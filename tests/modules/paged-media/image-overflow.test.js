/**
 * @jest-environment jsdom
 */
import ImageOverflowHandler from "../../../src/modules/paged-media/image-overflow";

describe("ImageOverflowHandler", () => {
	let handler;

	beforeEach(() => {
		handler = new ImageOverflowHandler();
	});

	describe("constructor", () => {
		it("should create an ImageOverflowHandler instance", () => {
			expect(handler).toBeInstanceOf(ImageOverflowHandler);
		});

		it("should have an image cache", () => {
			expect(handler._imageCache).toBeDefined();
			expect(handler._imageCache).toBeInstanceOf(Map);
		});

		it("should have a processed images set", () => {
			expect(handler._processedImages).toBeDefined();
			expect(handler._processedImages).toBeInstanceOf(WeakSet);
		});
	});

	describe("_constrainImage", () => {
		it("should scale down image that exceeds width", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			handler._constrainImage(img, 1200, 800, 800, 600);

			expect(img.style.maxWidth).toBe("800px");
			expect(img.style.maxHeight).toBe("533px");
			expect(img.classList.contains("pagedjs_image_constrained")).toBe(true);
		});

		it("should scale down image that exceeds height", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			handler._constrainImage(img, 600, 1500, 800, 1000);

			expect(img.style.maxWidth).toBe("400px");
			expect(img.style.maxHeight).toBe("1000px");
			expect(img.classList.contains("pagedjs_image_constrained")).toBe(true);
		});

		it("should not scale image that fits", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			handler._constrainImage(img, 400, 300, 800, 600);

			expect(img.style.maxWidth).toBe("400px");
			expect(img.style.maxHeight).toBe("300px");
			expect(img.classList.contains("pagedjs_image_constrained")).toBe(false);
		});

		it("should store original dimensions as data attributes", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			handler._constrainImage(img, 1200, 800, 800, 600);

			expect(img.dataset.originalWidth).toBe("1200");
			expect(img.dataset.originalHeight).toBe("800");
		});

		it("should store scale factor as data attribute", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			handler._constrainImage(img, 1200, 800, 800, 600);

			expect(img.dataset.scaleFactor).toBeDefined();
			const scale = parseFloat(img.dataset.scaleFactor);
			expect(scale).toBeLessThanOrEqual(1);
			expect(scale).toBeGreaterThan(0);
		});
	});

	describe("_processImage", () => {
		it("should skip images with user-specified max-width", () => {
			const img = document.createElement("img");
			img.style.maxWidth = "500px";
			img.style.width = "auto";
			img.style.height = "auto";

			Object.defineProperty(img, "naturalWidth", { value: 1200 });
			Object.defineProperty(img, "naturalHeight", { value: 800 });

			handler._processImage(img, 800, 600);

			expect(img.classList.contains("pagedjs_image_constrained")).toBe(false);
		});

		it("should skip images with user-specified max-height", () => {
			const img = document.createElement("img");
			img.style.maxHeight = "400px";
			img.style.width = "auto";
			img.style.height = "auto";

			Object.defineProperty(img, "naturalWidth", { value: 1200 });
			Object.defineProperty(img, "naturalHeight", { value: 800 });

			handler._processImage(img, 800, 600);

			expect(img.classList.contains("pagedjs_image_constrained")).toBe(false);
		});

		it("should handle images with unknown size", () => {
			const img = document.createElement("img");
			img.style.width = "auto";
			img.style.height = "auto";

			Object.defineProperty(img, "naturalWidth", { value: 0 });
			Object.defineProperty(img, "naturalHeight", { value: 0 });

			expect(() => {
				handler._processImage(img, 800, 600);
			}).not.toThrow();
		});
	});
});
