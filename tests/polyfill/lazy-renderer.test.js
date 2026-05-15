/**
 * @jest-environment jsdom
 */
import LazyRenderer from "../../src/polyfill/lazy-renderer.js";

describe("LazyRenderer", () => {
	let mockChunker;

	beforeEach(() => {
		mockChunker = {
			pages: [],
			viewMode: "single",
			hooks: {
				beforeParsed: { trigger: jest.fn() },
				afterParsed: { trigger: jest.fn() },
				afterRendered: { trigger: jest.fn() }
			},
			setup: jest.fn(),
			render: jest.fn(),
			loadFonts: jest.fn(),
			emit: jest.fn(),
			rendered: false,
			source: null,
			breakToken: undefined,
			pagesArea: null,
			pageTemplate: null,
			q: { clear: jest.fn() },
			removePages: jest.fn(),
			start: jest.fn()
		};

		global.IntersectionObserver = jest.fn(function(callback) {
			this.callback = callback;
			this.observe = jest.fn();
			this.disconnect = jest.fn();
		});

		document.body.innerHTML = "";
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should create a LazyRenderer instance", () => {
			const renderer = new LazyRenderer(mockChunker);
			expect(renderer).toBeInstanceOf(LazyRenderer);
		});

		it("should use default options", () => {
			const renderer = new LazyRenderer(mockChunker);
			expect(renderer.options.bufferPages).toBe(3);
			expect(renderer.options.unloadPages).toBe(5);
			expect(renderer.options.enableUnload).toBe(true);
		});

		it("should accept custom options", () => {
			const renderer = new LazyRenderer(mockChunker, {
				bufferPages: 5,
				unloadPages: 10,
				enableUnload: false
			});
			expect(renderer.options.bufferPages).toBe(5);
			expect(renderer.options.unloadPages).toBe(10);
			expect(renderer.options.enableUnload).toBe(false);
		});
	});

	describe("createPlaceholder", () => {
		it("should create a placeholder element", () => {
			const renderer = new LazyRenderer(mockChunker);
			const pageData = {
				pageNumber: 1,
				blank: false
			};

			const placeholder = renderer.createPlaceholder(0, pageData);

			expect(placeholder).toBeDefined();
			expect(placeholder.dataset.pageNumber).toBe("1");
			expect(placeholder.dataset.pageIndex).toBe("0");
			expect(placeholder.dataset.lazyStatus).toBe("pending");
			expect(placeholder.classList.contains("pagedjs_page")).toBe(true);
			expect(placeholder.classList.contains("pagedjs_lazy_placeholder")).toBe(true);
		});

		it("should mark blank pages", () => {
			const renderer = new LazyRenderer(mockChunker);
			const pageData = {
				pageNumber: 2,
				blank: true
			};

			const placeholder = renderer.createPlaceholder(1, pageData);
			expect(placeholder.classList.contains("pagedjs_blank_page")).toBe(true);
		});

		it("should mark first page", () => {
			const renderer = new LazyRenderer(mockChunker);
			const pageData = {
				pageNumber: 1,
				blank: false
			};

			const placeholder = renderer.createPlaceholder(0, pageData);
			expect(placeholder.classList.contains("pagedjs_first_page")).toBe(true);
		});
	});

	describe("getRenderedCount", () => {
		it("should return 0 initially", () => {
			const renderer = new LazyRenderer(mockChunker);
			expect(renderer.getRenderedCount()).toBe(0);
		});

		it("should track rendered pages", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.renderedPages.add(0);
			renderer.renderedPages.add(1);
			renderer.renderedPages.add(2);
			expect(renderer.getRenderedCount()).toBe(3);
		});
	});

	describe("getRenderProgress", () => {
		it("should return 0 when no pages", () => {
			const renderer = new LazyRenderer(mockChunker);
			expect(renderer.getRenderProgress()).toBe(0);
		});

		it("should calculate progress correctly", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.totalPages = 100;
			renderer.renderedPages.add(0);
			renderer.renderedPages.add(1);
			renderer.renderedPages.add(2);

			expect(renderer.getRenderProgress()).toBe(3);
		});

		it("should return 100 when all pages rendered", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.totalPages = 10;
			for (let i = 0; i < 10; i++) {
				renderer.renderedPages.add(i);
			}
			expect(renderer.getRenderProgress()).toBe(100);
		});
	});

	describe("getDistanceFromViewport", () => {
		it("should return 0 when no visible pages", () => {
			const renderer = new LazyRenderer(mockChunker);
			expect(renderer.getDistanceFromViewport(5)).toBe(0);
		});

		it("should return 0 for visible pages", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.visiblePages.add(5);
			renderer.visiblePages.add(6);
			renderer.visiblePages.add(7);

			expect(renderer.getDistanceFromViewport(5)).toBe(0);
			expect(renderer.getDistanceFromViewport(6)).toBe(0);
			expect(renderer.getDistanceFromViewport(7)).toBe(0);
		});

		it("should return distance for pages above viewport", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.visiblePages.add(10);
			renderer.visiblePages.add(11);

			expect(renderer.getDistanceFromViewport(5)).toBe(5);
			expect(renderer.getDistanceFromViewport(8)).toBe(2);
		});

		it("should return distance for pages below viewport", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.visiblePages.add(5);
			renderer.visiblePages.add(6);

			expect(renderer.getDistanceFromViewport(10)).toBe(4);
			expect(renderer.getDistanceFromViewport(8)).toBe(2);
		});
	});

	describe("scheduleRender", () => {
		it("should not schedule already rendered page", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.renderedPages.add(0);

			renderer.scheduleRender(0);
			expect(renderer._renderQueue.length).toBe(0);
		});
	});

	describe("scheduleUnload", () => {
		it("should not unload non-rendered page", () => {
			const renderer = new LazyRenderer(mockChunker);

			renderer.scheduleUnload(5);
			expect(renderer.renderedPages.has(5)).toBe(false);
		});

		it("should not unload page within unload distance", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.visiblePages.add(10);
			renderer.renderedPages.add(5);

			renderer.scheduleUnload(5);
			expect(renderer.renderedPages.has(5)).toBe(true);
		});
	});

	describe("destroy", () => {
		it("should clean up resources", () => {
			const renderer = new LazyRenderer(mockChunker);
			renderer.visiblePages.add(0);
			renderer.renderedPages.add(0);
			renderer.pageData.set(0, {});

			renderer.destroy();

			expect(renderer.visiblePages.size).toBe(0);
			expect(renderer.renderedPages.size).toBe(0);
			expect(renderer.pageData.size).toBe(0);
			expect(renderer._renderQueue.length).toBe(0);
		});
	});

	describe("events", () => {
		it("should emit and listen to events", () => {
			const renderer = new LazyRenderer(mockChunker);
			const callback = jest.fn();

			renderer.on("testEvent", callback);
			renderer.emit("testEvent", { data: "test" });

			expect(callback).toHaveBeenCalledWith({ data: "test" });
		});

		it("should support multiple listeners", () => {
			const renderer = new LazyRenderer(mockChunker);
			const callback1 = jest.fn();
			const callback2 = jest.fn();

			renderer.on("testEvent", callback1);
			renderer.on("testEvent", callback2);
			renderer.emit("testEvent", {});

			expect(callback1).toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});
	});
});
