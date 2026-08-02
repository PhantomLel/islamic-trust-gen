<script lang="ts">
	let { data } = $props();
</script>

<a href="/admin/help/conversations" class="text-sm text-navy/50 hover:text-navy inline-flex items-center gap-1">
	← Back to conversations
</a>

<div class="mt-4 mb-8">
	<h1 class="text-2xl font-semibold text-navy tracking-tight mb-1">Conversation #{data.conversation.id}</h1>
	<p class="text-navy/45 text-sm">
		{data.conversation.surface}{data.conversation.stepKey ? ` / ${data.conversation.stepKey}` : ''}
	</p>
</div>

<div class="max-w-2xl rounded-xl border border-navy/[0.06] bg-white/70 p-5 space-y-5">
	{#each data.queries as q (q.id)}
		<div>
			<p class="mb-1.5 text-[11px] uppercase tracking-wider text-navy/35 font-medium">Turn {q.turnIndex + 1}</p>
			<div class="flex justify-end">
				<div class="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-[13px] leading-relaxed text-cream">
					{q.questionText}
				</div>
			</div>
			<div class="mt-2 flex justify-start">
				<div class="max-w-[85%] rounded-2xl rounded-bl-md border border-navy/10 bg-white px-4 py-2.5 shadow-sm">
					<p class="text-[13px] leading-relaxed text-navy">{q.renderedResponse.shortAnswer}</p>
					<p class="mt-2 text-[10.5px] text-navy/40 uppercase tracking-wide">{q.renderedResponse.kind}</p>
				</div>
			</div>
		</div>
	{:else}
		<p class="text-navy/40 text-sm">No turns recorded.</p>
	{/each}
</div>
