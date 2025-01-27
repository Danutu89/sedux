import type { ActionWithPayload } from "./slicer.d";

export interface Calls {
	nextCalled: ActionWithPayload<any> | null;
	called: ActionWithPayload<any> | null;
	prevCalled: ActionWithPayload<any> | null;
}
