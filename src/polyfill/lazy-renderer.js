import EventEmitter from "event-emitter";

const DEFAULT_BUFFER_PAGES = 3;
const DEFAULT_UNLOAD_PAGES = 5;

class LazyRenderer {
	constructor(chunker, options = {}) {
		this.chunker = chunker;
		this.options = {
			bufferPages: options.bufferPages !== undefined ? options.bufferPages : DEFAULT_BUFFER_PAGES,
			unloadPages: options.unloadPages !== undefined ? options.unloadPages : DEFAULT_UNLOAD_PAGES,
			enableUnload: options.enableUnload !== undefined ? options.enableUnload : true,
			placeholderTemplate: options.placeholderTemplate || null,
			onPageRender: options.onPageRender || null,
			onPageUnload: options.onPageUnload || null,
			onProgress: options.onProgress || null
		};

		this.visiblePages = new Set();
		this.renderedPages = new Set();
		this.pageData = new Map();
		this.observer = null;
		this.hiddenContainer = null;
		this.visibleContainer = null;
		this.isChunking = false;
		this.chunkingComplete = false;
		this.totalPages = 0;

		this._pendingRenders = new Map();
		this._renderQueue = [];
		this._isProcessingQueue = false;
	}

	async chunkInBackground(content, renderTo) {
		this.isChunking = true;

		this.hiddenContainer = document.createElement("div");
		this.hiddenContainer.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
		document.body.appendChild(this.hiddenContainer);

		this.visibleContainer = renderTo || document.createElement("div");
		if (!renderTo) {
			document.body.appendChild(this.visibleContainer);
		}
		this.visibleContainer.classList.add("pagedjs_lazy_container");

		this.emit("progress", { stage: "chunking", progress: 0 });

		const chunker = this.chunker;

		await chunker.hooks.beforeParsed.trigger(content, chunker);

		const ContentParser = await import("../chunker/parser.js");
		const parsed = new ContentParser.default(content);

		chunker.source = parsed;
		chunker.breakToken = undefined;

		if (chunker.pagesArea && chunker.pageTemplate) {
			chunker.q.clear();
			chunker.removePages();
		} else {
			chunker.setup(this.hiddenContainer);
		}

		chunker.emit("rendering", content);

		await chunker.hooks.afterParsed.trigger(parsed, chunker);
		await chunker.loadFonts();

		let rendered = await chunker.render(parsed, chunker.breakToken);
		while (rendered.canceled) {
			chunker.start();
			rendered = await chunker.render(parsed, chunker.breakToken);
		}

		chunker.rendered = true;
		this.totalPages = chunker.pages.length;

		for (let i = 0; i < chunker.pages.length; i++) {
			const page = chunker.pages[i];
			this.pageData.set(i, {
				index: i,
				pageNumber: i + 1,
				breakToken: page.endToken,
				startToken: page.startToken,
				blank: page.blank,
				name: page.name,
				hiddenElement: page.element,
				rendered: false
			});
		}

		await chunker.hooks.afterRendered.trigger(chunker.pages, chunker);

		this.isChunking = false;
		this.chunkingComplete = true;

		this.emit("progress", { stage: "chunking_complete", progress: 100 });
		this.emit("chunkingComplete", { totalPages: this.totalPages });

		this.setupVisiblePages();
		this.startObserving();

		return { totalPages: this.totalPages, pages: chunker.pages };
	}

	setupVisiblePages() {
		const pagesArea = document.createElement("div");
		pagesArea.classList.add("pagedjs_pages");
		pagesArea.classList.add("pagedjs_lazy_pages");

		if (this.chunker.viewMode === "single") {
			pagesArea.classList.add("pagedjs_single_page_mode");
		}

		this.visibleContainer.innerHTML = "";
		this.visibleContainer.appendChild(pagesArea);

		this.pagesArea = pagesArea;

		for (let i = 0; i < this.totalPages; i++) {
			const pageData = this.pageData.get(i);
			const placeholder = this.createPlaceholder(i, pageData);
			pagesArea.appendChild(placeholder);
			pageData.visibleElement = placeholder;
		}

		this.emit("pagesSetup", { totalPages: this.totalPages });
	}

