import EventEmitter from "event-emitter";

import Chunker from "../chunker/chunker";
import Polisher from "../polisher/polisher";
import PDFExporter from "../export/index";
import LazyRenderer from "./lazy-renderer";
import { SpreadViewer, SpreadViewerOptions } from "./spread-viewer";

import { registerHandlers, initializeHandlers } from "../utils/handlers";

type PreviewerEventEmitter = {
	on(type: string, listener: (...args: any[]) => void): void;
	emit(type: string, ...args: any[]): void;
};

type Emitter = {
	on(type: string, listener: (...args: any[]) => void): void;
	emit(type: string, ...args: any[]): void;
};

interface Size {
	width: { value: number; unit: string };
	height: { value: number; unit: string };
	format?: string;
	orientation?: string;
}

interface FlowInfo {
	performance: number;
	size: Size;
	viewMode: string;
}

interface LazyFlowInfo extends FlowInfo {
	lazyRenderer: LazyRenderer;
	isLazy: boolean;
}

class Previewer {
	_viewMode: string;
	_lazyRender: boolean;
	_lazyRenderOptions: Record<string, unknown>;
	_useWorkers: boolean;
	_workerOptions: Record<string, unknown>;
	_spreadViewerEnabled: boolean;
	_spreadViewerOptions: Partial<SpreadViewerOptions>;

	polisher: Polisher;
	chunker: Chunker;
	hooks: Record<string, unknown>;
	pdfExporter: PDFExporter;
	lazyRenderer: LazyRenderer | null;
	spreadViewer: SpreadViewer | null;
	rendered: boolean;
	size: Size;
	handlers?: ReturnType<typeof initializeHandlers>;
	atpages?: unknown;

	constructor(options: Record<string, unknown> = {}) {
		const { viewMode } = options;
		if (viewMode === undefined || viewMode === null) {
			this._viewMode = "spread";
		} else if (viewMode === "single" || viewMode === "spread") {
			this._viewMode = viewMode as string;
		} else {
			console.warn(`Previewer: invalid viewMode "${viewMode}". Expected "single" or "spread". Falling back to "spread".`);
			this._viewMode = "spread";
		}

		const { lazyRender, lazyRenderOptions } = options;
		this._lazyRender = lazyRender === true;
		this._lazyRenderOptions = (lazyRenderOptions as Record<string, unknown>) || {};

		const { useWorkers, workerOptions } = options;
		this._useWorkers = useWorkers === true;
		this._workerOptions = (workerOptions as Record<string, unknown>) || {};

		this.polisher = new Polisher(false);

		this.chunker = new Chunker(undefined, undefined, {});

		if (this._useWorkers || this._workerOptions) {
			this.chunker._useWorkers = this._useWorkers;
			this.chunker._workerOptions = this._workerOptions;
		}

		this.hooks = {};

		this.pdfExporter = new PDFExporter(this);

		this.lazyRenderer = null;

		this.spreadViewer = null;
		const { spreadViewer, spreadViewerOptions } = options;
		this._spreadViewerEnabled = spreadViewer === true;
		this._spreadViewerOptions = (spreadViewerOptions as Partial<SpreadViewerOptions>) || {};

		this.rendered = false;

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

		const chunker = this.chunker as unknown as Emitter;
		chunker.on("page", (page) => {
			this.emit("page", page);
		});

		chunker.on("rendering", () => {
			this.emit("rendering", this.chunker);
		});

		chunker.on("workersReady", (data) => {
			this.emit("workersReady", data);
		});

		chunker.on("workerTaskComplete", (data) => {
			this.emit("workerTaskComplete", data);
		});

		chunker.on("workerTaskError", (data) => {
			this.emit("workerTaskError", data);
		});

		chunker.on("workerLayoutComplete", (data) => {
			this.emit("workerLayoutComplete", data);
		});

		chunker.on("oversetDetected", (data) => {
			this.emit("oversetDetected", data);
		});

		chunker.on("oversetMaxIterations", (data) => {
			this.emit("oversetMaxIterations", data);
		});
	}

	get useWorkers(): boolean {
		return this._useWorkers;
	}

	set useWorkers(value: boolean) {
		this._useWorkers = value === true;
		if (this.chunker) {
			this.chunker.useWorkers = this._useWorkers;
		}
	}

	get viewMode(): string {
		return this._viewMode;
	}

	set viewMode(v: string) {
		if (v !== "single" && v !== "spread") {
			console.warn(`Previewer: invalid viewMode "${v}". Expected "single" or "spread". Falling back to "spread".`);
			v = "spread";
		}
		this._viewMode = v;
		this.emit("viewModeChanged", v);
	}

	initializeHandlers() {
		let handlers = initializeHandlers(this.chunker, this.polisher, this) as unknown as Emitter;

		handlers.on("size", (size: Size) => {
			this.size = size;
			this.emit("size", size);
		});

		handlers.on("atpages", (pages: unknown) => {
			this.atpages = pages;
			this.emit("atpages", pages);
		});

		return handlers;
	}

	registerHandlers(...args: unknown[]) {
		return (registerHandlers as (...args: unknown[]) => void).apply(null, args);
	}

	getParams(name: string): string | undefined {
		let param: string | undefined;
		let url = new URL(window.location.href);
		let params = new URLSearchParams(url.search);
		for (var pair of params.entries()) {
			if (pair[0] === name) {
				param = pair[1];
			}
		}

		return param;
	}

