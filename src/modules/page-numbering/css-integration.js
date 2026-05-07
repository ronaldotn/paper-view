/**
 * CSS @page Rule Integration
 * 
 * Parses CSS @page rules to extract page numbering configuration.
 * 
 * @module modules/page-numbering/css-integration
 */

import * as csstree from "css-tree";

/**
 * Parse CSS @page rules from a stylesheet or CSS string
 * 
 * @param {string|CSSStyleSheet} cssSource - CSS string or stylesheet object
 * @returns {Array} Array of parsed @page rules
 */
export function parsePageRules(cssSource) {
	if (!cssSource) {
		return [];
	}
	
	try {
		// Use csstree if available
		if (csstree) {
			return parseWithCSSTree(cssSource);
		}
		
		// Fallback: parse simple @page rules from string
		if (typeof cssSource === 'string') {
			return parseSimplePageRules(cssSource);
		}
		
		// If it's already a stylesheet, extract rules
		if (cssSource.cssRules || cssSource.rules) {
			return extractRulesFromStylesheet(cssSource);
		}
		
		return [];
	} catch (error) {
		console.warn('Failed to parse CSS @page rules:', error);
		return [];
	}
}

/**
 * Extract page numbering configuration from parsed @page rules
 * 
 * @param {Array} pageRules - Array of parsed @page rules
 * @returns {object|null} Page numbering configuration object, or null if none found
 */
export function extractPageNumberingConfig(pageRules) {
	if (!pageRules || !Array.isArray(pageRules) || pageRules.length === 0) {
		return null;
	}
	
	const config = {};
	
	pageRules.forEach(rule => {
		if (!rule.properties) {
			return;
		}
		
		// Check for page numbering properties
		const props = rule.properties;
		
		// pagedjs-page-numbering: enabled | disabled
		if (props['pagedjs-page-numbering']) {
			const value = props['pagedjs-page-numbering'].toLowerCase();
			config.enabled = value === 'enabled';
		}
		
		// pagedjs-page-numbering-position
		if (props['pagedjs-page-numbering-position']) {
			config.position = props['pagedjs-page-numbering-position'].toLowerCase();
		}
		
		// pagedjs-page-numbering-style
		if (props['pagedjs-page-numbering-style']) {
			config.style = props['pagedjs-page-numbering-style'].toLowerCase();
		}
		
		// pagedjs-page-numbering-start
		if (props['pagedjs-page-numbering-start']) {
			const startValue = parseInt(props['pagedjs-page-numbering-start'], 10);
			if (!isNaN(startValue) && startValue > 0) {
				config.start = startValue;
			}
		}
		
		// pagedjs-page-numbering-class
		if (props['pagedjs-page-numbering-class']) {
			config.className = props['pagedjs-page-numbering-class'];
		}
		
		// Extract custom CSS properties for page numbers
		// Look for properties that start with pagedjs-page-numbering-
		Object.keys(props).forEach(propName => {
			if (propName.startsWith('pagedjs-page-numbering-') && 
				!propName.endsWith('-position') &&
				!propName.endsWith('-style') &&
				!propName.endsWith('-start') &&
				!propName.endsWith('-class') &&
				propName !== 'pagedjs-page-numbering') {
				
				// Convert CSS property name to camelCase for config
				const cssPropName = propName.replace('pagedjs-page-numbering-', '');
				const camelCaseName = cssPropName.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
				
				// Initialize css object if needed
				if (!config.css) {
					config.css = {};
				}
				
				config.css[camelCaseName] = props[propName];
			}
		});
	});
	
	// Return null if no page numbering properties were found
	return Object.keys(config).length > 0 ? config : null;
}

/**
 * Parse CSS using css-tree library
 * 
 * @param {string} cssString - CSS string to parse
 * @returns {Array} Array of parsed @page rules
 * @private
 */
function parseWithCSSTree(cssString) {
	try {
		const ast = csstree.parse(cssString);
		const pageRules = [];
		
		csstree.walk(ast, {
			visit: 'Atrule',
			enter: (node) => {
				if (node.name === 'page') {
					// Get selector from node.prelude
					let selector = '';
					if (node.prelude) {
						selector = csstree.generate(node.prelude);
					}
					
					const rule = {
						selector: selector,
						properties: {}
					};
					
					// Extract properties from the rule
					if (node.block && node.block.children) {
						node.block.children.forEach(child => {
							if (child.type === 'Declaration') {
								const propertyName = child.property;
								const propertyValue = csstree.generate(child.value);
								rule.properties[propertyName] = propertyValue;
							}
						});
					}
					
					pageRules.push(rule);
				}
			}
		});
		
		return pageRules;
	} catch (error) {
		console.warn('Failed to parse CSS with css-tree:', error);
		return [];
	}
}

