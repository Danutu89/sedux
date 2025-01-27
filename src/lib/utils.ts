import { mainStore } from "./store.svelte.js";
export const waitUntilSliceInitialized = async (
	name: string
): Promise<void> => {
	while (!mainStore.value[name]) {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
};

export const waitUntilWindowLoaded = async (): Promise<void> => {
	while (typeof window === "undefined") {
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
};
