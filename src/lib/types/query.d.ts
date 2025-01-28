import type { InterceptorApi } from "./interceptor.d";

export type Simplify<T> = T extends any[] | Date
    ? T
    : {
            [K in keyof T]: T[K];
        } & {};

export type SimplifyThunk<T> = T extends (...args: any[]) => any ? {
	(...args: Parameters<T>): ReturnType<T>;
} & {[K in keyof T]: T[K]} & {}: T;

type QueryOptions = {
	url: string;
	method: "POST" | "GET" | "DELETE" | "PATCH" | "PUT";
	body?: any;
	credentials?: "same-origin" | "omit" | "include";
	headers?: any;
};

type BaseQueryFn = {
	(query: QueryOptions, fetch?: any): Promise<Response>;
}

type MaybePromise<T> = T | Promise<T>;

type QueryFn = {
	(...args: any): QueryOptions;
	cacheKey?: string;
}



type EndpointBuilt<T extends any[] = any[]> = {
	query: (...args: T) => QueryOptions;
	transformResponse?: (data: any, response: Response) => any;
	transformError?: (error: any) => any;
	onSuccess?: (
		data: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
			setContext: (data: any) => void;
			getContext: () => any
		}
	) => void;
	onError?: (
		error: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
				setContext: (data: any) => void;
			getContext: () => any
		}
	) => void;
	onStart?: (
		data: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
				setContext: (data: any) => void;
			getContext: () => any
		}
	) => void;
	onOptimisticUpdate?: (
		data: any,
		payload: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
				setContext: (data: any) => void;
			getContext: () => any
		}
	) => any;
	parseError?: (data: any, response: Response) => any;
	tag?: string;
	invalidateTags?: string[];
	mock?: {
		data: any;
		error?: any;
		ok?: boolean;
		status?: number;
	};
	cache?: {
		ttl?: ((...args: Parameters<typeof query>) => number);
		key?: ((...args: Parameters<typeof query>) => string);
		autoRefresh?: ((...args: Parameters<typeof query>) => boolean);
	};
}

type Endpoint = {
	query: (...args: T) => QueryOptions;
	transformResponse?: (data: any, response: any) => any;
	transformError?: (error: any) => any;
	onSuccess?: (
		data: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
			setContext: (data: any) => void;
			getContext: () => any
		}
	) => void;
	onError?: (
		error: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
				setContext: (data: any) => void;
				getContext: () => any
		}
	) => void;
	onStart?: (
		data: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
			setContext: (data: any) => void;
						getContext: () => any
		}
	) => void;
	onOptimisticUpdate?: (
		data: any,
		payload: any,
		api: {
			dispatch: InterceptorApi["dispatch"];
			dispatchGlobal: InterceptorApi["dispatchGlobal"];
			getState: InterceptorApi["getState"];
			setContext: (data: any) => void;
			getContext: () => any
		}
	) => any;
	parseError?: (data: any, response?: Response) => any;
	tag?: string;
	invalidateTags?: string[];
	mock?: {
		data: any;
		error?: any;
		ok?: boolean;
		status?: number;
	};
	cache?: {
		ttl?: ((...args: T) => number);
		key?: ((...args: T) => string);
		autoRefresh?: ((...args: T) => boolean);
	};
}

interface InitialState {
	[key: string]: {
		status: "idle" | "loading" | "completed" | "failed";
		data: any | null;
		error: any | null;
	};
}

type ThunkNameGeneric<N extends string> = `use${Capitalize<N>}Query`;

export type ThunkDispatcher<
	T extends ReturnType<CreateApiOptions["endpoints"]>,
	P extends string
> = {
	(
		...args: Parameters<T[P extends string ? P : never]["query"]>
	): Promise<void>;
	start: string;
	completed: string;
	error: string;
	update: string;
	hydrate: string;
	optimistic: string;
	onCompleted: (fn: (payload: ReturnType<T[P extends string ? P : never]["transformResponse"]>) => any) => void;
	onError: (fn: (payload: Awaited<ReturnType<T[P extends string ? P : never]["transformError"]>> | ReturnType<T[P extends string ? P : never]["parseError"]> | ReturnType<C["defaults"]["parseError"]>) => any) => void;
	onStart: (fn: (payload:  Parameters<T[P extends string ? P : never]["query"]>) => any) => void;
	onUpdate: (fn: (payload:  Parameters<T[P extends string ? P : never]["query"]>) => any) => void;
}

export type ThunkUnwrappedDispatcher<
	C extends CreateApiOptions,
	T extends ReturnType<CreateApiOptions["endpoints"]>,
	P extends string
> = {
	(...args: Parameters<T[P extends string ? P : never]["query"]>): Promise<{
		data: ReturnType<T[P extends string ? P : never]["transformResponse"]>;
		error:
			Simplify< Awaited<ReturnType<T[P extends string ? P : never]["transformError"]>>
			| ReturnType<T[P extends string ? P : never]["parseError"]>
			| ReturnType<C["defaults"]["parseError"]> | unknown>;
		status: "idle" | "loading" | "completed" | "failed";
	}>;
	start: string;
	completed: string;
	error: string;
	update: string;
}

export type RefreshThunkDispatcher<
	T extends ReturnType<CreateApiOptions["endpoints"]>,
	P extends string
