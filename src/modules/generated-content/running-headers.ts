import Handler from "../handler";
import * as csstree from "css-tree";

interface RunningSelector {
	identifier: string;
	value: string;
	selector: string;
	first?: HTMLElement;
}

interface ElementEntry {
	func: string;
	args: string[];
	value: string;
	style: string;
	selector: string;
	fullSelector: string;
}

class RunningHeaders extends Handler {
	runningSelectors: Record<string, RunningSelector>;
	elements: Record<string, ElementEntry>;
	orderedSelectors: string[] | undefined;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.runningSelectors = {};
		this.elements = {};
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		if (declaration.property === "position") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let identifier = declaration.value.children.first.name;

			if (identifier === "running") {
				let value: string;
				csstree.walk(declaration, {
					visit: "Function" as any,
					enter: (node: any) => {
						value = node.children.first.name;
					}
				});

				this.runningSelectors[value!] = {
					identifier: identifier,
					value: value!,
					selector: selector
				};
			}
		}

		if (declaration.property === "content") {
			csstree.walk(declaration, {
				visit: "Function" as any,
				enter: (funcNode: any, fItem: any, fList: any) => {
					if (funcNode.name.indexOf("element") > -1) {
						let selector = csstree.generate(rule.ruleNode.prelude);
						let func = funcNode.name;
						let value = funcNode.children.first.name;
						let args = [value];
						let style = "first";

						selector.split(",").forEach((s: string) => {
							s = s.replace(/::after|::before/, "");

							this.elements[s.trim()] = {
								func: func,
								args: args,
								value: value,
								style: style || "first",
								selector: s.trim(),
								fullSelector: selector
							};
						});
					}
				}
			});
		}
	}

	afterParsed(fragment: Document | HTMLElement): void {
		for (let name of Object.keys(this.runningSelectors)) {
			let set = this.runningSelectors[name];
			let selected = Array.from(fragment.querySelectorAll(set.selector));

			if (set.identifier === "running") {
				for (let header of selected) {
					(header as HTMLElement).style.display = "none";
				}
			}
		}
	}

	afterPageLayout(fragment: Document | HTMLElement): void {
		for (let name of Object.keys(this.runningSelectors)) {
			let set = this.runningSelectors[name];
			let selected = fragment.querySelector(set.selector);
			if (selected) {
				if (set.identifier === "running") {
					set.first = selected as HTMLElement;
				} else {
					console.warn(set.value + "needs css replacement");
				}
			}
		}

		if (!this.orderedSelectors) {
			this.orderedSelectors = this.orderSelectors(this.elements);
		}

		for (let selector of this.orderedSelectors) {
			if (selector) {
				let el = this.elements[selector];
				let selected = fragment.querySelector(selector);
				if (selected) {
					let running = this.runningSelectors[el.args[0]];
					if (running && running.first) {
						selected.innerHTML = "";
						let clone = running.first.cloneNode(true) as HTMLElement;
						clone.style.display = "";
						selected.appendChild(clone);
					}
				}
			}
		}
	}

	pageWeight(s: string): number {
		let weight = 1;
		let selector = s.split(" ");
		let parts = selector.length && selector[0].split(".");

		parts.shift();

		switch (parts.length) {
			case 4:
				if (parts[3] === "pagedjs_first_page") {
					weight = 7;
				} else if (parts[3] === "pagedjs_left_page" || parts[3] === "pagedjs_right_page") {
					weight = 6;
				}
				break;
			case 3:
				if (parts[1] === "pagedjs_named_page") {
					if (parts[2].indexOf(":nth-of-type") > -1) {
						weight = 7;
					} else {
						weight = 5;
					}
				}
				break;
			case 2:
				if (parts[1] === "pagedjs_first_page") {
					weight = 4;
				} else if (parts[1] === "pagedjs_blank_page") {
					weight = 3;
				} else if (parts[1] === "pagedjs_left_page" || parts[1] === "pagedjs_right_page") {
					weight = 2;
				}
				break;
			default:
				if (parts[0].indexOf(":nth-of-type") > -1) {
					weight = 4;
				} else {
					weight = 1;
				}
		}

		return weight;
	}

	orderSelectors(obj: Record<string, ElementEntry>): string[] {
		let selectors = Object.keys(obj);
		let weighted: Record<number, string[]> = {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
			6: [],
			7: []
		};

		let orderedSelectors: string[] = [];

		for (let s of selectors) {
			let w = this.pageWeight(s);
			weighted[w].unshift(s);
		}

		for (var i = 1; i <= 7; i++) {
			orderedSelectors = orderedSelectors.concat(weighted[i]);
		}

		return orderedSelectors;
	}

	beforeTreeParse(text: string, sheet: any): void {
		sheet.text = text.replace(/element[\s]*\(([^|^#)]*)\)/g, "element-ident($1)");
	}
}

export default RunningHeaders;
