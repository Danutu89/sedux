import { createSlicer } from "../slicer.svelte.js";
import { storex } from "../store.svelte.js";
import type { Reducer } from "../types/reducer.js";
import type { ActionWithPayload } from "../types/slicer.js";
import type { CreateSlice, Dispatchers } from "../types/slice.js";

export const createSlice: CreateSlice = (options) => {
	const store = storex(options.initialState);

	const thunks = options.thunks?.reduce(
		(acc, thunk) => ({
			...acc,
			[thunk.name]: thunk(options.name),
		}),
		{}
	);

	const reducer: Reducer<
		typeof options.initialState,
		ActionWithPayload<any>
	> = (state, action) => {
		if (options.reducers[action.type as string]) {
			return options.reducers[action.type as string](state, action);
		}
		return state;
	};
	const slicer = createSlicer(
		() => {},
		reducer,
		options.name,
		store,
		options.persisted
	);

	const dispatchers: Dispatchers<
		typeof options.initialState,
		typeof options.reducers
	> = Object.keys(options.reducers).reduce((acc, key) => {
		(acc as any)[key] = (payload: any) =>
			slicer.dispatch({
				type: key,
				payload,
				name: options.name,
			});
		return acc;
	}, {} as Dispatchers<typeof options.initialState, typeof options.reducers>);

	return [slicer, { ...dispatchers, ...thunks }, store];
};
