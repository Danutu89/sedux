import { mainStore } from "./store.svelte.js";
import type { Value } from "./types/store.js";
import type { SyncPersist, SyncMainState } from "./types/persist.js";
/**
 * @param  {string} name
 * @param  {Value} value
 * @returns void
 */
export const syncPersist: SyncPersist = <T>(name: string, value: T) => {
	const store = mainStore.value;

	if (!(name in store)) {
		console.error("Logic name not valid.", name);
		return;
	}

	const { persist } = store[name];

	if (!persist) return;

	let persisted:
		| T
		| {
				value: T;
				_derived: string;
		  };

	if (typeof persist === "string") {
		const derivedValue = value[persist as keyof T];
		persisted = {
			value: value,
			_derived: persist,
		};
	} else {
		persisted = value;
	}

	localStorage.setItem(name, JSON.stringify(persisted));
};
/**
 * @param  {string} name
 * @returns void
 */
export const syncMainState: SyncMainState = (name: string) => {
	const store = localStorage.getItem(name);
	if (!store) {
		mainStore.update((prevState) => ({
			...prevState,
			[name]: { ...prevState[name], _persistLoaded: true },
		}));
		return;
	}

	const json = JSON.parse(store);
	if (typeof mainStore.value[name].persist === "string") {
		mainStore.value[name].state.update((prevState: Value) => ({
			...prevState,
			[json._derived]: json.value,
		}));
	} else {
		mainStore.value[name].state.update(() => ({
			...json,
		}));
	}

	mainStore.update((prevState) => ({
		...prevState,
		[name]: { ...prevState[name], _persistLoaded: true },
	}));
};
