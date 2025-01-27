import type { Logic } from "./logic.d";
import type { Storex } from "./store.d";

export interface Selector<S extends keyof A, A, T> {
	(state: A[S] extends Logic<S> ? A[S]["state"] : unknown): T;
}
export type Select = <
	N extends keyof A,
	A extends Record<string, Logic<any>>,
	T
>(
	name: N,
	selector: Selector<N, Storex<A>, T>
) => ReturnType<Selector<N, A, T>>;
