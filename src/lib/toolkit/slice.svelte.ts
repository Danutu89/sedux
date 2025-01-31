import { createSlicer } from "../slicer.svelte.js";
import { storex } from "../store.svelte.js";
import type { Reducer } from "../types/reducer.js";
import type { ActionWithPayload } from "../types/slicer.js";
import type { CreateSlice, Dispatchers, Path } from "../types/slice.js";

export const createSlice: CreateSlice = (options) => {
	const store = storex(options.initialState);

	const thunks = options.thunks?.reduce(
		(acc, thunk) => ({
			...acc,
			[thunk.name]: thunk(options.name),
		}),
		{}
	);



	const hydrateState = (url: URLSearchParams) => {
		const state = store.value;
		const updates: Record<Path<typeof options.initialState>, any> = {} as Record<Path<typeof options.initialState>, any>;

		url.forEach((value, key) => {
			if (!key.startsWith(`${options.name}.`)) return;

			const path = key.replace(`${options.name}.`, '') as Path<typeof options.initialState> as string;
			if (options.searchParams?.exclude?.includes(path)) return;
			if (options.searchParams?.include && options.searchParams?.include?.length > 0 && !options.searchParams?.include?.includes(path)) return;

			try {
				let parsedValue;
				// Handle base64 encoded objects
				if (value.startsWith('base64:')) {
					const decodedValue = atob(value.replace('base64:', ''));
					parsedValue = JSON.parse(decodedValue);
				} else if (options.searchParams?.parseValue) {
					parsedValue = options.searchParams.parseValue(value, path);
				} else {
					parsedValue = JSON.parse(value);
				}

				const pathParts = path.split('.') as Path<typeof options.initialState>[];
				let current = state;

				if (pathParts.length === 1 && typeof state[pathParts[0]] === 'object') {
					current[pathParts[0]] = parsedValue;
				} else {
					for (let i = 0; i < pathParts.length - 1; i++) {
						if (!(pathParts[i] in current)) {
							//@ts-ignore
							current[pathParts[i]] = {};
						}
						current = current[pathParts[i]];
					}
					current[pathParts[pathParts.length - 1]] = parsedValue;
				}
			} catch (e) {
				const pathParts = path.split('.');
				let current = state;
				
				if (pathParts.length === 1 && typeof state[pathParts[0]] === 'object') {
					//@ts-ignore
					current[pathParts[0]] = value;
				} else {
					for (let i = 0; i < pathParts.length - 1; i++) {
						if (!(pathParts[i] in current)) {
							//@ts-ignore
							current[pathParts[i]] = {};
						}
						current = current[pathParts[i]];
					}
					//@ts-ignore
					current[pathParts[pathParts.length - 1]] = value;
				}
			}
		});

		if (Object.keys(updates).length > 0) {
			store.set({ ...state, ...updates });
		}
	}

	const syncSearchParams = (state: typeof options.initialState) => {
		if (!options.searchParams?.enabled) return;

		const searchParams = new URLSearchParams(window.location.search);
		const processObject = (obj: any, parentPath = '') => {
			if (typeof obj !== 'object' || obj === null) return;

			if (parentPath) {
				if (options.searchParams?.exclude?.includes(parentPath as Path<typeof options.initialState>)) return;
				if (options.searchParams?.include && options.searchParams?.include?.length > 0 && !options.searchParams?.include?.includes(parentPath as Path<typeof options.initialState>)) {
					const hasIncludedChild = options.searchParams?.include?.some(includePath => 
						includePath.toString().startsWith(parentPath + '.')
					);
					if (!hasIncludedChild) return;
				}
			}

			Object.entries(obj).forEach(([key, value]) => {
				const currentPath = parentPath ? `${parentPath}.${key}` : key;
				const paramKey = `${options.name}.${currentPath}`;

				if (value && typeof value === 'object') {
					if (Array.isArray(value)) {
						// Handle arrays by adding multiple entries with the same key
						searchParams.delete(paramKey);
						value.forEach(item => {
							if (typeof item === 'object') {
								const base64Value = 'base64:' + btoa(JSON.stringify(item));
								searchParams.append(paramKey, base64Value);
							} else {
								searchParams.append(paramKey, JSON.stringify(item));
							}
						});
					} else if (options.searchParams?.include?.includes(currentPath as Path<typeof options.initialState>)) {
						// Handle objects by converting to base64
						const base64Value = 'base64:' + btoa(JSON.stringify(value));
						searchParams.set(paramKey, base64Value);
					} else {
						processObject(value, currentPath);
					}
				} else {
					if (options.searchParams?.exclude?.includes(currentPath as Path<typeof options.initialState>)) return;
					if (options.searchParams?.include && options.searchParams?.include?.length > 0 && !options.searchParams?.include?.includes(currentPath as Path<typeof options.initialState>)) return;
					if (!options.searchParams?.shouldAppend(value, currentPath as Path<typeof options.initialState>)) {
						searchParams.delete(paramKey);
						return;
					}

					searchParams.set(paramKey, JSON.stringify(value));
				}
			});
		};

		processObject(state);
		options.searchParams.goto(`?${searchParams.toString()}`);
	}

	if (typeof window !== 'undefined') {
		if (options.searchParams?.enabled) {
			hydrateState(new URLSearchParams(window.location.search));
		}
	}


	const reducer: Reducer<
		typeof options.initialState,
		ActionWithPayload<any>
	> = (state, action) => {
		if (options.reducers[action.type as string]) {
			const result = options.reducers[action.type as string](state, action);
			if (options.searchParams?.enabled) {
				syncSearchParams(result);
			}
			return result;
		}
		return state;
	};
	const slicer = createSlicer(
		() => {},
		reducer,
		options.name,
		store,
		options.persist
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