	createPlaceholder(index, pageData) {
		const placeholder = document.createElement("div");
		placeholder.classList.add("pagedjs_page");
		placeholder.classList.add("pagedjs_lazy_placeholder");
		placeholder.dataset.pageNumber = pageData.pageNumber;
		placeholder.dataset.pageIndex = index;
		placeholder.dataset.lazyStatus = "pending";

		if (pageData.blank) {
			placeholder.classList.add("pagedjs_blank_page");
		}

		if (index === 0) {
			placeholder.classList.add("pagedjs_first_page");
		}

		if (this.chunker.viewMode !== "single") {
			if (index % 2 !== 1) {
				placeholder.classList.add("pagedjs_right_page");
			} else {
				placeholder.classList.add("pagedjs_left_page");
			}
		}

		const inner = document.createElement("div");
		inner.classList.add("pagedjs_sheet");
		inner.innerHTML = `
			<div class="pagedjs_pagebox">
				<div class="pagedjs_area">
					<div class="pagedjs_page_content"></div>
				</div>
			</div>
		`;

		const loadingOverlay = document.createElement("div");
		loadingOverlay.classList.add("pagedjs_lazy_loading");
		loadingOverlay.innerHTML = `
			<div class="pagedjs_lazy_loading_spinner"></div>
			<div class="pagedjs_lazy_loading_text">Page ${pageData.pageNumber}</div>
		`;
		inner.appendChild(loadingOverlay);

		placeholder.appendChild(inner);

		return placeholder;
	}

