import { listenersStore } from "./store.svelte.js";
import type { AddListener, Listener } from "./types/listener.js";

export const addListener: AddListener = (actionType, callback, name, customId) => {
	const now = new Date();
	const id =
		now.getMilliseconds().toString() +
		Math.random().toString() +
		Math.random().toString();
	const finalId = id;

	const store = listenersStore.value;

	const check = store.some((listener) => listener.id === finalId);

	if (check) throw new Error(`Listener with id ${finalId} already exists`);

	const listener = { actionType, callback, id: finalId, name } as Listener;

	listenersStore.update((prevState) => {
		prevState.push(listener);
		return prevState;
	});

	return {
		listener,
		destroy: () => {
			listenersStore.update((prevState) =>
				prevState.filter((listener) => listener.id !== finalId)
			);
		},
	};
};

export const addOnceListener: AddListener = (actionType, callback, name) => {
	const now = new Date();
	//create unique id for listener fomr milliseconds
	const id =
		now.getMilliseconds().toString() +
		Math.random().toString() +
		Math.random().toString();
	const finalId = id;

	const store = listenersStore.value;

	const check = store.some((listener) => listener.id === finalId);

	if (check) throw new Error(`Listener with id ${finalId} already exists`);

	const listener = {
		actionType,
		callback,
		type: "once",
		name,
		id: finalId,
	} as Listener;

	listenersStore.update((prevState) => {
		prevState.push(listener);
		return prevState;
	});

	return {
		listener,
		destroy: () => {
			listenersStore.update((prevState) =>
				prevState?.filter((listener) => listener.id !== finalId)
			);
		},
	};
};
