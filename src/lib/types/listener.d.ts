import type { ActionWithPayload } from "./slicer.d";

export interface Listener {
	actionType: symbol | symbol[] | string | string[];
	callback: Callback;
	type?: "once" | "all" | null;
	id: string;
}

export type Callback = (action: ActionWithPayload<any>) => void;

export interface ListenerDestroyable {
	listener: Listener;
	destroy: () => void;
}

export type AddListener = (
	actionType: symbol | symbol[] | string | string[],
	callback: Callback,
	customId?: string
) => ListenerDestroyable;

export declare function addListener(
	actionType: symbol | symbol[] | string | string[],
	callback: Callback,
	customId?: string
): ListenerDestroyable;

export declare function addOnceListener(
	actionType: symbol | symbol[] | string | string[],
	callback: Callback,
	customId?: string
): ListenerDestroyable;
