import type { SvelteURL, SvelteURLSearchParams } from "svelte/reactivity";
import type { Reducer } from "./reducer.d";
import type { ActionWithPayload, Slicer } from "./slicer.d";
import type { Storex } from "./store.d";
import type { CreateAsyncThunk, Thunk } from "./thunks.d";

interface Reducers<S> {
	[key: string]: Reducer<S, ActionWithPayload<any>>;
}

type Dispatch = <T>(payload?: T) => ActionWithPayload<T>;

type Dispatchers<S, K extends Reducers<S>> = Record<
	keyof K,
	Dispatch | Thunk<any, any>
>;

type PathImpl<T, Key extends keyof T> =
  Key extends string
    ? T[Key] extends Array<any>
      ? `${Key}`
      : T[Key] extends Record<string, any>
        ? `${Key}.${PathImpl<T[Key], keyof T[Key]>}`
        : `${Key}`
    : never;
type Path<T> = PathImpl<T, keyof T> | keyof T;

type SearchParamsOptions<T> = {
    enabled: boolean;
    include?: Path<T>[];
    exclude?: Path<T>[];
	obj: () => URL | SvelteURL;
	goto: (url: string) => void;
    shouldAppend: (value: any, path: Path<T>) => boolean;
	parseValue?: (value: any, path: Path<T>) => any
}

interface CreateSliceOptions<
    T extends Record<string, any>,
    K extends Reducers<T>,
    P extends Record<string, Reducer<T>>
> {
    name: string;
    initialState: T;
    reducers: K;
    searchParams?: SearchParamsOptions<T>
    thunks?: ReturnType<CreateAsyncThunk>[];
    extraReducers?: P;
    persisted?: boolean | string;
}

interface CreateSlice {
    <
        T extends Record<string, any>,
        K extends Reducers<T>,
        P extends Record<string, Reducer<T>>
    >(
        options: CreateSliceOptions<T, K, P>
    ): [Slicer<T>, Dispatchers<T, K>, Storex<T>];
}

export declare function createSlice<
	T extends Record<string, any>,
	K extends Reducers<T>,
	P extends Record<string, Reducer<T>>
>(
	options: CreateSliceOptions<T, K, P>
): [Slicer<T>, Dispatchers<T, K>, Storex<T>];
