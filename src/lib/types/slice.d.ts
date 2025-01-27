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

interface CreateSliceOptions<
	T extends Record<string, any>,
	K extends Reducers<T>,
	P extends Record<string, Reducer<T>>
> {
	name: string;
	initialState: T;
	reducers: K;
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
