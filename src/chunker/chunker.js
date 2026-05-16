import Page from "./page";
import ContentParser from "./parser";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";
import Queue from "../utils/queue";
import {
	requestIdleCallback
} from "../utils/utils";
import PageNumberingModule from "../modules/page-numbering/index.js";
import LayoutWorkerManager from "./layout-worker-manager.js";

const MAX_PAGES = false;

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

/**
 * Chop up text into flows
 * @class
 */
class Chunker {
	constructor(content, renderTo, options = {}) {
		// this.preview = preview;

		this.hooks = {};
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
		this.maxChars;

		this.viewMode = "spread";

		// Worker options
		const { useWorkers, workerOptions } = options;
		this._useWorkers = useWorkers === true;
		this._workerOptions = workerOptions || {};
		this.layoutWorkerManager = null;

		// Initialize page numbering module if configured
		this.pageNumbering = null;
		if (options.pageNumbering) {
			this.pageNumbering = new PageNumberingModule(options.pageNumbering);
		}

		if (content) {
			this.flow(content, renderTo);
		}
	}

	get useWorkers() {
		return this._useWorkers;
	}

	set useWorkers(value) {
		this._useWorkers = value === true;
	}

	setup(renderTo) {
		this.pagesArea = document.createElement("div");
		this.pagesArea.classList.add("pagedjs_pages");

		if (this.viewMode === "single") {
			this.pagesArea.classList.add("pagedjs_single_page_mode");
		}

		if (renderTo) {
			renderTo.appendChild(this.pagesArea);
			renderTo.classList.add("paper_view_content_root");
		} else {
			let body = document.querySelector("body");
			body.appendChild(this.pagesArea);
			body.classList.add("paper_view_content_root");
		}

		this.pageTemplate = document.createElement("template");
		this.pageTemplate.innerHTML = TEMPLATE;

	}

	async flow(content, renderTo) {
		let parsed;

		await this.hooks.beforeParsed.trigger(content, this);

		parsed = new ContentParser(content);

		this.source = parsed;
		this.breakToken = undefined;

		if (this.pagesArea && this.pageTemplate) {
			this.q.clear();
			this.removePages();
		} else {
			this.setup(renderTo);
		}

		// Initialize workers if enabled
		if (this._useWorkers) {
			await this.initWorkers();
		}

		this.emit("rendering", content);

		await this.hooks.afterParsed.trigger(parsed, this);

		await this.loadFonts();

		let rendered = await this.render(parsed, this.breakToken);
		while (rendered.canceled) {
			this.start();
			rendered = await this.render(parsed, this.breakToken);
		}

		// Handle overset content if any
		if (this.oversetPages().length > 0) {
			await this.handleOverset(parsed);
		}

		this.rendered = true;

		await this.hooks.afterRendered.trigger(this.pages, this);

		this.emit("rendered", this.pages);

		return this;
	}

	async initWorkers() {
		if (this.layoutWorkerManager) {
			return;
		}

		this.layoutWorkerManager = new LayoutWorkerManager(this._workerOptions);

		this.layoutWorkerManager.on("ready", (data) => {
			this.emit("workersReady", data);
		});

		this.layoutWorkerManager.on("taskComplete", (data) => {
			this.emit("workerTaskComplete", data);
		});

		this.layoutWorkerManager.on("taskError", (data) => {
			this.emit("workerTaskError", data);
		});

		await this.layoutWorkerManager.initialize();
	}

	getWorkerStats() {
		if (!this.layoutWorkerManager) {
			return null;
		}
		return this.layoutWorkerManager.getStats();
	}

	/**
	 * Find all pages that have overset content (content that didn't fit)
	 * @returns {Array<Page>} Array of pages with overset content
	 */
	oversetPages() {
		let overset = [];
		for (let i = 0; i < this.pages.length; i++) {
			let page = this.pages[i];
			if (page.overset) {
				overset.push(page);
			}
		}
		return overset;
	}

