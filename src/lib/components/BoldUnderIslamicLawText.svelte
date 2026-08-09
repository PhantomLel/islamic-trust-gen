<script lang="ts">
	const UNDER_ISLAMIC_LAW = /(under islamic law)/gi;

	type Part = { text: string; bold: boolean };

	function split(text: string): Part[] {
		const parts: Part[] = [];
		let last = 0;

		for (const match of text.matchAll(UNDER_ISLAMIC_LAW)) {
			const index = match.index ?? 0;
			if (index > last) {
				parts.push({ text: text.slice(last, index), bold: false });
			}
			parts.push({ text: match[1], bold: true });
			last = index + match[1].length;
		}

		if (last < text.length) {
			parts.push({ text: text.slice(last), bold: false });
		}

		return parts.length > 0 ? parts : [{ text, bold: false }];
	}

	let {
		text,
		class: className = '',
		boldClass = 'font-semibold',
	}: {
		text: string;
		class?: string;
		boldClass?: string;
	} = $props();

	const parts = $derived(split(text));
</script>

<span class={className}>
	{#each parts as part}
		{#if part.bold}
			<strong class={boldClass}>{part.text}</strong>
		{:else}
			{part.text}
		{/if}
	{/each}
</span>
