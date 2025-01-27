import type { Action, ActionWithPayload } from "./slicer.d";

export type Reducer<S, A extends Action = ActionWithPayload<any>> = (
	state: S,
	action: A,
) => S;
