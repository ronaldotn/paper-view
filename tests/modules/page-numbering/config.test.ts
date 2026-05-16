/**
 * Unit tests for page numbering configuration validation and normalization
 * 
 * Validates: Requirements 2.1, 3.1, 4.1, 5.1, 7.2
 */

import {
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
} from "../../../src/modules/page-numbering/config.ts";

describe("Page Numbering Configuration", () => {
	describe("Constants", () => {
		test("VALID_POSITIONS contains all required positions", () => {
			expect(VALID_POSITIONS).toEqual([
				"top-left", "top-center", "top-right",
				"bottom-left", "bottom-center", "bottom-right"
			]);
		});

		test("VALID_STYLES contains all required styles", () => {
			expect(VALID_STYLES).toEqual([
				"decimal", "upper-roman", "lower-roman",
				"upper-alpha", "lower-alpha"
			]);
		});

		test("DEFAULT_CONFIG has correct default values", () => {
			expect(DEFAULT_CONFIG).toEqual({
				enabled: false,
				position: "bottom-center",
				style: "decimal",
				start: 1,
				template: "{current}",
				className: "pagedjs-page-number",
				css: {}
			});
		});
	});

	describe("validatePosition", () => {
		test("returns true for valid positions", () => {
			VALID_POSITIONS.forEach((position: string) => {
				expect(validatePosition(position)).toBe(true);
			});
		});

		test("returns false for invalid positions", () => {
			expect(validatePosition("invalid")).toBe(false);
			expect(validatePosition("top")).toBe(false);
			expect(validatePosition("center")).toBe(false);
			expect(validatePosition("")).toBe(false);
			expect(validatePosition(null)).toBe(false);
			expect(validatePosition(undefined)).toBe(false);
			expect(validatePosition(123 as any)).toBe(false);
		});
	});

	describe("validateStyle", () => {
		test("returns true for valid styles", () => {
			VALID_STYLES.forEach((style: string) => {
				expect(validateStyle(style)).toBe(true);
			});
		});

		test("returns false for invalid styles", () => {
			expect(validateStyle("invalid")).toBe(false);
			expect(validateStyle("roman")).toBe(false);
			expect(validateStyle("alpha")).toBe(false);
			expect(validateStyle("")).toBe(false);
			expect(validateStyle(null)).toBe(false);
			expect(validateStyle(undefined)).toBe(false);
			expect(validateStyle(123 as any)).toBe(false);
		});
	});

	describe("validateStart", () => {
		test("returns true for positive integers", () => {
			expect(validateStart(1)).toBe(true);
			expect(validateStart(5)).toBe(true);
			expect(validateStart(100)).toBe(true);
		});

		test("returns false for non-positive or non-integer values", () => {
			expect(validateStart(0)).toBe(false);
			expect(validateStart(-1)).toBe(false);
			expect(validateStart(1.5)).toBe(false);
			expect(validateStart("1" as any)).toBe(false);
			expect(validateStart(null)).toBe(false);
			expect(validateStart(undefined)).toBe(false);
			expect(validateStart(true as any)).toBe(false);
		});
	});

	describe("validateTemplate", () => {
		test("returns true for valid templates", () => {
			expect(validateTemplate("{current}")).toBe(true);
			expect(validateTemplate("Page {current} of {total}")).toBe(true);
			expect(validateTemplate("")).toBe(true);
			expect(validateTemplate("Just text")).toBe(true);
		});

		test("returns false for non-string values", () => {
			expect(validateTemplate(null)).toBe(false);
			expect(validateTemplate(undefined)).toBe(false);
			expect(validateTemplate(123 as any)).toBe(false);
			expect(validateTemplate({} as any)).toBe(false);
			expect(validateTemplate([] as any)).toBe(false);
			expect(validateTemplate(true as any)).toBe(false);
		});
	});

	describe("validateCss", () => {
		test("returns true for valid CSS objects", () => {
			expect(validateCss({})).toBe(true);
			expect(validateCss({ fontSize: "12px", color: "#000" })).toBe(true);
			expect(validateCss(null)).toBe(true);
			expect(validateCss(undefined)).toBe(true);
		});

		test("returns false for invalid CSS objects", () => {
			expect(validateCss("font-size: 12px" as any)).toBe(false);
			expect(validateCss(123 as any)).toBe(false);
			expect(validateCss(true as any)).toBe(false);
			expect(validateCss([] as any)).toBe(false);
			expect(validateCss({ fontSize: 12 } as any)).toBe(false); // number instead of string
			expect(validateCss({ color: null } as any)).toBe(false); // null instead of string
		});
	});

	describe("validateClassName", () => {
		test("returns true for valid class names", () => {
			expect(validateClassName("pagedjs-page-number")).toBe(true);
			expect(validateClassName("my-class")).toBe(true);
			expect(validateClassName("a")).toBe(true);
		});

		test("returns false for invalid class names", () => {
			expect(validateClassName("")).toBe(false);
			expect(validateClassName(null)).toBe(false);
			expect(validateClassName(undefined)).toBe(false);
			expect(validateClassName(123 as any)).toBe(false);
			expect(validateClassName({} as any)).toBe(false);
		});
	});

	describe("validateEnabled", () => {
		test("returns true for boolean values", () => {
			expect(validateEnabled(true)).toBe(true);
			expect(validateEnabled(false)).toBe(true);
		});

		test("returns false for non-boolean values", () => {
			expect(validateEnabled("true" as any)).toBe(false);
			expect(validateEnabled("false" as any)).toBe(false);
			expect(validateEnabled(1 as any)).toBe(false);
			expect(validateEnabled(0 as any)).toBe(false);
			expect(validateEnabled(null)).toBe(false);
			expect(validateEnabled(undefined)).toBe(false);
			expect(validateEnabled({} as any)).toBe(false);
		});
	});

	describe("validateConfig", () => {
		test("returns valid for empty config object", () => {
			const result = validateConfig({});
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		test("returns valid for complete valid config", () => {
			const config = {
				enabled: true,
				position: "top-right",
				style: "upper-roman",
				start: 5,
				template: "Page {current}",
				className: "custom-page-number",
				css: { fontSize: "14px", color: "#333" }
			};
			const result = validateConfig(config);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		test("returns invalid for non-object config", () => {
			const result = validateConfig("not an object" as any);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Configuration must be an object");
		});

		test("returns invalid for config with invalid position", () => {
			const result = validateConfig({ position: "invalid" });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(`position must be one of: ${VALID_POSITIONS.join(", ")}`);
		});

		test("returns invalid for config with invalid style", () => {
			const result = validateConfig({ style: "invalid" });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(`style must be one of: ${VALID_STYLES.join(", ")}`);
		});

		test("returns invalid for config with invalid start", () => {
			const result = validateConfig({ start: -1 });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("start must be a positive integer");
		});

		test("returns invalid for config with invalid template", () => {
			const result = validateConfig({ template: 123 as any });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("template must be a string");
		});

		test("returns invalid for config with invalid className", () => {
			const result = validateConfig({ className: "" });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("className must be a non-empty string");
		});

		test("returns invalid for config with invalid css", () => {
			const result = validateConfig({ css: "invalid" as any });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("css must be an object with string values");
		});

		test("returns invalid for config with invalid enabled", () => {
			const result = validateConfig({ enabled: "yes" as any });
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("enabled must be a boolean");
		});

		test("returns multiple errors for config with multiple invalid fields", () => {
			const result = validateConfig({
				position: "invalid",
				start: -1,
				css: "invalid"
			} as any);
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(3);
		});
	});

	describe("normalizeConfig", () => {
		test("returns default config for empty input", () => {
			const result = normalizeConfig();
			expect(result).toEqual(DEFAULT_CONFIG);
		});

		test("returns default config for non-object input", () => {
			expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
			expect(normalizeConfig(undefined)).toEqual(DEFAULT_CONFIG);
			expect(normalizeConfig("invalid" as any)).toEqual(DEFAULT_CONFIG);
			expect(normalizeConfig(123 as any)).toEqual(DEFAULT_CONFIG);
		});

		test("applies valid values from config", () => {
			const config = {
				enabled: true,
				position: "top-left",
				style: "lower-alpha",
				start: 3,
				template: "Page {current} of {total}",
				className: "custom-class",
				css: { fontSize: "12px" }
			};
			const result = normalizeConfig(config);
			expect(result).toEqual(config);
		});

		test("ignores invalid values and uses defaults", () => {
			const config = {
				enabled: "yes", // invalid
				position: "invalid", // invalid
				style: "invalid", // invalid
				start: -1, // invalid
				template: 123, // invalid
				className: "", // invalid
				css: "invalid" // invalid
			} as any;
			const result = normalizeConfig(config);
			expect(result).toEqual(DEFAULT_CONFIG);
		});

		test("merges CSS objects", () => {
			const config = {
				css: { fontSize: "14px", color: "#000" }
			};
			const result = normalizeConfig(config);
			expect(result.css).toEqual({ fontSize: "14px", color: "#000" });
		});

		test("handles partial configuration", () => {
			const config = {
				enabled: true,
				position: "bottom-right"
			};
			const result = normalizeConfig(config);
			expect(result.enabled).toBe(true);
			expect(result.position).toBe("bottom-right");
			expect(result.style).toBe(DEFAULT_CONFIG.style);
			expect(result.start).toBe(DEFAULT_CONFIG.start);
			expect(result.template).toBe(DEFAULT_CONFIG.template);
			expect(result.className).toBe(DEFAULT_CONFIG.className);
			expect(result.css).toEqual(DEFAULT_CONFIG.css);
		});
	});

	describe("isValidConfig", () => {
		test("returns true for valid config", () => {
			expect(isValidConfig({})).toBe(true);
			expect(isValidConfig({ enabled: true })).toBe(true);
			expect(isValidConfig({ position: "top-center", style: "decimal" })).toBe(true);
		});

		test("returns false for invalid config", () => {
			expect(isValidConfig("not an object" as any)).toBe(false);
			expect(isValidConfig({ position: "invalid" })).toBe(false);
			expect(isValidConfig({ start: -1 })).toBe(false);
		});
	});

	describe("mergeConfigs", () => {
		test("returns default config when no inputs provided", () => {
			const result = mergeConfigs();
			expect(result).toEqual(DEFAULT_CONFIG);
		});

		test("applies CSS config over defaults", () => {
			const cssConfig = {
				position: "top-center",
				style: "upper-roman"
			};
			const result = mergeConfigs({}, cssConfig);
			expect(result.position).toBe("top-center");
			expect(result.style).toBe("upper-roman");
			expect(result.enabled).toBe(DEFAULT_CONFIG.enabled);
		});

		test("applies API config over CSS config and defaults", () => {
			const cssConfig = {
				position: "top-center",
				style: "upper-roman"
			};
			const apiConfig = {
				position: "bottom-left",
				enabled: true
			};
			const result = mergeConfigs(apiConfig, cssConfig);
			expect(result.position).toBe("bottom-left"); // API overrides CSS
			expect(result.style).toBe("upper-roman"); // From CSS
			expect(result.enabled).toBe(true); // From API
		});

		test("handles custom default config", () => {
			const customDefaults = {
				enabled: true,
				position: "top-right",
				template: "Page {current}"
			};
			const result = mergeConfigs({}, {}, customDefaults);
			expect(result.enabled).toBe(true);
			expect(result.position).toBe("top-right");
			expect(result.template).toBe("Page {current}");
			expect(result.style).toBe(DEFAULT_CONFIG.style); // Falls back to module default
		});

		test("normalizes merged config", () => {
			const cssConfig = {
				position: "invalid", // Will be normalized to default
				style: "upper-alpha"
			};
			const apiConfig = {
				start: -1 // Will be normalized to default
			} as any;
			const result = mergeConfigs(apiConfig, cssConfig);
			expect(result.position).toBe(DEFAULT_CONFIG.position); // Invalid CSS value normalized
			expect(result.style).toBe("upper-alpha"); // Valid CSS value kept
			expect(result.start).toBe(DEFAULT_CONFIG.start); // Invalid API value normalized
		});
	});
});
