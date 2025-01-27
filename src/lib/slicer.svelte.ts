import {  mainStore, preData, storex } from "./store.svelte.js";
import { syncMainState, syncPersist } from "./persist.svelte.js";
import type {
	GeneralAction,
	SlicerFactory,
	SlicerToolkitFactory,
} from "./types/slicer.js";
import {
	dispatch as dispatchToSlicer,
	timedDispatch as timedDispatchToSlicer,
} from "./dispatcher.svelte.js";
import { resetInterceptors } from "./interceptor.svelte.js";
import { setCurrent } from "./internal.svelte.js";
import { onMount } from "svelte";
import { syncDb, syncDbMainState } from "./db.svelte.js";

const awaitUntilPreDataIsLoaded = async () => {
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (preData.value) {
				clearInterval(interval);
				resolve(true);
			}
		}, 100);
	});
};

export const createSlicer: SlicerFactory = (
	interceptor,
	reducer,
	name,
	state,
	persist = false,
	type = "localstorage",
	storageHandler
) => {
	
		if (!reducer || !state || !name) throw new Error("Invalid arguments");
		// state.reset();
		// if (typeof window !== "undefined") {
		// 	await awaitUntilPreDataIsLoaded();
		// 	const ssrData = { ...get(preData) }[name];

		// 	if (ssrData) state.set(ssrData);
		// }
		//@ts-ignore
		mainStore.update((prevState) => ({
			...prevState,
			[name]: {
				reducer,
				state,
				persist,
				_persistLoaded: !persist,
			},
		}));

		setCurrent(name);
		resetInterceptors(name);
		interceptor ? interceptor() : null;

		let synced = false;
		let syncLock = false;
		let destroyLock = false;
		const store = mainStore.value;
		// Handle persistence synchronously
		// if (
		// 	store[name] &&
		// 	persist &&
		// 	!synced &&
		// 	!store[name]._persistLoaded &&
		// 	typeof window !== "undefined" &&
		// 	!syncLock
		// ) {
		// 	syncLock = true;

			if (type === "localstorage" && persist) {
				syncMainState(name);
				synced = true;
			}
			if (type === "indexeddb" && persist) {
				syncDbMainState(name, typeof persist === 'string' ? persist : '');
				synced = true;
			}	
			if (type === "custom" && storageHandler) {
				try {
					storageHandler.hydrate(name, mainStore);
				} catch (error) {
					console.error(error);
				}
				synced = true;
			}
		// }

		// if (!synced && persist) return;

		const dispatch = (action: GeneralAction<any>): Promise<unknown> =>
			dispatchToSlicer(action, name);
		const timedDispatch = (action: GeneralAction<any>, time: number): void =>
			timedDispatchToSlicer(action, time, name);

		// Handle state changes synchronously
		state.subscribe((value: any) => {
		
			if (!destroyLock) {
				if (persist && type === "localstorage" && synced) {
					syncPersist(name, $state.snapshot(value));
				}
				if (persist && type === 'indexeddb') {
					syncDb(name, $state.snapshot(value), typeof persist === 'string' ? persist : '');
				}
				if (persist && type === "custom" && storageHandler && synced) {
					try {
						storageHandler.sync(name, $state.snapshot(value));
					} catch (error) {
						console.error(error);
					}
				}
			}
		});
		const destroy = () => {
			destroyLock = true;
			store[name]?.state?.reset();
			mainStore.update((prevState) => {
				delete prevState[name];
				return prevState;
			});
		};

		// Resolve the promise synchronously
		return {
			reset: store[name].state.reset,
			get value() {
				return store[name].state.value;
			},
			destroy,
			dispatch,
			timedDispatch,
		};
}

export const createSlicerToolkit: SlicerToolkitFactory = (
	name,
	reducers,
	initialState,
	thunks,
	persist,
	type
) => {
	const store = storex(initialState);


	return {
		...createSlicer(thunks, reducers, name, store, persist, type),
		store,
	};
};