/**
 * Parse simple @page rules from CSS string (fallback)
 * 
 * @param {string} cssString - CSS string to parse
 * @returns {Array} Array of parsed @page rules
 * @private
 */
function parseSimplePageRules(cssString) {
	const pageRules = [];
	const pageRuleRegex = /@page\s*([^{]*)\s*{([^}]+)}/g;
	
	let match;
	while ((match = pageRuleRegex.exec(cssString)) !== null) {
		const selector = match[1].trim() || '';
		const content = match[2];
		
		const rule = {
			selector: selector,
			properties: {}
		};
		
		// Parse properties (simple key-value pairs)
		const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);?/g;
		let propMatch;
		
		while ((propMatch = propertyRegex.exec(content)) !== null) {
			const propName = propMatch[1].trim();
			const propValue = propMatch[2].trim();
			rule.properties[propName] = propValue;
		}
		
		pageRules.push(rule);
	}
	
	return pageRules;
}

/**
 * Extract @page rules from a stylesheet object
 * 
 * @param {CSSStyleSheet} stylesheet - Stylesheet object
 * @returns {Array} Array of parsed @page rules
 * @private
 */
function extractRulesFromStylesheet(stylesheet) {
	const pageRules = [];
	const rules = stylesheet.cssRules || stylesheet.rules;
	
	if (!rules) {
		return pageRules;
	}
	
	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];
		
		if (rule.type === CSSRule.PAGE_RULE || rule.constructor.name === 'CSSPageRule') {
			const pageRule = {
				selector: rule.selectorText || '',
				properties: {}
			};
			
			// Extract style properties
			const style = rule.style;
			if (style) {
				for (let j = 0; j < style.length; j++) {
					const propName = style[j];
					const propValue = style.getPropertyValue(propName);
					pageRule.properties[propName] = propValue;
				}
			}
			
			pageRules.push(pageRule);
		}
	}
	
	return pageRules;
}

/**
 * Convert configuration object to CSS @page rule string
 * 
 * @param {object} config - Page numbering configuration
 * @param {string} selector - @page selector (e.g., '', ':first', ':left')
 * @returns {string} CSS @page rule string
 */
export function configToCSSRule(config, selector = '') {
	if (!config || typeof config !== 'object') {
		return '';
	}
	
	const properties = [];
	
	// Add enabled/disabled property
	if (config.enabled !== undefined) {
		properties.push(`pagedjs-page-numbering: ${config.enabled ? 'enabled' : 'disabled'};`);
	}
	
	// Add position property
	if (config.position) {
		properties.push(`pagedjs-page-numbering-position: ${config.position};`);
	}
	
	// Add style property
	if (config.style) {
		properties.push(`pagedjs-page-numbering-style: ${config.style};`);
	}
	
	// Add start property
	if (config.start !== undefined && config.start !== 1) {
		properties.push(`pagedjs-page-numbering-start: ${config.start};`);
	}
	
	// Add class name property
	if (config.className && config.className !== 'pagedjs-page-number') {
		properties.push(`pagedjs-page-numbering-class: ${config.className};`);
	}
	
	// Add custom CSS properties
	if (config.css && typeof config.css === 'object') {
		Object.keys(config.css).forEach(key => {
			// Convert camelCase back to kebab-case
			const cssProperty = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
			properties.push(`pagedjs-page-numbering-${cssProperty}: ${config.css[key]};`);
		});
	}
	
	if (properties.length === 0) {
		return '';
	}
	
	const selectorPart = selector ? ` ${selector}` : '';
	return `@page${selectorPart} {\n  ${properties.join('\n  ')}\n}`;
}

/**
 * Check if CSS contains page numbering configuration
 * 
 * @param {string} cssString - CSS string to check
 * @returns {boolean} True if CSS contains page numbering properties
 */
export function hasPageNumberingCSS(cssString) {
	if (!cssString || typeof cssString !== 'string') {
		return false;
	}
	
	// Check for page numbering properties
	const pageNumberingProps = [
		'pagedjs-page-numbering',
		'pagedjs-page-numbering-position',
		'pagedjs-page-numbering-style',
		'pagedjs-page-numbering-start',
		'pagedjs-page-numbering-class'
	];
	
	return pageNumberingProps.some(prop => cssString.includes(prop));
}