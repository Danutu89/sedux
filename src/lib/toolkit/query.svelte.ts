import { request } from "../request.js";
import { createSlicerToolkit } from "../slicer.svelte.js";
import { select } from "../store.svelte.js";
import { createSmartInterceptor } from "../interceptor.svelte.js";
import type {
	BaseQuery,
	CreateApi,
	ThunkName,
	Thunks,
	InitialState,
	Endpoint,
	ThunkDispatcher,
	CacheAdapter,
} from "../types/query.js";
import { addInterceptor } from "../interceptor.svelte.js";
import type { Reducer } from "../types/reducer.js";
const invalidation: Record<string, any> = {};
const globalCaches: Record<
	string,
	Record<
		string,
		{
			data: any;
			lastUpdated: number;
			expire: number;
			autoRefresh: boolean;
			tag: string;
		}
	>
> = {};
let cacheWatcher: number;

const defaultCacheAdapter: CacheAdapter = {
	read: (endpointName: string, key: string) => {
		return globalCaches[endpointName][key];
	},
	write: (endpointName: string, key: string, value: any) => {
		globalCaches[endpointName][key] = value;
	},
	remove: (endpointName: string, key: string) => {
		delete globalCaches[endpointName][key];
	},
	clear: () => {
		Object.keys(globalCaches).forEach((endpointName) => {
			Object.keys(globalCaches[endpointName]).forEach((key) => {
				delete globalCaches[endpointName][key];
			});
		});
	},
	getEndpoints: () => {
		return Object.keys(globalCaches);
	},
	getKeys: (endpointName: string) => {
		return Object.keys(globalCaches[endpointName]);
	},
};

const isPromise = (value: any): boolean => {
	return value && value.then && typeof value.then === "function";
};

class QueryError extends Error {
	data: any;
	response: Response;
	constructor(data: any, response: Response) {
		super("An error occurred while fetching the data");
		this.name = "QueryError";
		this.data = data;
		this.response = response;
	}
}

export const baseQuery: BaseQuery =
	(baseUrl: string, options) => async (query, fetch?: any) => {
		const { method, body, headers, url, credentials } = query;
		const fullUrl = baseUrl + url;
		const mergedHeaders = {
			...(typeof options === "function"
				? options().headers
				: options?.headers || {}),
			...headers,
		};

		if (fetch) {
			const isGetRequest = method === "GET";
			let url = fullUrl;

			const toPair = (key: string) => key + "=" + encodeURIComponent(body[key]);

			const paramKeys = isGetRequest && body && Object.keys(body);
			if (paramKeys && paramKeys.length)
				url =
					url +
					(url.includes("?") ? "&" : "?") +
					paramKeys?.map(toPair).join("&");

			return await fetch(url, {
				method: method,
				body: !isGetRequest ? JSON.stringify(body) : undefined,
				credentials: credentials || "same-origin",
				headers: {
					...mergedHeaders,
					...(!isGetRequest
						? {
							"Content-Type": "application/json",
						}
						: {}),
				},
			});
		}
		//@ts-ignore
		return await request[method.toLowerCase()](fullUrl, body, {
			credentials: credentials || "same-origin",
			headers: mergedHeaders,
		});
	};

const composeCacheKey = (key: string, obj: any | undefined) => {
	//create a hash for the object
	if (!obj) return key;

	if (typeof obj === "string") return `${key}-${obj}`;

	if (typeof obj === "number") return `${key}-${obj}`;

	if (typeof obj === "boolean") return `${key}-${obj}`;

	if (typeof obj === "function") return `${key}-${obj}`;

	if (typeof obj === "symbol") return `${key}-${String(obj)}`;

	if (typeof obj === "undefined") return `${key}-undefined`;

	if (obj === null) return `${key}-null`;

	if (obj instanceof Array) {
		const hash = obj.reduce((acc, item) => {
			if (
				typeof item === "object" ||
				item instanceof Array ||
				item instanceof Function ||
				item instanceof Symbol ||
				item === null ||
				typeof item === "undefined"
			) {
				acc += composeCacheKey(key, item);
			} else {
				acc += item;
			}
			return acc;
		}, "");
		return `${key}-${hash}`;
	}

	if (typeof obj === "object") {
		const hash = Object.keys(obj)
			.sort()
			.reduce((acc, key) => {
				acc += obj[key];
				return acc;
			}, "");
		return `${key}-${hash}`;
	}

	return `${key}-${obj}`;
};

