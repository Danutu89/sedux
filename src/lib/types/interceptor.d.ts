import type {
	Action,
	ActionWithPayload,
	GeneralAction,
	PureAction,
} from "./slicer.d";

export interface InterceptorStore {
	[z: string]: Record<string, Array<InterceptorMap>>;
}

export interface InterceptorApi {
	getState: (name?: string) => any;
	dispatch: <A>(action: GeneralAction<A>) => void;
	dispatchGlobal: <A>(action: GeneralAction<A>, name: string) => void;
}

export type InterceptorPayload<T> = ActionWithPayload<T>;

export type Interceptor = <P>(
	payload: InterceptorPayload<P>["payload"],
	api: InterceptorApi,
	name: string,
	type: string | symbol
) => Promise<void>;
export type SmartInterceptor = {
	fulfilled?: (error: any, api: InterceptorApi) => void | (() => void);
	rejected?: (
		error: any,
		api: InterceptorApi
	) => void | (() => void) | Promise<void>;
	clone: (prev: SmartInterceptor) => SmartInterceptor;
	handled?: boolean;
	(
		payload: InterceptorPayload<any>["payload"],
		api: InterceptorApi
	): Promise<any>;
};

export type SmartInterceptorFunction = (
	payload: InterceptorPayload<any>["payload"],
	api: InterceptorApi
) => Promise<any>;

export type InterceptorMap = {
	callback: Interceptor;
	mode: "pre" | "post";
	handled?: boolean;
	fulfilled?: (result: any, api: InterceptorApi) => void;
	rejected?: (
		error: any,
		api: InterceptorApi
	) => void | ((error: any, api: InterceptorApi) => Promise<void>);
	clone?: () => SmartInterceptor;
};

export type Mode = "pre" | "post";

export type AddInterceptor = (
	constant: symbol | string,
	callback: Interceptor | SmartInterceptor,
	mode?: Mode,
	handled?: boolean,
	fulfilled?: (result: any, api: InterceptorApi) => void,
	rejected?: (error: any, api: InterceptorApi) => void
) => void;

export type GetInterceptors = (
	name: string,
	constant: symbol | string
) => InterceptorMap[];

export type CallInterceptors = <P>(
	name: string,
	constant: symbol | string,
	payload: ActionWithPayload<P>["payload"],
	api: InterceptorApi,
	mode: Mode
) => Promise<any>;

export type PreIntercept = (
	constant: symbol | string,
	action: ActionWithPayload<any>["payload"],
	api: InterceptorApi
) => Promise<void>;
export type PostIntercept = (
	constant: symbol | string,
	action: ActionWithPayload<any>["payload"],
	api: InterceptorApi
) => Promise<void>;
export type ResetInterceptors = (name: string) => void;

export type CreateSmartInterceptor = (
	callback: SmartInterceptorFunction
) => SmartInterceptor;

export declare function createSmartInterceptor(
	callback: SmartInterceptorFunction
): SmartInterceptor;
export declare function addInterceptor(
	constant: symbol | string,
	callback: Interceptor | SmartInterceptor,
	mode?: Mode,
	handled?: boolean,
	fulfilled?: (result: any, api: InterceptorApi) => void,
	rejected?: (error: any, api: InterceptorApi) => void
): void;
