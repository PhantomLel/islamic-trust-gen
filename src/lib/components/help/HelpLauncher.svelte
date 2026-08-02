<script lang="ts">
	import HelpPanel from './HelpPanel.svelte';

	let {
		surface,
		stepKey = null,
		trustId = null,
		blockedStepKeys = [] as string[],
	} = $props<{
		surface: 'help_center' | 'create_trust' | 'funding' | 'dashboard';
		stepKey?: string | null;
		trustId?: number | null;
		blockedStepKeys?: string[];
	}>();
</script>

<HelpPanel {surface} {stepKey} {trustId} {blockedStepKeys} />
