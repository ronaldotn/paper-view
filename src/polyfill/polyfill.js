import Previewer from "./previewer";
import * as PaperView from "../index";

window.PaperView = PaperView;

let ready = new Promise(function(resolve, reject){
	if (document.readyState === "interactive" || document.readyState === "complete") {
		resolve(document.readyState);
		return;
	}

	document.onreadystatechange = function ($) {
		if (document.readyState === "interactive") {
			resolve(document.readyState);
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
	let done;
	if (config.before) {
		await config.before();
	}

	if(config.auto !== false) {
		try {
			done = await previewer.preview(config.content, config.renderTo, config.stylesheets);
			window.__previewDone = done;
		} catch(e) {
			console.error("Polyfill: preview() error:", e.message, e.stack);
			window.__previewError = { message: e.message, stack: e.stack };
			throw e;
		}
	}

	if (config.after) {
		try {
			await config.after(done);
		} catch(e) {
			console.error("Polyfill: after() error:", e);
			window.__afterError = e.message;
		}
	}
});

export default previewer;
