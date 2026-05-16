import Handler from "../handler";

const IMAGE_SELECTOR = "img, svg, video, canvas, iframe";

class ImageOverflowHandler extends Handler {
	_imageCache: Map<string, any>;
	_processedImages: WeakSet<Element>;

	constructor() {
		super();
		this._imageCache = new Map();
		this._processedImages = new WeakSet();
	}

	afterPageLayout(pageElement: HTMLElement, page: any, breakToken: any, chunker: any): void {
		this._handleImagesInPage(pageElement, page);
	}

	_handleImagesInPage(pageElement: HTMLElement, page: any): void {
		const images = pageElement.querySelectorAll(IMAGE_SELECTOR);
		if (!images.length) return;

		const area = pageElement.querySelector(".pagedjs_page_content");
		if (!area) return;

		const areaRect = area.getBoundingClientRect();
		const maxWidth = areaRect.width;
		const maxHeight = areaRect.height;

		images.forEach((img) => {
			if (this._processedImages.has(img)) return;

			this._processImage(img as HTMLElement, maxWidth, maxHeight);
			this._processedImages.add(img);
		});
	}

	_processImage(img: HTMLElement, maxWidth: number, maxHeight: number): void {
		const currentStyle = window.getComputedStyle(img);
		const userMaxWidth = currentStyle.getPropertyValue("max-width");
		const userMaxHeight = currentStyle.getPropertyValue("max-height");

		if (userMaxWidth !== "none" && userMaxWidth !== "") {
			return;
		}

		if (userMaxHeight !== "none" && userMaxHeight !== "") {
			return;
		}

		const intrinsicWidth = (img as HTMLImageElement).naturalWidth || img.width;
		const intrinsicHeight = (img as HTMLImageElement).naturalHeight || img.height;

		if (!intrinsicWidth || !intrinsicHeight) {
			this._handleUnknownSize(img, maxWidth, maxHeight);
			return;
		}

		const exceedsWidth = intrinsicWidth > maxWidth;
		const exceedsHeight = intrinsicHeight > maxHeight;

		if (exceedsWidth || exceedsHeight) {
			this._constrainImage(img, intrinsicWidth, intrinsicHeight, maxWidth, maxHeight);
		}
	}

	_constrainImage(img: HTMLElement, intrinsicWidth: number, intrinsicHeight: number, maxWidth: number, maxHeight: number): void {
		const widthRatio = maxWidth / intrinsicWidth;
		const heightRatio = maxHeight / intrinsicHeight;
		const scale = Math.min(widthRatio, heightRatio, 1);

		const newWidth = Math.round(intrinsicWidth * scale);
		const newHeight = Math.round(intrinsicHeight * scale);

		img.style.maxWidth = `${newWidth}px`;
		img.style.maxHeight = `${newHeight}px`;
		img.style.width = "auto";
		img.style.height = "auto";

		if (scale < 1) {
			img.classList.add("pagedjs_image_constrained");
			img.dataset.originalWidth = String(intrinsicWidth);
			img.dataset.originalHeight = String(intrinsicHeight);
			img.dataset.scaleFactor = scale.toFixed(3);
		}
	}

	_handleUnknownSize(img: HTMLElement, maxWidth: number, maxHeight: number): void {
		const checkSize = () => {
			const rect = img.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				if (rect.width > maxWidth || rect.height > maxHeight) {
					img.style.maxWidth = "100%";
					img.style.height = "auto";
					img.classList.add("pagedjs_image_constrained");
				}
			}
		};

		if ((img as HTMLImageElement).complete !== undefined && (img as HTMLImageElement).complete) {
			checkSize();
		} else {
			img.addEventListener("load", checkSize, { once: true });
			img.addEventListener("error", checkSize, { once: true });
		}
	}

	afterRendered(pages: any[], chunker: any): void {
		this._handleLazyLoadedImages(pages);
	}

	_handleLazyLoadedImages(pages: any[]): void {
		pages.forEach((page) => {
			if (!page.element) return;

			const images = page.element.querySelectorAll("img[data-src], img.lazy");
			images.forEach((img) => {
				const observer = new MutationObserver(() => {
					if ((img as HTMLImageElement).src && (img as HTMLImageElement).naturalWidth) {
						this._processImage(img as HTMLElement, page.width, page.height);
						observer.disconnect();
					}
				});

				observer.observe(img, { attributes: true, attributeFilter: ["src"] });
			});
		});
	}
}

export default ImageOverflowHandler;