	/**
	 * Handle overset content by adding new pages and re-rendering
	 * @param {ContentParser} parsed - The parsed content source
	 * @param {number} maxIterations - Maximum iterations to prevent infinite loops
	 * @returns {Promise<void>}
	 */
	async handleOverset(parsed, maxIterations = 50) {
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

			// Remove pages from the overset page onwards
			this.removePages(startIndex);

			// Re-render from the break token
			let rendered = await this.render(parsed, breakToken);

			if (rendered.canceled) {
				this.start();
				rendered = await this.render(parsed, breakToken);
			}

			// Check if we still have overset content
			if (this.oversetPages().length === 0) {
				break;
			}
		}

		if (iterations >= maxIterations) {
			console.warn(`Overset handling stopped after ${maxIterations} iterations. Content may be truncated.`);
			this.emit("oversetMaxIterations", { iterations: maxIterations });
		}
	}

	/**
	 * Get summary of overset content status
	 * @returns {object} Overset information
	 */
	getOversetInfo() {
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

	async render(parsed, startAt) {
		let renderer = this.layout(parsed, startAt);

		let done = false;
		let result;

		while (!done) {
			result = await this.q.enqueue(() => { return this.renderAsync(renderer); });
			done = result.done;
		}

		return result;
	}

	start() {
		this.rendered = false;
		this.stopped = false;
	}

	stop() {
		this.stopped = true;
		// this.q.clear();
	}

	renderOnIdle(renderer) {
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

	async renderAsync(renderer) {
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

	async handleBreaks(node) {
		if (this.viewMode === "single") { return; }
		let currentPage = this.total + 1;
		let currentPosition = currentPage % 2 === 0 ? "left" : "right";
		// TODO: Recto and Verso should reverse for rtl languages
		let currentSide = currentPage % 2 === 0 ? "verso" : "recto";
		let previousBreakAfter;
		let breakBefore;
		let page;

		if (currentPage === 1) {
			return;
		}

		if (node &&
				typeof node.dataset !== "undefined" &&
				typeof node.dataset.previousBreakAfter !== "undefined") {
			previousBreakAfter = node.dataset.previousBreakAfter;
		}

		if (node &&
				typeof node.dataset !== "undefined" &&
				typeof node.dataset.breakBefore !== "undefined") {
			breakBefore = node.dataset.breakBefore;
		}

		// Also check parent nodes for break-before (breakToken.node may be a child of the element with break-before)
		if (!breakBefore && node) {
			// Walk up ancestors, but only if node is the first content in that ancestor
			let current = node;
			let parent = node.nodeType === 3 ? node.parentNode : node.parentNode;
			while (!breakBefore && parent && parent.nodeType === 1) {
				// Check if current is the first meaningful child of parent
				let isFirst = true;
				let sibling = current.previousSibling;
				while (sibling) {
					if (sibling.nodeType === 3 && !sibling.textContent.trim()) {
						sibling = sibling.previousSibling;
						continue;
					}
					isFirst = false;
					break;
				}
				if (!isFirst) break;

				if (typeof parent.dataset !== "undefined" &&
						typeof parent.dataset.breakBefore !== "undefined") {
					breakBefore = parent.dataset.breakBefore;
					break;
				}
				current = parent;
				parent = parent.parentNode;
			}
		}

		// Also check previousBreakAfter on ancestors (same first-child logic)
		if (!previousBreakAfter && node) {
			let current = node;
			let parent = node.nodeType === 3 ? node.parentNode : node.parentNode;
			while (!previousBreakAfter && parent && parent.nodeType === 1) {
				let isFirst = true;
				let sibling = current.previousSibling;
				while (sibling) {
					if (sibling.nodeType === 3 && !sibling.textContent.trim()) {
						sibling = sibling.previousSibling;
						continue;
					}
					isFirst = false;
					break;
				}
				if (!isFirst) break;

				if (typeof parent.dataset !== "undefined" &&
						typeof parent.dataset.previousBreakAfter !== "undefined") {
					previousBreakAfter = parent.dataset.previousBreakAfter;
					break;
				}
				current = parent;
				parent = parent.parentNode;
			}
		}

		if( previousBreakAfter &&
				(previousBreakAfter === "left" || previousBreakAfter === "right") &&
				previousBreakAfter !== currentPosition) {
			page = this.addPage(true);
		} else if( previousBreakAfter &&
				(previousBreakAfter === "verso" || previousBreakAfter === "recto") &&
				previousBreakAfter !== currentSide) {
			page = this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "left" || breakBefore === "right") &&
				breakBefore !== currentPosition) {
			page = this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "verso" || breakBefore === "recto") &&
				breakBefore !== currentSide) {
			page = this.addPage(true);
		}

		if (page) {
			await this.hooks.beforePageLayout.trigger(page, undefined, undefined, this);
			this.emit("page", page);
			// await this.hooks.layout.trigger(page.element, page, undefined, this);
			await this.hooks.afterPageLayout.trigger(page.element, page, undefined, this);
			this.emit("renderedPage", page);
		}
	}

	async *layout(content, startAt) {
		let breakToken = startAt || false;

		// If using workers, pre-calculate break points in batch
		if (this._useWorkers && this.layoutWorkerManager && !breakToken) {
			yield* this.layoutWithWorkers(content);
			return;
		}

		while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {

			if (breakToken && breakToken.node) {
				await this.handleBreaks(breakToken.node);
			} else {
				await this.handleBreaks(content.firstChild);
			}

			let page = this.addPage();

			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			// Layout content in the page, starting from the breakToken
			breakToken = await page.layout(content, breakToken, this.maxChars);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);

			this.recoredCharLength(page.wrapper.textContent.length);

			yield breakToken;

			// Stop if we get undefined, showing we have reached the end of the content
		}
	}

	/**
	 * Layout using Web Workers - pre-calculates break points off main thread
	 */
	async *layoutWithWorkers(content) {
		// Serialize content for worker analysis
		const serializedContent = this.serializeContent(content);
		const bounds = this.pagesArea.getBoundingClientRect();

		// Send to worker for break point analysis
		const workerResult = await this.layoutWorkerManager.calculateLayout(
			serializedContent,
			{ width: bounds.width, height: bounds.height },
			this.maxChars,
			0
		);

		if (workerResult.error) {
			console.warn("Worker layout failed, falling back to main thread:", workerResult.error);
			// Fallback to main thread layout
			let breakToken = false;
			while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {
				if (breakToken && breakToken.node) {
					await this.handleBreaks(breakToken.node);
				} else {
					await this.handleBreaks(content.firstChild);
				}

				let page = this.addPage();
				await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
				this.emit("page", page);
				breakToken = await page.layout(content, breakToken, this.maxChars);
				await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
				this.emit("renderedPage", page);
				this.recoredCharLength(page.wrapper.textContent.length);
				yield breakToken;
			}
			return;
		}

		// Worker returned break point analysis - use it to guide layout
		this.emit("workerLayoutComplete", {
			nodesProcessed: workerResult.nodesProcessed,
			breaksFound: workerResult.breakFound
		});

		// Still need to do actual DOM layout on main thread, but worker
		// has already analyzed the content structure
		let breakToken = false;
		let pageCount = 0;

		while (breakToken !== undefined && (MAX_PAGES ? (this.total < MAX_PAGES) : true)) {
			if (breakToken && breakToken.node) {
				await this.handleBreaks(breakToken.node);
			} else {
				await this.handleBreaks(content.firstChild);
			}

			let page = this.addPage();
			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			breakToken = await page.layout(content, breakToken, this.maxChars);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);
			this.recoredCharLength(page.wrapper.textContent.length);

			pageCount++;
			yield breakToken;
		}
	}

	/**
	 * Serialize DOM content for worker analysis
	 */
	serializeContent(content) {
		if (!content) return null;

		const serialize = (node) => {
			if (!node) return null;

			const serialized = {
				nodeType: node.nodeType,
				tagName: node.tagName || null,
				textContent: node.textContent || null,
				dataRef: node.dataset && node.dataset.ref || null,
				breakBefore: node.dataset && node.dataset.breakBefore || null,
				previousBreakAfter: node.dataset && node.dataset.previousBreakAfter || null,
				breakInside: node.dataset && node.dataset.breakInside || null,
				page: node.dataset && node.dataset.page || null,
				children: []
			};

			if (node.childNodes && node.childNodes.length > 0) {
				for (let i = 0; i < node.childNodes.length; i++) {
					serialized.children.push(serialize(node.childNodes[i]));
				}
			}

			return serialized;
		};

		return serialize(content);
	}

	recoredCharLength(length) {
		if (length === 0) {
			return;
		}

		this.charsPerBreak.push(length);

		// Keep the length of the last few breaks
		if (this.charsPerBreak.length > 4) {
			this.charsPerBreak.shift();
		}

		this.maxChars = this.charsPerBreak.reduce((a, b) => a + b, 0) / (this.charsPerBreak.length);
	}

	removePages(fromIndex=0) {

		if (fromIndex >= this.pages.length) {
			return;
		}

		// Remove pages
		for (let i = fromIndex; i < this.pages.length; i++) {
			this.pages[i].destroy();
		}

		if (fromIndex > 0) {
			this.pages.splice(fromIndex);
		} else {
			this.pages = [];
		}
		
		// Update page numbering module with new total
		if (this.pageNumbering && this.pageNumbering.isEnabled()) {
			this.pageNumbering.updatePageCount(this.pages.length);
		}
	}

	addPage(blank) {
		let lastPage = this.pages[this.pages.length - 1];
		// Create a new page from the template
		let page = new Page(this.pagesArea, this.pageTemplate, blank, this.hooks, this.viewMode);

		this.pages.push(page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(this.total);

		// Render page number if page numbering is enabled
		if (this.pageNumbering && this.pageNumbering.isEnabled() && !blank) {
			this.pageNumbering.renderPageNumber(page.element, this.total, this.pages.length);
		}

		if (!blank) {
			// Listen for page overflow
			page.onOverflow((overflowToken) => {
				console.warn("overflow on", page.id, overflowToken);

				// Only reflow while rendering
				if (this.rendered) {
					return;
				}

				let index = this.pages.indexOf(page) + 1;

				// Stop the rendering
				this.stop();

				// Set the breakToken to resume at
				this.breakToken = overflowToken;

				// Remove pages
				this.removePages(index);

				if (this.rendered === true) {
					this.rendered = false;

					this.q.enqueue(async () => {

						this.start();

						await this.render(this.source, this.breakToken);

						this.rendered = true;

					});
				}


			});

			page.onUnderflow((overflowToken) => {
				// console.log("underflow on", page.id, overflowToken);

				// page.append(this.source, overflowToken);

			});
		}

		this.total = this.pages.length;

		return page;
	}
	/*
	insertPage(index, blank) {
		let lastPage = this.pages[index];
		// Create a new page from the template
		let page = new Page(this.pagesArea, this.pageTemplate, blank, this.hooks);

		let total = this.pages.splice(index, 0, page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(index + 1);

		for (let i = index + 2; i < this.pages.length; i++) {
			this.pages[i].index(i);
		}

		if (!blank) {
			// Listen for page overflow
			page.onOverflow((overflowToken) => {
				if (total < this.pages.length) {
					this.pages[total].layout(this.source, overflowToken);
				} else {
					let newPage = this.addPage();
					newPage.layout(this.source, overflowToken);
				}
			});

			page.onUnderflow(() => {
				// console.log("underflow on", page.id);
			});
		}

		this.total += 1;

		return page;
	}
	*/

	/**
	 * Insert a page at a specific index position
	 * @param {number} index - Position to insert (0 = before first page)
	 * @param {object} [options] - Insertion options
	 * @param {boolean} [options.blank=false] - Create a blank page without content
	 * @param {string|HTMLElement|DocumentFragment} [options.content] - Custom content to inject
	 * @param {string} [options.name] - Named page type (e.g., "cover", "toc")
	 * @param {string} [options.className] - Additional CSS class for the page
	 * @param {number} [options.pageNumberOverride] - Override the page counter value
	 * @param {boolean} [options.breakBefore] - Force a page break before insertion
	 * @returns {Page} The inserted page instance
	 */
	insertPage(index, options = {}) {
		const {
			blank = false,
			content = null,
			name = null,
			className = null,
			pageNumberOverride = null,
			breakBefore = false
		} = typeof options === "boolean" ? { blank: options } : options;

		if (index < 0) {
			index = 0;
		}
		if (index > this.pages.length) {
			index = this.pages.length;
		}

		const referencePage = this.pages[index] || null;
		const page = new Page(this.pagesArea, this.pageTemplate, blank, this.hooks, this.viewMode);

		if (name) {
			page.name = name;
		}

		this.pages.splice(index, 0, page);

		const insertAfterElement = index > 0 ? this.pages[index - 1].element : null;
		page.create(undefined, insertAfterElement);

		if (className) {
			page.element.classList.add(className);
		}

		if (breakBefore) {
			page.element.style.breakBefore = "page";
		}

		this.reindexPagesFrom(index);

		if (pageNumberOverride !== null) {
			page.element.style.counterReset = `page ${pageNumberOverride}`;
		}

		if (this.pageNumbering && this.pageNumbering.isEnabled() && !blank) {
			this.pageNumbering.renderPageNumber(page.element, index, this.pages.length);
		}

		if (content) {
			this.injectPageContent(page, content);
		}

		if (!blank && !content) {
			page.onOverflow((overflowToken) => {
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
						await this.render(this.source, this.breakToken);
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

	/**
	 * Insert multiple pages at once
	 * @param {number} startIndex - Position to start inserting
	 * @param {Array<object>} pageConfigs - Array of page configuration objects
	 * @returns {Page[]} Array of inserted page instances
	 */
	insertPages(startIndex, pageConfigs) {
		const inserted = [];

		pageConfigs.forEach((config, i) => {
			const page = this.insertPage(startIndex + i, config);
			inserted.push(page);
		});

		return inserted;
	}

	/**
	 * Prepend a page at the beginning (shorthand for insertPage(0))
	 * @param {object} [options] - Page options
	 * @returns {Page} The inserted page instance
	 */
	prependPage(options = {}) {
		return this.insertPage(0, options);
	}

	/**
	 * Append a page at the end (alias for addPage with options support)
	 * @param {object} [options] - Page options
	 * @returns {Page} The inserted page instance
	 */
	appendPage(options = {}) {
		return this.insertPage(this.pages.length, options);
	}

	/**
	 * Remove a page at a specific index
	 * @param {number} index - Page index to remove
	 * @returns {boolean} Whether the page was removed successfully
	 */
	removePage(index) {
		if (index < 0 || index >= this.pages.length) {
			return false;
		}

		const page = this.pages[index];
		page.element.remove();
		this.pages.splice(index, 1);

		this.reindexPagesFrom(index);
		this.total = this.pages.length;

		this.emit("pageRemoved", index);

		return true;
	}

	/**
	 * Replace a page at a specific index with new content
	 * @param {number} index - Page index to replace
	 * @param {object} [options] - Page options
	 * @returns {Page} The new page instance
	 */
	replacePage(index, options = {}) {
		this.removePage(index);
		return this.insertPage(index, options);
	}

	/**
	 * Re-index all pages starting from a given index
	 * @param {number} fromIndex - Index to start re-indexing from
	 * @private
	 */
	reindexPagesFrom(fromIndex) {
		for (let i = fromIndex; i < this.pages.length; i++) {
			this.pages[i].index(i);

			if (this.viewMode !== "single") {
				const el = this.pages[i].element;
				if (i % 2 !== 1) {
					el.classList.remove("pagedjs_left_page");
					el.classList.add("pagedjs_right_page");
				} else {
					el.classList.remove("pagedjs_right_page");
					el.classList.add("pagedjs_left_page");
				}
			}

			if (this.pageNumbering && this.pageNumbering.isEnabled() && !this.pages[i].blank) {
				const existingPageNum = this.pages[i].element.querySelector(".pagedjs_page_number");
				if (existingPageNum) {
					existingPageNum.remove();
				}
				this.pageNumbering.renderPageNumber(this.pages[i].element, i, this.pages.length);
			}
		}
	}

	/**
	 * Inject content into a page element
	 * @param {Page} page - Page instance
	 * @param {string|HTMLElement|DocumentFragment} content - Content to inject
	 * @private
	 */
	injectPageContent(page, content) {
		const wrapper = page.createWrapper();

		if (typeof content === "string") {
			const fragment = document.createRange().createContextualFragment(content);
			wrapper.appendChild(fragment);
		} else if (content instanceof HTMLElement || content instanceof DocumentFragment) {
			wrapper.appendChild(content.cloneNode ? content.cloneNode(true) : content);
		}
	}

	get total() {
		return this._total;
	}

	set total(num) {
		this.pagesArea.style.setProperty("--pagedjs-page-count", num);
		this._total = num;
		
		// Update page numbering module with new total
		if (this.pageNumbering && this.pageNumbering.isEnabled()) {
			this.pageNumbering.updatePageCount(num);
		}
	}

	loadFonts() {
		let fontPromises = [];
		if (document.fonts) {
			document.fonts.forEach((fontFace) => {
				if (fontFace.status !== "loaded") {
					let fontLoaded = fontFace.load().then((r) => {
						return fontFace.family;
					}, (r) => {
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

	destroy() {
		this.pagesArea.remove();
		this.pageTemplate.remove();

		// Terminate workers
		if (this.layoutWorkerManager) {
			this.layoutWorkerManager.terminate();
			this.layoutWorkerManager = null;
		}

		// Clear page numbering module
		if (this.pageNumbering) {
			this.pageNumbering.disable();
		}
	}
	
	/**
	 * Update page numbering configuration
	 * @param {object} config - New page numbering configuration
	 */
	updatePageNumbering(config) {
		if (!this.pageNumbering) {
			this.pageNumbering = new PageNumberingModule(config);
		} else {
			this.pageNumbering.updateConfig(config);
		}
		
		// Clear existing page number elements before re-rendering
		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}
		
		// If page numbering is now enabled and we have existing pages, render page numbers
		if (this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering.renderPageNumber(page.element, index, this.pages.length);
				}
			});
		}
	}
	
	/**
	 * Get current page numbering configuration
	 * @returns {object|null} Current page numbering configuration or null if not initialized
	 */
	getPageNumberingConfig() {
		if (!this.pageNumbering) {
			return null;
		}
		return this.pageNumbering.getConfig();
	}
	
	/**
	 * Enable or disable page numbering
	 * @param {boolean} enabled - Whether to enable page numbering
	 */
	setPageNumberingEnabled(enabled) {
		if (!this.pageNumbering) {
			// Initialize with default config if not already initialized
			this.pageNumbering = new PageNumberingModule({ enabled });
		} else if (enabled) {
			this.pageNumbering.enable();
		} else {
			this.pageNumbering.disable();
		}
		
		// Clear existing page number elements before re-rendering
		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}
		
		// If enabling and we have existing pages, render page numbers
		if (enabled && this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering.renderPageNumber(page.element, index, this.pages.length);
				}
			});
		}
	}
	
	/**
	 * Apply CSS @page rules to page numbering configuration
	 * @param {Array} pageRules - Array of parsed CSS @page rules
	 */
	applyPageNumberingCSSRules(pageRules) {
		if (!this.pageNumbering) {
			// Initialize with default config if not already initialized
			this.pageNumbering = new PageNumberingModule({});
		}
		this.pageNumbering.applyCSSRules(pageRules);
		
		// Clear existing page number elements before re-rendering
		if (this.pageNumbering) {
			this.pageNumbering._clearPageElements();
		}
		
		// If page numbering is now enabled and we have existing pages, render page numbers
		if (this.pageNumbering.isEnabled() && this.pages.length > 0) {
			this.pages.forEach((page, index) => {
				if (!page.blank) {
					this.pageNumbering.renderPageNumber(page.element, index, this.pages.length);
				}
			});
		}
	}

}

EventEmitter(Chunker.prototype);

export default Chunker;
