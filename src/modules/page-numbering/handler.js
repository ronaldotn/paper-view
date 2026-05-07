/**
 * Page Numbering CSS Handler
 * 
 * Handles extraction of page numbering configuration from CSS @page rules
 * and applies it to the Chunker's page numbering module.
 * 
 * @module modules/page-numbering/handler
 */

import Handler from "../handler.js";
import * as csstree from "css-tree";
import { extractPageNumberingConfig } from "./css-integration.js";

/**
 * PageNumberingHandler class
 * 
 * Extracts page numbering configuration from CSS @page rules
 * and applies it to the Chunker's page numbering module.
 */
class PageNumberingHandler extends Handler {
	/**
	 * Create a new PageNumberingHandler instance
	 * 
	 * @param {object} chunker - Chunker instance
	 * @param {object} polisher - Polisher instance  
	 * @param {object} caller - Caller instance
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		
		/** @type {Array} Collected @page rules with page numbering properties */
		this.pageRules = [];
		
		/** @type {object} Extracted page numbering configuration */
		this.config = null;
	}
	
	/**
	 * Handle @page rules to extract page numbering configuration
	 * 
	 * @param {object} node - CSS tree node
	 * @param {object} item - List item
	 * @param {object} list - List
	 */
	onAtPage(node, item, list) {
		let selector = "";
		
		// Get selector
		if (node.prelude) {
			selector = csstree.generate(node.prelude);
		} else {
			selector = "*";
		}
		
		// Extract properties from the @page rule
		const rule = {
			selector: selector,
			properties: {}
		};
		
		// Walk through declarations in the @page rule
		if (node.block && node.block.children) {
			node.block.children.forEach(child => {
				if (child.type === "Declaration") {
					const propertyName = csstree.property(child.property).name;
					const propertyValue = csstree.generate(child.value);
					rule.properties[propertyName] = propertyValue;
				}
			});
		}
		
		// Check if this rule has page numbering properties
		const hasPageNumberingProps = Object.keys(rule.properties).some(prop => 
			prop.startsWith('pagedjs-page-numbering')
		);
		
		if (hasPageNumberingProps) {
			this.pageRules.push(rule);
		}
		
		// Note: We don't remove the rule from the list because
		// other handlers (like AtPage) need to process it too
	}
	
	/**
	 * After tree walk is complete, apply extracted configuration to Chunker
	 * 
	 * @param {object} ast - CSS tree AST
	 * @param {object} sheet - Sheet object
	 */
	afterTreeWalk(ast, sheet) {
		// If we collected any @page rules with page numbering properties,
		// apply them to the Chunker
		if (this.pageRules.length > 0 && this.chunker) {
			// Apply CSS specificity (more specific rules override less specific ones)
			const sortedRules = this.applySpecificity(this.pageRules);
			
			// Extract configuration from sorted rules
			this.config = extractPageNumberingConfig(sortedRules);
			
			// Apply to Chunker
			if (this.chunker.applyPageNumberingCSSRules) {
				this.chunker.applyPageNumberingCSSRules(sortedRules);
			}
			
			// Emit event with configuration
			this.emit("pageNumberingConfig", this.config);
		}
		
		// Reset for next sheet
		this.pageRules = [];
	}
	
	/**
	 * Apply CSS specificity to @page rules
	 * More specific selectors override less specific ones
	 * 
	 * @param {Array} rules - Array of @page rules
	 * @returns {Array} Rules sorted and filtered by specificity
	 */
	applySpecificity(rules) {
		if (!rules || rules.length === 0) {
			return [];
		}
		
		// Calculate specificity for each rule
		const rulesWithSpecificity = rules.map(rule => ({
			...rule,
			specificity: this.calculateSpecificity(rule.selector)
		}));
		
		// Sort by specificity (descending - most specific first)
		rulesWithSpecificity.sort((a, b) => b.specificity - a.specificity);
		
		// For rules with same specificity, later rules override earlier ones
		// (cascade order)
		const uniqueSelectors = new Set();
		const filteredRules = [];
		
		for (const rule of rulesWithSpecificity) {
			// If we haven't seen this selector yet, add it
			// (more specific rules come first due to sorting)
			if (!uniqueSelectors.has(rule.selector)) {
				uniqueSelectors.add(rule.selector);
				filteredRules.push(rule);
			}
		}
		
		return filteredRules;
	}
	
	/**
	 * Calculate specificity score for a @page selector
	 * Higher score means more specific selector
	 * 
	 * @param {string} selector - @page selector
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
		
		// Check for nth selectors (e.g., :nth(1))
		if (selector.includes(':nth')) {
			score += 7;
		}
		
		return score;
	}
	
	/**
	 * Get extracted page numbering configuration
	 * 
	 * @returns {object|null} Page numbering configuration
	 */
	getConfig() {
		return this.config;
	}
	
	/**
	 * Get collected @page rules
	 * 
	 * @returns {Array} Array of @page rules
	 */
	getPageRules() {
		return this.pageRules;
	}
	
	/**
	 * Reset handler state
	 */
	reset() {
		this.pageRules = [];
		this.config = null;
	}
}

export default PageNumberingHandler;