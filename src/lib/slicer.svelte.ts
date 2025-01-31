import {  mainStore, storex } from "./store.svelte.js";
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
import { syncStorage, hydrateFromStorage } from "./db.svelte.js";


export const createSlicer: SlicerFactory = (
	interceptor,
	reducer,
	name,
	state,
	persist,
) => {
	
		if (!reducer || !state || !name) throw new Error("Invalid arguments");

		//@ts-ignore
		mainStore.update((prevState) => ({
			...prevState,
			[name]: {
				reducer,
				state,
				persist: typeof persist !== 'undefined',
				_persistLoaded: !persist,
			},
		}));

		setCurrent(name);
		resetInterceptors(name);
		interceptor ? interceptor() : null;

		let destroyLock = false;
		const store = mainStore.value;
		if (persist) {
			hydrateFromStorage(name, persist).then(() => {
				state.subscribe((value: any) => {
					if (destroyLock)return;
					if (!persist) return;
					syncStorage(name, value, persist);
				});
			})
		}else {
			state.subscribe((value: any) => {
				if (destroyLock)return;
				if (!persist) return;
				syncStorage(name, value, persist);
			});
		}



		const dispatch = (action: GeneralAction<any>): Promise<unknown> =>
			dispatchToSlicer(action, name);
		const timedDispatch = (action: GeneralAction<any>, time: number): void =>
			timedDispatchToSlicer(action, time, name);

		// Handle state changes synchronously
		
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
) => {
	const store = storex(initialState);


	return {
		...createSlicer(thunks, reducers, name, store, persist),
		store,
	};
};
