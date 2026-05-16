import Previewer from "./previewer";
import * as PaperView from "../index";

window.PaperView = PaperView;

let ready = new Promise<void>(function(resolve){
	if (document.readyState === "interactive" || document.readyState === "complete") {
		resolve();
		return;
	}

	document.onreadystatechange = function () {
		if (document.readyState === "interactive") {
			resolve();
		}
	};
});

let config = window.PaperViewConfig || {
	auto: true,
	before: undefined,
	after: undefined,
	content: undefined,
	stylesheets: undefined,
	renderTo: undefined
};

let previewer = new Previewer();

ready.then(async function () {
	let done: unknown;
	if (config.before) {
		await config.before();
	}

	if(config.auto !== false) {
		try {
			done = await previewer.preview(config.content, config.renderTo, config.stylesheets);
			window.__previewDone = done;
		} catch(e) {
			console.error("Polyfill: preview() error:", (e as Error).message, (e as Error).stack);
			window.__previewError = { message: (e as Error).message, stack: (e as Error).stack || "" };
			throw e;
		}
	}

	if (config.after) {
		try {
			await config.after(done);
		} catch(e) {
			console.error("Polyfill: after() error:", e);
			window.__afterError = (e as Error).message;
		}
	}
});

export default previewer;
