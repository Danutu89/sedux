import type { Storex } from "$lib/types/store.js";
import { mainStore, preData } from "../store.svelte.js";

interface ParsedStore {
	[key: string]: any;
	__type__?: string;
}

//parse the store into a json which is formed by another stores
export const parse = (store: Storex<Record<string, any>>) => {
	const parsed: ParsedStore = {};
	for (const [key, value] of Object.entries(store.value)) {
		if (value && typeof value === "object" && "state" in value) {
			parsed[key] = value.state.value;
			parsed[key].__type__ = "store";
		} else {
			parsed[key] = value;
		}
	}

	return parsed;
};

//now parse it back into a store
export const unparse = (parsed: Record<string, any>) => {
	for (const [key, value] of Object.entries(parsed)) {
		if (
			value &&
			typeof value === "object" &&
			value.__type__ === "store" &&
			key in mainStore.value
		) {
			mainStore.value[key].state.set(value);
		} else {
			preData.update((data: Record<string, any>) => {
				data[key] = value;
				return data;
			});
		}
	}
};
