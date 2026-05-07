/**
 * Configuration validation and normalization for page numbering module
 * 
 * Validates: Requirements 2.1, 3.1, 4.1, 5.1, 7.2
 */

// Valid position values
export const VALID_POSITIONS = [
	"top-left", "top-center", "top-right",
	"bottom-left", "bottom-center", "bottom-right"
];

// Valid numbering styles
export const VALID_STYLES = [
	"decimal", "upper-roman", "lower-roman",
	"upper-alpha", "lower-alpha"
];

// Default configuration values
export const DEFAULT_CONFIG = {
	enabled: false,
	position: "bottom-center",
	style: "decimal",
	start: 1,
	template: "{current}",
	className: "pagedjs-page-number",
	css: {}
};

/**
 * Validate position value
 * @param {string} position - Position to validate
 * @returns {boolean} True if position is valid
 */
export function validatePosition(position) {
	return VALID_POSITIONS.includes(position);
}

/**
 * Validate numbering style
 * @param {string} style - Style to validate
 * @returns {boolean} True if style is valid
 */
export function validateStyle(style) {
	return VALID_STYLES.includes(style);
}

/**
 * Validate start page number
 * @param {number} start - Start page number to validate
 * @returns {boolean} True if start is valid
 */
export function validateStart(start) {
	return Number.isInteger(start) && start > 0;
}

/**
 * Validate content template
 * @param {string} template - Template to validate
 * @returns {boolean} True if template is valid
 */
export function validateTemplate(template) {
	if (typeof template !== "string") {
		return false;
	}
  
	// Template should be a string that may contain {current} and {total} placeholders
	// We'll allow any string for flexibility, but check for basic string validity
	return template.length >= 0; // Empty string is valid
}

/**
 * Validate CSS object
 * @param {object} css - CSS object to validate
 * @returns {boolean} True if CSS object is valid
 */
export function validateCss(css) {
	if (css === null || css === undefined) {
		return true; // null/undefined is valid (will be normalized to empty object)
	}
  
	if (typeof css !== "object" || Array.isArray(css)) {
		return false;
	}
  
	// Check that all values are strings (CSS property values)
	for (const key in css) {
		if (Object.prototype.hasOwnProperty.call(css, key)) {
			if (typeof css[key] !== "string") {
				return false;
			}
		}
	}
  
	return true;
}

/**
 * Validate className
 * @param {string} className - CSS class name to validate
 * @returns {boolean} True if className is valid
 */
export function validateClassName(className) {
	return typeof className === "string" && className.length > 0;
}

/**
 * Validate enabled flag
 * @param {boolean} enabled - Enabled flag to validate
 * @returns {boolean} True if enabled is valid
 */
export function validateEnabled(enabled) {
	return typeof enabled === "boolean";
}

/**
 * Validate complete configuration object
 * @param {object} config - Configuration object to validate
 * @returns {object} Validation result with isValid flag and errors array
 */
export function validateConfig(config) {
	const errors = [];
  
	if (!config || typeof config !== "object") {
		return {
			isValid: false,
			errors: ["Configuration must be an object"]
		};
	}
  
	// Validate enabled
	if (config.enabled !== undefined && !validateEnabled(config.enabled)) {
		errors.push("enabled must be a boolean");
	}
  
	// Validate position
	if (config.position !== undefined && !validatePosition(config.position)) {
		errors.push(`position must be one of: ${VALID_POSITIONS.join(", ")}`);
	}
  
	// Validate style
	if (config.style !== undefined && !validateStyle(config.style)) {
		errors.push(`style must be one of: ${VALID_STYLES.join(", ")}`);
	}
  
	// Validate start
	if (config.start !== undefined && !validateStart(config.start)) {
		errors.push("start must be a positive integer");
	}
  
	// Validate template
	if (config.template !== undefined && !validateTemplate(config.template)) {
		errors.push("template must be a string");
	}
  
	// Validate className
	if (config.className !== undefined && !validateClassName(config.className)) {
		errors.push("className must be a non-empty string");
	}
  
	// Validate css
	if (config.css !== undefined && !validateCss(config.css)) {
		errors.push("css must be an object with string values");
	}
  
	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Normalize configuration object by applying defaults for missing values
 * and validating/repairing invalid values
 * @param {object} config - Configuration object to normalize
 * @returns {object} Normalized configuration object
 */
export function normalizeConfig(config = {}) {
	const normalized = { ...DEFAULT_CONFIG };
  
	if (!config || typeof config !== "object") {
		return normalized;
	}
  
	// Apply enabled if valid, otherwise use default
	if (validateEnabled(config.enabled)) {
		normalized.enabled = config.enabled;
	}
  
	// Apply position if valid, otherwise use default
	if (validatePosition(config.position)) {
		normalized.position = config.position;
	}
  
	// Apply style if valid, otherwise use default
	if (validateStyle(config.style)) {
		normalized.style = config.style;
	}
  
	// Apply start if valid, otherwise use default
	if (validateStart(config.start)) {
		normalized.start = config.start;
	}
  
	// Apply template if valid, otherwise use default
	if (validateTemplate(config.template)) {
		normalized.template = config.template;
	}
  
	// Apply className if valid, otherwise use default
	if (validateClassName(config.className)) {
		normalized.className = config.className;
	}
  
	// Apply css if valid, otherwise use default
	if (validateCss(config.css)) {
		// Merge CSS objects, config.css overrides default
		normalized.css = { ...normalized.css, ...config.css };
	}
  
	return normalized;
}

/**
 * Check if configuration is valid without throwing errors
 * @param {object} config - Configuration to check
 * @returns {boolean} True if configuration is valid
 */
export function isValidConfig(config) {
	const result = validateConfig(config);
	return result.isValid;
}

/**
 * Parse configuration from various sources (API, CSS, defaults)
 * and merge them according to priority
 * @param {object} apiConfig - Configuration from JavaScript API (highest priority)
 * @param {object} cssConfig - Configuration from CSS @page rules (medium priority)
 * @param {object} defaultConfig - Default configuration (lowest priority)
 * @returns {object} Merged and normalized configuration
 */
export function mergeConfigs(apiConfig = {}, cssConfig = {}, defaultConfig = DEFAULT_CONFIG) {
	// Start with defaults
	const merged = { ...defaultConfig };
  
	// Apply CSS configuration (medium priority)
	if (cssConfig && typeof cssConfig === "object") {
		Object.keys(cssConfig).forEach(key => {
			if (cssConfig[key] !== undefined) {
				merged[key] = cssConfig[key];
			}
		});
	}
  
	// Apply API configuration (highest priority)
	if (apiConfig && typeof apiConfig === "object") {
		Object.keys(apiConfig).forEach(key => {
			if (apiConfig[key] !== undefined) {
				merged[key] = apiConfig[key];
			}
		});
	}
  
	// Normalize the merged configuration
	return normalizeConfig(merged);
}

// Export everything as default for convenience
export default {
	validatePosition,
	validateStyle,
	validateStart,
	validateTemplate,
	validateCss,
	validateClassName,
	validateEnabled,
	validateConfig,
	normalizeConfig,
	isValidConfig,
	mergeConfigs,
	VALID_POSITIONS,
	VALID_STYLES,
	DEFAULT_CONFIG
};