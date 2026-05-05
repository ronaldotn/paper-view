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

console.log('Polyfill: Creating Previewer...');
let previewer = new Previewer();
console.log('Polyfill: Previewer created, waiting for DOM...');

ready.then(async function () {
	console.log('Polyfill: DOM ready, starting preview...');
	let done;
	if (config.before) {
		console.log('Polyfill: Calling before()...');
		await config.before();
	}

	if(config.auto !== false) {
		console.log('Polyfill: Calling preview()...');
		try {
			done = await previewer.preview(config.content, config.renderTo, config.stylesheets);
			console.log('Polyfill: preview() completed, done:', done);
			window.__previewDone = done;
		} catch(e) {
			console.error('Polyfill: preview() error:', e.message, e.stack);
			window.__previewError = { message: e.message, stack: e.stack };
			throw e;
		}
	} else {
		console.log('Polyfill: auto is false, skipping preview');
	}

	if (config.after) {
		console.log('Polyfill: Calling after()...');
		try {
			await config.after(done);
		} catch(e) {
			console.error('Polyfill: after() error:', e);
			window.__afterError = e.message;
		}
	}
	console.log('Polyfill: All done.');
});

export default previewer;
