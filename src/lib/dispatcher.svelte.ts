import { mainStore, listenersStore } from "./store.svelte.js";
import type { GeneralAction } from "./types/slicer.js";
import type {
	Dispatch,
	InterceptorCatcher,
	ListenerCatcher,
	ReducerCatcher,
	TimeDispatch,
} from "./types/dispatcher.js";
import { queue } from "./helpers/queue.js";
import type { Listener } from "./types/listener.js";
import { postIntercept, preIntercept } from "./interceptor.svelte.js";
import { actionsLogger } from "./helpers/logger.svelte.js";
import type { InterceptorApi } from "./types/interceptor.js";
import type { UpdateQueue } from "./types/dispatcher.js";

const dispatch: Dispatch = (action, name) => {
	const action_ = typeof action === "function" ? action() : action;
	const promise = new Promise((resolve, reject) => {
		//get unique id based on epoch time and random number to avoid collisions in the future
		const id = `${Date.now()}${Math.floor(Math.random() * 100)}`;

		if (!(name in mainStore.value)) {
			reject(`Logic name not valid. ${name}`);
		}

		if (typeof action_.type === "undefined") {
			reject(`Action type is undefined. ${action_}`);
		}

		queue.enqueue({ ...action_, name, _id: id, resolve, reject });
	});

	return promise;
};

const timedDispatch: TimeDispatch = (action, time, name) => {
	setTimeout(() => dispatch(action, name), time * 60 * 1000);
};

const updateQueue: UpdateQueue = async (): Promise<void> => {
	if (queue.isEmpty()) return;
	// if (get(callsStore).nextCalled !== null) return;

	const action = queue.dequeue();

	reducerCatcher(action);
	interceptorCatcher(action);
	listenerCatcher(action);
	if (action.resolve) action.resolve(action);
	if (typeof window !== "undefined") actionsLogger(action);
};

const reducerCatcher: ReducerCatcher = (action): void => {
	const app = mainStore.value[action.name || ""];

	if (!app) {
		console.error("Logic name not valid.", action.name);
		return;
	}

	const state = $state.snapshot(app.state.value);

	let result;

	try {
		result = app.reducer(state, action);

		const newState = Object.assign({}, state, result);

		app.state.update(() => newState);
	} catch (error) {
		console.error(error);
	}
};

const interceptorCatcher: InterceptorCatcher = async (action) => {
	const api: InterceptorApi = {
		dispatch: (_action) => dispatch(_action, action.name as string),
		dispatchGlobal: <T>(_action: GeneralAction<T>, name: string) =>
			dispatch(_action, name),
		getState: (name) => {
			return mainStore.value[name ?? (action.name as string)].state.value;
		},
	};

	try {
		await preIntercept(action?.type, action, api);
	} catch (error) {
		console.log(error);
		return;
	}

	try {
		await postIntercept(action?.type, action, api);
	} catch (error) {
		console.log(error);
		return;
	}

	return;
};

const listenerCatcher: ListenerCatcher = (action) => {
	if (action === null) return;
	const listeners: Listener[] = listenersStore.value;
	const deletetion: Listener[] = [];
	console.log(listeners, 'listeners');

	listeners.map((item: Listener) => {
		if (typeof item.actionType === "object") {
			//@ts-ignore
			if (item.actionType.includes(action.type)) {
				try {
					item.callback(action);
					if (item.type === "once") deletetion.push(item);
				} catch (error) {
					console.log(error);
					return;
				}
			}
		} else {
			if (item.actionType === action?.type) {
				try {
					item.callback(action);
					if (item.type === "once") deletetion.push(item);
				} catch (error) {
					console.log(error);
					return;
				}
			}
		}
		return;
	});

	deletetion.map((item: Listener) => {
		listenersStore.update((prevState: Listener[]) => {
			return prevState.filter((listener: Listener) => listener.id !== item.id);
		});
		return;
	});

	return;
};

export {
	reducerCatcher,
	interceptorCatcher,
	listenerCatcher,
	dispatch,
	timedDispatch,
	updateQueue,
};
