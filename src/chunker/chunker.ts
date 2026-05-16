import Page from "./page";
import ContentParser from "./parser";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";
import Queue from "../utils/queue";
import {
	requestIdleCallback
} from "../utils/utils";
import PageNumberingModule from "../modules/page-numbering/index";
import LayoutWorkerManager from "./layout-worker-manager";

interface BreakToken {
	node: Node;
	offset: number;
}

interface PageNumberingConfig {
	enabled?: boolean;
	[key: string]: unknown;
}

interface WorkerOptions {
	workerCount?: number;
	workerUrl?: string;
	[key: string]: unknown;
}

interface ChunkerOptions {
	useWorkers?: boolean;
	workerOptions?: WorkerOptions;
	pageNumbering?: PageNumberingConfig;
}

const MAX_PAGES: number | false = false;

const TEMPLATE = `
<div class="pagedjs_page">
	<div class="pagedjs_sheet">
		<div class="pagedjs_bleed pagedjs_bleed-top">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>
			<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-bottom">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>		<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-left">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>		<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-right">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>
			<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_pagebox">
			<div class="pagedjs_margin-top-left-corner-holder">
				<div class="pagedjs_margin pagedjs_margin-top-left-corner"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-top">
				<div class="pagedjs_margin pagedjs_margin-top-left"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-top-center"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-top-right"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-top-right-corner-holder">
				<div class="pagedjs_margin pagedjs_margin-top-right-corner"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-right">
				<div class="pagedjs_margin pagedjs_margin-right-top"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-right-middle"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-right-bottom"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_area">
				<div class="pagedjs_page_content"></div>
			</div>
			<div class="pagedjs_margin-left">
				<div class="pagedjs_margin pagedjs_margin-left-top"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-left-middle"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-left-bottom"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-bottom-left-corner-holder">
				<div class="pagedjs_margin pagedjs_margin-bottom-left-corner"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-bottom">
				<div class="pagedjs_margin pagedjs_margin-bottom-left"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-bottom-center"><div class="pagedjs_margin-content"></div></div>
				<div class="pagedjs_margin pagedjs_margin-bottom-right"><div class="pagedjs_margin-content"></div></div>
			</div>
			<div class="pagedjs_margin-bottom-right-corner-holder">
				<div class="pagedjs_margin pagedjs_margin-bottom-right-corner"><div class="pagedjs_margin-content"></div></div>
			</div>
			
		</div>
	</div>
</div>`;

class Chunker {
	hooks: {
		beforeParsed: Hook;
		afterParsed: Hook;
		beforePageLayout: Hook;
		layout: Hook;
		renderNode: Hook;
		layoutNode: Hook;
		onOverflow: Hook;
		onBreakToken: Hook;
		afterPageLayout: Hook;
		afterRendered: Hook;
	};
	pages: Page[];
	_total: number;
	q: Queue;
	stopped: boolean;
	rendered: boolean;
	source: ContentParser | undefined;
	breakToken: BreakToken | undefined;
	content: unknown;
	charsPerBreak: number[];
	maxChars: number | undefined;
	viewMode: string;
	_useWorkers: boolean;
	_workerOptions: WorkerOptions;
	layoutWorkerManager: LayoutWorkerManager | null;
	pageNumbering: PageNumberingModule | null;
	pagesArea: HTMLElement | undefined;
	pageTemplate: HTMLTemplateElement | undefined;

	constructor(content: unknown, renderTo?: HTMLElement, options: ChunkerOptions = {}) {
		this.hooks = {} as Chunker["hooks"];
		this.hooks.beforeParsed = new Hook(this);
		this.hooks.afterParsed = new Hook(this);
		this.hooks.beforePageLayout = new Hook(this);
		this.hooks.layout = new Hook(this);
		this.hooks.renderNode = new Hook(this);
		this.hooks.layoutNode = new Hook(this);
		this.hooks.onOverflow = new Hook(this);
		this.hooks.onBreakToken = new Hook();
		this.hooks.afterPageLayout = new Hook(this);
		this.hooks.afterRendered = new Hook(this);

		this.pages = [];
		this._total = 0;

		this.q = new Queue(this);
		this.stopped = false;
		this.rendered = false;

		this.content = content;

		this.charsPerBreak = [];
		this.maxChars = undefined;

		this.viewMode = "spread";

		const { useWorkers, workerOptions } = options;
		this._useWorkers = useWorkers === true;
		this._workerOptions = workerOptions || {};
		this.layoutWorkerManager = null;

		this.pageNumbering = null;
		if (options.pageNumbering) {
			this.pageNumbering = new PageNumberingModule(options.pageNumbering);
		}

		if (content) {
			this.flow(content, renderTo);
		}
	}

