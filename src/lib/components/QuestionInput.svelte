<script lang="ts">
	import type {
		ChildResponse,
		HeirResponse,
		PersonalDataResponse,
		Question,
		QuestionResponseValue,
	} from '$lib/config';
	import {
		isPersonalDataShape,
	} from '$lib/question-response-helpers';
	import HeirsCalculatorInput from './HeirsCalculatorInput.svelte';
	import CountySelector from './CountySelector.svelte';
	import OwnershipAllocationInput from './OwnershipAllocationInput.svelte';
	import HebaAcknowledgmentInput from './HebaAcknowledgmentInput.svelte';
	import HebaAssetsInput from './HebaAssetsInput.svelte';
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
	import CharitiesInput from './CharitiesInput.svelte';
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
	{#key question.id}
		<HeirsCalculatorInput {value} {onresponse} questionId={question.id} {allResponses} />
	{/key}

{:else if question.type === 'ownership-allocation'}
	<OwnershipAllocationInput {value} {onresponse} {onnext} />

{:else if question.type === 'heba'}
	<HebaAcknowledgmentInput {value} {onresponse} {allResponses} />

{:else if question.type === 'heba-assets'}
	<HebaAssetsInput {value} {onresponse} />

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
	{@const houseDeedValue = typeof value === 'boolean' ? value : null}
	<HouseDeedQuestionInput
		value={houseDeedValue}
		onresponse={(v) => onresponse(v)}
		{trustId}
		{userId}
		existingUrl={houseDeedUrl}
		{deedRetrievalRequested}
		saveActionPath="?/saveHouseDeed"
	/>

{:else if question.type === 'summary-review'}
	<SummaryReviewScreen {value} {onresponse} {allResponses} {onnavigate} {oncomplete} {completing} {selectedPlan} />

{:else if question.type === 'charities'}
	<CharitiesInput {value} {onresponse} {allResponses} {selectedPlan} />
{/if}
