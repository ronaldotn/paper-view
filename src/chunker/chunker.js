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

	// oversetPages() {
	// 	let overset = [];
	// 	for (let i = 0; i < this.pages.length; i++) {
	// 		let page = this.pages[i];
	// 		if (page.overset) {
	// 			overset.push(page);
	// 			// page.overset = false;
	// 		}
	// 	}
	// 	return overset;
	// }
	//
	// async handleOverset(parsed) {
	// 	let overset = this.oversetPages();
	// 	if (overset.length) {
	// 		console.log("overset", overset);
	// 		let index = this.pages.indexOf(overset[0]) + 1;
	// 		console.log("INDEX", index);
	//
	// 		// Remove pages
	// 		// this.removePages(index);
	//
	// 		// await this.render(parsed, overset[0].overset);
	//
	// 		// return this.handleOverset(parsed);
	// 	}
	// }

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
