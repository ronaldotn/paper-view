import Sheet from "./sheet";
import baseStyles from "./base";
import baseStylesIE from "./baseCssIE";
import Hook from "../utils/hook";
import {browserAgent} from "../utils/utils";
import request from "../utils/request";

// Import page numbering CSS integration utilities
import { parsePageRules, extractPageNumberingConfig } from "../modules/page-numbering/css-integration.js";

class Polisher {
	constructor(setup) {
		this.sheets = [];
		this.inserted = [];

		this.hooks = {};
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

	async add() {
		let fetched = [];
		let urls = [];

		for (var i = 0; i < arguments.length; i++) {
			let f;

			if (typeof arguments[i] === "object") {
				for (let url in arguments[i]) {
					let obj = arguments[i];
					f = new Promise(function(resolve, reject) {
						urls.push(url);
						resolve(obj[url]);
					});
				}
			} else {
				urls.push(arguments[i]);
				f = request(arguments[i]).then((response) => {
					return response.text();
				});
			}


			fetched.push(f);
		}

		return await Promise.all(fetched)
			.then(async (originals) => {
				let text = "";
				for (let index = 0; index < originals.length; index++) {
					text = await this.convertViaSheet(originals[index], urls[index]);
					this.insert(text);
				}
				return text;
			});
	}

	async convertViaSheet(cssStr, href) {
		let sheet = new Sheet(href, this.hooks);
		await sheet.parse(cssStr);

		// Insert the imported sheets first
		for (let url of sheet.imported) {
			let str = await request(url).then((response) => {
				return response.text();
			});
			let text = await this.convertViaSheet(str, url);
			this.insert(text);
		}

		this.sheets.push(sheet);

		if (typeof sheet.width !== "undefined") {
			this.width = sheet.width;
		}
		if (typeof sheet.height !== "undefined") {
			this.height = sheet.height;
		}
		if (typeof sheet.orientation !== "undefined") {
			this.orientation = sheet.orientation;
		}

		// Extract page numbering configuration from this sheet
		// Reset cached config since we're adding a new sheet
		this.pageNumberingConfig = null;
		
		return sheet.toString();
	}

	insert(text){
		let head = document.querySelector("head");
		let style = document.createElement("style");
		style.type = "text/css";
		style.dataset.pagedjsInsertedStyles = "true";

		style.appendChild(document.createTextNode(text));

		head.appendChild(style);

		this.inserted.push(style);
		return style;
	}

	destroy() {
		this.styleEl.remove();
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
	getPageNumberingConfig() {
		// If we already extracted config, return it
		if (this.pageNumberingConfig !== null) {
			return this.pageNumberingConfig;
		}

		// Extract @page rules from all sheets
		const allPageRules = [];
		
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
		const allPageRules = [];
		
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
	hasPageNumberingCSS() {
		for (const sheet of this.sheets) {
			if (sheet.text && sheet.text.includes('pagedjs-page-numbering')) {
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
	applyPageNumberingSpecificity(pageRules) {
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
		let mergedConfig = {};
		
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
	calculateSpecificity(selector) {
		if (!selector || selector === '' || selector === '*') {
			return 0; // Least specific
		}

		let score = 0;
		
		// Check for pseudo-classes
		if (selector.includes(':first')) score += 10;
		if (selector.includes(':left')) score += 5;
		if (selector.includes(':right')) score += 5;
		if (selector.includes(':blank')) score += 10;
		
		// Check for named pages (e.g., @page chapter)
		if (selector && !selector.startsWith(':')) {
			score += 3; // Named pages are more specific than generic @page
		}

		return score;
	}
}

export default Polisher;
