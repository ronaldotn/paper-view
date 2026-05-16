/**
 * SpreadViewer - Enhanced spread/book view mode for PaperView
 *
 * Provides:
 * - Open book view (side-by-side page spreads)
 * - Arrow navigation (next/prev spread)
 * - Zoom in/out with mouse wheel and controls
 * - Keyboard shortcuts for navigation
 * - Touch/swipe support for mobile
 */

export interface SpreadViewerOptions {
	container: HTMLElement;
	spreadMode?: "book" | "scroll";
	zoom?: number;
	minZoom?: number;
	maxZoom?: number;
	zoomStep?: number;
	enableKeyboard?: boolean;
	enableTouch?: boolean;
	animationDuration?: number;
}

export interface SpreadViewerState {
	currentSpread: number;
	totalSpreads: number;
	zoom: number;
	mode: "book" | "scroll";
	isAnimating: boolean;
}

export type SpreadViewerEvent =
	| { type: "spreadChange"; spread: number; pages: number[] }
	| { type: "zoomChange"; zoom: number }
	| { type: "modeChange"; mode: "book" | "scroll" }
	| { type: "ready" };

type EventCallback = (event: SpreadViewerEvent) => void;

const DEFAULT_OPTIONS: Required<Omit<SpreadViewerOptions, "container">> = {
	spreadMode: "book",
	zoom: 1,
	minZoom: 0.5,
	maxZoom: 3,
	zoomStep: 0.25,
	enableKeyboard: true,
	enableTouch: true,
	animationDuration: 300,
};

export class SpreadViewer {
	private container: HTMLElement;
	private pagesContainer: HTMLElement | null = null;
	private options: Required<SpreadViewerOptions>;
	private state: SpreadViewerState;
	private pages: HTMLElement[] = [];
	private eventListeners: Map<string, EventCallback[]> = new Map();
	private touchStartX: number = 0;
	private touchStartY: number = 0;
	private isInitialized: boolean = false;

	constructor(options: SpreadViewerOptions) {
		this.container = options.container;
		this.options = { ...DEFAULT_OPTIONS, ...options };
		this.state = {
			currentSpread: 0,
			totalSpreads: 0,
			zoom: this.options.zoom,
			mode: this.options.spreadMode,
			isAnimating: false,
		};
	}

	/**
	 * Initialize the spread viewer with rendered pages
	 */
	public async initialize(): Promise<void> {
		if (this.isInitialized) return;

		this.pagesContainer = this.container.querySelector(".pagedjs_pages");
		if (!this.pagesContainer) {
			throw new Error("SpreadViewer: No .pagedjs_pages container found");
		}

		this.collectPages();
		this.setupLayout();
		this.setupEventListeners();
		this.applyZoom();
		this.goToSpread(0);

		this.isInitialized = true;
		this.emit({ type: "ready" });
	}

	/**
	 * Collect all page elements from the container
	 */
	private collectPages(): void {
		this.pages = Array.from(
			this.pagesContainer!.querySelectorAll(".pagedjs_page")
		) as HTMLElement[];
		this.state.totalSpreads = Math.ceil(this.pages.length / 2);
	}

