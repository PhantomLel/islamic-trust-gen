import { Fraction, frac } from './Fraction';
import {
	HEIR_LABELS,
	type EstateInput,
	type HeirType,
	type HeirAllocation,
	type BlockedHeir,
	type CalculationResult,
	type ShareType,
} from './types';

type ShareEntry = {
	count: number;
	share: Fraction;
	shareType: ShareType;
	reasons: string[];
};

/**
 * Islamic Inheritance Calculator (Farā'iḍ)
 *
 * Implements the classical Sunni rules with Hanafi position on
 * grandfather–sibling interaction (grandfather blocks all siblings).
 *
 * Flow:
 *   1. Apply blocking rules (ḥajb al-ḥirmān)
 *   2. Assign fixed shares (furūḍ) to aṣḥāb al-furūḍ
 *   3. Distribute residual to ʿaṣaba (residuary heirs)
 *   4. If total fixed > 1  →  ʿawl  (proportional reduction)
 *   5. If residual remains and no ʿaṣaba  →  radd (return to non-spouse heirs)
 *   6. If radd impossible  →  flag dhawul arḥām (not yet supported)
 */
export class IslamicInheritanceCalculator {
	private input: EstateInput;
	private blocked: Map<HeirType, string> = new Map();
	private shares: Map<HeirType, ShareEntry> = new Map();
	private notes: string[] = [];

	constructor(input: EstateInput) {
		this.input = { ...input };
	}

	// ─── Public entry point ────────────────────────────────────────────

	calculate(): CalculationResult {
		this.applyBlockingRules();
		this.assignFixedShares();

		const totalFixed = this.sumShares();
		const awlNeeded = totalFixed.greaterThan(Fraction.ONE);

		let awlApplied = false;
		let raddApplied = false;
		let dhawulArhamNeeded = false;

		if (awlNeeded) {
			this.applyAwl(totalFixed);
			awlApplied = true;
		} else {
			const residual = Fraction.ONE.subtract(totalFixed);

			if (residual.isPositive()) {
				const asabaConsumed = this.distributeResiduary(residual);

				if (!asabaConsumed) {
					const raddResult = this.applyRadd();
					if (raddResult === 'applied') {
						raddApplied = true;
					} else {
						dhawulArhamNeeded = true;
					}
				}
			}
		}

		this.detectMusharrakaNote();

		return this.buildResult(totalFixed, awlApplied, raddApplied, dhawulArhamNeeded);
	}

	// ─── Blocking rules (ḥajb al-ḥirmān) ──────────────────────────────

	private applyBlockingRules(): void {
		const i = this.input;

		const hasSons = i.sons > 0;
		const hasSonsOfSons = i.sonsOfSons > 0;
		const hasMaleDescendants = hasSons || hasSonsOfSons;
		const hasAnyDescendant = hasMaleDescendants || i.daughters > 0 || i.daughtersOfSons > 0;

		// ── Paternal Grandfather ─────────────────────────
		if (i.fatherAlive) {
			this.block('paternal_grandfather', 'Blocked by father');
		}

		// ── Grandmothers ─────────────────────────────────
		if (i.motherAlive) {
			this.block('maternal_grandmother', 'Blocked by mother');
			this.block('paternal_grandmother', 'Blocked by mother');
		}
		if (i.fatherAlive) {
			this.block('paternal_grandmother', 'Blocked by father');
		}

		// ── Son's Son (grandson) ─────────────────────────
		if (hasSons) {
			this.block('sons_of_sons', 'Blocked by son');
		}

		// ── Son's Daughter (granddaughter) ───────────────
		if (hasSons) {
			this.block('daughters_of_sons', 'Blocked by son');
		}
		if (i.daughters >= 2 && i.sonsOfSons === 0) {
			this.block('daughters_of_sons', "Blocked by two or more daughters (no grandson to convert to ʿaṣaba)");
		}

		// ── Full Brother ─────────────────────────────────
		if (i.fatherAlive) this.block('full_brother', 'Blocked by father');
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('full_brother', 'Blocked by paternal grandfather (Ḥanafī)');
		}
		if (hasSons) this.block('full_brother', 'Blocked by son');
		if (hasSonsOfSons && !hasSons) this.block('full_brother', 'Blocked by grandson');

