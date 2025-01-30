import type { SvelteURL, SvelteURLSearchParams } from "svelte/reactivity";
import type { Reducer } from "./reducer.d";
import type { ActionWithPayload, Slicer } from "./slicer.d";
import type { Storex } from "./store.d";
import type { CreateAsyncThunk, Thunk } from "./thunks.d";


export type Simplify<T> = T extends any[] | Date
    ? T
    : {
            [K in keyof T]: T[K];
        } & {};

export type SimplifyThunk<T> = T extends (...args: any[]) => any ? {
	(...args: Parameters<T>): ReturnType<T>;
} & {[K in keyof T]: T[K]} & {}: T;



interface Reducers<S> {
	[key: string]: Reducer<S, ActionWithPayload<any>>;
}

type Dispatch = <T>(payload?: T) => ActionWithPayload<T>;

type Dispatchers<S, K extends Reducers<S>> = {
    [P in keyof K]: (payload?: Simplify<Parameters<K[P]>[1]['payload']>) => void;
};


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
    ): [Slicer<T>, Simplify<Dispatchers<T, K>>, Storex<T>];
}

export declare function createSlice<
	T extends Record<string, any>,
	K extends Reducers<T>,
	P extends Record<string, Reducer<T>>
>(
	options: CreateSliceOptions<T, K, P>
): [Slicer<T>, Simplify<Dispatchers<T, K>>, Storex<T>];
