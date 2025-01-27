import { Queue } from "./helpers/queue.js";
import type { Calls } from "./types/calls.js";
import type { Listener } from "./types/listener.js";
import type { Logic } from "./types/logic.js";
import type { DynamicSelector, Selector, Storex } from "./types/store.js";
import type { InterceptorStore } from "./types/interceptor.js";
import type { Store as InternalStore } from "./types/internal.js";

type Subscriber<T> = (value: T) => void;
type Unsubscriber = () => void;

const createMainStore = <T>(initialState: T): Storex<T> => {
	let value = $state(initialState);
	const subscribers = new Set<Subscriber<T>>();

	const notify = () => {
		subscribers.forEach(subscriber => subscriber(value));
	};

	const reset = (): void => {
		value = initialState;
		notify();
	};

	const set = (newState: T): void => {
		value = newState;
		notify();
	};

	const update = (fn: (value: T) => T) => {
		const temp = fn(value);

		if (!temp || Object.keys(temp as object).length === 0) return;

		//if it s an array, we need to check if the array is the same
		if (Array.isArray(temp)) {
			value = temp;
		}else{
			value = { ...value, ...temp };
		}
		notify();
	};

	const subscribe = (subscriber: Subscriber<T>): Unsubscriber => {
		subscribers.add(subscriber);
		subscriber($state.snapshot(value) as T); // Initial value
		
		return () => {
			subscribers.delete(subscriber);
		};
	};

	return {
		get value(): T {
			return value;
		},
		set,
		update,
		reset,
		subscribe
	};
};

const storex = createMainStore;

const queue = createMainStore<Queue>(new Queue());

const callsStore = createMainStore<Calls>({
	prevCalled: null,
	called: null,
	nextCalled: null,
});

const interceptors = createMainStore<InterceptorStore>({});

const listenersStore = createMainStore<Listener[]>([]);

const sessionStore = createMainStore<any>({});

const internalStore = createMainStore<InternalStore>({
	current: "",
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	currentResolve: () => {},
	currentIsAsync: false,
	destination: null,
});

let mainStore = createMainStore({} as Record<string, Logic<any>>);
const preData = createMainStore({} as Record<string, any>);

const initMainStore = () => {
	Object.values(mainStore.value).forEach((logic) => {
		logic?.state?.reset();
	});
	mainStore = createMainStore({} as Record<string, Logic<any>>);
};

const select = (store: any, fn: (value: any) => any) => {
	return fn(store);
};

const dynamicSelect: DynamicSelector = (store) => (key) => {
	return select(store, (value) => {
		return value[key];
	});
};

export {
	mainStore,
	listenersStore,
	callsStore,
	initMainStore,
	queue,
	storex,
	interceptors,
	select,
	dynamicSelect,
	internalStore,
	sessionStore,
	preData,
};
