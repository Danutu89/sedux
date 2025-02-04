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
	listen: (
		listener: (message: {
			type: string;
			payload: unknown;
			source: string;
			state: unknown;
		}) => void
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

const handleExtensionDispatch = (states: Record<string, any>) => {
	mainStore.update((prevStates) => {
		Object.keys(states).forEach((key) => {
			if (prevStates[key]) {
				prevStates[key].state.set(states[key]);
			}
		});
		return prevStates;
	})
}

/**
 * @returns void
 */
export const initDevTools = (): void => {
	const extension = (window as Window).__REDUX_DEVTOOLS_EXTENSION__;
	if (extension && extension.connect) {
		devTools = extension?.connect({ trace: true });
		window.addEventListener('message', (e) => {
			if (e.data.source === '@devtools-extension') {
				try {
					if (e.data.type === 'DISPATCH' && e.data.payload.type === 'JUMP_TO_ACTION') {
						handleExtensionDispatch(JSON.parse(e.data.state));
					}
				} catch (error) {
					console.log(error)
				}
			}
		});
	}
};

export const destroyDevTools = (): void => {
	if (devTools) {
		devTools?.disconnect?.();
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
