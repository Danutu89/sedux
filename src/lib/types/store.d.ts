import type { Logic } from "./logic.d";

export interface Storex<T> extends T {
	set: (value: T) => void;
	update: (fn: (value: T) => T) => void;
	reset: () => void;
	subscribe: (subscriber: (value: T) => void) => () => void;
	// get: () => T;
	value: T;
}

export type Selector = <T, K>(
	state: T,
	callback: (value: T) => K
) => K;

//create type for dynamic selectors which return a function that takes and argument key which is a string and returns a readable which is selected from the store with the key which is a keyof the store
export type DynamicSelector = <T, K>(
	state: Storex<T>
) => (key: keyof T) => T[keyof T];

// export type DynamicSelector = <T, K>(state: Storex<T>) => I extends (key: keyof T) => Readable<T[I]> ? I : never;

export type Value = T;
/**
 * @param  {T} initialState
 * @returns Storex
 */
export declare function storex<T>(initialState: T): Storex<T>;
export declare function select<T, K>(
	state: Storex<T>,
	callback: (value: T) => K
): K;
export declare function dynamicSelect<T, K>(
	state: Storex<T>
): (key: keyof T) => T[keyof T];
export declare const mainStore: Storex<Record<string, Logic<any>>>;