		// ── Full Sister ──────────────────────────────────
		if (i.fatherAlive) this.block('full_sister', 'Blocked by father');
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('full_sister', 'Blocked by paternal grandfather (Ḥanafī)');
		}
		if (hasSons) this.block('full_sister', 'Blocked by son');
		if (hasSonsOfSons && !hasSons) this.block('full_sister', 'Blocked by grandson');

		// ── Paternal Half-Brother ────────────────────────
		if (i.fatherAlive) this.block('paternal_half_brother', 'Blocked by father');
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('paternal_half_brother', 'Blocked by paternal grandfather (Ḥanafī)');
		}
		if (hasSons) this.block('paternal_half_brother', 'Blocked by son');
		if (hasSonsOfSons && !hasSons) this.block('paternal_half_brother', 'Blocked by grandson');
		if (i.fullBrothers > 0 && !this.blocked.has('full_brother')) {
			this.block('paternal_half_brother', 'Blocked by full brother');
		}

		// ── Paternal Half-Sister ─────────────────────────
		if (i.fatherAlive) this.block('paternal_half_sister', 'Blocked by father');
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('paternal_half_sister', 'Blocked by paternal grandfather (Ḥanafī)');
		}
		if (hasSons) this.block('paternal_half_sister', 'Blocked by son');
		if (hasSonsOfSons && !hasSons) this.block('paternal_half_sister', 'Blocked by grandson');
		if (i.fullBrothers > 0 && !this.blocked.has('full_brother')) {
			this.block('paternal_half_sister', 'Blocked by full brother');
		}
		if (i.fullSisters >= 2 && !this.blocked.has('full_sister') && i.paternalHalfBrothers === 0) {
			this.block('paternal_half_sister', 'Blocked by two or more full sisters (2/3 exhausted)');
		}

		// Full sisters as ʿaṣaba maʿa al-ghayr block paternal half-siblings
		const fullSistersAreAsaba =
			i.fullSisters > 0 &&
			!this.blocked.has('full_sister') &&
			i.fullBrothers === 0 &&
			this.hasFemaleDescendantsOnly();
		if (fullSistersAreAsaba) {
			this.block('paternal_half_brother', "Blocked by full sister (ʿaṣaba with daughters)");
			this.block('paternal_half_sister', "Blocked by full sister (ʿaṣaba with daughters)");
		}

		// ── Maternal Half-Siblings ───────────────────────
		if (i.fatherAlive) {
			this.block('maternal_half_brother', 'Blocked by father');
			this.block('maternal_half_sister', 'Blocked by father');
		}
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('maternal_half_brother', 'Blocked by paternal grandfather');
			this.block('maternal_half_sister', 'Blocked by paternal grandfather');
		}
		if (hasAnyDescendant) {
			this.block('maternal_half_brother', 'Blocked by descendant');
			this.block('maternal_half_sister', 'Blocked by descendant');
		}

		// ── Full Paternal Uncle ──────────────────────────
		if (i.fatherAlive) this.block('full_paternal_uncle', 'Blocked by father');
		if (!i.fatherAlive && i.paternalGrandfatherAlive) {
			this.block('full_paternal_uncle', 'Blocked by paternal grandfather');
		}
		if (hasSons) this.block('full_paternal_uncle', 'Blocked by son');
		if (hasSonsOfSons && !hasSons) this.block('full_paternal_uncle', 'Blocked by grandson');
		if (i.fullBrothers > 0 && !this.blocked.has('full_brother')) {
			this.block('full_paternal_uncle', 'Blocked by full brother');
		}
		if (i.paternalHalfBrothers > 0 && !this.blocked.has('paternal_half_brother')) {
			this.block('full_paternal_uncle', 'Blocked by paternal half-brother');
		}
	}

	private block(heir: HeirType, reason: string): void {
		if (!this.blocked.has(heir)) {
			this.blocked.set(heir, reason);
		}
	}

	// ─── Fixed-share assignment (furūḍ) ────────────────────────────────

	private assignFixedShares(): void {
		this.assignSpouseShare();
		this.assignMotherShare();
		this.assignFatherShare();
		this.assignDaughterShare();
		this.assignSonsDaughterShare();
		this.assignGrandfatherShare();
		this.assignGrandmotherShare();
		this.assignFullSisterShare();
		this.assignPaternalHalfSisterShare();
		this.assignMaternalSiblingShares();
	}

	private assignSpouseShare(): void {
		if (!this.input.spouse) return;

		const hasDescendants = this.hasAnyDescendants();
		const spouseType = this.spouseHeirType();

		if (spouseType === 'husband') {
			const share = hasDescendants ? frac(1, 4) : frac(1, 2);
			const reason = hasDescendants ? '1/4 (descendants exist)' : '1/2 (no descendants)';
			this.setShare(spouseType, 1, share, 'fixed', reason);
		} else {
			const share = hasDescendants ? frac(1, 8) : frac(1, 4);
			const reason = hasDescendants ? '1/8 (descendants exist)' : '1/4 (no descendants)';
			this.setShare(spouseType, 1, share, 'fixed', reason);
		}
	}

	private assignFatherShare(): void {
		if (!this.input.fatherAlive) return;

		const hasDescendants = this.hasAnyDescendants();
		if (hasDescendants) {
			this.setShare('father', 1, frac(1, 6), 'fixed', '1/6 (descendants exist)');
		}
		// When no descendants → father is pure ʿaṣaba (handled in residuary)
		// When only female descendants → 1/6 fixed + residual (residual added later)
	}

	private assignMotherShare(): void {
		if (!this.input.motherAlive) return;

		const hasDescendants = this.hasAnyDescendants();
		const totalSiblings = this.totalSiblingCount();

		// Case 1: Descendants or 2+ siblings → 1/6
		if (hasDescendants || totalSiblings >= 2) {
			this.setShare('mother', 1, frac(1, 6), 'fixed', '1/6 (descendants or 2+ siblings exist)');
			return;
		}

		// Case 2: Umariyyah (Gharāwayn) — spouse + both parents, no descendants, < 2 siblings
		const isUmariyyah =
			this.input.spouse &&
			this.input.fatherAlive &&
			totalSiblings < 2;

		if (isUmariyyah) {
			const spouseShare = this.getSpouseFixedShare();
			const remainder = Fraction.ONE.subtract(spouseShare);
			const motherShare = remainder.multiply(frac(1, 3));
			this.setShare('mother', 1, motherShare, 'fixed', '1/3 of remainder after spouse (Umariyyah/Gharāwayn)');
			this.notes.push(
				'Umariyyah (Gharāwayn) applied: mother receives 1/3 of remainder ' +
				'after spouse share to maintain father receiving double mother\'s portion.'
			);
			return;
		}

		// Case 3: Default → 1/3
		this.setShare('mother', 1, frac(1, 3), 'fixed', '1/3 (no descendants, < 2 siblings)');
	}

	private assignDaughterShare(): void {
		const count = this.input.daughters;
		if (count === 0) return;

		// If sons exist → daughters become ʿaṣaba bi-l-ghayr (handled in residuary)
		if (this.input.sons > 0) return;

		const share = count === 1 ? frac(1, 2) : frac(2, 3);
		const reason = count === 1 ? '1/2 (one daughter, no sons)' : '2/3 (two or more daughters, no sons)';
		this.setShare('daughter', count, share, 'fixed', reason);
	}

	private assignSonsDaughterShare(): void {
		const count = this.input.daughtersOfSons;
		if (count === 0 || this.blocked.has('daughters_of_sons')) return;

		// If son's sons exist → ʿaṣaba bi-l-ghayr (handled in residuary)
		if (this.input.sonsOfSons > 0) return;

		const daughterCount = this.input.daughters;

		if (daughterCount === 0) {
			const share = count === 1 ? frac(1, 2) : frac(2, 3);
			const reason = count === 1
				? '1/2 (one granddaughter, no daughters/sons)'
				: '2/3 (two or more granddaughters, no daughters/sons)';
			this.setShare('daughters_of_sons', count, share, 'fixed', reason);
		} else if (daughterCount === 1) {
			// Completing the 2/3: daughter got 1/2, granddaughters get 1/6
			this.setShare('daughters_of_sons', count, frac(1, 6), 'fixed', '1/6 (completing 2/3 alongside one daughter)');
		}
		// If daughterCount >= 2, they're already blocked (handled in blocking rules)
	}

	private assignGrandfatherShare(): void {
		if (!this.input.paternalGrandfatherAlive || this.blocked.has('paternal_grandfather')) return;

		const hasDescendants = this.hasAnyDescendants();
		if (hasDescendants) {
			this.setShare('paternal_grandfather', 1, frac(1, 6), 'fixed', '1/6 (descendants exist, acting as father)');
		}
		// When no descendants → pure ʿaṣaba (handled in residuary)
	}

	private assignGrandmotherShare(): void {
		const paternalAlive = this.input.paternalGrandmotherAlive && !this.blocked.has('paternal_grandmother');
		const maternalAlive = this.input.maternalGrandmotherAlive && !this.blocked.has('maternal_grandmother');

		if (!paternalAlive && !maternalAlive) return;

		const grandmotherCount = (paternalAlive ? 1 : 0) + (maternalAlive ? 1 : 0);
		const sharePerGrandmother = frac(1, 6 * grandmotherCount);

		if (paternalAlive) {
			const reason = grandmotherCount === 2
				? '1/12 (sharing 1/6 with maternal grandmother)'
				: '1/6 (sole grandmother)';
			this.setShare('paternal_grandmother', 1, sharePerGrandmother, 'fixed', reason);
		}
		if (maternalAlive) {
			const reason = grandmotherCount === 2
				? '1/12 (sharing 1/6 with paternal grandmother)'
				: '1/6 (sole grandmother)';
			this.setShare('maternal_grandmother', 1, sharePerGrandmother, 'fixed', reason);
		}
	}

	private assignFullSisterShare(): void {
		const count = this.input.fullSisters;
		if (count === 0 || this.blocked.has('full_sister')) return;

		// If full brothers exist → ʿaṣaba bi-l-ghayr
		if (this.input.fullBrothers > 0) return;

		// If female-only descendants exist → ʿaṣaba maʿa al-ghayr (residuary)
		if (this.hasFemaleDescendantsOnly()) return;

		// Fixed share only when NO descendants at all
		if (this.hasAnyDescendants()) return;

		const share = count === 1 ? frac(1, 2) : frac(2, 3);
		const reason = count === 1 ? '1/2 (one full sister)' : '2/3 (two or more full sisters)';
		this.setShare('full_sister', count, share, 'fixed', reason);
	}

	private assignPaternalHalfSisterShare(): void {
		const count = this.input.paternalHalfSisters;
		if (count === 0 || this.blocked.has('paternal_half_sister')) return;

		// If paternal half-brothers exist → ʿaṣaba bi-l-ghayr
		if (this.input.paternalHalfBrothers > 0) return;

		// If female-only descendants → ʿaṣaba maʿa al-ghayr
		if (this.hasFemaleDescendantsOnly()) return;

		// Fixed share only when no descendants
		if (this.hasAnyDescendants()) return;

		const fullSisterCount = this.input.fullSisters;
		const fullSistersBlocked = this.blocked.has('full_sister');

		if (fullSisterCount === 0 || fullSistersBlocked) {
			// No full sisters → half-sisters take the sister share
			const share = count === 1 ? frac(1, 2) : frac(2, 3);
			const reason = count === 1
				? '1/2 (one paternal half-sister, no full sisters)'
				: '2/3 (two or more paternal half-sisters, no full sisters)';
			this.setShare('paternal_half_sister', count, share, 'fixed', reason);
		} else if (fullSisterCount === 1) {
			// One full sister took 1/2; half-sisters get 1/6 to complete 2/3
			this.setShare('paternal_half_sister', count, frac(1, 6), 'fixed', '1/6 (completing 2/3 alongside one full sister)');
		}
		// If fullSisterCount >= 2 → already blocked in blocking rules
	}

	private assignMaternalSiblingShares(): void {
		const brotherCount = this.blocked.has('maternal_half_brother') ? 0 : this.input.maternalHalfBrothers;
		const sisterCount = this.blocked.has('maternal_half_sister') ? 0 : this.input.maternalHalfSisters;
		const totalCount = brotherCount + sisterCount;
		if (totalCount === 0) return;

		// Maternal siblings share equally regardless of gender
		const totalShare = totalCount === 1 ? frac(1, 6) : frac(1, 3);
		const reason = totalCount === 1
			? '1/6 (one maternal sibling)'
			: '1/3 shared equally (two or more maternal siblings)';

		if (brotherCount > 0) {
			const brotherShare = totalShare.multiply(frac(brotherCount, totalCount));
			this.setShare('maternal_half_brother', brotherCount, brotherShare, 'fixed', reason);
		}
		if (sisterCount > 0) {
			const sisterShare = totalShare.multiply(frac(sisterCount, totalCount));
			this.setShare('maternal_half_sister', sisterCount, sisterShare, 'fixed', reason);
		}
	}

	// ─── Residuary distribution (ʿaṣaba) ──────────────────────────────

	/**
	 * Distribute the residual to ʿaṣaba heirs in priority order.
	 * Returns true if any heir consumed the residual.
	 */
	private distributeResiduary(residual: Fraction): boolean {
		if (!residual.isPositive()) return false;

		// Tier 1: Sons (+ Daughters as ʿaṣaba bi-l-ghayr)
		if (this.input.sons > 0) {
			this.distributeAsabaBiGhayr('son', this.input.sons, 'daughter', this.input.daughters, residual);
			return true;
		}

		// Tier 2: Son's Sons (+ Son's Daughters as ʿaṣaba bi-l-ghayr)
		if (this.input.sonsOfSons > 0 && !this.blocked.has('sons_of_sons')) {
			const sdCount = this.blocked.has('daughters_of_sons') ? 0 : this.input.daughtersOfSons;
			this.distributeAsabaBiGhayr('sons_of_sons', this.input.sonsOfSons, 'daughters_of_sons', sdCount, residual);
			return true;
		}

		// Tier 3: Father
		if (this.input.fatherAlive) {
			this.addResiduary('father', 1, residual, 'Residual as ʿaṣaba');
			return true;
		}

		// Tier 4: Paternal Grandfather
		if (this.input.paternalGrandfatherAlive && !this.blocked.has('paternal_grandfather')) {
			this.addResiduary('paternal_grandfather', 1, residual, 'Residual as ʿaṣaba');
			return true;
		}

		// Tier 5a: Full Brothers (+ Full Sisters as ʿaṣaba bi-l-ghayr)
		if (this.input.fullBrothers > 0 && !this.blocked.has('full_brother')) {
			const fsCount = this.blocked.has('full_sister') ? 0 : this.input.fullSisters;
			this.distributeAsabaBiGhayr('full_brother', this.input.fullBrothers, 'full_sister', fsCount, residual);
			return true;
		}

		// Tier 5b: Full Sisters alone as ʿaṣaba maʿa al-ghayr (with female descendants)
		if (this.input.fullSisters > 0 && !this.blocked.has('full_sister') && this.hasFemaleDescendantsOnly()) {
			this.addResiduary('full_sister', this.input.fullSisters, residual, "ʿAṣaba maʿa al-ghayr (with daughters)");
			return true;
		}

		// Tier 6a: Paternal Half-Brothers (+ Paternal Half-Sisters as ʿaṣaba bi-l-ghayr)
		if (this.input.paternalHalfBrothers > 0 && !this.blocked.has('paternal_half_brother')) {
			const phsCount = this.blocked.has('paternal_half_sister') ? 0 : this.input.paternalHalfSisters;
			this.distributeAsabaBiGhayr(
				'paternal_half_brother', this.input.paternalHalfBrothers,
				'paternal_half_sister', phsCount,
				residual,
			);
			return true;
		}

		// Tier 6b: Paternal Half-Sisters alone as ʿaṣaba maʿa al-ghayr
		if (this.input.paternalHalfSisters > 0 && !this.blocked.has('paternal_half_sister') && this.hasFemaleDescendantsOnly()) {
			this.addResiduary('paternal_half_sister', this.input.paternalHalfSisters, residual, "ʿAṣaba maʿa al-ghayr (with daughters)");
			return true;
		}

		// Tier 7: Full Paternal Uncles
		if (this.input.fullPaternalUncles > 0 && !this.blocked.has('full_paternal_uncle')) {
			this.addResiduary('full_paternal_uncle', this.input.fullPaternalUncles, residual, 'Residual as ʿaṣaba');
			return true;
		}

		return false;
	}

	/**
	 * Distribute residual between a male heir type and female counterpart in 2:1 ratio.
	 */
	private distributeAsabaBiGhayr(
		maleType: HeirType, maleCount: number,
		femaleType: HeirType, femaleCount: number,
		residual: Fraction,
	): void {
		const maleParts = 2 * maleCount;
		const femaleParts = femaleCount;
		const totalParts = maleParts + femaleParts;

		const maleTotal = residual.multiply(frac(maleParts, totalParts));
		this.addResiduary(maleType, maleCount, maleTotal, `ʿAṣaba: ${maleCount} × 2 parts of ${totalParts}`);

		if (femaleCount > 0) {
			const femaleTotal = residual.multiply(frac(femaleParts, totalParts));
			this.addResiduary(femaleType, femaleCount, femaleTotal, `ʿAṣaba bi-l-ghayr: ${femaleCount} × 1 part of ${totalParts}`);
		}
	}

	// ─── ʿAwl (proportional reduction when total > 1) ─────────────────

	private applyAwl(totalFixed: Fraction): void {
		this.notes.push(
			`ʿAwl applied: total fixed shares = ${totalFixed.toString()} (exceeds 1). ` +
			'All shares proportionally reduced.'
		);

		for (const entry of this.shares.values()) {
			entry.share = entry.share.divide(totalFixed);
			entry.reasons.push('Reduced by ʿawl');
		}
	}

	// ─── Radd (redistribute remainder to non-spouse heirs) ────────────

	/**
	 * When residual remains and no ʿaṣaba exists, excess returns to
	 * fixed-share heirs (excluding spouse).
	 */
	private applyRadd(): 'applied' | 'dhawul_arham' {
		const spouseType = this.input.spouse ? this.spouseHeirType() : null;

		const nonSpouseEntries: [HeirType, ShareEntry][] = [];
		let nonSpouseTotal = Fraction.ZERO;

		for (const [type, entry] of this.shares) {
			if (type !== spouseType) {
				nonSpouseEntries.push([type, entry]);
				nonSpouseTotal = nonSpouseTotal.add(entry.share);
			}
		}

		if (nonSpouseEntries.length === 0 || nonSpouseTotal.isZero()) {
			return 'dhawul_arham';
		}

		const spouseShare = spouseType ? (this.shares.get(spouseType)?.share ?? Fraction.ZERO) : Fraction.ZERO;
		const availableForNonSpouse = Fraction.ONE.subtract(spouseShare);

		this.notes.push(
			'Radd applied: no ʿaṣaba heirs, remainder redistributed to ' +
			'non-spouse fixed-share heirs proportionally.'
		);

		for (const [, entry] of nonSpouseEntries) {
			const newShare = entry.share.multiply(availableForNonSpouse).divide(nonSpouseTotal);
			entry.share = newShare;
			entry.reasons.push('Increased by radd');
		}

		return 'applied';
	}

	// ─── Special-case detection ───────────────────────────────────────

	private detectMusharrakaNote(): void {
		const i = this.input;
		const maternalCount = (this.blocked.has('maternal_half_brother') ? 0 : i.maternalHalfBrothers)
			+ (this.blocked.has('maternal_half_sister') ? 0 : i.maternalHalfSisters);

		if (maternalCount < 2) return;

		const fullBrotherEntry = this.shares.get('full_brother');
		const fullBrotherGetsNothing = i.fullBrothers > 0 && !this.blocked.has('full_brother') && !fullBrotherEntry;

		if (fullBrotherGetsNothing || (fullBrotherEntry && fullBrotherEntry.share.isZero())) {
			this.notes.push(
				'Mushārakah note: full brothers receive nothing while maternal siblings inherit 1/3. ' +
				'In Mālikī and Shāfiʿī schools, full siblings would share in the 1/3 with maternal siblings. ' +
				'This calculator follows the Ḥanafī/Ḥanbalī position where full brothers take only the residual.'
			);
		}
	}

	// ─── Helper methods ───────────────────────────────────────────────

	private hasAnyDescendants(): boolean {
		return (
			this.input.sons > 0 ||
			this.input.daughters > 0 ||
			(this.input.sonsOfSons > 0 && !this.blocked.has('sons_of_sons')) ||
			(this.input.daughtersOfSons > 0 && !this.blocked.has('daughters_of_sons'))
		);
	}

	private hasFemaleDescendantsOnly(): boolean {
		const hasFemaleDescendants =
			this.input.daughters > 0 ||
			(this.input.daughtersOfSons > 0 && !this.blocked.has('daughters_of_sons'));
		const hasMaleDescendants =
			this.input.sons > 0 ||
			(this.input.sonsOfSons > 0 && !this.blocked.has('sons_of_sons'));
		return hasFemaleDescendants && !hasMaleDescendants;
	}

	/**
	 * Total sibling count for mother's share reduction.
	 * Includes ALL siblings regardless of blocking (ḥajb al-nuqṣān).
	 */
	private totalSiblingCount(): number {
		const i = this.input;
		return (
			i.fullBrothers + i.fullSisters +
			i.paternalHalfBrothers + i.paternalHalfSisters +
			i.maternalHalfBrothers + i.maternalHalfSisters
		);
	}

	private spouseHeirType(): 'husband' | 'wife' {
		return this.input.decedentGender === 'male' ? 'wife' : 'husband';
	}

	private getSpouseFixedShare(): Fraction {
		const hasDesc = this.hasAnyDescendants();
		if (this.input.decedentGender === 'female') {
			return hasDesc ? frac(1, 4) : frac(1, 2);
		}
		return hasDesc ? frac(1, 8) : frac(1, 4);
	}

	// ─── Share bookkeeping ────────────────────────────────────────────

	private setShare(
		heirType: HeirType, count: number, share: Fraction,
		shareType: ShareType, reason: string,
	): void {
		this.shares.set(heirType, { count, share, shareType, reasons: [reason] });
	}

	private addResiduary(
		heirType: HeirType, count: number,
		share: Fraction, reason: string,
	): void {
		const existing = this.shares.get(heirType);
		if (existing) {
			existing.share = existing.share.add(share);
			existing.shareType = 'fixed_and_residuary';
			existing.reasons.push(reason);
		} else {
			this.shares.set(heirType, { count, share, shareType: 'residuary', reasons: [reason] });
		}
	}

	private sumShares(): Fraction {
		let total = Fraction.ZERO;
		for (const entry of this.shares.values()) {
			total = total.add(entry.share);
		}
		return total;
	}

	// ─── Build final result ───────────────────────────────────────────

	private buildResult(
		totalFixed: Fraction,
		awlApplied: boolean,
		raddApplied: boolean,
		dhawulArhamNeeded: boolean,
	): CalculationResult {
		const heirs: HeirAllocation[] = [];

		for (const [heirType, entry] of this.shares) {
			if (entry.share.isZero()) continue;
			heirs.push({
				heirType,
				label: HEIR_LABELS[heirType],
				count: entry.count,
				totalShare: entry.share,
				perPersonShare: entry.count > 1 ? entry.share.divide(frac(entry.count)) : entry.share,
				shareType: entry.shareType,
				reasons: entry.reasons,
			});
		}

		const blockedHeirs: BlockedHeir[] = [];
		for (const [heirType, reason] of this.blocked) {
			const heirCount = this.getInputCount(heirType);
			if (heirCount > 0) {
				blockedHeirs.push({ heirType, label: HEIR_LABELS[heirType], reason });
			}
		}

		const residual = Fraction.ONE.subtract(totalFixed);

		return {
			heirs,
			blockedHeirs,
			totalFixedShares: totalFixed,
			residual: residual.isPositive() ? residual : Fraction.ZERO,
			awlApplied,
			raddApplied,
			dhawulArhamNeeded,
			notes: this.notes,
			error: dhawulArhamNeeded
				? 'Dhawul arḥām distribution is not yet supported. Remaining estate cannot be distributed with current rules.'
				: undefined,
		};
	}

	private getInputCount(heirType: HeirType): number {
		const map: Partial<Record<HeirType, number>> = {
			husband: this.input.spouse && this.input.decedentGender === 'female' ? 1 : 0,
			wife: this.input.spouse && this.input.decedentGender === 'male' ? 1 : 0,
			father: this.input.fatherAlive ? 1 : 0,
			mother: this.input.motherAlive ? 1 : 0,
			son: this.input.sons,
			daughter: this.input.daughters,
			sons_of_sons: this.input.sonsOfSons,
			daughters_of_sons: this.input.daughtersOfSons,
			paternal_grandfather: this.input.paternalGrandfatherAlive ? 1 : 0,
			paternal_grandmother: this.input.paternalGrandmotherAlive ? 1 : 0,
			maternal_grandmother: this.input.maternalGrandmotherAlive ? 1 : 0,
			full_brother: this.input.fullBrothers,
			full_sister: this.input.fullSisters,
			paternal_half_brother: this.input.paternalHalfBrothers,
			paternal_half_sister: this.input.paternalHalfSisters,
			maternal_half_brother: this.input.maternalHalfBrothers,
			maternal_half_sister: this.input.maternalHalfSisters,
			full_paternal_uncle: this.input.fullPaternalUncles,
		};
		return map[heirType] ?? 0;
	}
}
