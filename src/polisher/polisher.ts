import Sheet from "./sheet";
import baseStyles from "./base";
import baseStylesIE from "./baseCssIE";
import Hook from "../utils/hook";
import { browserAgent } from "../utils/utils";
import request from "../utils/request";

// Import page numbering CSS integration utilities
// @ts-expect-error - JS module without type declarations
import { parsePageRules, extractPageNumberingConfig } from "../modules/page-numbering/css-integration";

interface PolisherHooks {
	onUrl: Hook;
	onAtPage: Hook;
	onAtMedia: Hook;
	onRule: Hook;
	onDeclaration: Hook;
	onContent: Hook;
	onImport: Hook;
	beforeTreeParse: Hook;
	beforeTreeWalk: Hook;
	afterTreeWalk: Hook;
}

interface PageRule {
	selector: string;
	declarations: Array<{ property: string; value: string }>;
	[key: string]: any;
}

class Polisher {
	sheets: Sheet[];
	inserted: HTMLStyleElement[];
	hooks: PolisherHooks;
	base?: HTMLStyleElement;
	styleEl?: HTMLStyleElement;
	styleSheet?: CSSStyleSheet | null;
	width?: string;
	height?: string;
	orientation?: string;
	pageNumberingConfig: Record<string, any> | null;

	constructor(setup: any) {
		this.sheets = [];
		this.inserted = [];

		this.hooks = {} as PolisherHooks;
		this.hooks.onUrl = new Hook(this);
		this.hooks.onAtPage = new Hook(this);
		this.hooks.onAtMedia = new Hook(this);
		this.hooks.onRule = new Hook(this);
		this.hooks.onDeclaration = new Hook(this);
		this.hooks.onContent = new Hook(this);
		this.hooks.onImport = new Hook(this);

		this.hooks.beforeTreeParse = new Hook(this);
		this.hooks.beforeTreeWalk = new Hook(this);
		this.hooks.afterTreeWalk = new Hook(this);

		// Store page numbering configuration extracted from CSS
		this.pageNumberingConfig = null;

		if (setup !== false) {
			this.setup();
		}
	}

	setup() {
		if (browserAgent() === "Edge" || browserAgent() === "IE") {
			this.base = this.insert(baseStylesIE);
		} else {
			this.base = this.insert(baseStyles);
		}
		this.styleEl = document.createElement("style");
		document.head.appendChild(this.styleEl);
		this.styleSheet = this.styleEl.sheet;
		return this.styleSheet;
	}

	async add(...args: any[]) {
		let fetched: Promise<Response | string>[] = [];
		let urls: string[] = [];

		for (var i = 0; i < arguments.length; i++) {
			let f: Promise<Response | string>;

			if (typeof arguments[i] === "object") {
				for (let url in arguments[i]) {
					let obj = arguments[i] as Record<string, string>;
					f = new Promise(function(resolve, reject) {
						urls.push(url);
						resolve(obj[url]);
					});
				}
			} else {
				urls.push(arguments[i] as string);
				f = request(arguments[i] as string).then((response: Response) => {
					return response.text();
				});
			}


			fetched.push(f!);
		}

		return await Promise.all(fetched)
			.then(async (originals) => {
				let text = "";
				for (let index = 0; index < originals.length; index++) {
					text = await this.convertViaSheet(originals[index] as string, urls[index]);
					this.insert(text);
				}
				return text;
			});
	}

	async convertViaSheet(cssStr: string, href: string) {
		let sheet = new Sheet(href, this.hooks);
		await sheet.parse(cssStr);

		// Insert the imported sheets first
		for (let url of sheet.imported) {
			let str = await request(url).then((response: Response) => {
				return response.text();
			});
			let text = await this.convertViaSheet(str, url);
			this.insert(text);
		}

		this.sheets.push(sheet);

		if (typeof (sheet as any).width !== "undefined") {
			this.width = (sheet as any).width;
		}
		if (typeof (sheet as any).height !== "undefined") {
			this.height = (sheet as any).height;
		}
		if (typeof (sheet as any).orientation !== "undefined") {
			this.orientation = (sheet as any).orientation;
		}

		// Extract page numbering configuration from this sheet
		// Reset cached config since we're adding a new sheet
		this.pageNumberingConfig = null;

		return sheet.toString();
	}

	insert(text: string) {
		let head = document.querySelector("head")!;
		let style = document.createElement("style");
		style.type = "text/css";
		style.dataset.pagedjsInsertedStyles = "true";

		style.appendChild(document.createTextNode(text));

		head.appendChild(style);

		this.inserted.push(style);
		return style;
	}

