interface RequestOptions {
	method?: string;
	headers?: Record<string, string>;
	credentials?: string;
	body?: string | null;
}

export default async function request(url: string, options: RequestOptions = {}): Promise<Response> {
	return new Promise(function(resolve: (value: Response) => void, reject: (reason?: any) => void) {
		const request = new XMLHttpRequest();

		request.open(options.method || "get", url, true);

		for (const i in options.headers) {
			request.setRequestHeader(i, options.headers[i]);
		}

		request.withCredentials = options.credentials=="include";

		request.onload = () => {
			const status = request.status === 0 && url.startsWith("file://") ? 200 : request.status;
			resolve(new Response(request.responseText, {status}));
		};

		request.onerror = reject;

		request.send(options.body || null);
	});
}