	/**
	 * Setup the container layout for book/spread view
	 */
	private setupLayout(): void {
		const style = document.createElement("style");
		style.setAttribute("data-spread-viewer", "true");
		style.textContent = `
			.spread-viewer-wrapper {
				overflow: hidden;
				position: relative;
				width: 100%;
				height: 100%;
				touch-action: none;
			}

			.spread-viewer-viewport {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 100%;
				height: 100%;
				transition: transform ${this.options.animationDuration}ms ease-out;
				transform-origin: center center;
			}

			.spread-viewer-spread {
				display: flex;
				flex-direction: row;
				gap: 0;
				position: relative;
				transition: opacity ${this.options.animationDuration}ms ease;
			}

			.spread-viewer-spread .pagedjs_page {
				flex-shrink: 0;
				margin: 0;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
				transition: transform 0.2s ease;
			}

			/* Book spine effect */
			.spread-viewer-spread .pagedjs_right_page {
				border-radius: 0 3px 3px 0;
				margin-right: -1px;
			}

			.spread-viewer-spread .pagedjs_left_page {
				border-radius: 3px 0 0 3px;
				margin-left: -1px;
				box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
			}

			/* Page curl effect on hover */
			.spread-viewer-spread .pagedjs_page:hover {
				transform: perspective(1000px) rotateY(-2deg);
			}

			.spread-viewer-spread .pagedjs_left_page:hover {
				transform: perspective(1000px) rotateY(2deg);
			}

			/* Navigation arrows */
			.spread-viewer-nav {
				position: absolute;
				top: 50%;
				transform: translateY(-50%);
				width: 48px;
				height: 48px;
				border: none;
				background: rgba(255, 255, 255, 0.9);
				border-radius: 50%;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20px;
				color: #333;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
				transition: all 0.2s ease;
				z-index: 10;
				opacity: 0.7;
			}

			.spread-viewer-nav:hover {
				opacity: 1;
				background: #fff;
				transform: translateY(-50%) scale(1.1);
			}

			.spread-viewer-nav:disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}

			.spread-viewer-nav:disabled:hover {
				transform: translateY(-50%) scale(1);
			}

			.spread-viewer-nav--prev {
				left: 16px;
			}

			.spread-viewer-nav--next {
				right: 16px;
			}

			/* Zoom controls */
			.spread-viewer-zoom-controls {
				position: absolute;
				bottom: 16px;
				right: 16px;
				display: flex;
				gap: 8px;
				z-index: 10;
			}

			.spread-viewer-zoom-btn {
				width: 36px;
				height: 36px;
				border: none;
				background: rgba(255, 255, 255, 0.9);
				border-radius: 8px;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				color: #333;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
				transition: all 0.2s ease;
			}

			.spread-viewer-zoom-btn:hover {
				background: #fff;
				transform: scale(1.05);
			}

			.spread-viewer-zoom-level {
				display: flex;
				align-items: center;
				padding: 0 12px;
				background: rgba(255, 255, 255, 0.9);
				border-radius: 8px;
				font-size: 14px;
				color: #333;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
				min-width: 60px;
				justify-content: center;
			}

			/* Page indicator */
			.spread-viewer-indicator {
				position: absolute;
				bottom: 16px;
				left: 50%;
				transform: translateX(-50%);
				padding: 8px 16px;
				background: rgba(0, 0, 0, 0.7);
				color: #fff;
				border-radius: 20px;
				font-size: 14px;
				z-index: 10;
			}

			/* Scroll mode overrides */
			.spread-viewer-wrapper.scroll-mode .spread-viewer-viewport {
				flex-direction: column;
				overflow-y: auto;
			}

			.spread-viewer-wrapper.scroll-mode .spread-viewer-spread {
				flex-direction: column;
				gap: 16px;
				padding: 16px;
			}

			/* Hide navigation in scroll mode */
			.spread-viewer-wrapper.scroll-mode .spread-viewer-nav {
				display: none;
			}
		`;
		document.head.appendChild(style);

		// Create wrapper structure
		const wrapper = document.createElement("div");
		wrapper.className = `spread-viewer-wrapper${this.state.mode === "scroll" ? " scroll-mode" : ""}`;

		const viewport = document.createElement("div");
		viewport.className = "spread-viewer-viewport";

		// Move pages container into viewport
		this.container.appendChild(wrapper);
		wrapper.appendChild(viewport);
		viewport.appendChild(this.pagesContainer!);

		// Create navigation buttons
		const prevBtn = document.createElement("button");
		prevBtn.className = "spread-viewer-nav spread-viewer-nav--prev";
		prevBtn.innerHTML = "&#8249;";
		prevBtn.setAttribute("aria-label", "Previous spread");
		prevBtn.addEventListener("click", () => this.prevSpread());

		const nextBtn = document.createElement("button");
		nextBtn.className = "spread-viewer-nav spread-viewer-nav--next";
		nextBtn.innerHTML = "&#8250;";
		nextBtn.setAttribute("aria-label", "Next spread");
		nextBtn.addEventListener("click", () => this.nextSpread());

		wrapper.appendChild(prevBtn);
		wrapper.appendChild(nextBtn);

		// Create zoom controls
		const zoomControls = document.createElement("div");
		zoomControls.className = "spread-viewer-zoom-controls";
		zoomControls.innerHTML = `
			<button class="spread-viewer-zoom-btn" data-action="zoom-out" aria-label="Zoom out">−</button>
			<div class="spread-viewer-zoom-level" id="spreadViewerZoomLevel">${Math.round(this.state.zoom * 100)}%</div>
			<button class="spread-viewer-zoom-btn" data-action="zoom-in" aria-label="Zoom in">+</button>
			<button class="spread-viewer-zoom-btn" data-action="zoom-fit" aria-label="Fit to screen">⊡</button>
		`;

		zoomControls
			.querySelector("[data-action=\"zoom-out\"]")!
			.addEventListener("click", () => this.zoomOut());
		zoomControls
			.querySelector("[data-action=\"zoom-in\"]")!
			.addEventListener("click", () => this.zoomIn());
		zoomControls
			.querySelector("[data-action=\"zoom-fit\"]")!
			.addEventListener("click", () => this.zoomToFit());

		wrapper.appendChild(zoomControls);

		// Create page indicator
		const indicator = document.createElement("div");
		indicator.className = "spread-viewer-indicator";
		indicator.id = "spreadViewerIndicator";
		wrapper.appendChild(indicator);

		this.updateIndicator();
		this.updateNavigationButtons();
	}