	wrapContent(): DocumentFragment {
		let body = document.querySelector("body")!;

		let template: HTMLTemplateElement | null;
		template = body.querySelector(":scope > template[data-ref='pagedjs-content']");

		if (!template) {
			template = document.createElement("template");
			template.dataset.ref = "pagedjs-content";
			template.innerHTML = body.innerHTML;
			body.innerHTML = "";
			body.appendChild(template);
		}

		return template.content;
	}

	removeStyles(doc: Document = document): (string | Record<string, string>)[] {
		let stylesheets = Array.from(doc.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];
		let hrefs: (string | Record<string, string>)[] = stylesheets.map((sheet) => {
			sheet.remove();
			return sheet.href;
		});

		let inlineStyles = Array.from(doc.querySelectorAll("style:not([data-pagedjs-inserted-styles])"));
		inlineStyles.forEach((inlineStyle) => {
			let obj: Record<string, string> = {};
			obj[window.location.href] = inlineStyle.textContent || "";
			hrefs.push(obj);
			inlineStyle.remove();
		});

		return hrefs;
	}

	async preview(
		contentFrom?: string | HTMLElement | null,
		renderTo?: HTMLElement,
		stylesheets?: (string | Record<string, string>)[]
	): Promise<(Chunker & FlowInfo) | ({ totalPages: number; pages: unknown[] } & LazyFlowInfo)> {
		if (this._lazyRender) {
			return this.previewLazy(contentFrom, renderTo, stylesheets);
		}

		let content: string | DocumentFragment | undefined;
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

		let flow = await this.chunker.flow(content, renderTo);

		let endTime = performance.now();

		(flow as Chunker & FlowInfo).performance = (endTime - startTime);
		(flow as Chunker & FlowInfo).size = this.size;
		(flow as Chunker & FlowInfo).viewMode = this._viewMode;

		this.rendered = true;

		if (this._spreadViewerEnabled && renderTo) {
			await this.initSpreadViewer(renderTo);
		}

		this.emit("rendered", flow);

		return flow as Chunker & FlowInfo;
	}

	async previewLazy(
		contentFrom?: string | HTMLElement | null,
		renderTo?: HTMLElement,
		stylesheets?: (string | Record<string, string>)[]
	): Promise<{ totalPages: number; pages: unknown[] } & LazyFlowInfo> {
		let content: string | DocumentFragment | undefined;
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

		const lazy = this.lazyRenderer as unknown as Emitter;
		lazy.on("chunkingComplete", (data) => {
			this.emit("chunkingComplete", data);
		});

		lazy.on("pageRendered", (data) => {
			this.emit("lazyPageRendered", data);
		});

		lazy.on("pageUnloaded", (data) => {
			this.emit("lazyPageUnloaded", data);
		});

		lazy.on("progress", (data) => {
			this.emit("lazyProgress", data);
		});

		const result = await this.lazyRenderer.chunkInBackground(content, renderTo);

		let endTime = performance.now();

		(result as typeof result & LazyFlowInfo).performance = (endTime - startTime);
		(result as typeof result & LazyFlowInfo).size = this.size;
		(result as typeof result & LazyFlowInfo).viewMode = this._viewMode;
		(result as typeof result & LazyFlowInfo).lazyRenderer = this.lazyRenderer;
		(result as typeof result & LazyFlowInfo).isLazy = true;

		this.rendered = true;

		if (this._spreadViewerEnabled && renderTo) {
			await this.initSpreadViewer(renderTo);
		}

		this.emit("rendered", result);

		return result as typeof result & LazyFlowInfo;
	}

	async exportPDF(options: Record<string, unknown> = {}): Promise<unknown> {
		if (this.lazyRenderer && this.lazyRenderer.chunkingComplete) {
			this.lazyRenderer.renderAllPages();
			await new Promise(resolve => setTimeout(resolve, 500));
		}
		return this.pdfExporter.export(options);
	}

	getLazyRenderInfo(): Record<string, unknown> | null {
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

	getWorkerStats(): unknown {
		return this.chunker.getWorkerStats();
	}

	getOversetInfo(): unknown {
		return this.chunker.getOversetInfo();
	}

	scrollToPage(index: number): void {
		if (this.lazyRenderer) {
			this.lazyRenderer.scrollToPage(index);
		}
	}

	scrollToPageNumber(pageNumber: number): void {
		if (this.lazyRenderer) {
			this.lazyRenderer.scrollToPageNumber(pageNumber);
		}
	}

	async initSpreadViewer(renderTo: HTMLElement): Promise<void> {
		if (this.spreadViewer) {
			this.spreadViewer.destroy();
		}

		this.spreadViewer = new SpreadViewer({
			container: renderTo,
			spreadMode: "book",
			...this._spreadViewerOptions
		});

		await this.spreadViewer.initialize();

		const sv = this.spreadViewer as unknown as Emitter;
		sv.on("spreadChange", (data) => {
			this.emit("spreadChange", data);
		});

		sv.on("zoomChange", (data) => {
			this.emit("zoomChange", data);
		});

		sv.on("modeChange", (data) => {
			this.emit("spreadModeChange", data);
		});
	}

	getSpreadViewer(): SpreadViewer | null {
		return this.spreadViewer;
	}

	isSpreadViewerEnabled(): boolean {
		return this._spreadViewerEnabled && this.spreadViewer !== null;
	}

	setSpreadViewerMode(mode: "book" | "scroll"): void {
		if (this.spreadViewer) {
			this.spreadViewer.setMode(mode);
		}
	}

	destroy(): void {
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

interface Previewer extends PreviewerEventEmitter {}

export default Previewer;
