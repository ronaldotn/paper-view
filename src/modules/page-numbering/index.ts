import * as config from "./config";
import * as formatter from "./formatter";
import PageNumberRenderer from "./renderer";
import { parsePageRules, extractPageNumberingConfig } from "./css-integration";
import { calculatePosition, getPositionCSS } from "./positions";
import PageNumberingHandler from "./handler";

export class PageNumberingModule {
	enabled: boolean;
	config: import("./config").PageNumberingConfig;
	pageCount: number;
	renderer: PageNumberRenderer;
	_initialized: boolean;
	_pageElements: { element: HTMLElement; pageIndex: number; pageElement: HTMLElement }[];

	constructor(options: any = {}) {
		this.enabled = false;
		this.config = config.normalizeConfig(options);
		this.pageCount = 0;
		this.renderer = new PageNumberRenderer();
		this._initialized = false;
		this._pageElements = [];
		this.enabled = this.config.enabled;
	}

	enable(): void {
		this.enabled = true;
		this.config.enabled = true;
	}

	disable(): void {
		this.enabled = false;
		this.config.enabled = false;
		this._clearPageElements();
	}

	updateConfig(newConfig: any): import("./config.js").PageNumberingConfig {
		const mergedConfig = { ...this.config, ...newConfig };
		this.config = config.normalizeConfig(mergedConfig);

		this.enabled = this.config.enabled;

		if (!this.enabled) {
			this._clearPageElements();
		}

		return this.config;
	}

	applyCSSRules(pageRules: any[]): void {
		if (!pageRules || !Array.isArray(pageRules)) {
			return;
		}

		const cssConfig = extractPageNumberingConfig(pageRules);
		if (cssConfig) {
			this.config = config.mergeConfigs({}, cssConfig, this.config);
			this.enabled = this.config.enabled;
		}
	}

	renderPageNumber(pageElement: HTMLElement, pageIndex: number, totalPages: number): HTMLElement | null {
		if (!this.enabled || !pageElement) {
			return null;
		}

		const pageNumber = this.config.start + pageIndex;

		const formattedNumber = formatter.formatWithTemplate(
			pageNumber,
			this.config.style,
			totalPages,
			this.config.template
		);

		const pageNumberElement = this.renderer.createElement(
			formattedNumber,
			this.config
		);

		this.renderer.positionElement(
			pageNumberElement,
			pageElement,
			this.config.position
		);

		this._pageElements.push({
			element: pageNumberElement,
			pageIndex: pageIndex,
			pageElement: pageElement
		});

		return pageNumberElement;
	}

	updatePageCount(totalPages: number): void {
		if (!this.enabled || !Number.isInteger(totalPages) || totalPages < 1) {
			return;
		}

		this.pageCount = totalPages;

		this._pageElements.forEach((item, index) => {
			if (index < totalPages) {
				const pageNumber = this.config.start + index;
				const formattedNumber = formatter.formatWithTemplate(
					pageNumber,
					this.config.style,
					totalPages,
					this.config.template
				);

				this.renderer.updateContent(
					item.element,
					formattedNumber,
					this.config
				);
			}
		});

		if (this._pageElements.length > totalPages) {
			this._pageElements.slice(totalPages).forEach(item => {
				if (item.element && item.element.parentNode) {
					item.element.parentNode.removeChild(item.element);
				}
			});
			this._pageElements = this._pageElements.slice(0, totalPages);
		}
	}

	_clearPageElements(): void {
		this._pageElements.forEach(item => {
			if (item.element && item.element.parentNode) {
				item.element.parentNode.removeChild(item.element);
			}
		});
		this._pageElements = [];
	}

	getConfig(): import("./config.js").PageNumberingConfig {
		return { ...this.config };
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	getPageCount(): number {
		return this.pageCount;
	}
}

export {
	config,
	formatter,
	PageNumberRenderer,
	parsePageRules,
	extractPageNumberingConfig,
	calculatePosition,
	getPositionCSS,
	PageNumberingHandler
};

export default PageNumberingModule;
