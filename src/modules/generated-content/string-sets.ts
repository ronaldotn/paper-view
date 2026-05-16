import Handler from "../handler";
import * as csstree from "css-tree";

interface StringSetEntry {
	identifier: string;
	value: string;
	keyword: string;
	selector: string;
	first: string | null;
	last: string | null;
	start: string | null;
	firstExcept: string | null;
	previous: string | null;
}

class StringSets extends Handler {
	stringSetSelectors: Record<string, StringSetEntry>;
	pageCount: number;
	pageStringValues: Record<string, { page: number; first: string; last: string }[]>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.stringSetSelectors = {};
		this.pageCount = 0;
		this.pageStringValues = {};
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		if (declaration.property === "string-set") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			let currentIdentifier: string | null = null;
			let currentValue: string | null = null;
			let currentKeyword: string | null = null;

			csstree.walk(declaration.value, {
				visit: "Identifier" as any,
				enter: (node: any) => {
					if (["first", "last", "start", "first-except"].includes(node.name)) {
						currentKeyword = node.name;
					} else if (!currentValue) {
						currentIdentifier = node.name;
					}
				}
			});

			csstree.walk(declaration.value, {
				visit: "Function" as any,
				enter: (node: any) => {
					if (node.name === "content") {
						currentValue = csstree.generate(node);
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
					first: null,
					last: null,
					start: null,
					firstExcept: null,
					previous: null
				};
			}
		}
	}

	onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void {
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

	afterPageLayout(fragment: Document | HTMLElement, page: any, breakToken: any, chunker: any): void {
		this.pageCount++;
		const isFirstPage = this.pageCount === 1;

		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			let selected = fragment.querySelectorAll(set.selector);

			if (selected.length > 0) {
				let firstValue = this.extractTextContent(selected[0] as HTMLElement);
				let lastValue = this.extractTextContent(selected[selected.length - 1] as HTMLElement);

				set.first = firstValue;
				set.last = lastValue;

				if (isFirstPage) {
					set.start = firstValue;
				} else if (!set.start) {
					set.start = firstValue;
				}

				if (!isFirstPage && !set.firstExcept) {
					set.firstExcept = firstValue;
				}

				set.previous = lastValue;

				if (!this.pageStringValues[name]) {
					this.pageStringValues[name] = [];
				}
				this.pageStringValues[name].push({
					page: this.pageCount,
					first: firstValue,
					last: lastValue
				});
			}

			let valueToUse = this.getValueForKeyword(set, isFirstPage);

			if (valueToUse !== null && valueToUse !== undefined) {
				(fragment as HTMLElement).style.setProperty(`--pagedjs-string-${name}`, `"${valueToUse}"`);
			}
		}
	}

	extractTextContent(element: HTMLElement): string {
		if (!element) return "";
		return element.textContent!.replace(/\\([\s\S])|(["'])/g, "\\$1$2").trim();
	}

	getValueForKeyword(set: StringSetEntry, isFirstPage: boolean): string | null {
		switch (set.keyword) {
			case "first":
				return set.first !== null ? set.first : set.previous;

			case "last":
				return set.last !== null ? set.last : set.previous;

			case "start":
				if (isFirstPage) {
					return set.start;
				}
				return set.first !== null ? set.first : set.start;

			case "first-except":
				if (isFirstPage) {
					return "";
				}
				return set.firstExcept !== null ? set.firstExcept : "";

			default:
				return set.first !== null ? set.first : set.previous;
		}
	}

	getStringValues(name?: string): any {
		if (name) {
			return this.pageStringValues[name] || [];
		}
		return this.pageStringValues;
	}

	reset(): void {
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
