/**
 * Page Number Renderer
 * 
 * Handles creation, positioning, and styling of page number DOM elements.
 * 
 * @module modules/page-numbering/renderer
 */

import { getPositionCSS } from './positions.js';

/**
 * PageNumberRenderer class
 * 
 * Creates and manages page number DOM elements with proper positioning and styling.
 */
export default class PageNumberRenderer {
	/**
	 * Create a page number DOM element
	 * 
	 * @param {string} content - The content to display (formatted page number)
	 * @param {object} config - Configuration object
	 * @returns {HTMLElement} The created page number element
	 */
	createElement(content, config) {
		// Create the element
		const element = document.createElement('div');
		
		// Set content
		element.textContent = content;
		
		// Apply base CSS class
		element.className = config.className || 'pagedjs-page-number';
		
		// Apply additional CSS classes based on position
		if (config.position) {
			const positionClass = this._getPositionClass(config.position);
			if (positionClass) {
				element.classList.add(positionClass);
			}
		}
		
		// Apply inline styles from config
		this._applyInlineStyles(element, config.css || {});
		
		// Apply base styles for proper positioning
		this._applyBaseStyles(element);
		
		return element;
	}
	
	/**
	 * Position a page number element on a page
	 * 
	 * @param {HTMLElement} element - The page number element
	 * @param {HTMLElement} pageElement - The page element
	 * @param {string} position - Position string (e.g., 'top-left', 'bottom-center')
	 */
	positionElement(element, pageElement, position) {
		if (!element || !pageElement || !position) {
			return;
		}
		
		// Get CSS properties for the position
		const cssProps = getPositionCSS(position);
		
		// Apply positioning styles
		Object.keys(cssProps).forEach(prop => {
			element.style[prop] = cssProps[prop];
		});
		
		// Add the element to the page
		pageElement.appendChild(element);
	}
	
	/**
	 * Apply CSS styles to an element
	 * 
	 * @param {HTMLElement} element - The element to style
	 * @param {object} config - Configuration object with styling properties
	 */
	applyStyles(element, config) {
		if (!element || !config) {
			return;
		}
		
		// Update CSS class
		if (config.className && config.className !== element.className) {
			// Remove old position classes
			const oldClasses = element.className.split(' ');
			oldClasses.forEach(className => {
				if (className.startsWith('pagedjs-page-number--')) {
					element.classList.remove(className);
				}
			});
			
			// Set new class
			element.className = config.className;
			
			// Add position class if needed
			if (config.position) {
				const positionClass = this._getPositionClass(config.position);
				if (positionClass) {
					element.classList.add(positionClass);
				}
			}
		}
		
		// Apply inline styles
		if (config.css) {
			this._applyInlineStyles(element, config.css);
		}
	}
	
	/**
	 * Update element content
	 * 
	 * @param {HTMLElement} element - The element to update
	 * @param {string} content - New content
	 * @param {object} config - Configuration object (for potential style updates)
	 */
	updateContent(element, content, config) {
		if (!element) {
			return;
		}
		
		// Update text content
		element.textContent = content;
		
		// Optionally update styles if config changed
		if (config) {
			this.applyStyles(element, config);
		}
	}
	
	/**
	 * Get CSS class name for a position
	 * 
	 * @param {string} position - Position string
	 * @returns {string} CSS class name
	 * @private
	 */
	_getPositionClass(position) {
		if (!position) {
			return '';
		}
		
		// Convert position to CSS class format
		// e.g., 'top-left' -> 'pagedjs-page-number--top-left'
		return `pagedjs-page-number--${position.replace(/-/g, '-')}`;
	}
	
	/**
	 * Apply inline CSS styles to an element
	 * 
	 * @param {HTMLElement} element - The element to style
	 * @param {object} styles - CSS styles object
	 * @private
	 */
	_applyInlineStyles(element, styles) {
		if (!element || !styles || typeof styles !== 'object') {
			return;
		}
		
		Object.keys(styles).forEach(property => {
			// Convert camelCase to kebab-case for CSS properties
			const cssProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
			element.style[cssProperty] = styles[property];
		});
	}
	
	/**
	 * Apply base styles for page number elements
	 * 
	 * @param {HTMLElement} element - The element to style
	 * @private
	 */
	_applyBaseStyles(element) {
		// Base styles for proper positioning
		element.style.position = 'absolute';
		element.style.zIndex = '1000'; // Ensure it's above page content
		element.style.pointerEvents = 'none'; // Don't interfere with page interactions
		
		// Default styling
		element.style.fontSize = '12px';
		element.style.color = '#666';
		element.style.fontFamily = 'sans-serif';
		element.style.padding = '4px 8px';
		element.style.margin = '0';
	}
}