	destroy() {
		this.styleEl!.remove();
		this.inserted.forEach((s) => {
			s.remove();
		});
		this.sheets = [];
		this.pageNumberingConfig = null;
	}

	/**
	 * Extract page numbering configuration from all parsed CSS sheets
	 * This method parses @page rules to find page numbering properties
	 * and returns the configuration object
	 *
	 * @returns {object|null} Page numbering configuration or null if not found
	 */
	getPageNumberingConfig(): Record<string, any> | null {
		// If we already extracted config, return it
		if (this.pageNumberingConfig !== null) {
			return this.pageNumberingConfig;
		}

		// Extract @page rules from all sheets
		const allPageRules: any[] = [];

		for (const sheet of this.sheets) {
			if (sheet.text) {
				const pageRules = parsePageRules(sheet.text);
				if (pageRules && pageRules.length > 0) {
					allPageRules.push(...pageRules);
				}
			}
		}

		// Extract configuration from @page rules
		if (allPageRules.length > 0) {
			this.pageNumberingConfig = extractPageNumberingConfig(allPageRules);
		} else {
			this.pageNumberingConfig = null;
		}

		return this.pageNumberingConfig;
	}

	/**
	 * Get all parsed @page rules from CSS sheets
	 * This includes rules with page numbering properties and other @page rules
	 *
	 * @returns {Array} Array of parsed @page rules
	 */
	getPageRules() {
		const allPageRules: any[] = [];

		for (const sheet of this.sheets) {
			if (sheet.text) {
				const pageRules = parsePageRules(sheet.text);
				if (pageRules && pageRules.length > 0) {
					allPageRules.push(...pageRules);
				}
			}
		}

		return allPageRules;
	}

	/**
	 * Check if any parsed CSS contains page numbering configuration
	 *
	 * @returns {boolean} True if page numbering CSS properties are found
	 */
	hasPageNumberingCSS(): boolean {
		for (const sheet of this.sheets) {
			if (sheet.text && sheet.text.includes("pagedjs-page-numbering")) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Apply CSS specificity and inheritance to page numbering configuration
	 * This handles cases like @page :first vs @page, etc.
	 *
	 * @param {Array} pageRules - Array of parsed @page rules
	 * @returns {object} Merged configuration with specificity applied
	 */
	applyPageNumberingSpecificity(pageRules: PageRule[]): Record<string, any> | null {
		if (!pageRules || pageRules.length === 0) {
			return null;
		}

		// Sort rules by specificity (more specific selectors first)
		const sortedRules = [...pageRules].sort((a, b) => {
			const aSpecificity = this.calculateSpecificity(a.selector);
			const bSpecificity = this.calculateSpecificity(b.selector);
			return bSpecificity - aSpecificity; // Descending order
		});

		// Extract config from most specific to least specific
		// More specific rules override less specific ones
		let mergedConfig: Record<string, any> = {};

		for (const rule of sortedRules) {
			const ruleConfig = extractPageNumberingConfig([rule]);
			if (ruleConfig) {
				// Merge with existing config (more specific overrides less specific)
				mergedConfig = { ...mergedConfig, ...ruleConfig };
			}
		}

		return mergedConfig;
	}

	/**
	 * Calculate specificity score for a @page selector
	 * Higher score means more specific selector
	 *
	 * @param {string} selector - @page selector (e.g., '', ':first', ':left', etc.)
	 * @returns {number} Specificity score
	 */
	calculateSpecificity(selector: string): number {
		if (!selector || selector === "" || selector === "*") {
			return 0; // Least specific
		}

		let score = 0;

		// Check for pseudo-classes
		if (selector.includes(":first")) score += 10;
		if (selector.includes(":left")) score += 5;
		if (selector.includes(":right")) score += 5;
		if (selector.includes(":blank")) score += 10;

		// Check for named pages (e.g., @page chapter)
		if (selector && !selector.startsWith(":")) {
			score += 3; // Named pages are more specific than generic @page
		}

		// :has() selectors are highly specific (content-based matching)
		if (selector.includes(":has(")) score += 15;

		// :is() selectors take the specificity of their most specific argument
		if (selector.includes(":is(")) {
			score += 8; // Base score for :is()
			// Additional points based on what's inside :is()
			if (selector.includes(":first")) score += 2;
			if (selector.includes(":blank")) score += 2;
		}

		return score;
	}
}

export default Polisher;
