import type { GeneralAction } from "../types/slicer.js";
import { mainStore } from "../store.svelte.js";

interface DevTools {
	connect: (options: { trace: boolean }) => DevTools;
	disconnect: () => void;
	send: (
		action: unknown,
		state: unknown,
		options: { trace: boolean; serialize: boolean }
	) => void;
}

interface Window {
	__REDUX_DEVTOOLS_EXTENSION__?: DevTools;
}

declare global {
	interface Window {
		__REDUX_DEVTOOLS_EXTENSION__?: DevTools;
	}
}

let devTools: DevTools | null = null;

/**
 * @returns void
 */
export const initDevTools = (): void => {
	const extension = (window as Window).__REDUX_DEVTOOLS_EXTENSION__;
	if (extension) {
		devTools = extension.connect({ trace: true });
	}
};

export const destroyDevTools = (): void => {
	if (devTools) {
		devTools.disconnect();
	}
};

/**
 * @param  {Calls} state
 * @returns void
 */
export const actionsLogger = (action: GeneralAction<any>): void => {
	if (typeof window === "undefined") return;
	if (!action) return;
	const store = mainStore.value;

	const parsed: Record<string, unknown> = {};

	Object.keys(store).forEach((key) => {
		if (store[key]) parsed[key] = $state.snapshot(store[key].state.value);
	});

	if (action && devTools) {
		devTools.send({ ...action, type: action.type.toString() }, parsed, {
			trace: true,
			serialize: true,
		});
	}

	console.group(`%c Action ${action.type.toString()}`, "color: grey");
	console.info(`%c current state`, "color: #03A9F4", parsed);
	console.info(`%c current call`, "color: #4CAF50", {
		type: action.type.toString(),
		payload: action.payload,
		name: action.name,
		id: action._id,
	});
	console.groupEnd();
};
