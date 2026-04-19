<script lang="ts">
	import type {
		ChildResponse,
		CharityResponse,
		HeirResponse,
		PersonalDataResponse,
		Question,
		QuestionResponseValue,
	} from '$lib/config';
	import { charities } from '$lib/config';
	import {
		isCustomCharityResponse,
		isPersonalDataShape,
		meetsDiscountedCharityPledge,
		WASIYYAH_THIRD_PERCENT
	} from '$lib/question-response-helpers';
	import HeirsCalculatorInput from './HeirsCalculatorInput.svelte';
	import CountySelector from './CountySelector.svelte';
	import OwnershipAllocationInput from './OwnershipAllocationInput.svelte';
	import HebaAcknowledgmentInput from './HebaAcknowledgmentInput.svelte';
	import AssetAllocationInput from './AssetAllocationInput.svelte';
	import SeparatePropertyInput from './SeparatePropertyInput.svelte';
	import PersonalPropertyInput from './PersonalPropertyInput.svelte';
	import TrusteeSelectionInput from './TrusteeSelectionInput.svelte';
	import SuccessorTrusteesInput from './SuccessorTrusteesInput.svelte';
	import PourOverRepresentativesInput from './PourOverRepresentativesInput.svelte';
	import MadhabInput from './MadhabInput.svelte';
	import HeirPreviewScreen from './HeirPreviewScreen.svelte';
	import MinorDistributionInput from './MinorDistributionInput.svelte';
	import NonCharitableBequestsInput from './NonCharitableBequestsInput.svelte';
	import SummaryReviewScreen from './SummaryReviewScreen.svelte';
	import HouseDeedQuestionInput from './HouseDeedQuestionInput.svelte';

	let { question, value, onresponse, onnext, allResponses = {}, onnavigate, oncomplete, completing = false, trustId = 0, userId = '', userCounty = null, houseDeedUrl = null, deedRetrievalRequested = false, selectedPlan = null }: {
		question: Question;
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		onnext: () => void;
		allResponses?: Record<string, QuestionResponseValue>;
		onnavigate?: (questionId: string) => void;
		oncomplete?: () => void;
		completing?: boolean;
		trustId?: number;
		userId?: string;
		/** From screening / user profile — pre-fills husband & wife Texas county when empty */
		userCounty?: string | null;
		houseDeedUrl?: string | null;
		deedRetrievalRequested?: boolean;
		selectedPlan?: string | null;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			onnext();
		}
	}

	const inputClass = `w-full px-5 py-4 rounded-xl bg-white border border-navy/10 text-navy text-base
		placeholder:text-navy/25 outline-none transition-all
		focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10`;

	function formatPhone(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 10);
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	function handlePhoneInput(e: Event & { currentTarget: HTMLInputElement }) {
		const formatted = formatPhone(e.currentTarget.value);
		e.currentTarget.value = formatted;
		const digits = formatted.replace(/\D/g, '');
		onresponse(digits.length > 0 ? formatted : null);
	}

	function getChildren(): ChildResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((item): item is ChildResponse => 
				!!item && typeof item === 'object' && 'firstName' in item
			)
			.map((child) => ({
				firstName: child.firstName ?? '',
				lastName: child.lastName ?? '',
				dob: child.dob ?? ''
			}));
	}

	function getHeirs(): HeirResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((item): item is HeirResponse => !!item && typeof item === 'object' && 'firstName' in item)
			.map((heir) => ({
				firstName: heir.firstName ?? '',
				lastName: heir.lastName ?? ''
			}));
	}

	function updateChild(index: number, field: keyof ChildResponse, fieldValue: string) {
		const next = getChildren();
		next[index] = { ...next[index], [field]: fieldValue };
		onresponse(next);
	}

	function addChild() {
		onresponse([...getChildren(), { firstName: '', lastName: '', dob: '' }]);
	}

	function removeChild(index: number) {
		const next = getChildren().filter((_, i) => i !== index);
		onresponse(next.length > 0 ? next : null);
	}

	function updateHeir(index: number, field: keyof HeirResponse, fieldValue: string) {
		const next = getHeirs();
		next[index] = { ...next[index], [field]: fieldValue };
		onresponse(next);
	}

	function addHeir() {
		onresponse([...getHeirs(), { firstName: '', lastName: '' }]);
	}

	function removeHeir(index: number) {
		const next = getHeirs().filter((_, i) => i !== index);
		onresponse(next.length > 0 ? next : null);
	}

	function newCustomCharityId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
	}

	function getCharities(): CharityResponse[] {
		if (!Array.isArray(value)) return [];
		return value
			.filter((item): item is CharityResponse => 
				!!item && typeof item === 'object' && 'charityId' in item
			)
			.map((charity) => {
				const charityId = charity.charityId ?? '';
				const percentage = charity.percentage ?? 0;
				if (isCustomCharityResponse(charity)) {
					return {
						charityId,
						percentage,
						customName: charity.customName ?? '',
						customEin: typeof charity.customEin === 'string' ? charity.customEin : ''
					};
				}
				return { charityId, percentage };
			});
	}

	function isCharitySelected(charityId: string): boolean {
		return getCharities().some((c) => c.charityId === charityId);
	}

	function toggleCharity(charityId: string) {
		const current = getCharities();
		const exists = current.some((c) => c.charityId === charityId);
		if (exists) {
			const next = current.filter((c) => c.charityId !== charityId);
			onresponse(next.length > 0 ? next : null);
		} else {
			onresponse([...current, { charityId, percentage: 0 }]);
		}
	}

	function updateCharityPercentage(charityId: string, percentage: number) {
		const current = getCharities();
		onresponse(current.map((c) => c.charityId === charityId ? { ...c, percentage } : c));
	}

	function addCustomCharity() {
		const current = getCharities();
		onresponse([
			...current,
			{ charityId: newCustomCharityId(), percentage: 0, customName: '', customEin: '' }
		]);
	}

	function removeCustomCharity(charityId: string) {
		const current = getCharities().filter((c) => c.charityId !== charityId);
		onresponse(current.length > 0 ? current : null);
	}

	function updateCustomCharityField(charityId: string, field: 'customName' | 'customEin', fieldValue: string) {
		const current = getCharities();
		onresponse(
			current.map((c) =>
				c.charityId === charityId && isCustomCharityResponse(c)
					? { ...c, [field]: fieldValue }
					: c
			)
		);
	}

	function getTotalCharityPercentage(): number {
		return getCharities().reduce((sum, c) => sum + (c.percentage || 0), 0);
	}

	function getPersonalData(): PersonalDataResponse {
		if (isPersonalDataShape(value)) {
			return {
				name: typeof value.name === 'string' ? value.name : '',
				dob: typeof value.dob === 'string' ? value.dob : '',
				county: typeof value.county === 'string' ? value.county : ''
			};
		}
		return { name: '', dob: '', county: '' };
	}

	function patchPersonalData(part: Partial<PersonalDataResponse>) {
		onresponse({ ...getPersonalData(), ...part });
	}

	const profileCounty = $derived((userCounty ?? '').trim());

	/** Once per visit to a spouse personal-data step; reset when leaving those steps so returning can pre-fill again. */
	let countyProfileAutofillConsumed = $state(false);

	$effect(() => {
		const isSpousePersonal =
			question.type === 'personal-data' &&
			(question.id === 'husband-data' || question.id === 'wife-data');

		if (!isSpousePersonal) {
			countyProfileAutofillConsumed = false;
			return;
		}

		const fromProfile = profileCounty;
		if (!fromProfile || countyProfileAutofillConsumed) return;

		const pd = getPersonalData();
		if (pd.county.trim()) {
			countyProfileAutofillConsumed = true;
			return;
		}

		patchPersonalData({ county: fromProfile });
		countyProfileAutofillConsumed = true;
	});
