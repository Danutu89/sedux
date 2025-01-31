import type { Hydrate, Sync } from "./persist.d";
import type { MaybePromise } from "./query.d";
import type { Reducer } from "./reducer.d";
import type { Storex } from "./store.d";

export interface Action {
	type: symbol | string;
	name?: string;
	_id?: string;
}

export interface PureAction extends Action {
	name: string;
}

export interface ActionWithPayload<T> extends Action {
	payload?: T extends ActionWithPayload<any> ? T["payload"] : T;
}

export interface StorageAdapter {
	read: (name: string) => MaybePromise<any>;
	write: (name: string, value: any) => MaybePromise<void>;
	remove: (name: string) => MaybePromise<void>;
	clear: () => MaybePromise<void>;
	getKeys: () => MaybePromise<string[]>;
	hasKey: (name: string) => MaybePromise<boolean>;
}

export type ActionVoid = () => Action;

export type GeneralAction<A> = A extends StaticAction<any> ? A : ActionVoid;
type GeneralActionWithPayload<A> = ActionWithPayload<
	GeneralAction<A> extends ActionWithPayload<A> ? A : never
>;
export type StaticAction<A> = Action | GeneralActionWithPayload<A> | PureAction;

//type for general action and action void


export type SlicerFactory = <T, A>(
	interceptor: () => void | null,
	reducer: Reducer<T>,
	name: string,
	state?: Storex<A>,
	persist?: StorageAdapter,
	storageHandler?: {
		sync: Sync;
		hydrate: Hydrate;
	}
) => Slicer<A>;

export type SlicerToolkitFactory = <T>(
	name: string,
	reducers: Reducer<T>,
	initialState: T,
	thunks: () => void,
	persist?: StorageAdapter,
) => {
	store: Storex<T>;
	timedDispatch: (
		action: ActionVoid | Action | ActionWithPayload<T>,
		time: number
	) => void;
	dispatch: <T>(action: ActionVoid | Action | ActionWithPayload<T>) => void;
};

export interface Slicer<T> {
	reset: () => void;
	destroy: () => void;
	dispatch: <T>(action: ActionVoid | Action | ActionWithPayload<T>) => void;
	timedDispatch: (
		action: ActionVoid | Action | ActionWithPayload<T>,
		time: number
	) => void;
	value: T;
}

export declare function createSlicerToolkit<T>(
	name: string,
	reducers: Reducer<T>,
	initialState: T,
	thunks: () => void,
	persist?: StorageAdapter,
): {
	store: Slicer<T>;
	timedDispatch: (
		action: ActionVoid | Action | ActionWithPayload<T>,
		time: number
	) => void;
	dispatch: <T>(action: ActionVoid | Action | ActionWithPayload<T>) => void;
};

export declare function createSlicer<T, A>(
	interceptor: () => void | null,
	reducer: Reducer<T>,
	name: string,
	state: Storex<A>,
	persist?: StorageAdapter,
): Slicer<T>;

export declare function createSlicerAsync<T, A>(
	interceptor: () => void | null,
	reducer: Reducer<T>,
	name: string,
	state?: Storex<A>,
	persist?: StorageAdapter,
): Promise<Slicer<A>>;
