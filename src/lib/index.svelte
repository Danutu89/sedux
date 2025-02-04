<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { updateQueue } from './dispatcher.svelte.js';
	import { destroyDevTools, initDevTools } from './helpers/logger.svelte.js';
	import { queue } from './helpers/queue.js';
	import { hydrateSlicesFromSearchQuery } from './utils.js';
	import { afterNavigate } from '$app/navigation';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const unsubscribeQueue = queue.subscribe((value) => {
		updateQueue();
	});

	onMount(() => {
		initDevTools();
	});

	onDestroy(() => {
		destroyDevTools();
		unsubscribeQueue();
	});
	afterNavigate(() => {
		hydrateSlicesFromSearchQuery();
	});
</script>

{@render children?.()}
