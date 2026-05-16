import EventEmitter from "event-emitter";

import Chunker from "../chunker/chunker";
import Polisher from "../polisher/polisher";
import PDFExporter from "../export/index.js";
import LazyRenderer from "./lazy-renderer.js";
import { SpreadViewer } from "./spread-viewer.ts";

import { registerHandlers, initializeHandlers } from "../utils/handlers";

class Previewer {
	constructor(options = {}) {
		// this.preview = this.getParams("preview") !== "false";

		// Determine viewMode from options
		const { viewMode } = options;
		if (viewMode === undefined || viewMode === null) {
			this._viewMode = "spread";
		} else if (viewMode === "single" || viewMode === "spread") {
			this._viewMode = viewMode;
		} else {
			console.warn(`Previewer: invalid viewMode "${viewMode}". Expected "single" or "spread". Falling back to "spread".`);
			this._viewMode = "spread";
		}

		// Lazy rendering options
		const { lazyRender, lazyRenderOptions } = options;
		this._lazyRender = lazyRender === true;
		this._lazyRenderOptions = lazyRenderOptions || {};

		// Worker options
		const { useWorkers, workerOptions } = options;
		this._useWorkers = useWorkers === true;
		this._workerOptions = workerOptions || {};

		// Process styles
		this.polisher = new Polisher(false);

		// Chunk contents
		this.chunker = new Chunker();

		// Apply worker options if provided
		if (this._useWorkers || this._workerOptions) {
			this.chunker._useWorkers = this._useWorkers;
			this.chunker._workerOptions = this._workerOptions;
		}

		// Hooks
		this.hooks = {};

		// PDF Exporter
		this.pdfExporter = new PDFExporter(this);

		// Lazy Renderer
		this.lazyRenderer = null;

		// Spread Viewer
		this.spreadViewer = null;
		const { spreadViewer, spreadViewerOptions } = options;
		this._spreadViewerEnabled = spreadViewer === true;
		this._spreadViewerOptions = spreadViewerOptions || {};

		// Rendered state
		this.rendered = false;

		// default size
		this.size = {
			width: {
				value: 8.5,
				unit: "in"
			},
			height: {
				value: 11,
				unit: "in"
			},
			format: undefined,
			orientation: undefined
		};

		this.chunker.on("page", (page) => {
			this.emit("page", page);
		});

		this.chunker.on("rendering", () => {
			this.emit("rendering", this.chunker);
		});

		this.chunker.on("workersReady", (data) => {
			this.emit("workersReady", data);
		});

		this.chunker.on("workerTaskComplete", (data) => {
			this.emit("workerTaskComplete", data);
		});

		this.chunker.on("workerTaskError", (data) => {
			this.emit("workerTaskError", data);
		});

		this.chunker.on("workerLayoutComplete", (data) => {
			this.emit("workerLayoutComplete", data);
		});

		this.chunker.on("oversetDetected", (data) => {
			this.emit("oversetDetected", data);
		});

		this.chunker.on("oversetMaxIterations", (data) => {
			this.emit("oversetMaxIterations", data);
		});
	}

	get useWorkers() {
		return this._useWorkers;
	}

	set useWorkers(value) {
		this._useWorkers = value === true;
		if (this.chunker) {
			this.chunker.useWorkers = this._useWorkers;
		}
	}

	get viewMode() {
		return this._viewMode;
	}

	set viewMode(v) {
		if (v !== "single" && v !== "spread") {
			console.warn(`Previewer: invalid viewMode "${v}". Expected "single" or "spread". Falling back to "spread".`);
			v = "spread";
		}
		this._viewMode = v;
		this.emit("viewModeChanged", v);
	}

	initializeHandlers() {
		let handlers = initializeHandlers(this.chunker, this.polisher, this);

		handlers.on("size", (size) => {
			this.size = size;
			this.emit("size", size);
		});

		handlers.on("atpages", (pages) => {
			this.atpages = pages;
			this.emit("atpages", pages);
		});

		return handlers;
	}

	registerHandlers() {
		return registerHandlers.apply(registerHandlers, arguments);
	}

	getParams(name) {
		let param;
		let url = new URL(window.location);
		let params = new URLSearchParams(url.search);
		for(var pair of params.entries()) {
			if(pair[0] === name) {
				param = pair[1];
			}
		}

		return param;
	}

	wrapContent() {
		// Wrap body in template tag
		let body = document.querySelector("body");

		// Check if a template exists
		let template;
		template = body.querySelector(":scope > template[data-ref='pagedjs-content']");

		if (!template) {
			// Otherwise create one
			template = document.createElement("template");
			template.dataset.ref = "pagedjs-content";
			template.innerHTML = body.innerHTML;
			body.innerHTML = "";
			body.appendChild(template);
		}

		return template.content;
	}

	removeStyles(doc=document) {
		// Get all stylesheets
		let stylesheets = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
		let hrefs = stylesheets.map((sheet) => {
			sheet.remove();
			return sheet.href;
		});

		// Get inline styles
		let inlineStyles = Array.from(doc.querySelectorAll("style:not([data-pagedjs-inserted-styles])"));
		inlineStyles.forEach((inlineStyle) => {
			let obj = {};
			obj[window.location.href] = inlineStyle.textContent;
			hrefs.push(obj);
			inlineStyle.remove();
		});

		return hrefs;
	}

