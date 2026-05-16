import * as csstree from "css-tree";

interface PageRule {
	selector: string;
	properties: Record<string, string>;
}

export function parsePageRules(cssSource: any): PageRule[] {
	if (!cssSource) {
		return [];
	}

	try {
		if (csstree) {
			return parseWithCSSTree(cssSource);
		}

		if (typeof cssSource === "string") {
			return parseSimplePageRules(cssSource);
		}

		if (cssSource.cssRules || cssSource.rules) {
			return extractRulesFromStylesheet(cssSource);
		}

		return [];
	} catch (error) {
		console.warn("Failed to parse CSS @page rules:", error);
		return [];
	}
}

export function extractPageNumberingConfig(pageRules: PageRule[]): Record<string, any> | null {
	if (!pageRules || !Array.isArray(pageRules) || pageRules.length === 0) {
		return null;
	}

	const config: Record<string, any> = {};

	pageRules.forEach(rule => {
		if (!rule.properties) {
			return;
		}

		const props = rule.properties;

		if (props["pagedjs-page-numbering"]) {
			const value = props["pagedjs-page-numbering"].toLowerCase();
			config.enabled = value === "enabled";
		}

		if (props["pagedjs-page-numbering-position"]) {
			config.position = props["pagedjs-page-numbering-position"].toLowerCase();
		}

		if (props["pagedjs-page-numbering-style"]) {
			config.style = props["pagedjs-page-numbering-style"].toLowerCase();
		}

		if (props["pagedjs-page-numbering-start"]) {
			const startValue = parseInt(props["pagedjs-page-numbering-start"], 10);
			if (!isNaN(startValue) && startValue > 0) {
				config.start = startValue;
			}
		}

		if (props["pagedjs-page-numbering-class"]) {
			config.className = props["pagedjs-page-numbering-class"];
		}

		Object.keys(props).forEach(propName => {
			if (propName.startsWith("pagedjs-page-numbering-") &&
				!propName.endsWith("-position") &&
				!propName.endsWith("-style") &&
				!propName.endsWith("-start") &&
				!propName.endsWith("-class") &&
				propName !== "pagedjs-page-numbering") {

				const cssPropName = propName.replace("pagedjs-page-numbering-", "");
				const camelCaseName = cssPropName.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());

				if (!config.css) {
					config.css = {};
				}

				config.css[camelCaseName] = props[propName];
			}
		});
	});

	return Object.keys(config).length > 0 ? config : null;
}

function parseWithCSSTree(cssString: string): PageRule[] {
	try {
		const ast = csstree.parse(cssString);
		const pageRules: PageRule[] = [];

		csstree.walk(ast, {
			visit: "Atrule" as any,
			enter: (node: any) => {
				if (node.name === "page") {
					let selector = "";
					if (node.prelude) {
						selector = csstree.generate(node.prelude);
					}

					const rule: PageRule = {
						selector: selector,
						properties: {}
					};

					if (node.block && node.block.children) {
						node.block.children.forEach((child: any) => {
							if (child.type === "Declaration") {
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
		console.warn("Failed to parse CSS with css-tree:", error);
		return [];
	}
}

function parseSimplePageRules(cssString: string): PageRule[] {
	const pageRules: PageRule[] = [];
	const pageRuleRegex = /@page\s*([^{]*)\s*{([^}]+)}/g;

	let match: RegExpExecArray | null;
	while ((match = pageRuleRegex.exec(cssString)) !== null) {
		const selector = match[1].trim() || "";
		const content = match[2];

		const rule: PageRule = {
			selector: selector,
			properties: {}
		};

		const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);?/g;
		let propMatch: RegExpExecArray | null;

		while ((propMatch = propertyRegex.exec(content)) !== null) {
			const propName = propMatch[1].trim();
			const propValue = propMatch[2].trim();
			rule.properties[propName] = propValue;
		}

		pageRules.push(rule);
	}

	return pageRules;
}

function extractRulesFromStylesheet(stylesheet: CSSStyleSheet): PageRule[] {
	const pageRules: PageRule[] = [];
	const rules = stylesheet.cssRules || (stylesheet as any).rules;

	if (!rules) {
		return pageRules;
	}

	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];

		if (rule.type === CSSRule.PAGE_RULE || rule.constructor.name === "CSSPageRule") {
			const pageRule: PageRule = {
				selector: (rule as any).selectorText || "",
				properties: {}
			};

			const style = (rule as any).style;
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

export function configToCSSRule(config: any, selector: string = ""): string {
	if (!config || typeof config !== "object") {
		return "";
	}

	const properties: string[] = [];

	if (config.enabled !== undefined) {
		properties.push(`pagedjs-page-numbering: ${config.enabled ? "enabled" : "disabled"};`);
	}

	if (config.position) {
		properties.push(`pagedjs-page-numbering-position: ${config.position};`);
	}

	if (config.style) {
		properties.push(`pagedjs-page-numbering-style: ${config.style};`);
	}

	if (config.start !== undefined && config.start !== 1) {
		properties.push(`pagedjs-page-numbering-start: ${config.start};`);
	}

	if (config.className && config.className !== "pagedjs-page-number") {
		properties.push(`pagedjs-page-numbering-class: ${config.className};`);
	}

	if (config.css && typeof config.css === "object") {
		Object.keys(config.css).forEach(key => {
			const cssProperty = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
			properties.push(`pagedjs-page-numbering-${cssProperty}: ${config.css[key]};`);
		});
	}

	if (properties.length === 0) {
		return "";
	}

	const selectorPart = selector ? ` ${selector}` : "";
	return `@page${selectorPart} {\n  ${properties.join("\n  ")}\n}`;
}

export function hasPageNumberingCSS(cssString: string): boolean {
	if (!cssString || typeof cssString !== "string") {
		return false;
	}

	const pageNumberingProps = [
		"pagedjs-page-numbering",
		"pagedjs-page-numbering-position",
		"pagedjs-page-numbering-style",
		"pagedjs-page-numbering-start",
		"pagedjs-page-numbering-class"
	];

	return pageNumberingProps.some(prop => cssString.includes(prop));
}
