import type { Hydrate, Sync } from "./persist.d";
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
	persist?: boolean | string,
	type?: "localstorage" | "session" | "indexeddb" | "custom",
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
	persist?: boolean | string,
	type?: "localstorage" | "session" | "indexeddb"
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
	persist?: boolean | string,
	type?: "localstorage" | "session"
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
	persist?: boolean | string,
	session?: "localstorage" | "session"
): Slicer<T>;

export declare function createSlicerAsync<T, A>(
	interceptor: () => void | null,
	reducer: Reducer<T>,
	name: string,
	state?: Storex<A>,
	persist?: boolean | string,
	type?: "localstorage" | "session" | "custom",
	storageHandler?: {
		sync: Sync;
		hydrate: Hydrate;
	}
): Promise<Slicer<A>>;
