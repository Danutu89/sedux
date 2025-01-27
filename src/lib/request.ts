interface Options {
	headers?: Record<string, string>;
	credentials?: "same-origin" | "include" | null;
	strictErrors?: boolean;
}

const jsonRequest = {
	version: "[SEDUX]",
	request(
		method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT" | "OPTIONS",
		url: string,
		data?: Record<string, any>,
		options?: Options
	): Promise<Response> {
		const defaults = {
			method: method.toUpperCase(),
			credentials: "include",
			strictErrors: false,
		} as {
			method: string;
			credentials: "include" | null;
			strictErrors: boolean;
			body: string | FormData;
		};
		const settings = { ...defaults, ...options } as RequestInit;
		const isGetRequest = settings.method === "GET";
		const jsonHeaders: Record<string, string> = { Accept: "application/json" };
		if (!isGetRequest && !(data instanceof FormData))
			jsonHeaders["Content-Type"] = "application/json";
		// else if (!isGetRequest && data instanceof FormData)
		// 	jsonHeaders["Content-Type"] = "multipart/form-data;"; //boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
		settings.headers = {
			...jsonHeaders,
			...(options && options.headers),
		};
		const toPair = (key: string) =>
			data ? key + "=" + encodeURIComponent(data[key]) : ""; //build query string field-value
		const paramKeys = isGetRequest && data && Object.keys(data);
		if (paramKeys && paramKeys.length)
			url =
				url + (url.includes("?") ? "&" : "?") + paramKeys.map(toPair).join("&");
		if (!isGetRequest && data)
			settings.body = data instanceof FormData ? data : JSON.stringify(data);
		const logUrl = url.replace(/[?].*/, ""); //security: prevent logging url parameters
		const logDomain = logUrl.replace(/.*:[/][/]/, "").replace(/[:/].*/, ""); //extract hostname
		if (jsonRequest.logger)
			jsonRequest.logger(
				new Date().toISOString(),
				"request",
				settings?.method || "",
				logDomain,
				logUrl
			);
		return fetch(url, settings);
	},
	get: (
		url: string,
		params?: Record<string, any>,
		options?: Options
	): Promise<Response> => jsonRequest.request("GET", url, params, options),
	post: (
		url: string,
		resource?: Record<string, any>,
		options?: Options
	): Promise<Response> => jsonRequest.request("POST", url, resource, options),
	put: (
		url: string,
		resource?: Record<string, any>,
		options?: Options
	): Promise<Response> => jsonRequest.request("PUT", url, resource, options),
	patch: (
		url: string,
		resource?: Record<string, any>,
		options?: Options
	): Promise<Response> => jsonRequest.request("PATCH", url, resource, options),
	delete: (
		url: string,
		resource?: Record<string, any>,
		options?: Options
	): Promise<Response> => jsonRequest.request("DELETE", url, resource, options),
	options: (
		url: string,
		resource?: Record<string, any>,
		options?: Options
	): Promise<Response> =>
		jsonRequest.request("OPTIONS", url, resource, options),
	logger: null as
		| ((
				date: string,
				type: string,
				method: string,
				domain: string,
				url: string
		  ) => void)
		| null,
	getLogHeaders(): Array<unknown> {
		return [
			"Timestamp",
			"HTTP",
			"Method",
			"Domain",
			"URL",
			"Ok",
			"Status",
			"Text",
			"Type",
		];
	},
	getLogHeaderIndex(): Record<string, number> {
		return {
			timestamp: 0,
			http: 1,
			method: 2,
			domain: 3,
			url: 4,
			ok: 5,
			status: 6,
			text: 7,
			type: 8,
		};
	},
	enableLogger(booleanOrFn: boolean | void | (() => void)): void {
		const isFn = typeof booleanOrFn === "function";
		jsonRequest.logger = isFn
			? (booleanOrFn as () => void)
			: booleanOrFn === false
			? null
			: console.log;
	},
};

export { jsonRequest as request };