	/**
	 * Setup keyboard and touch event listeners
	 */
	private setupEventListeners(): void {
		// Keyboard navigation
		if (this.options.enableKeyboard) {
			document.addEventListener("keydown", this.handleKeyDown);
		}

		// Touch/swipe support
		if (this.options.enableTouch) {
			const wrapper = this.container.querySelector(
				".spread-viewer-wrapper"
			) as HTMLElement | null;
			if (wrapper) {
				wrapper.addEventListener("touchstart", this.handleTouchStart as EventListener, {
					passive: true,
				});
				wrapper.addEventListener("touchend", this.handleTouchEnd as EventListener, {
					passive: true,
				});
			}
		}

		// Mouse wheel zoom
		const viewport = this.container.querySelector(
			".spread-viewer-viewport"
		) as HTMLElement | null;
		if (viewport) {
			viewport.addEventListener("wheel", this.handleWheelZoom as EventListener, {
				passive: false,
			});
		}
	}

	/**
	 * Handle keyboard events
	 */
	private handleKeyDown = (e: KeyboardEvent): void => {
		switch (e.key) {
			case "ArrowLeft":
			case "PageUp":
				e.preventDefault();
				this.prevSpread();
				break;
			case "ArrowRight":
			case "PageDown":
				e.preventDefault();
				this.nextSpread();
				break;
			case "Home":
				e.preventDefault();
				this.goToSpread(0);
				break;
			case "End":
				e.preventDefault();
				this.goToSpread(this.state.totalSpreads - 1);
				break;
			case "+":
			case "=":
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					this.zoomIn();
				}
				break;
			case "-":
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					this.zoomOut();
				}
				break;
			case "0":
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					this.zoomToFit();
				}
				break;
		}
	};

	/**
	 * Handle touch start for swipe detection
	 */
	private handleTouchStart = (e: TouchEvent): void => {
		this.touchStartX = e.touches[0].clientX;
		this.touchStartY = e.touches[0].clientY;
	};

	/**
	 * Handle touch end for swipe detection
	 */
	private handleTouchEnd = (e: TouchEvent): void => {
		const deltaX = e.changedTouches[0].clientX - this.touchStartX;
		const deltaY = e.changedTouches[0].clientY - this.touchStartY;

		// Only handle horizontal swipes (ignore vertical scrolling)
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
			if (deltaX > 0) {
				this.prevSpread();
			} else {
				this.nextSpread();
			}
		}
	};

	/**
	 * Handle mouse wheel for zoom
	 */
	private handleWheelZoom = (e: WheelEvent): void => {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			if (e.deltaY < 0) {
				this.zoomIn();
			} else {
				this.zoomOut();
			}
		}
	};

	/**
	 * Navigate to a specific spread
	 */
	public goToSpread(spreadIndex: number): void {
		if (spreadIndex < 0) spreadIndex = 0;
		if (spreadIndex >= this.state.totalSpreads)
			spreadIndex = this.state.totalSpreads - 1;

		if (spreadIndex === this.state.currentSpread && this.state.mode === "book") return;

		this.state.currentSpread = spreadIndex;

		if (this.state.mode === "book") {
			this.showSpreadBookMode(spreadIndex);
		} else {
			this.showSpreadScrollMode(spreadIndex);
		}

		this.updateIndicator();
		this.updateNavigationButtons();
		this.emit({
			type: "spreadChange",
			spread: spreadIndex,
			pages: this.getPagesInSpread(spreadIndex),
		});
	}

	/**
	 * Show spread in book mode (side-by-side)
	 */
	private showSpreadBookMode(spreadIndex: number): void {
		const pageIndices = this.getPagesInSpread(spreadIndex);

		// Hide all pages first
		this.pages.forEach((page) => {
			page.style.display = "none";
		});

		// Show only current spread pages
		pageIndices.forEach((index) => {
			if (this.pages[index]) {
				this.pages[index].style.display = "block";
			}
		});

		// Ensure correct order: left page first, then right page
		const spreadContainer = document.createElement("div");
		spreadContainer.className = "spread-viewer-spread";

		pageIndices.forEach((index) => {
			if (this.pages[index]) {
				spreadContainer.appendChild(this.pages[index]);
			}
		});

		const viewport = this.container.querySelector(
			".spread-viewer-viewport"
		);
		if (viewport) {
			// Clear viewport and add spread
			viewport.innerHTML = "";
			viewport.appendChild(spreadContainer);
		}
	}

	/**
	 * Show spread in scroll mode (all pages visible)
	 */
	private showSpreadScrollMode(_spreadIndex: number): void {
		this.pages.forEach((page) => {
			page.style.display = "block";
		});
	}

	/**
	 * Get page indices for a given spread
	 */
	private getPagesInSpread(spreadIndex: number): number[] {
		const leftIndex = spreadIndex * 2;
		const rightIndex = leftIndex + 1;
		const pages: number[] = [];

		if (leftIndex < this.pages.length) pages.push(leftIndex);
		if (rightIndex < this.pages.length) pages.push(rightIndex);

		return pages;
	}

	/**
	 * Navigate to next spread
	 */
	public nextSpread(): void {
		if (this.state.currentSpread < this.state.totalSpreads - 1) {
			this.goToSpread(this.state.currentSpread + 1);
		}
	}

	/**
	 * Navigate to previous spread
	 */
	public prevSpread(): void {
		if (this.state.currentSpread > 0) {
			this.goToSpread(this.state.currentSpread - 1);
		}
	}

	/**
	 * Zoom in
	 */
	public zoomIn(): void {
		const newZoom = Math.min(
			this.state.zoom + this.options.zoomStep,
			this.options.maxZoom
		);
		this.setZoom(newZoom);
	}

	/**
	 * Zoom out
	 */
	public zoomOut(): void {
		const newZoom = Math.max(
			this.state.zoom - this.options.zoomStep,
			this.options.minZoom
		);
		this.setZoom(newZoom);
	}

	/**
	 * Zoom to fit the viewport
	 */
	public zoomToFit(): void {
		this.setZoom(1);
	}

	/**
	 * Set zoom level
	 */
	public setZoom(level: number): void {
		this.state.zoom = Math.max(
			this.options.minZoom,
			Math.min(this.options.maxZoom, level)
		);
		this.applyZoom();
		this.emit({ type: "zoomChange", zoom: this.state.zoom });
	}

	/**
	 * Apply current zoom to viewport
	 */
	private applyZoom(): void {
		const viewport = this.container.querySelector(
			".spread-viewer-viewport"
		) as HTMLElement | null;
		if (viewport) {
			viewport.style.transform = `scale(${this.state.zoom})`;
		}

		const zoomLevel = this.container.querySelector(
			"#spreadViewerZoomLevel"
		);
		if (zoomLevel) {
			zoomLevel.textContent = `${Math.round(this.state.zoom * 100)}%`;
		}
	}

	/**
	 * Switch between book and scroll modes
	 */
	public setMode(mode: "book" | "scroll"): void {
		this.state.mode = mode;

		const wrapper = this.container.querySelector(".spread-viewer-wrapper");
		if (wrapper) {
			if (mode === "scroll") {
				wrapper.classList.add("scroll-mode");
			} else {
				wrapper.classList.remove("scroll-mode");
			}
		}

		this.goToSpread(this.state.currentSpread);
		this.emit({ type: "modeChange", mode });
	}

	/**
	 * Update page indicator text
	 */
	private updateIndicator(): void {
		const indicator = this.container.querySelector(
			"#spreadViewerIndicator"
		);
		if (indicator) {
			const pageIndices = this.getPagesInSpread(this.state.currentSpread);
			const pageLabels = pageIndices.map((i) => i + 1).join("–");
			indicator.textContent = `Spread ${this.state.currentSpread + 1} of ${this.state.totalSpreads} (Pages ${pageLabels})`;
		}
	}

	/**
	 * Update navigation button states
	 */
	private updateNavigationButtons(): void {
		const prevBtn = this.container.querySelector(
			".spread-viewer-nav--prev"
		) as HTMLButtonElement;
		const nextBtn = this.container.querySelector(
			".spread-viewer-nav--next"
		) as HTMLButtonElement;

		if (prevBtn) {
			prevBtn.disabled = this.state.currentSpread === 0;
		}
		if (nextBtn) {
			nextBtn.disabled =
				this.state.currentSpread >= this.state.totalSpreads - 1;
		}
	}

	/**
	 * Get current state
	 */
	public getState(): Readonly<SpreadViewerState> {
		return { ...this.state };
	}

	/**
	 * Get total page count
	 */
	public getTotalPages(): number {
		return this.pages.length;
	}

	/**
	 * Event system
	 */
	public on(event: string, callback: EventCallback): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	public off(event: string, callback: EventCallback): void {
		const callbacks = this.eventListeners.get(event);
		if (callbacks) {
			const index = callbacks.indexOf(callback);
			if (index !== -1) {
				callbacks.splice(index, 1);
			}
		}
	}

	private emit(event: SpreadViewerEvent): void {
		const callbacks = this.eventListeners.get(event.type);
		if (callbacks) {
			callbacks.forEach((cb) => cb(event));
		}
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		document.removeEventListener("keydown", this.handleKeyDown);

		const wrapper = this.container.querySelector(
			".spread-viewer-wrapper"
		) as HTMLElement | null;
		if (wrapper) {
			wrapper.removeEventListener("touchstart", this.handleTouchStart as EventListener);
			wrapper.removeEventListener("touchend", this.handleTouchEnd as EventListener);
		}

		const viewport = this.container.querySelector(
			".spread-viewer-viewport"
		) as HTMLElement | null;
		if (viewport) {
			viewport.removeEventListener("wheel", this.handleWheelZoom as EventListener);
		}

		// Remove injected styles
		const style = document.querySelector(
			"style[data-spread-viewer=\"true\"]"
		);
		if (style) style.remove();

		// Restore original container structure
		if (this.pagesContainer && this.pagesContainer.parentNode) {
			this.container.appendChild(this.pagesContainer);
		}

		const wrapperEl = this.container.querySelector(
			".spread-viewer-wrapper"
		);
		if (wrapperEl) wrapperEl.remove();

		this.eventListeners.clear();
		this.isInitialized = false;
	}
}
