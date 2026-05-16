import Handler from "../handler";
import * as csstree from "css-tree";

class StringSets extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.stringSetSelectors = {};
		this.pageCount = 0;
		this.pageStringValues = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "string-set") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			// Parse all string-set definitions (can be multiple: string-set: title content(first), subtitle content(last))
			let currentIdentifier = null;
			let currentValue = null;
			let currentKeyword = null;

			csstree.walk(declaration.value, {
				visit: "Identifier",
				enter: (node) => {
					if (["first", "last", "start", "first-except"].includes(node.name)) {
						currentKeyword = node.name;
					} else if (!currentValue) {
						currentIdentifier = node.name;
					}
				}
			});

			csstree.walk(declaration.value, {
				visit: "Function",
				enter: (node) => {
					if (node.name === "content") {
						currentValue = csstree.generate(node);
						// Extract keyword from content() if present
						if (node.children && node.children.first) {
							let arg = node.children.first;
							if (arg.type === "Identifier" && ["first", "last", "start", "first-except"].includes(arg.name)) {
								currentKeyword = arg.name;
							}
						}
					}
				}
			});

			if (currentIdentifier && currentValue) {
				this.stringSetSelectors[currentIdentifier] = {
					identifier: currentIdentifier,
					value: currentValue,
					keyword: currentKeyword || "first",
					selector: selector,
					// Storage for different keyword values
					first: null,
					last: null,
					start: null,
					firstExcept: null,
					previous: null
				};
			}
		}
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "string") {
			let identifier = funcNode.children && funcNode.children.first.name;
			funcNode.name = "var";
			funcNode.children = new csstree.List();

			funcNode.children.append(funcNode.children.createItem({
				type: "Identifier",
				loc: null,
				name: "--pagedjs-string-" + identifier
			}));
		}
	}

	afterPageLayout(fragment, page, breakToken, chunker) {
		this.pageCount++;
		const isFirstPage = this.pageCount === 1;

		// Collect all matching elements on this page
		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			let selected = fragment.querySelectorAll(set.selector);

			if (selected.length > 0) {
				// Get first and last values on this page
				let firstValue = this.extractTextContent(selected[0]);
				let lastValue = this.extractTextContent(selected[selected.length - 1]);

				// Store first value
				set.first = firstValue;

				// Store last value
				set.last = lastValue;

				// Store start value (first value on first page, otherwise persistent)
				if (isFirstPage) {
					set.start = firstValue;
				} else if (!set.start) {
					set.start = firstValue;
				}

				// Store first-except (first value except on first page)
				if (!isFirstPage && !set.firstExcept) {
					set.firstExcept = firstValue;
				}

				// Update previous value
				set.previous = lastValue;

				// Store page-specific values for debugging
				if (!this.pageStringValues[name]) {
					this.pageStringValues[name] = [];
				}
				this.pageStringValues[name].push({
					page: this.pageCount,
					first: firstValue,
					last: lastValue
				});
			}

			// Determine which value to use based on keyword
			let valueToUse = this.getValueForKeyword(set, isFirstPage);

			if (valueToUse !== null && valueToUse !== undefined) {
				fragment.style.setProperty(`--pagedjs-string-${name}`, `"${valueToUse}"`);
			}
		}
	}

	extractTextContent(element) {
		if (!element) return "";
		return element.textContent.replace(/\\([\s\S])|(["'])/g, "\\$1$2").trim();
	}

	getValueForKeyword(set, isFirstPage) {
		switch (set.keyword) {
			case "first":
				// Use the first value found on the page, or the previous page's last value
				return set.first !== null ? set.first : set.previous;

			case "last":
				// Use the last value found on the page, or the previous page's last value
				return set.last !== null ? set.last : set.previous;

			case "start":
				// Use the first value from the first page, or the first value from current page
				if (isFirstPage) {
					return set.start;
				}
				return set.first !== null ? set.first : set.start;

			case "first-except":
				// Use the first value except on the first page (empty on first page)
				if (isFirstPage) {
					return "";
				}
				return set.firstExcept !== null ? set.firstExcept : "";

			default:
				// Default to first behavior
				return set.first !== null ? set.first : set.previous;
		}
	}

	/**
	 * Get all collected string values for debugging
	 */
	getStringValues(name) {
		if (name) {
			return this.pageStringValues[name] || [];
		}
		return this.pageStringValues;
	}

	/**
	 * Reset string-set state (useful for re-rendering)
	 */
	reset() {
		this.pageCount = 0;
		this.pageStringValues = {};
		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			set.first = null;
			set.last = null;
			set.start = null;
			set.firstExcept = null;
			set.previous = null;
		}
	}
}

export default StringSets;