const createCacheWatcher = (cacheAdapter: CacheAdapter) => {
	return setInterval(() => {
		cacheAdapter.getEndpoints().forEach((endpointName) => {
			cacheAdapter.getKeys(endpointName).forEach((cacheKey) => {
				const data = cacheAdapter.read(endpointName, cacheKey);
				if (data.expire === Infinity) return;
				if (
					data && data.lastUpdated + data.expire <
					Date.now() &&
					data.autoRefresh
				) {
					invalidation[data.tag]();
					cacheAdapter.remove(endpointName, cacheKey);
				}
			});
		});
	}, 1000) as unknown as number;
};
//@ts-ignore
export const createApi: CreateApi = ({
	baseQuery,
	endpoints,
	reducerPath,
	persist,
	defaults,
	cacheAdapter: providedCacheAdapter,
}) => {
	const api = {
		endpoints: endpoints(),
	};
	const listeners = new Map<string, (payload: any) => any>();

	const cacheAdapter = providedCacheAdapter || defaultCacheAdapter;


	if (typeof window !== "undefined") {
		if (!cacheWatcher) {
			cacheWatcher = createCacheWatcher(cacheAdapter);
		}
		window.addEventListener("beforeunload", () => {
			if (cacheWatcher) {
				clearInterval(cacheWatcher);
			}
		});
		//check for the endpoints, and if they are empty and there is in cache, fulfill them
	}

	// onDestroy(() => {
	// 	if (browser) {
	// 		clearInterval(cacheWatcher);
	// 	}
	// });

	const initialState: Record<keyof typeof api.endpoints, InitialState> =
		Object.keys(api.endpoints).reduce((acc, key) => {
			acc[key] = {
				//@ts-ignore
				status: "idle",
				//@ts-ignore
				data: null,
				//@ts-ignore
				error: null,
			};
			return acc;
		}, {} as Record<keyof typeof api.endpoints, InitialState>);

	const reducerFn: Reducer<any> = (state, action) => {
		let path: keyof typeof api.endpoints = (action.type as string).split(
			"/"
		)[0];

		switch (action.type) {
			case path + "/start":
				state = {
					...state,
					[path]: {
						...state[path],
						status: "loading",
						error: null,
					},
				};
				break;
			case path + "/completed":
				state = {
					...state,
					[path]: {
						...state[path],
						status: "completed",
						data: action.payload,
						error: null,
					},
				};
				break;
			case path + "/optimistic":
				listeners.get(`${path}/update`)?.(action.payload);
				state = {
					...state,
					[path]: {
						...state[path],
						data: action.payload,
						error: null,
					},
				};
				break;
			case path + "/error":
				state = {
					...state,
					[path]: {
						...state[path],
						status: "failed",
						data: null,
						error: action.payload,
					},
				};
				break;
			case path + "/hydrate":
				state = {
					...state,
					[path]: {
						...state[path],
						status: "completed",
						error: null,
						...action.payload,
					},
				};
				break;
		}
		return state;
	};

	const actions: Record<
		keyof typeof api.endpoints,
		Record<
			"start" | "success" | "error" | "update" | "optimistic" | "hydrate",
			(payload: any) => any
		>
	> = Object.keys(api.endpoints).reduce(
		(acc, endpointName: keyof typeof api.endpoints) => {
			acc[endpointName] = {
				start: (payload) => ({
					type: `${String(endpointName)}/start`,
					payload,
				}),
				update: (payload) => ({
					type: `${String(endpointName)}/update`,
					payload,
				}),
				success: (payload) => ({
					type: `${String(endpointName)}/completed`,
					payload,
				}),
				error: (payload) => ({
					type: `${String(endpointName)}/error`,
					payload,
				}),
				optimistic: (payload) => ({
					type: `${String(endpointName)}/optimistic`,
					payload,
				}),
				hydrate: (payload) => ({
					type: `${String(endpointName)}/hydrate`,
					payload,
				}),
			};

			return acc;
		},
		{} as Record<
			keyof typeof api.endpoints,
			Record<
				"start" | "success" | "error" | "update" | "optimistic" | "hydrate",
				(payload: any) => any
			>
		>
	) as Record<
		keyof typeof api.endpoints,
		Record<
			"start" | "success" | "error" | "update" | "optimistic" | "hydrate",
			(payload: any) => any
		>
	>;

	const setupThunks = () => {
		Object.keys(api.endpoints).forEach((endpointName) => {
			const endpoint = api.endpoints[endpointName] as Endpoint;
			const { transformError, transformResponse } = endpoint;
			let context: Record<string, any> = {};
			let optimisticBackup: Record<string, any> = {};

			const interceptor = createSmartInterceptor(async (payload, api) => {
				try {
					if (endpoint?.cache?.key) {
						const cacheKey = typeof endpoint?.cache?.key === "function" ? endpoint?.cache?.key(...payload) : endpoint?.cache?.key;
						const finalCacheKey = typeof endpoint?.cache?.key === "function" ? cacheKey : composeCacheKey(cacheKey, payload);
						const ttl = endpoint.cache.ttl?.(payload) || Infinity;
						const autoRefresh = endpoint.cache.autoRefresh?.(payload) || false;
						if (!cacheAdapter.read(endpointName, finalCacheKey)) {
							cacheAdapter.write(endpointName, finalCacheKey, {
								data: null,
								lastUpdated: Date.now(),
								expire: ttl,
								autoRefresh: autoRefresh,
								tag: endpoint.tag!,
							});
						}
						if (cacheAdapter.read(endpointName, finalCacheKey)) {
							const now = Date.now();
							if (
								cacheAdapter.read(endpointName, finalCacheKey).lastUpdated +
								cacheAdapter.read(endpointName, finalCacheKey).expire <
								now
							) {
								cacheAdapter.remove(endpointName, finalCacheKey);
							} else if (cacheAdapter.read(endpointName, finalCacheKey).data) {
								api.dispatch(actions[endpointName].hydrate({ data: cacheAdapter.read(endpointName, finalCacheKey).data }));
							}
						}
					}
				} catch (error) {
					console.log(error);
				}

				if (endpoint.onOptimisticUpdate) {
					try {
						optimisticBackup[endpointName] = api.getState(reducerPath)[endpointName].data;
						const optimisticData = endpoint.onOptimisticUpdate(
							api.getState(reducerPath)[endpointName].data,
							payload,
							{
								...api,
								setContext: (data) => {
									context = {...context, ...data}
								},
								getContext: () => context
							}
						);
						api.dispatch(actions[endpointName].optimistic(optimisticData));
					} catch (error) {
						console.log(error)
					}

				}

				if (endpoint.onStart) {
					endpoint.onStart(payload, {
						...api,
						setContext: (data) => {
							context = {...context, ...data}
						},
						getContext: () => context
					});
				}

				listeners.get(`${endpointName}/start`)?.(payload);

				let response: any;

				if (endpoint.mock) {
					if (endpoint.mock.ok === false) {
						throw new Error(endpoint.mock.error);
					}
					response = {
						ok: endpoint.mock.ok || true,
						status: endpoint.mock.status || 200,
						headers: {
							get: () => "application/json",
						},
						json: async () => endpoint.mock?.data,
					};
				} else {
					//@ts-ignore
					const query = endpoint.query(...payload);
					response = await baseQuery(query);

					if (response.status === 204) {
						return transformResponse
							? await transformResponse({}, response)
							: defaults?.transformResponse
								? await defaults.transformResponse({}, response)
								: response;
					}

					if (
						!response.headers.get("content-type")?.includes("application/json")
					) {
						throw new QueryError(await response.text(), response);
					}
				}

				const json = await response.json();

				if (!response.ok) {
					throw new QueryError(json, response);
				}

				return { json, response, payload };
			});

			interceptor.fulfilled = ({ json, response, payload }, api) => {
				const transformedResponse = transformResponse
					? transformResponse(json, response)
					: defaults?.transformResponse
						? defaults.transformResponse(json, response)
						: json;

				if (endpoint?.cache?.key) {
					const cacheKey = typeof endpoint?.cache?.key === "function" ? endpoint?.cache?.key(...payload) : endpoint?.cache?.key;
					const finalCacheKey = typeof endpoint?.cache?.key === "function" ? cacheKey : composeCacheKey(cacheKey, payload);
					const ttl = endpoint.cache.ttl?.(payload) || Infinity;
					const autoRefresh = endpoint.cache.autoRefresh?.(payload) || false;
					cacheAdapter.write(endpointName, finalCacheKey, {
						data: transformedResponse,
						lastUpdated: Date.now(),
						expire: ttl,
						autoRefresh: autoRefresh,
						tag: endpoint.tag!,
					});
				}

				api.dispatch(actions[endpointName].success(transformedResponse));

				if (endpoint.invalidateTags && endpoint.invalidateTags.length > 0) {
					endpoint.invalidateTags.forEach((tag) => {
						if (typeof invalidation[tag] === "function") invalidation[tag]();
					});
				}
				if (endpoint.onSuccess) {
					endpoint.onSuccess(transformedResponse, {
						...api,
						setContext: (data) => {
							context = {...context, ...data}
						},
						getContext: () => context
					});
				} else if (defaults?.onSuccess) {
					defaults.onSuccess(transformedResponse, {
						...api,
						setContext: (data) => {
							context = {...context, ...data}
						},
						getContext: () => context
					});
				}

				listeners.get(`${endpointName}/completed`)?.(transformedResponse);
			};

			interceptor.rejected = async ({ data, response }, api) => {
				const parsedError = endpoint.parseError
					? endpoint.parseError(data, response)
					: data;

				const transformedError = transformError
					? await transformError(parsedError)
					: defaults?.transformError
						? await defaults.transformError(parsedError)
						: parsedError;

				if (endpoint.onOptimisticUpdate) {
					api.dispatch(
						actions[endpointName].optimistic(optimisticBackup[endpointName])
					);
				}

				api.dispatch(actions[endpointName].error(transformedError));

				if (endpoint.onError) {
					endpoint.onError(transformedError, {
						...api,
						setContext: (data) => {
							context = {...context, ...data}
						},
						getContext: () => context
					});
				} else if (defaults?.onError) {
					defaults.onError(transformedError, {
						...api,
						setContext: (data) => {
							context = {...context, ...data}
						},
						getContext: () => context
					});
				}

				listeners.get(`${endpointName}/error`)?.(transformedError);
			};

			addInterceptor(`${endpointName}/start`, interceptor, "post");
			addInterceptor(`${endpointName}/update`, interceptor, "post");
		});
	};

	const slicer = createSlicerToolkit(
		reducerPath,
		reducerFn,
		initialState,
		setupThunks,
		persist
	);


	const { dispatch: dispatchToSlicer, store } = slicer;

	const createThunkName: ThunkName = <T extends string>(
		endpointName: string
	) => {
		return `use${(endpointName.charAt(0).toUpperCase() +
				endpointName.slice(1)) as Capitalize<T>
			}Query`;
	};

	const thunks: Thunks<any> = Object.keys(api.endpoints).reduce(
		(acc, endpointName) => {
			const name = createThunkName(endpointName);
			const thunk = (
				initialData: any,
				prematureTagRegistration: {
					enabled?: boolean;
					lastParams?: any;
				} = {
						enabled: false,
						lastParams: null,
					}
			) => {
				const endpoint = api.endpoints[endpointName] as Endpoint;
				if (initialData && !isPromise(initialData)) {
					dispatchToSlicer(actions[endpointName].hydrate(initialData));
				} else if (initialData && isPromise(initialData)) {
					dispatchToSlicer(
						actions[endpointName].hydrate({
							status: "loading",
							data: null,
							error: null,
						})
					);
					initialData.then((data: any) => {
						dispatchToSlicer(actions[endpointName].hydrate(data));
					});
				}
				if (prematureTagRegistration?.enabled && endpoint.tag) {
					invalidation[endpoint.tag] = async () => {
						if (endpoint?.cache?.key) {
							const cacheKey = typeof endpoint?.cache?.key === "function" ? endpoint?.cache?.key(...prematureTagRegistration.lastParams) : endpoint?.cache?.key;
							const finalCacheKey = typeof endpoint?.cache?.key === "function" ? cacheKey : composeCacheKey(cacheKey, prematureTagRegistration.lastParams);
							cacheAdapter.remove(endpointName, finalCacheKey);
						}
						await dispatchToSlicer(
							actions[endpointName].update(prematureTagRegistration.lastParams)
						);
					};
				}



				const dispatcher: ThunkDispatcher<any, any> = (async (...args) => {
					if (endpoint.tag) {
						invalidation[endpoint.tag] = async () => {
							if (endpoint?.cache?.key) {
								const cacheKey = typeof endpoint?.cache?.key === "function" ? endpoint?.cache?.key(...args) : endpoint?.cache?.key;
								const finalCacheKey = typeof endpoint?.cache?.key === "function" ? cacheKey : composeCacheKey(cacheKey, args);
								cacheAdapter.remove(endpointName, finalCacheKey);
							}
							await dispatchToSlicer(actions[endpointName].update(args));
						};
					}
					await dispatchToSlicer(actions[endpointName].start(args));
				}) as ThunkDispatcher<any, any>;
				const updateDispatcher = (async (...args) => {
					await dispatchToSlicer(actions[endpointName].update(args));
				}) as ThunkDispatcher<any, any>;
				const optimisticDispatcher = (async (args) => {
					await dispatchToSlicer(actions[endpointName].optimistic(args));
				}) as ThunkDispatcher<any, any>;
				dispatcher.completed = `${endpointName}/completed`;
				dispatcher.error = `${endpointName}/error`;
				dispatcher.start = `${endpointName}/start`;
				dispatcher.update = `${endpointName}/update`;


				dispatcher.onCompleted = (fn: (payload: any) => any) => {
					listeners.set(`${endpointName}/completed`, fn);
				};

				dispatcher.onError = (fn: (payload: any) => any) => {
					listeners.set(`${endpointName}/error`, fn);
				};

				dispatcher.onStart = (fn: (payload: any) => any) => {
					listeners.set(`${endpointName}/start`, fn);
				};

				dispatcher.onUpdate = (fn: (payload: any) => any) => {
					listeners.set(`${endpointName}/update`, fn);
				};

				return [
					dispatcher,
					{
						get data() {
							return store.value[endpointName].data;
						},
						get status() {
							return store.value[endpointName].status;
						},
						get error() {
							return store.value[endpointName].error;
						},
					},
					updateDispatcher,
					optimisticDispatcher,
				];
			};

			thunk.unwrap =
				(fetch?: any) =>
					async (...payload: any) => {
						const endpoint = api.endpoints[endpointName] as Endpoint;
						let response: any;

						if (endpoint.mock) {
							if (endpoint.mock.ok === false) {
								return {
									status: "failed",
									data: null,
									error: endpoint.mock.error,
								};
							}
							response = {
								ok: endpoint.mock.ok || true,
								status: endpoint.mock.status || 200,
								headers: {
									get: () => "application/json",
								},
								json: async () => endpoint.mock?.data,
							};
						} else {
							//@ts-ignore
							const query = endpoint.query(...payload);

							try {
								response = await baseQuery(query, fetch);
							} catch (error) {
								let parsedError = error;
								if (endpoint.parseError) {
									parsedError = endpoint.parseError(error, response);
								} else if (defaults?.parseError) {
									parsedError = defaults.parseError(error, response);
								}

								if (endpoint.transformError) {
									parsedError = await endpoint.transformError(parsedError);
								} else if (defaults?.transformError) {
									parsedError = await defaults.transformError(parsedError);
								}
								return {
									status: "failed",
									data: null,
									error: parsedError,
								};
							}

							if (response.status === 204) {
								const data = endpoint.transformResponse
									? await endpoint.transformResponse({}, response)
									: defaults?.transformResponse
										? await defaults.transformResponse({}, response)
										: response;
								return {
									status: "completed",
									data,
									error: "",
								};
							}

							if (
								!response.headers
									.get("content-type")
									?.includes("application/json")
							) {
								const error = await response.text();
								let parsedError = error;

								if (endpoint.parseError) {
									parsedError = endpoint.parseError(error, response);
								} else if (defaults?.parseError) {
									parsedError = defaults.parseError(error, response);
								}

								if (endpoint.transformError) {
									parsedError = await endpoint.transformError(parsedError);
								} else if (defaults?.transformError) {
									parsedError = await defaults.transformError(parsedError);
								}
								return {
									status: "failed",
									data: null,
									error: parsedError,
								};
							}
						}

						const json = await response.json();

						if (!response.ok) {
							let error = "";
							if (endpoint.parseError) {
								error = endpoint.parseError(json, response);
							} else if (defaults?.parseError) {
								error = defaults.parseError(json, response);
							} else {
								if (json.non_field_errors) {
									error = json.non_field_errors[0];
								} else if (json.details) {
									error = json.details[0];
								} else if (json.detail) {
									error = json.detail;
								} else if (json instanceof Array) {
									error = json[0];
								} else {
									const key = Object.keys(json)[0];
									error = `${key} ${json[key][0]}`;
								}
							}
							let parsedError = error;
							if (endpoint.transformError) {
								parsedError = await endpoint.transformError(error);
							} else if (defaults?.transformError) {
								parsedError = await defaults.transformError(error);
							}
							return {
								status: "failed",
								data: null,
								error: parsedError,
							};
						}

						const transformedResponse = endpoint.transformResponse
							? await endpoint.transformResponse(json, response)
							: defaults?.transformResponse
								? await defaults.transformResponse(json, response)
								: json;

						return {
							status: "completed",
							data: transformedResponse,
							error: "",
						};
					};
			//@ts-ignore
			acc[name] = thunk;
			return acc;
		},
		{} as Thunks<any>
	);

	const util = {
		updateQueryResult: (
			endpointName: keyof typeof api.endpoints,
			callback: (draft: any) => any
		) => {
			try {
				const endpointState = store.value[endpointName];
				if (endpointState.status === "completed") {
					dispatchToSlicer(
						actions[endpointName].optimistic(
							callback(endpointState.data)
						)
					);
				}
			} catch (error) {
				console.log(error)
			}
		},
	};

	return { ...thunks, util };
};