	startObserving() {
		if (typeof IntersectionObserver === "undefined") {
			console.warn("IntersectionObserver not supported, falling back to eager rendering");
			this.renderAllPages();
			return;
		}

		const rootMarginPages = this.options.bufferPages;
		const hiddenContainer = this.hiddenContainer;
		const chunker = this.chunker;

		if (chunker.pages.length > 0 && chunker.pages[0].element) {
			const firstPage = chunker.pages[0].element;
			const pageHeight = firstPage.offsetHeight || 1056;
			const pageWidth = firstPage.offsetWidth || 816;
			const rootMargin = `${pageHeight * rootMarginPages}px ${pageWidth * rootMarginPages}px`;

			this.observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					const index = parseInt(entry.target.dataset.pageIndex, 10);
					if (entry.isIntersecting) {
						this.visiblePages.add(index);
						this.scheduleRender(index);
					} else {
						this.visiblePages.delete(index);
						if (this.options.enableUnload) {
							this.scheduleUnload(index);
						}
					}
				}
			}, {
				root: null,
				rootMargin: rootMargin,
				threshold: 0
			});

			const placeholders = this.pagesArea.querySelectorAll(".pagedjs_lazy_placeholder");
			placeholders.forEach(ph => this.observer.observe(ph));
		}
	}

	scheduleRender(index) {
		if (this.renderedPages.has(index)) {
			return;
		}

		if (this._pendingRenders.has(index)) {
			return;
		}

		this._pendingRenders.set(index, true);
		this._renderQueue.push(index);

		if (!this._isProcessingQueue) {
			this.processRenderQueue();
		}
	}

	async processRenderQueue() {
		this._isProcessingQueue = true;

		while (this._renderQueue.length > 0) {
			const index = this._renderQueue.shift();
			this._pendingRenders.delete(index);

			if (this.renderedPages.has(index)) {
				continue;
			}

			await this.renderPage(index);
		}

		this._isProcessingQueue = false;
	}

	async renderPage(index) {
		const pageData = this.pageData.get(index);
		if (!pageData || pageData.rendered) {
			return;
		}

		const placeholder = pageData.visibleElement;
		if (!placeholder) {
			return;
		}

		placeholder.dataset.lazyStatus = "rendering";

		const hiddenPage = pageData.hiddenElement;
		if (!hiddenPage) {
			placeholder.dataset.lazyStatus = "error";
			return;
		}

		const hiddenContent = hiddenPage.querySelector(".pagedjs_page_content");
		const visibleContent = placeholder.querySelector(".pagedjs_page_content");

		if (hiddenContent && visibleContent) {
			visibleContent.innerHTML = hiddenContent.innerHTML;

			const loadingOverlay = placeholder.querySelector(".pagedjs_lazy_loading");
			if (loadingOverlay) {
				loadingOverlay.remove();
			}

			pageData.rendered = true;
			this.renderedPages.add(index);

			placeholder.dataset.lazyStatus = "rendered";

			if (this.options.onPageRender) {
				this.options.onPageRender(index, pageData);
			}

			this.emit("pageRendered", { index, pageData });
		}
	}

	scheduleUnload(index) {
		if (!this.renderedPages.has(index)) {
			return;
		}

		const distanceFromViewport = this.getDistanceFromViewport(index);
		if (distanceFromViewport < this.options.unloadPages) {
			return;
		}

		this.unloadPage(index);
	}

	unloadPage(index) {
		const pageData = this.pageData.get(index);
		if (!pageData || !pageData.rendered) {
			return;
		}

		const placeholder = pageData.visibleElement;
		if (!placeholder) {
			return;
		}

		const visibleContent = placeholder.querySelector(".pagedjs_page_content");
		if (visibleContent) {
			visibleContent.innerHTML = "";
		}

		const loadingOverlay = placeholder.querySelector(".pagedjs_lazy_loading");
		if (!loadingOverlay) {
			const sheet = placeholder.querySelector(".pagedjs_sheet");
			if (sheet) {
				const newOverlay = document.createElement("div");
				newOverlay.classList.add("pagedjs_lazy_loading");
				newOverlay.innerHTML = `
					<div class="pagedjs_lazy_loading_spinner"></div>
					<div class="pagedjs_lazy_loading_text">Page ${pageData.pageNumber}</div>
				`;
				sheet.appendChild(newOverlay);
			}
		}

		pageData.rendered = false;
		this.renderedPages.delete(index);

		placeholder.dataset.lazyStatus = "unloaded";

		if (this.options.onPageUnload) {
			this.options.onPageUnload(index, pageData);
		}

		this.emit("pageUnloaded", { index, pageData });
	}

	getDistanceFromViewport(index) {
		const visibleArray = Array.from(this.visiblePages).sort((a, b) => a - b);
		if (visibleArray.length === 0) {
			return 0;
		}

		const minVisible = visibleArray[0];
		const maxVisible = visibleArray[visibleArray.length - 1];

		if (index >= minVisible && index <= maxVisible) {
			return 0;
		}

		if (index < minVisible) {
			return minVisible - index;
		}

		return index - maxVisible;
	}

	renderAllPages() {
		for (let i = 0; i < this.totalPages; i++) {
			this.renderPage(i);
		}
	}

	getRenderedCount() {
		return this.renderedPages.size;
	}

	getRenderProgress() {
		if (this.totalPages === 0) {
			return 0;
		}
		return Math.round((this.renderedPages.size / this.totalPages) * 100);
	}

	scrollToPage(index) {
		if (index < 0 || index >= this.totalPages) {
			return;
		}

		const pageData = this.pageData.get(index);
		if (!pageData || !pageData.visibleElement) {
			return;
		}

		pageData.visibleElement.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	scrollToPageNumber(pageNumber) {
		this.scrollToPage(pageNumber - 1);
	}

	destroy() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		if (this.hiddenContainer && this.hiddenContainer.parentNode) {
			this.hiddenContainer.parentNode.removeChild(this.hiddenContainer);
			this.hiddenContainer = null;
		}

		if (this.pagesArea && this.pagesArea.parentNode) {
			this.pagesArea.parentNode.removeChild(this.pagesArea);
		}

		this.visiblePages.clear();
		this.renderedPages.clear();
		this.pageData.clear();
		this._pendingRenders.clear();
		this._renderQueue = [];
	}

	on(event, callback) {
		if (!this._listeners) {
			this._listeners = {};
		}
		if (!this._listeners[event]) {
			this._listeners[event] = [];
		}
		this._listeners[event].push(callback);
	}

	emit(event, data) {
		if (!this._listeners || !this._listeners[event]) {
			return;
		}
		for (const callback of this._listeners[event]) {
			callback(data);
		}
	}
}

EventEmitter(LazyRenderer.prototype);

export default LazyRenderer;
