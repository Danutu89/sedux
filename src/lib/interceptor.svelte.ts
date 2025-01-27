import { interceptors } from "./store.svelte.js";
import type {
	AddInterceptor,
	GetInterceptors,
	ResetInterceptors,
	CallInterceptors,
	PreIntercept,
	PostIntercept,
	CreateSmartInterceptor,
	SmartInterceptor,
} from "./types/interceptor.js";
import { getCurrent } from "./internal.svelte.js";

export const addInterceptor: AddInterceptor = (
	constant,
	callback,
	mode = "pre",
	handled = false,
	fulfilled?,
	rejected?
) => {
	const interceptor = {
		mode,
		handled,
		callback,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		fulfilled: fulfilled || (() => {}),
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		rejected: rejected || (() => {}),
	};

	const name = getCurrent();

	if ("handled" in callback) {
		interceptor.handled = callback.handled ?? false;
		interceptor.fulfilled = callback.fulfilled
			? callback.fulfilled
			: (result, api) => {};
		interceptor.rejected = callback.rejected
			? callback.rejected
			: (result, api) => {};
	}

	//@ts-ignore
	interceptors.update((prevState) => ({
		...prevState,
		[name]: {
			...(prevState[name] || {}),
			[constant as string]: [
				...(prevState[name] && prevState[name][constant as string]
					? prevState[name][constant as string]
					: []),
				interceptor,
			],
		},
	}));
};

export const getInterceptors: GetInterceptors = (name, constant) => {
	return interceptors.value[name]
		? interceptors.value[name][constant as string] || []
		: [];
};

export const callInterceptors: CallInterceptors = async (
	name,
	constant,
	payload,
	api,
	mode
) => {
	const interceptors = getInterceptors(name, constant);

	await interceptors.forEach(async (interceptor) => {
		if (interceptor.mode !== mode) return;

		if (interceptor.handled) {
			try {
				const res = await interceptor.callback(payload, api, name, constant);
				if (interceptor.fulfilled) interceptor.fulfilled(res, api);
			} catch (error) {
				if (interceptor.rejected) interceptor.rejected(error, api);
			}
		} else {
			interceptor.callback(payload, api, name, constant);
		}
	});
};

export const preIntercept: PreIntercept = async (constant, action, api) => {
	await callInterceptors(action.name, constant, action.payload, api, "pre");
};

export const postIntercept: PostIntercept = async (constant, action, api) => {
	await callInterceptors(action.name, constant, action.payload, api, "post");
};

export const resetInterceptors: ResetInterceptors = (name) => {
	interceptors.update((prevState) => ({ ...prevState, [name]: {} }));
};

export const createSmartInterceptor: CreateSmartInterceptor = (callback) => {
	const interceptor: SmartInterceptor = callback as SmartInterceptor;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	interceptor.fulfilled = () => {};
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	interceptor.rejected = () => {};
	interceptor.handled = true;
	interceptor.clone = (prev: SmartInterceptor) => {
		const prevClone = prev || interceptor;
		const clone = prevClone.bind({});
		clone.fulfilled = prevClone.fulfilled;
		clone.rejected = prevClone.rejected;
		clone.handled = prevClone.handled;
		clone.clone = prevClone.clone.bind(null, clone);
		return clone;
	};

	return interceptor;
};
