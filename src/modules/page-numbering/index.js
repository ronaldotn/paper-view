/**
 * Page Numbering Module
 * 
 * Main entry point for the page numbering feature.
 * Provides configurable page number display for paged media.
 * 
 * @module modules/page-numbering
 */

import * as config from './config.js';
import * as formatter from './formatter.js';
import PageNumberRenderer from './renderer.js';
import { parsePageRules, extractPageNumberingConfig } from './css-integration.js';
import { calculatePosition, getPositionCSS } from './positions.js';
import PageNumberingHandler from './handler.js';

/**
 * PageNumberingModule class
 * 
 * Main class for managing page numbering configuration and rendering.
 * Coordinates with Chunker for page rendering and handles dynamic updates.
 */
export class PageNumberingModule {
	/**
	 * Create a new PageNumberingModule instance
	 * 
	 * @param {object} options - Initial configuration options
	 */
	constructor(options = {}) {
		/** @type {boolean} Whether page numbering is enabled */
		this.enabled = false;
		
		/** @type {object} Current configuration */
		this.config = config.normalizeConfig(options);
		
		/** @type {number} Total page count */
		this.pageCount = 0;
		
		/** @type {PageNumberRenderer} Renderer instance */
		this.renderer = new PageNumberRenderer();
		
		/** @type {boolean} Whether the module is initialized */
		this._initialized = false;
		
		/** @type {Array} Array of page number elements for dynamic updates */
		this._pageElements = [];
		
		// Set enabled from config
		this.enabled = this.config.enabled;
	}
	
	/**
	 * Enable page numbering
	 */
	enable() {
		this.enabled = true;
		this.config.enabled = true;
	}
	
	/**
	 * Disable page numbering
	 */
	disable() {
		this.enabled = false;
		this.config.enabled = false;
		// Clear any existing page number elements
		this._clearPageElements();
	}
	
	/**
	 * Update configuration
	 * 
	 * @param {object} newConfig - New configuration values
	 * @returns {object} Updated configuration
	 */
	updateConfig(newConfig) {
		// Merge with existing config
		const mergedConfig = { ...this.config, ...newConfig };
		this.config = config.normalizeConfig(mergedConfig);
		
		// Update enabled state
		this.enabled = this.config.enabled;
		
		// If page numbering is now disabled, clear elements
		if (!this.enabled) {
			this._clearPageElements();
		}
		
		return this.config;
	}
	
	/**
	 * Apply CSS @page rules to configuration
	 * 
	 * @param {Array} pageRules - Array of parsed CSS @page rules
	 */
	applyCSSRules(pageRules) {
		if (!pageRules || !Array.isArray(pageRules)) {
			return;
		}
		
		const cssConfig = extractPageNumberingConfig(pageRules);
		if (cssConfig) {
			// Merge CSS config with existing config (CSS has medium priority)
			this.config = config.mergeConfigs({}, cssConfig, this.config);
			this.enabled = this.config.enabled;
		}
	}
	
	/**
	 * Render page number for a specific page
	 * 
	 * @param {HTMLElement} pageElement - The page DOM element
	 * @param {number} pageIndex - 0-based page index
	 * @param {number} totalPages - Total number of pages
	 * @returns {HTMLElement|null} The created page number element, or null if disabled
	 */
	renderPageNumber(pageElement, pageIndex, totalPages) {
		if (!this.enabled || !pageElement) {
			return null;
		}
		
		// Calculate actual page number (1-based) with start offset
		const pageNumber = this.config.start + pageIndex;
		
		// Format the page number
		const formattedNumber = formatter.formatWithTemplate(
			pageNumber,
			this.config.style,
			totalPages,
			this.config.template
		);
		
		// Create and position the page number element
		const pageNumberElement = this.renderer.createElement(
			formattedNumber,
			this.config
		);
		
		// Position the element on the page
		this.renderer.positionElement(
			pageNumberElement,
			pageElement,
			this.config.position
		);
		
		// Store element for potential updates
		this._pageElements.push({
			element: pageNumberElement,
			pageIndex: pageIndex,
			pageElement: pageElement
		});
		
		return pageNumberElement;
	}
	
	/**
	 * Update page count and refresh all page numbers
	 * 
	 * @param {number} totalPages - New total page count
	 */
	updatePageCount(totalPages) {
		if (!this.enabled || !Number.isInteger(totalPages) || totalPages < 1) {
			return;
		}
		
		this.pageCount = totalPages;
		
		// Update all existing page number elements
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
		
		// Remove elements for pages that no longer exist
		if (this._pageElements.length > totalPages) {
			this._pageElements.slice(totalPages).forEach(item => {
				if (item.element && item.element.parentNode) {
					item.element.parentNode.removeChild(item.element);
				}
			});
			this._pageElements = this._pageElements.slice(0, totalPages);
		}
	}
	
	/**
	 * Clear all page number elements
	 * @private
	 */
	_clearPageElements() {
		this._pageElements.forEach(item => {
			if (item.element && item.element.parentNode) {
				item.element.parentNode.removeChild(item.element);
			}
		});
		this._pageElements = [];
	}
	
	/**
	 * Get current configuration
	 * 
	 * @returns {object} Current configuration
	 */
	getConfig() {
		return { ...this.config };
	}
	
	/**
	 * Check if page numbering is enabled
	 * 
	 * @returns {boolean} True if enabled
	 */
	isEnabled() {
		return this.enabled;
	}
	
	/**
	 * Get total page count
	 * 
	 * @returns {number} Total page count
	 */
	getPageCount() {
		return this.pageCount;
	}
}

// Export all components for individual use
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

// Default export for module registration
export default PageNumberingModule;