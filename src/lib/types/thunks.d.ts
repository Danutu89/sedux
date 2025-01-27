import type { Action, ActionVoid, ActionWithPayload } from "./slicer.d";

type Dispatch = <T>(payload?: T) => ActionWithPayload<T>;

interface Thunk<P, T extends string> {
	(payload?: P): (
		payload: P,
		api: {
			dispatch: <P>(
				action: Action | ActionWithPayload<P> | ActionVoid
			) => Promise<unknown>;
			name: string;
		}
	) => Promise<void>;
	pending: `${T}/pending`;
	fulfilled: `${T}/fulfilled`;
	rejected: `${T}/rejected`;
}
type PreThunk = <P>(
	payload: P,
	api: {
		dispatch: <P>(
			action: Action | ActionWithPayload<P> | ActionVoid
		) => Promise<unknown>;
		name: string;
	}
) => () => Promise<void>;

type CreateAsyncThunk = <
	T extends string,
	P extends (...args: any[]) => Promise<any>,
	R extends (...args: any[]) => any
>(
	type: T,
	payloadCreator: P,
	resultCreator: R
) => (name: string) => Thunk<Parameters<P>[0], T>;
