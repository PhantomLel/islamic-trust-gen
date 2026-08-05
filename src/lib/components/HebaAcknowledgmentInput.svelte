<script lang="ts">
	import type { QuestionResponseValue } from '$lib/config';

	let {
		value: _value,
		onresponse: _onresponse,
		allResponses: _allResponses = {},
	}: {
		value: QuestionResponseValue;
		onresponse: (val: QuestionResponseValue) => void;
		allResponses?: Record<string, QuestionResponseValue>;
	} = $props();
</script>

<div class="space-y-8 w-full min-w-0">
	<div class="rounded-2xl bg-white border border-navy/10 p-4 sm:p-6 md:p-8 space-y-5 min-w-0">
		<p class="text-[15px] sm:text-[14px] text-navy/70 leading-relaxed text-pretty wrap-break-word">
			By choosing the 50/50 option, you are each making an Islamic gift, a <span class="font-semibold text-navy/90">heba</span>, of one-half of all community property (property acquired during the marriage, not counting gifts or inheritances) to the other spouse.
		</p>

		<div class="text-[15px] sm:text-[14px] text-navy/70 leading-relaxed space-y-2.5 min-w-0">
			<p class="font-medium text-navy/80">Under Islamic law, this gift:</p>
			<ul class="space-y-2 pl-1 min-w-0">
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word">Takes effect <span class="font-medium text-navy/85">immediately</span> when you sign your trust. Not at death.</span>
				</li>
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word">Is <span class="font-medium text-navy/85">irrevocable</span>. It cannot be taken back for any reason.</span>
				</li>
				<li class="flex items-start gap-2.5 min-w-0">
					<span class="w-4 h-px bg-navy/25 mt-[11px] shrink-0" aria-hidden="true"></span>
					<span class="min-w-0 flex-1 text-pretty wrap-break-word"><span class="font-medium text-navy/85">Survives divorce — under Islamic law.</span> Religiously, this gift cannot be reclaimed, even if you later separate. This does not change Texas law: Texas still treats the property as community property, and a Texas court would divide it in a divorce as it otherwise would.</span>
				</li>
			</ul>
		</div>

		<div class="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3.5 sm:px-5 sm:py-4 min-w-0">
			<p class="text-[13px] text-amber-900/80 leading-relaxed text-pretty wrap-break-word">
				<span class="font-semibold">This is not a formality.</span> This is a real and permanent commitment under Islamic law. If you are not comfortable with this, go back and choose the asset-by-asset option instead. There is no wrong answer, only the one that is right for your family.
			</p>
		</div>

	</div>
</div>