	get useWorkers(): boolean {
		return this._useWorkers;
	}

	set useWorkers(value: boolean) {
		this._useWorkers = value === true;
	}

	setup(renderTo?: HTMLElement): void {
		this.pagesArea = document.createElement("div");
		this.pagesArea.classList.add("pagedjs_pages");

		if (this.viewMode === "single") {
			this.pagesArea.classList.add("pagedjs_single_page_mode");
		}

		if (renderTo) {
			renderTo.appendChild(this.pagesArea);
			renderTo.classList.add("paper_view_content_root");
		} else {
			let body = document.querySelector("body")!;
			body.appendChild(this.pagesArea);
			body.classList.add("paper_view_content_root");
		}

		this.pageTemplate = document.createElement("template");
		this.pageTemplate.innerHTML = TEMPLATE;
	}

	async flow(content: unknown, renderTo?: HTMLElement): Promise<this> {
		let parsed: ContentParser;

		await this.hooks.beforeParsed.trigger(content, this);

		parsed = new ContentParser(content as Node | string);

		this.source = parsed;
		this.breakToken = undefined;

		if (this.pagesArea && this.pageTemplate) {
			this.q.clear();
			this.removePages();
		} else {
			this.setup(renderTo);
		}

		if (this._useWorkers) {
			await this.initWorkers();
		}

		this.emit("rendering", content);

		await this.hooks.afterParsed.trigger(parsed, this);

		await this.loadFonts();

		let rendered: { done: boolean; canceled: boolean } = await this.render(parsed, this.breakToken);
		while (rendered.canceled) {
			this.start();
			rendered = await this.render(parsed, this.breakToken);
		}

		if (this.oversetPages().length > 0) {
			await this.handleOverset(parsed);
		}

		this.rendered = true;

		await this.hooks.afterRendered.trigger(this.pages, this);

		this.emit("rendered", this.pages);

		return this;
	}

	async initWorkers(): Promise<void> {
		if (this.layoutWorkerManager) {
			return;
		}

		this.layoutWorkerManager = new LayoutWorkerManager(this._workerOptions);

		this.layoutWorkerManager.on("ready", (data: unknown) => {
			this.emit("workersReady", data);
		});

		this.layoutWorkerManager.on("taskComplete", (data: unknown) => {
			this.emit("workerTaskComplete", data);
		});

		this.layoutWorkerManager.on("taskError", (data: unknown) => {
			this.emit("workerTaskError", data);
		});

		await this.layoutWorkerManager.initialize();
	}

	getWorkerStats(): unknown {
		if (!this.layoutWorkerManager) {
			return null;
		}
		return this.layoutWorkerManager.getStats();
	}

	oversetPages(): Page[] {
		let overset: Page[] = [];
		for (let i = 0; i < this.pages.length; i++) {
			let page = this.pages[i];
			if (page.overset) {
				overset.push(page);
			}
		}
		return overset;
	}

	async handleOverset(parsed: ContentParser, maxIterations: number = 50): Promise<void> {
		let iterations = 0;

		while (iterations < maxIterations) {
			let overset = this.oversetPages();

			if (overset.length === 0) {
				break;
			}

			iterations++;

			let firstOversetPage = overset[0];
			let breakToken = firstOversetPage.endToken;
			let startIndex = this.pages.indexOf(firstOversetPage) + 1;

			this.emit("oversetDetected", {
				page: firstOversetPage,
				pageIndex: startIndex,
				breakToken,
				iteration: iterations
			});

			this.removePages(startIndex);

			let rendered: { done: boolean; canceled: boolean } = await this.render(parsed, breakToken);

			if (rendered.canceled) {
				this.start();
				rendered = await this.render(parsed, breakToken);
			}

			if (this.oversetPages().length === 0) {
				break;
			}
		}

		if (iterations >= maxIterations) {
			console.warn(`Overset handling stopped after ${maxIterations} iterations. Content may be truncated.`);
			this.emit("oversetMaxIterations", { iterations: maxIterations });
		}
	}

