export const VALID_POSITIONS: string[] = [
	"top-left", "top-center", "top-right",
	"bottom-left", "bottom-center", "bottom-right"
];

export const VALID_STYLES: string[] = [
	"decimal", "upper-roman", "lower-roman",
	"upper-alpha", "lower-alpha"
];

export interface PageNumberingConfig {
	enabled: boolean;
	position: string;
	style: string;
	start: number;
	template: string;
	className: string;
	css: Record<string, string>;
}

export const DEFAULT_CONFIG: PageNumberingConfig = {
	enabled: false,
	position: "bottom-center",
	style: "decimal",
	start: 1,
	template: "{current}",
	className: "pagedjs-page-number",
	css: {}
};

export function validatePosition(position: string): boolean {
	return VALID_POSITIONS.includes(position);
}

export function validateStyle(style: string): boolean {
	return VALID_STYLES.includes(style);
}

export function validateStart(start: number): boolean {
	return Number.isInteger(start) && start > 0;
}

export function validateTemplate(template: string): boolean {
	if (typeof template !== "string") {
		return false;
	}
	return template.length >= 0;
}

export function validateCss(css: any): boolean {
	if (css === null || css === undefined) {
		return true;
	}

	if (typeof css !== "object" || Array.isArray(css)) {
		return false;
	}

	for (const key in css) {
		if (Object.prototype.hasOwnProperty.call(css, key)) {
			if (typeof css[key] !== "string") {
				return false;
			}
		}
	}

	return true;
}

export function validateClassName(className: string): boolean {
	return typeof className === "string" && className.length > 0;
}

export function validateEnabled(enabled: boolean): boolean {
	return typeof enabled === "boolean";
}

export function validateConfig(config: any): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!config || typeof config !== "object") {
		return {
			isValid: false,
			errors: ["Configuration must be an object"]
		};
	}

	if (config.enabled !== undefined && !validateEnabled(config.enabled)) {
		errors.push("enabled must be a boolean");
	}

	if (config.position !== undefined && !validatePosition(config.position)) {
		errors.push(`position must be one of: ${VALID_POSITIONS.join(", ")}`);
	}

	if (config.style !== undefined && !validateStyle(config.style)) {
		errors.push(`style must be one of: ${VALID_STYLES.join(", ")}`);
	}

	if (config.start !== undefined && !validateStart(config.start)) {
		errors.push("start must be a positive integer");
	}

	if (config.template !== undefined && !validateTemplate(config.template)) {
		errors.push("template must be a string");
	}

	if (config.className !== undefined && !validateClassName(config.className)) {
		errors.push("className must be a non-empty string");
	}

	if (config.css !== undefined && !validateCss(config.css)) {
		errors.push("css must be an object with string values");
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

export function normalizeConfig(config: any = {}): PageNumberingConfig {
	const normalized: PageNumberingConfig = { ...DEFAULT_CONFIG };

	if (!config || typeof config !== "object") {
		return normalized;
	}

	if (validateEnabled(config.enabled)) {
		normalized.enabled = config.enabled;
	}

	if (validatePosition(config.position)) {
		normalized.position = config.position;
	}

	if (validateStyle(config.style)) {
		normalized.style = config.style;
	}

	if (validateStart(config.start)) {
		normalized.start = config.start;
	}

	if (validateTemplate(config.template)) {
		normalized.template = config.template;
	}

	if (validateClassName(config.className)) {
		normalized.className = config.className;
	}

	if (validateCss(config.css)) {
		normalized.css = { ...normalized.css, ...config.css };
	}

	return normalized;
}

export function isValidConfig(config: any): boolean {
	const result = validateConfig(config);
	return result.isValid;
}

export function mergeConfigs(apiConfig: any = {}, cssConfig: any = {}, defaultConfig: PageNumberingConfig = DEFAULT_CONFIG): PageNumberingConfig {
	const merged: any = { ...defaultConfig };

	if (cssConfig && typeof cssConfig === "object") {
		Object.keys(cssConfig).forEach(key => {
			if (cssConfig[key] !== undefined) {
				merged[key] = cssConfig[key];
			}
		});
	}

	if (apiConfig && typeof apiConfig === "object") {
		Object.keys(apiConfig).forEach(key => {
			if (apiConfig[key] !== undefined) {
				merged[key] = apiConfig[key];
			}
		});
	}

	return normalizeConfig(merged);
}

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
