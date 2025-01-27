<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	// import { mainStore, initMainStore } from "./store";
	import { updateQueue } from './dispatcher.svelte.js';
	import { actionsLogger, destroyDevTools, initDevTools } from './helpers/logger.svelte.js';
	import { queue } from './helpers/queue.js';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	// import { browser } from "$app/environment";
	// import { parse, unparse } from "./helpers/parser";
	// import { START_SCRIPT_TAG, END_SCRIPT_TAG } from "./helpers/constants";

	// Object.keys($mainStore).forEach((key) => {
	// 	$mainStore[key]?.state?.reset();
	// });
	// if (typeof window === "undefined") {
	// 	initMainStore();
	// }

	const unsubscribeQueue = queue.subscribe((value) => {
		updateQueue();
	});
	// initSession($session, session);

	onMount(() => {
		initDevTools();
	});

	// $: if (typeof window !== "undefined") {
	// 	unparse(window.__sedux_ssr__);
	// }

	onDestroy(() => {
		destroyDevTools();
		unsubscribeQueue();
	});

	// const data = `${START_SCRIPT_TAG} window.__sedux_ssr__ = ${JSON.stringify(
	// 	parse(mainStore)
	// )} ${END_SCRIPT_TAG}`;
</script>

{@render children?.()}
<!-- {#if !browser}
	{@html data}
{/if} -->