	async preview(contentFrom, renderTo, stylesheets) {
		if (this._lazyRender) {
			return this.previewLazy(contentFrom, renderTo, stylesheets);
		}

		let content;
		if (typeof contentFrom === "string") {
			content = contentFrom;
		} else if (contentFrom && typeof contentFrom === "object") {
			if (contentFrom.style) {
				contentFrom.style.display = "none";
			}
			content = contentFrom.innerHTML;
		}

		if (!content) {
			content = this.wrapContent();
		}

		if (!stylesheets) {
			stylesheets = this.removeStyles();
		}

		this.handlers = this.initializeHandlers();

		this.polisher.setup();

		await this.polisher.add(...stylesheets);

		let startTime = performance.now();

		// Propagate viewMode to chunker before rendering
		this.chunker.viewMode = this._viewMode;

		// Render flow
		let flow = await this.chunker.flow(content, renderTo);

		let endTime = performance.now();

		flow.performance = (endTime - startTime);
		flow.size = this.size;
		flow.viewMode = this._viewMode;

		this.rendered = true;

		// Initialize spread viewer if enabled
		if (this._spreadViewerEnabled && renderTo) {
			await this.initSpreadViewer(renderTo);
		}

		this.emit("rendered", flow);

		return flow;
	}

	async previewLazy(contentFrom, renderTo, stylesheets) {
		let content;
		if (typeof contentFrom === "string") {
			content = contentFrom;
		} else if (contentFrom && typeof contentFrom === "object") {
			if (contentFrom.style) {
				contentFrom.style.display = "none";
			}
			content = contentFrom.innerHTML;
		}

		if (!content) {
			content = this.wrapContent();
		}

		if (!stylesheets) {
			stylesheets = this.removeStyles();
		}

		this.handlers = this.initializeHandlers();

		this.polisher.setup();

		await this.polisher.add(...stylesheets);

		let startTime = performance.now();

		this.chunker.viewMode = this._viewMode;

		this.lazyRenderer = new LazyRenderer(this.chunker, this._lazyRenderOptions);

		this.lazyRenderer.on("chunkingComplete", (data) => {
			this.emit("chunkingComplete", data);
		});

		this.lazyRenderer.on("pageRendered", (data) => {
			this.emit("lazyPageRendered", data);
		});

		this.lazyRenderer.on("pageUnloaded", (data) => {
			this.emit("lazyPageUnloaded", data);
		});

		this.lazyRenderer.on("progress", (data) => {
			this.emit("lazyProgress", data);
		});

		const result = await this.lazyRenderer.chunkInBackground(content, renderTo);

		let endTime = performance.now();

		result.performance = (endTime - startTime);
		result.size = this.size;
		result.viewMode = this._viewMode;
		result.lazyRenderer = this.lazyRenderer;
		result.isLazy = true;

		this.rendered = true;

		// Initialize spread viewer if enabled
		if (this._spreadViewerEnabled && renderTo) {
			await this.initSpreadViewer(renderTo);
		}

		this.emit("rendered", result);

		return result;
	}

	async exportPDF(options = {}) {
		if (this.lazyRenderer && this.lazyRenderer.chunkingComplete) {
			this.lazyRenderer.renderAllPages();
			await new Promise(resolve => setTimeout(resolve, 500));
		}
		return this.pdfExporter.export(options);
	}

	getLazyRenderInfo() {
		if (!this.lazyRenderer) {
			return null;
		}
		return {
			totalPages: this.lazyRenderer.totalPages,
			renderedPages: this.lazyRenderer.getRenderedCount(),
			progress: this.lazyRenderer.getRenderProgress(),
			chunkingComplete: this.lazyRenderer.chunkingComplete
		};
	}

	getWorkerStats() {
		return this.chunker.getWorkerStats();
	}

	getOversetInfo() {
		return this.chunker.getOversetInfo();
	}

	scrollToPage(index) {
		if (this.lazyRenderer) {
			this.lazyRenderer.scrollToPage(index);
		}
	}

	scrollToPageNumber(pageNumber) {
		if (this.lazyRenderer) {
			this.lazyRenderer.scrollToPageNumber(pageNumber);
		}
	}

	async initSpreadViewer(renderTo) {
		if (this.spreadViewer) {
			this.spreadViewer.destroy();
		}

		this.spreadViewer = new SpreadViewer({
			container: renderTo,
			spreadMode: "book",
			...this._spreadViewerOptions
		});

		await this.spreadViewer.initialize();

		this.spreadViewer.on("spreadChange", (data) => {
			this.emit("spreadChange", data);
		});

		this.spreadViewer.on("zoomChange", (data) => {
			this.emit("zoomChange", data);
		});

		this.spreadViewer.on("modeChange", (data) => {
			this.emit("spreadModeChange", data);
		});
	}

	getSpreadViewer() {
		return this.spreadViewer;
	}

	isSpreadViewerEnabled() {
		return this._spreadViewerEnabled && this.spreadViewer !== null;
	}

	setSpreadViewerMode(mode) {
		if (this.spreadViewer) {
			this.spreadViewer.setMode(mode);
		}
	}

	destroy() {
		if (this.spreadViewer) {
			this.spreadViewer.destroy();
			this.spreadViewer = null;
		}
		if (this.lazyRenderer) {
			this.lazyRenderer.destroy();
			this.lazyRenderer = null;
		}
		if (this.chunker) {
			this.chunker.destroy();
		}
	}
}

EventEmitter(Previewer.prototype);

export default Previewer;
