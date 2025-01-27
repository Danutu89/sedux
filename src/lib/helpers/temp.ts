import { callsStore } from "../store.svelte.js";
import type { GeneralAction } from "../types/slicer.d.ts";

export let lastCalled: GeneralAction<any> = {};
export let setLastCalled = (call: GeneralAction<any>) => {
	lastCalled = call;
};

export const proceedNextCall = (call: GeneralAction<any> | null) => {
	callsStore.update((prevState: GeneralAction<any>) => {
		return {
			...prevState,
			nextCalled: call,
			called: prevState.nextCalled,
			prevCalled: prevState.called,
		};
	});
};
