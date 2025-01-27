import type {
	Action,
	ActionVoid,
	ActionWithPayload,
	GeneralAction,
} from "./slicer.d";

export type Dispatch = <T>(
	action: ActionWithPayload<T> | ActionVoid,
	name: string
) => Promise<unknown>;
export type TimeDispatch = <T>(
	action: GeneralAction<T>,
	time: number,
	name: string
) => void;

export type ReducerCatcher = <T>(action: ActionWithPayload<T>) => void;
export type InterceptorCatcher = <T>(action: ActionWithPayload<T>) => Promise<void>;
export type ListenerCatcher = <T>(action: ActionWithPayload<T>) => void;
export type UpdateQueue = () => Promise<void>;
export declare function dispatch<T>(
	action: ActionWithPayload<T> | ActionVoid,
	name: string
): Promise<unknown>;

export declare function timedDispatch<T>(
	action: GeneralAction<T>,
	time: number,
	name: string
): void;

export declare function updateQueue(): Promise<void>;