> = {
	(
		...args: Parameters<T[P extends string ? P : never]["query"]>
	): Promise<void>;
}

export type OptimisticThunkDispatcher<
	T extends ReturnType<CreateApiOptions["endpoints"]>,
	P extends string
> = {
	(
		...args: Parameters<T[P extends string ? P : never]["query"]>
	): Promise<void>;
}

type Thunk<S extends CreateApiOptions, P extends keyof ReturnType<S["endpoints"]>> = {
	(
		initialData?: MaybePromise<{
			data: ReturnType<
				ReturnType<S["endpoints"]>[P extends string
					? P
					: never]["transformResponse"]
			>;
			error:
				Simplify<Awaited<
						ReturnType<
							ReturnType<S["endpoints"]>[P extends string
								? P
								: never]["transformError"]
						>
				  >
				| ReturnType<
						ReturnType<S["endpoints"]>[P extends string
							? P
							: never]["parseError"]
				  >
				| ReturnType<S["defaults"]["parseError"]> | unknown>;
			status: "idle" | "loading" | "completed" | "failed";
		}>,
		prematureTagRegistration?: {
			enabled?: boolean;
			lastParams?: any;
		}
	): [
		SimplifyThunk<ThunkDispatcher<ReturnType<S["endpoints"]>, P extends string ? P : never>>,
		{
			data: ReturnType<
				ReturnType<S["endpoints"]>[P extends string
					? P
					: never]["transformResponse"]
			>;
			error:
				| Awaited<
						ReturnType<
							ReturnType<S["endpoints"]>[P extends string
								? P
								: never]["transformError"]
						>
				  >
				| ReturnType<
						ReturnType<S["endpoints"]>[P extends string
							? P
							: never]["parseError"]
				  >
				| ReturnType<S["defaults"]["parseError"]>
				| unknown;

			status: "idle" | "loading" | "completed" | "failed";
		},
		SimplifyThunk<RefreshThunkDispatcher<
			ReturnType<S["endpoints"]>,
			P extends string ? P : never
		>>,
		SimplifyThunk<OptimisticThunkDispatcher<
			ReturnType<S["endpoints"]>,
			P extends string ? P : never
		>>
	];
	unwrap: (
		fetch?: any
	) => SimplifyThunk<ThunkUnwrappedDispatcher<
		S,
		ReturnType<S["endpoints"]>,
		P extends string ? P : never
	>>;
};

type Thunks<S extends CreateApiOptions> = {
	[P in keyof ReturnType<S["endpoints"]> as ThunkNameGeneric<
		P extends string ? P : never
	>]: SimplifyThunk<Thunk<S, P>>;
};
type ThunkName = <T extends string>(endpointName: T) => ThunkNameGeneric<T>;

type Util<S extends CreateApiOptions> = {
	updateQueryResult: <T extends keyof ReturnType<S["endpoints"]>>(
		endpointName: T,
		callback: (
			data: ReturnType<
				ReturnType<S["endpoints"]>[T extends string
					? T
					: never]["transformResponse"]
			>
		) => any
	) => void;
};

type Result<S extends CreateApiOptions> = Thunks<S> & { util: Util<S> };

type BaseQuery = (
	baseUrl: string,
	options?:
		| {
				headers?: Record<string, string>;
		  }
		| (() => {
				headers?: Record<string, string>;
		  })
) => BaseQueryFn;

type Endpoints = () => {
	[key: string]: EndpointBuilt;
};


interface CacheAdapter {
	read: (endpointName: string, key: string) => any;
	write: (endpointName: string, key: string, value: any) => void;
	remove: (endpointName: string, key: string) => void;
	clear: () => void;
	getEndpoints: () => string[];
	getKeys: (endpointName: string) => string[];
}

interface StoreAdapter {
	read: (endpointName: string, key: string) => any;
	write: (endpointName: string, key: string, value: any) => void;
	remove: (endpointName: string, key: string) => void;
	clear: () => void;
	getEndpoints: () => string[];
	getKeys: (endpointName: string) => string[];
}

type CreateApiOptions = {
	baseQuery: BaseQueryFn;
	endpoints: Endpoints;
	reducerPath: string;
	persist?: boolean | string;
	persistAdapter?: StoreAdapter;
	cacheAdapter?: CacheAdapter;
	defaults?: {
		transformResponse?: (data: any, response: Response) => any;
		transformError?: (error: any) => any;
		onSuccess?: (
			data: any,
			api: {
				dispatch: InterceptorApi["dispatch"];
				dispatchGlobal: InterceptorApi["dispatchGlobal"];
				getState: InterceptorApi["getState"];
				getContext: () => any;
				setContext: (data: any) => void;
			}
		) => void;
		onError?: (
			error: any,
			api: {
				dispatch: InterceptorApi["dispatch"];
				dispatchGlobal: InterceptorApi["dispatchGlobal"];
				getState: InterceptorApi["getState"];
				getContext: () => any;
				setContext: (data: any) => void;
			}
		) => void;
		parseError?: (data: any, response: Response) => any;
	};
};

type CreateApi = <T extends CreateApiOptions>(data: T) => Result<T>;

declare const baseQuery: BaseQuery;
declare const createApi: CreateApi;
