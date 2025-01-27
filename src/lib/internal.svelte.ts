import { internalStore } from "./store.svelte.js";
import type { SetCurrent, GetCurrent } from "./types/internal.js";

export const setCurrent: SetCurrent = (current) => {
	internalStore.update((prevState) => ({ ...prevState, current }));
};

export const getCurrent: GetCurrent = () => internalStore.value.current;