</script>

{#if question.type === 'text'}
	<input type="text" value={value ?? ''} oninput={(e) => onresponse(e.currentTarget.value || null)}
		onkeydown={handleKeydown} placeholder="Type your answer..." class={inputClass} />

{:else if question.type === 'tel'}
	{@const digits = typeof value === 'string' ? value.replace(/\D/g, '') : ''}
	{@const isValid = digits.length === 0 || digits.length === 10}
	<div>
		<input type="tel" value={value ?? ''} oninput={handlePhoneInput}
			onkeydown={handleKeydown} placeholder="(555) 123-4567"
			class="{inputClass} {!isValid ? 'border-red-400!' : ''}" />
		{#if !isValid}
			<p class="text-red-500 text-xs mt-1.5 ml-1">Please enter a valid 10-digit phone number</p>
		{/if}
	</div>

{:else if question.type === 'date'}
	<input type="date" value={value ?? ''} oninput={(e) => onresponse(e.currentTarget.value || null)}
		onkeydown={handleKeydown} class={inputClass} />

{:else if question.type === 'select' && question.options}
	<div class="flex flex-col gap-2.5">
		{#each question.options as option}
			{@const sel = value === option}
			<button onclick={() => { onresponse(option); onnext(); }}
				class="w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 cursor-pointer
					   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
				<div class="flex items-center gap-3">
					<div class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
								{sel ? 'border-emerald-accent' : 'border-navy/20'}">
						{#if sel}<div class="w-2.5 h-2.5 rounded-full bg-emerald-accent"></div>{/if}
					</div>
					<span class="text-base">{option}</span>
				</div>
			</button>
		{/each}
	</div>

{:else if question.type === 'boolean'}
	<div class="flex gap-3">
		{#each [{ label: 'Yes', value: true }, { label: 'No', value: false }] as opt}
			{@const sel = value === opt.value}
			<button onclick={() => { onresponse(opt.value); onnext(); }}
				class="flex-1 px-5 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer
					   {sel ? 'bg-emerald-accent/8 border-emerald-accent/30 text-navy font-medium' : 'bg-white border-navy/10 text-navy/70 hover:border-navy/20'}">
				{opt.label}
			</button>
		{/each}
	</div>

{:else if question.type === 'personal-data'}
	{@const pd = getPersonalData()}
	<div class="space-y-5">
		{#if question.subtext}
			<p class="text-sm text-navy/50 font-light leading-relaxed -mt-2 mb-1">{question.subtext}</p>
		{/if}
		<div class="space-y-1.5">
			<label for="pd-name-{question.id}" class="block text-[12px] font-medium text-navy/55 tracking-wide uppercase">
				Full legal name
			</label>
			<input
				id="pd-name-{question.id}"
				type="text"
				autocomplete="name"
				value={pd.name}
				oninput={(e) => patchPersonalData({ name: e.currentTarget.value })}
				onkeydown={handleKeydown}
				placeholder="As it should appear on documents"
				class={inputClass}
			/>
		</div>
		<div class="space-y-1.5">
			<label for="pd-dob-{question.id}" class="block text-[12px] font-medium text-navy/55 tracking-wide uppercase">
				Date of birth
			</label>
			<input
				id="pd-dob-{question.id}"
				type="date"
				value={pd.dob}
				oninput={(e) => patchPersonalData({ dob: e.currentTarget.value })}
				onkeydown={handleKeydown}
				class={inputClass}
			/>
		</div>
		<div class="space-y-1.5">
			<label class="block text-[12px] font-medium text-navy/55 tracking-wide uppercase">
				County of residence (Texas)
			</label>
			<CountySelector
				value={pd.county}
				onchange={(v) => patchPersonalData({ county: v })}
				placeholder="Search Texas counties…"
			/>
		</div>
	</div>

{:else if question.type === 'children'}
	{@const children = getChildren()}
	<div class="space-y-2.5">
		{#if children.length === 0}
			<div class="rounded-lg border border-dashed border-navy/15 bg-white/60 px-4 py-3 text-sm text-navy/45">
				No children added yet.
			</div>
		{/if}

		{#each children as child, index}
			<div class="rounded-lg border border-navy/10 bg-white p-2.5">
				<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_170px_auto] gap-2 items-center">
					<input type="text" value={child.firstName}
						oninput={(e) => updateChild(index, 'firstName', e.currentTarget.value)}
						placeholder="First name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10" />
					<input type="text" value={child.lastName}
						oninput={(e) => updateChild(index, 'lastName', e.currentTarget.value)}
						placeholder="Last name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10" />
					<input type="date" value={child.dob}
						oninput={(e) => updateChild(index, 'dob', e.currentTarget.value)}
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10" />
					<button type="button" onclick={() => removeChild(index)}
						class="h-[38px] px-3 rounded-md border border-navy/10 text-xs text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer whitespace-nowrap"
						aria-label={`Remove child ${index + 1}`}>
						Remove
					</button>
				</div>
			</div>
		{/each}

		<button type="button" onclick={addChild}
			class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-accent/25 text-sm font-medium text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Child
		</button>
	</div>

{:else if question.type === 'heir'}
	{@const heirs = getHeirs()}
	<div class="space-y-2.5">
		{#if heirs.length === 0}
			<div class="rounded-lg border border-dashed border-navy/15 bg-white/60 px-4 py-3 text-sm text-navy/45">
				No heirs added yet.
			</div>
		{/if}

		{#each heirs as heir, index}
			<div class="rounded-lg border border-navy/10 bg-white p-2.5">
				<div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
					<input type="text" value={heir.firstName}
						oninput={(e) => updateHeir(index, 'firstName', e.currentTarget.value)}
						placeholder="First name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10" />
					<input type="text" value={heir.lastName}
						oninput={(e) => updateHeir(index, 'lastName', e.currentTarget.value)}
						placeholder="Last name"
						class="w-full px-3 py-2.5 rounded-md border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10" />
					<button type="button" onclick={() => removeHeir(index)}
						class="h-[38px] px-3 rounded-md border border-navy/10 text-xs text-navy/50 hover:text-navy hover:border-navy/20 transition-colors cursor-pointer whitespace-nowrap"
						aria-label={`Remove heir ${index + 1}`}>
						Remove
					</button>
				</div>
			</div>
		{/each}

		<button type="button" onclick={addHeir}
			class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-emerald-accent/25 text-sm font-medium text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-all cursor-pointer">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Add Heir
		</button>
	</div>

{:else if question.type === 'heirs-calculator'}
	<HeirsCalculatorInput {value} {onresponse} questionId={question.id} {allResponses} />

{:else if question.type === 'ownership-allocation'}
	<OwnershipAllocationInput {value} {onresponse} {onnext} />

{:else if question.type === 'heba'}
	<HebaAcknowledgmentInput {value} {onresponse} {allResponses} />

{:else if question.type === 'assets'}
	<AssetAllocationInput {value} {onresponse} />

{:else if question.type === 'separate-property'}
	<SeparatePropertyInput {value} {onresponse} {allResponses} />

{:else if question.type === 'personal-property'}
	<PersonalPropertyInput {value} {onresponse} />

{:else if question.type === 'trustee-on-first-death'}
	<TrusteeSelectionInput {value} {onresponse} />

{:else if question.type === 'successor-trustees'}
	<SuccessorTrusteesInput {value} {onresponse} />

{:else if question.type === 'pour-over-representatives'}
	{@const role = question.id.endsWith('-guardians') ? 'guardian' : 'personal-representative'}
	<PourOverRepresentativesInput {value} {onresponse} {role} {allResponses} />

{:else if question.type === 'madhab'}
	<MadhabInput {value} {onresponse} {onnext} />

{:else if question.type === 'heir-preview'}
	<HeirPreviewScreen {value} {onresponse} {allResponses} />

{:else if question.type === 'minor-distribution'}
	<MinorDistributionInput {value} {onresponse} />

{:else if question.type === 'non-charitable-bequests'}
	<NonCharitableBequestsInput {value} {onresponse} {allResponses} />

{:else if question.type === 'house-deed'}
	<HouseDeedQuestionInput {trustId} {userId} existingUrl={houseDeedUrl} {deedRetrievalRequested} saveActionPath="?/saveHouseDeed" />

{:else if question.type === 'summary-review'}
	<SummaryReviewScreen {value} {onresponse} {allResponses} {onnavigate} {oncomplete} {completing} {selectedPlan} />

{:else if question.type === 'charities'}
	{@const selectedCharities = getCharities()}
	{@const discountedPledgeMet =
		selectedPlan !== 'discounted' || meetsDiscountedCharityPledge(selectedCharities)}
	<div class="space-y-3">
		<p class="text-sm text-navy/70">Get a discount of $200 by selecting a charity.</p>
		{#if selectedPlan === 'discounted'}
			<div
				class="rounded-xl border px-4 py-3 text-[13px] leading-relaxed {discountedPledgeMet
					? 'border-emerald-accent/25 bg-emerald-accent/5 text-navy/80'
					: 'border-amber-200 bg-amber-50 text-amber-950'}"
				role="status"
			>
				{#if discountedPledgeMet}
					Your wasiyyah pledge is satisfied: at least 1% is allocated to a charity you selected.
				{:else}
					You chose the discounted rate. To continue, allocate <strong>at least 1%</strong> of your wasiyyah to
					<strong>one</strong> of the charities below (listed or one you add).
				{/if}
			</div>
		{/if}

		{#each charities as charity}
			{@const selected = isCharitySelected(charity.id)}
			{@const charityData = selectedCharities.find((c) => c.charityId === charity.id)}
			{@const percentage = charityData?.percentage ?? 0}
			
			<div class="rounded-xl border transition-all duration-200
				{selected ? 'border-emerald-accent/30 bg-emerald-accent/5' : 'border-navy/10 bg-white'}">
				<div class="p-4">
					<div class="flex items-start gap-4">
						<button
							type="button"
							onclick={() => toggleCharity(charity.id)}
							class="flex items-center justify-center w-6 h-6 mt-1 rounded-md border-2 shrink-0 transition-colors cursor-pointer
								{selected ? 'border-emerald-accent bg-emerald-accent' : 'border-navy/20 bg-white hover:border-navy/30'}"
							aria-label={selected ? `Deselect ${charity.name}` : `Select ${charity.name}`}
						>
							{#if selected}
								<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</button>
						
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2">
								<div class="w-24 h-12 bg-white rounded-lg border border-navy/5 flex items-center justify-center p-2 shrink-0">
									<img src={charity.logo} alt={`${charity.name} logo`} class="max-w-full max-h-full object-contain" />
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="text-base font-medium text-navy mb-0.5">{charity.name}</h3>
									<a href={charity.website} target="_blank" rel="noopener noreferrer" 
										class="text-xs text-emerald-accent hover:text-emerald-accent/80 transition-colors">
										Visit Website →
									</a>
								</div>
							</div>
							
							{#if selected}
								<div class="mt-3 flex items-center gap-3">
									<label for={`${charity.id}-percentage`} class="text-sm text-navy/70 whitespace-nowrap">
										Percentage:
									</label>
									<div class="flex items-center gap-2 flex-1 max-w-xs">
										<input
											id={`${charity.id}-percentage`}
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={percentage}
											oninput={(e) => {
												const val = parseFloat(e.currentTarget.value);
												if (!isNaN(val)) updateCharityPercentage(charity.id, val);
											}}
											class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
											placeholder="0"
										/>
										<span class="text-sm text-navy/50 shrink-0">%</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}

		<div class="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 mt-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
				<div>
					<h3 class="text-sm font-medium text-navy">Other charities</h3>
					<p class="text-xs text-navy/55 mt-0.5">Add any U.S. charity by legal name and EIN (Employer Identification Number).</p>
				</div>
				<button
					type="button"
					onclick={addCustomCharity}
					class="shrink-0 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-accent/30 text-emerald-accent bg-emerald-accent/5 hover:bg-emerald-accent/10 transition-colors cursor-pointer"
				>
					Add charity
				</button>
			</div>
			{#each getCharities().filter((c) => isCustomCharityResponse(c)) as custom}
				<div class="rounded-lg border border-navy/10 bg-white p-3 mb-3 last:mb-0">
					<div class="grid gap-3 sm:grid-cols-2">
						<div>
							<label for={`custom-name-${custom.charityId}`} class="block text-xs text-navy/55 mb-1">Legal name</label>
							<input
								id={`custom-name-${custom.charityId}`}
								type="text"
								value={custom.customName}
								oninput={(e) => updateCustomCharityField(custom.charityId, 'customName', e.currentTarget.value)}
								placeholder="Charity legal name"
								class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
							/>
						</div>
						<div>
							<label for={`custom-ein-${custom.charityId}`} class="block text-xs text-navy/55 mb-1">EIN</label>
							<input
								id={`custom-ein-${custom.charityId}`}
								type="text"
								value={custom.customEin}
								oninput={(e) => updateCustomCharityField(custom.charityId, 'customEin', e.currentTarget.value)}
								placeholder="e.g. 12-3456789"
								class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
							/>
						</div>
					</div>
					<div class="mt-3 flex flex-wrap items-center gap-3">
						<label for={`${custom.charityId}-custom-pct`} class="text-sm text-navy/70 whitespace-nowrap">Wasiyyah %</label>
						<div class="flex items-center gap-2 flex-1 max-w-xs">
							<input
								id={`${custom.charityId}-custom-pct`}
								type="number"
								min="0"
								max="100"
								step="0.1"
								value={custom.percentage}
								oninput={(e) => {
									const val = parseFloat(e.currentTarget.value);
									if (!isNaN(val)) updateCharityPercentage(custom.charityId, val);
								}}
								class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm text-navy outline-none transition-all focus:border-emerald-accent/40 focus:ring-2 focus:ring-emerald-accent/10"
								placeholder="0"
							/>
							<span class="text-sm text-navy/50 shrink-0">%</span>
						</div>
						<button
							type="button"
							onclick={() => removeCustomCharity(custom.charityId)}
							class="ml-auto text-xs font-medium text-navy/45 hover:text-red-600 transition-colors cursor-pointer"
						>
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="space-y-2 mt-3 pt-3 border-t border-navy/10">
			{#if selectedCharities.length > 0}
				{@const totalPercentage = getTotalCharityPercentage()}
				{@const exceedsLimit = totalPercentage > WASIYYAH_THIRD_PERCENT + 0.01}
				
				<div class="flex items-center justify-between px-3 py-2 rounded-lg bg-navy/5">
					<span class="text-sm font-medium text-navy">Total wasiyyah (max ~33.3%):</span>
					<span class="text-sm font-semibold {exceedsLimit ? 'text-red-500' : 'text-emerald-accent'}">
						{totalPercentage.toFixed(1)}%
					</span>
				</div>
				{#if exceedsLimit}
					<div class="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
						<svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<p class="text-xs text-red-600 leading-relaxed">
							Charitable wasiyyah cannot exceed one-third of your estate. Please adjust your allocations.
						</p>
					</div>
				{:else if selectedPlan === 'discounted' && !discountedPledgeMet}
					<div class="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
						<p class="text-xs text-amber-900 leading-relaxed font-medium">
							Enter at least 1% next to one charity to meet your pledge and use Next.
						</p>
					</div>
				{/if}
			{:else}
				<p class="text-xs text-navy/40 text-center">Select listed charities and/or add your own below to allocate wasiyyah</p>
			{/if}
		</div>
	</div>
{/if}
