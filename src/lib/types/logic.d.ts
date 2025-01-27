import type { Reducer } from "./reducer.d";
import type { Storex } from "./store.d";

export interface Logic<S> {
	reducer: Reducer<S>;
	state: Storex<S>;
	persist: string | null | boolean;
	_persistLoaded?: boolean;
}

export type Store<S> = Record<string, Logic<S>>;