	getOversetInfo(): { hasOverset: boolean; oversetPageCount: number; oversetPages: Array<{ index: number; id: string | undefined; breakToken: { node: string | undefined; offset: number } | null }> } {
		let oversetPages = this.oversetPages();
		return {
			hasOverset: oversetPages.length > 0,
			oversetPageCount: oversetPages.length,
			oversetPages: oversetPages.map(page => ({
				index: this.pages.indexOf(page),
				id: page.id,
				breakToken: page.endToken ? {
					node: page.endToken.node?.nodeName,
					offset: page.endToken.offset
				} : null
			}))
		};
	}

	async render(parsed: ContentParser, startAt?: BreakToken): Promise<{ done: boolean; canceled: boolean }> {
		let renderer = this.layout(parsed, startAt);

		let done = false;
		let result: { done: boolean; canceled: boolean };

		while (!done) {
			result = await this.q.enqueue(() => { return this.renderAsync(renderer); });
			done = result.done;
		}

		return result!;
	}

	start(): void {
		this.rendered = false;
		this.stopped = false;
	}

	stop(): void {
		this.stopped = true;
	}

	renderOnIdle(renderer: AsyncGenerator<BreakToken | undefined, void, unknown>): Promise<{ done: boolean; canceled: boolean }> {
		return new Promise(resolve => {
			requestIdleCallback(async () => {
				if (this.stopped) {
					return resolve({ done: true, canceled: true });
				}
				let result = await renderer.next();
				if (this.stopped) {
					resolve({ done: true, canceled: true });
				} else {
					resolve(result);
				}
			});
		});
	}

	async renderAsync(renderer: AsyncGenerator<BreakToken | undefined, void, unknown>): Promise<{ done: boolean; canceled: boolean }> {
		if (this.stopped) {
			return { done: true, canceled: true };
		}
		let result = await renderer.next();
		if (this.stopped) {
			return { done: true, canceled: true };
		} else {
			return result;
		}
	}

	async handleBreaks(node: Node | undefined): Promise<void> {
		if (this.viewMode === "single") { return; }
		let currentPage = this.total + 1;
		let currentPosition = currentPage % 2 === 0 ? "left" : "right";
		let currentSide = currentPage % 2 === 0 ? "verso" : "recto";
		let previousBreakAfter: string | undefined;
		let breakBefore: string | undefined;
		let page: Page | undefined;

		if (currentPage === 1) {
			return;
		}

		if (node &&
			typeof (node as Element).dataset !== "undefined" &&
			typeof (node as Element).dataset.previousBreakAfter !== "undefined") {
			previousBreakAfter = (node as Element).dataset.previousBreakAfter;
		}

		if (node &&
			typeof (node as Element).dataset !== "undefined" &&
			typeof (node as Element).dataset.breakBefore !== "undefined") {
			breakBefore = (node as Element).dataset.breakBefore;
		}

		if (!breakBefore && node) {
			let current: Node = node;
			let parent: Node | null = node.nodeType === 3 ? node.parentNode : node.parentNode;
			while (!breakBefore && parent && parent.nodeType === 1) {
				let isFirst = true;
				let sibling = current.previousSibling;
				while (sibling) {
					if (sibling.nodeType === 3 && !(sibling.textContent || "").trim()) {
						sibling = sibling.previousSibling;
						continue;
					}
					isFirst = false;
					break;
				}
				if (!isFirst) break;

				if (typeof (parent as Element).dataset !== "undefined" &&
					typeof (parent as Element).dataset.breakBefore !== "undefined") {
					breakBefore = (parent as Element).dataset.breakBefore;
					break;
				}
				current = parent;
				parent = parent.parentNode;
			}
		}

		if (!previousBreakAfter && node) {
			let current: Node = node;
			let parent: Node | null = node.nodeType === 3 ? node.parentNode : node.parentNode;
			while (!previousBreakAfter && parent && parent.nodeType === 1) {
				let isFirst = true;
				let sibling = current.previousSibling;
				while (sibling) {
					if (sibling.nodeType === 3 && !(sibling.textContent || "").trim()) {
						sibling = sibling.previousSibling;
						continue;
					}
					isFirst = false;
					break;
				}
				if (!isFirst) break;

				if (typeof (parent as Element).dataset !== "undefined" &&
					typeof (parent as Element).dataset.previousBreakAfter !== "undefined") {
					previousBreakAfter = (parent as Element).dataset.previousBreakAfter;
					break;
				}
				current = parent;
				parent = parent.parentNode;
			}
		}

		if (previousBreakAfter &&
			(previousBreakAfter === "left" || previousBreakAfter === "right") &&
			previousBreakAfter !== currentPosition) {
			page = this.addPage(true);
		} else if (previousBreakAfter &&
			(previousBreakAfter === "verso" || previousBreakAfter === "recto") &&
			previousBreakAfter !== currentSide) {
			page = this.addPage(true);
		} else if (breakBefore &&
			(breakBefore === "left" || breakBefore === "right") &&
			breakBefore !== currentPosition) {
			page = this.addPage(true);
		} else if (breakBefore &&
			(breakBefore === "verso" || breakBefore === "recto") &&
			breakBefore !== currentSide) {
			page = this.addPage(true);
		}

		if (page) {
			await this.hooks.beforePageLayout.trigger(page, undefined, undefined, this);
			this.emit("page", page);
			await this.hooks.afterPageLayout.trigger(page.element, page, undefined, this);
			this.emit("renderedPage", page);
		}
	}

	async *layout(content: Node, startAt?: BreakToken): AsyncGenerator<BreakToken | undefined, void, unknown> {
		let breakToken: BreakToken | undefined | false = startAt || false;

		if (this._useWorkers && this.layoutWorkerManager && !breakToken) {
			yield* this.layoutWithWorkers(content);
			return;
		}

		while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {

			if (breakToken && breakToken.node) {
				await this.handleBreaks(breakToken.node);
			} else {
				await this.handleBreaks(content.firstChild!);
			}

			let page = this.addPage();

			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			breakToken = await page.layout(content, breakToken || undefined, this.maxChars!);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);

			this.recoredCharLength(page.wrapper!.textContent!.length);

			yield breakToken || undefined;
		}
	}

	async *layoutWithWorkers(content: Node): AsyncGenerator<BreakToken | undefined, void, unknown> {
		const serializedContent = this.serializeContent(content);
		const bounds = this.pagesArea!.getBoundingClientRect();

		const workerResult = await this.layoutWorkerManager!.calculateLayout(
			serializedContent,
			{ width: bounds.width, height: bounds.height },
			this.maxChars!,
			0
		) as { error?: string; nodesProcessed?: number; breakFound?: boolean };

		if (workerResult.error) {
			console.warn("Worker layout failed, falling back to main thread:", workerResult.error);
			let breakToken: BreakToken | undefined | false = false;
			while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {
				if (breakToken && breakToken.node) {
					await this.handleBreaks(breakToken.node);
				} else {
					await this.handleBreaks(content.firstChild!);
				}

				let page = this.addPage();
				await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
				this.emit("page", page);
				breakToken = await page.layout(content, breakToken || undefined, this.maxChars!);
				await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
				this.emit("renderedPage", page);
				this.recoredCharLength(page.wrapper!.textContent!.length);
				yield breakToken || undefined;
			}
			return;
		}

		this.emit("workerLayoutComplete", {
			nodesProcessed: workerResult.nodesProcessed,
			breaksFound: workerResult.breakFound
		});

		let breakToken: BreakToken | undefined | false = false;
		let pageCount = 0;

		while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {
			if (breakToken && breakToken.node) {
				await this.handleBreaks(breakToken.node);
			} else {
				await this.handleBreaks(content.firstChild!);
			}

			let page = this.addPage();
			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			breakToken = await page.layout(content, breakToken || undefined, this.maxChars!);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);
			this.recoredCharLength(page.wrapper!.textContent!.length);

			pageCount++;
			yield breakToken || undefined;
		}
	}

	serializeContent(content: Node): unknown {
		if (!content) return null;

		const serialize = (node: Node): unknown => {
			if (!node) return null;

			const serialized: Record<string, unknown> = {
				nodeType: node.nodeType,
				tagName: (node as Element).tagName || null,
				textContent: node.textContent || null,
				dataRef: (node as Element).dataset && (node as Element).dataset.ref || null,
				breakBefore: (node as Element).dataset && (node as Element).dataset.breakBefore || null,
				previousBreakAfter: (node as Element).dataset && (node as Element).dataset.previousBreakAfter || null,
				breakInside: (node as Element).dataset && (node as Element).dataset.breakInside || null,
				page: (node as Element).dataset && (node as Element).dataset.page || null,
				children: [] as unknown[]
			};

			if (node.childNodes && node.childNodes.length > 0) {
				for (let i = 0; i < node.childNodes.length; i++) {
					(serialized.children as unknown[]).push(serialize(node.childNodes[i]));
				}
			}

			return serialized;
		};

		return serialize(content);
	}

	recoredCharLength(length: number): void {
		if (length === 0) {
			return;
		}

		this.charsPerBreak.push(length);

		if (this.charsPerBreak.length > 4) {
			this.charsPerBreak.shift();
		}

		this.maxChars = this.charsPerBreak.reduce((a, b) => a + b, 0) / (this.charsPerBreak.length);
	}

	removePages(fromIndex: number = 0): void {

		if (fromIndex >= this.pages.length) {
			return;
		}

		for (let i = fromIndex; i < this.pages.length; i++) {
			this.pages[i].destroy();
		}

		if (fromIndex > 0) {
			this.pages.splice(fromIndex);
		} else {
			this.pages = [];
		}

		if (this.pageNumbering && this.pageNumbering.isEnabled()) {
			this.pageNumbering.updatePageCount(this.pages.length);
		}
	}

	addPage(blank?: boolean): Page {
		let lastPage = this.pages[this.pages.length - 1];

		let page = new Page(this.pagesArea!, this.pageTemplate!, blank, this.hooks, this.viewMode);

		this.pages.push(page);

		page.create(undefined, lastPage && lastPage.element);

		page.index(this.total);

		if (this.pageNumbering && this.pageNumbering.isEnabled() && !blank) {
			this.pageNumbering.renderPageNumber(page.element!, this.total, this.pages.length);
		}

		if (!blank) {
			page.onOverflow((overflowToken: BreakToken) => {
				console.warn("overflow on", page.id, overflowToken);

				if (this.rendered) {
					return;
				}

				let index = this.pages.indexOf(page) + 1;

				this.stop();

				this.breakToken = overflowToken;

				this.removePages(index);

				if (this.rendered === true) {
					this.rendered = false;

					this.q.enqueue(async () => {

						this.start();

						await this.render(this.source!, this.breakToken);

						this.rendered = true;

					});
				}


			});

			page.onUnderflow((overflowToken: BreakToken) => {

			});
		}

		this.total = this.pages.length;

		return page;
	}

	insertPage(index: number, options: (Record<string, unknown> & { blank?: boolean; content?: string | Node; name?: string; className?: string; pageNumberOverride?: number | null; breakBefore?: boolean }) | boolean = {}): Page {
		const {
			blank = false,
			content = null,
			name = null,
			className = null,
			pageNumberOverride = null,
			breakBefore = false
		} = typeof options === "boolean" ? { blank: options } : (options as Exclude<typeof options, boolean>);

		if (index < 0) {
			index = 0;
		}
		if (index > this.pages.length) {
			index = this.pages.length;
		}

		const referencePage = this.pages[index] || null;
		const page = new Page(this.pagesArea!, this.pageTemplate!, blank, this.hooks, this.viewMode);

		if (name) {
			page.name = name;
		}

		this.pages.splice(index, 0, page);

		const insertAfterElement = index > 0 ? this.pages[index - 1].element : null;
		page.create(undefined, insertAfterElement);

		if (className) {
			page.element!.classList.add(className);
		}

		if (breakBefore) {
			page.element!.style.breakBefore = "page";
		}

		this.reindexPagesFrom(index);

		if (pageNumberOverride !== null) {
			page.element!.style.counterReset = `page ${pageNumberOverride}`;
		}

		if (this.pageNumbering && this.pageNumbering.isEnabled() && !blank) {
			this.pageNumbering.renderPageNumber(page.element!, index, this.pages.length);
		}

		if (content) {
			this.injectPageContent(page, content);
		}

		if (!blank && !content) {
			page.onOverflow((overflowToken: BreakToken) => {
				if (this.rendered) {
					return;
				}

				const pageIndex = this.pages.indexOf(page) + 1;
				this.stop();
				this.breakToken = overflowToken;
				this.removePages(pageIndex);

				if (this.rendered === true) {
					this.rendered = false;
					this.q.enqueue(async () => {
						this.start();
						await this.render(this.source!, this.breakToken);
						this.rendered = true;
					});
				}
			});

			page.onUnderflow(() => {
				// Underflow handling for inserted pages
			});
		}

		this.total = this.pages.length;

		this.emit("pageInserted", page, index);

		return page;
	}

	insertPages(startIndex: number, pageConfigs: Array<Record<string, unknown>>): Page[] {
		const inserted: Page[] = [];

		pageConfigs.forEach((config, i) => {
			const page = this.insertPage(startIndex + i, config);
			inserted.push(page);
		});

		return inserted;
	}

	prependPage(options: Record<string, unknown> = {}): Page {
		return this.insertPage(0, options);
	}

	appendPage(options: Record<string, unknown> = {}): Page {
		return this.insertPage(this.pages.length, options);
	}

	removePage(index: number): boolean {
		if (index < 0 || index >= this.pages.length) {
			return false;
		}

		const page = this.pages[index];
		page.element!.remove();
		this.pages.splice(index, 1);

		this.reindexPagesFrom(index);
		this.total = this.pages.length;

		this.emit("pageRemoved", index);

		return true;
	}

	replacePage(index: number, options: Record<string, unknown> = {}): Page {
		this.removePage(index);
		return this.insertPage(index, options);
	}

	reindexPagesFrom(fromIndex: number): void {
		for (let i = fromIndex; i < this.pages.length; i++) {
			this.pages[i].index(i);

			if (this.viewMode !== "single") {
				const el = this.pages[i].element!;
				if (i % 2 !== 1) {
					el.classList.remove("pagedjs_left_page");
					el.classList.add("pagedjs_right_page");
				} else {
					el.classList.remove("pagedjs_right_page");
					el.classList.add("pagedjs_left_page");
				}
			}

			if (this.pageNumbering && this.pageNumbering.isEnabled() && !this.pages[i].blank) {
				const existingPageNum = this.pages[i].element!.querySelector(".pagedjs_page_number");
				if (existingPageNum) {
					existingPageNum.remove();
				}
				this.pageNumbering.renderPageNumber(this.pages[i].element!, i, this.pages.length);
			}
		}
	}

	injectPageContent(page: Page, content: string | Node): void {
		const wrapper = page.createWrapper();

		if (typeof content === "string") {
			const fragment = document.createRange().createContextualFragment(content);
			wrapper.appendChild(fragment);
		} else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
			wrapper.appendChild(content.cloneNode ? content.cloneNode(true) : content);
		}
	}

	get total(): number {
		return this._total;
	}

	set total(num: number) {
		this.pagesArea!.style.setProperty("--pagedjs-page-count", String(num));
		this._total = num;

		if (this.pageNumbering && this.pageNumbering.isEnabled()) {
			this.pageNumbering.updatePageCount(num);
		}
	}

	loadFonts(): Promise<unknown> | undefined {
		let fontPromises: Promise<unknown>[] = [];
		if (document.fonts) {
			document.fonts.forEach((fontFace) => {
				if (fontFace.status !== "loaded") {
					let fontLoaded = fontFace.load().then((r) => {
						return fontFace.family;
					}, () => {
						console.warn("Failed to preload font-family:", fontFace.family);
						return fontFace.family;
					});
					fontPromises.push(fontLoaded);
				}
			});
			return Promise.all(fontPromises).catch((err) => {
				console.warn(err);
			});
		}
	}

	destroy(): void {
		this.pagesArea!.remove();
		this.pageTemplate!.remove();

		if (this.layoutWorkerManager) {
			this.layoutWorkerManager.terminate();
			this.layoutWorkerManager = null;
		}

		if (this.pageNumbering) {
			this.pageNumbering.disable();
		}
	}

	updatePageNumbering(config: Record<string, unknown>): void {
		if (!this.pageNumbering) {
			this.pageNumbering = new PageNumberingModule(config);
		} else {
			this.pageNumbering.updateConfig(config);
		}

		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}

		if (this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering!.renderPageNumber(page.element!, index, this.pages.length);
				}
			});
		}
	}

	getPageNumberingConfig(): Record<string, unknown> | null {
		if (!this.pageNumbering) {
			return null;
		}
		return this.pageNumbering.getConfig();
	}

	setPageNumberingEnabled(enabled: boolean): void {
		if (!this.pageNumbering) {
			this.pageNumbering = new PageNumberingModule({ enabled });
		} else if (enabled) {
			this.pageNumbering.enable();
		} else {
			this.pageNumbering.disable();
		}

		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}

		if (enabled && this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering!.renderPageNumber(page.element!, index, this.pages.length);
				}
			});
		}
	}

	applyPageNumberingCSSRules(pageRules: unknown[]): void {
		if (!this.pageNumbering) {
			this.pageNumbering = new PageNumberingModule({});
		}
		this.pageNumbering.applyCSSRules(pageRules);

		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}

		if (this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering!.renderPageNumber(page.element!, index, this.pages.length);
				}
			});
		}
	}
}

interface Chunker extends EventEmitter {}
EventEmitter(Chunker.prototype);

export default Chunker;
