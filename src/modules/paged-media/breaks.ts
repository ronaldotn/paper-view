import Handler from "../handler";
import * as csstree from "css-tree";
import { elementAfter } from "../../utils/dom";

interface Breaker {
	property: string;
	value: string;
	selector: string;
	name?: string;
}

class Breaks extends Handler {
	breaks: Record<string, Breaker[]>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.breaks = {};
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		let property = declaration.property;

		if (property === "page") {
			let children = declaration.value.children.first;
			let value = children.name;
			let selector = csstree.generate(rule.ruleNode.prelude);
			let name = value;

			let breaker: Breaker = {
				property: property,
				value: value,
				selector: selector,
				name: name
			};

			selector.split(",").forEach((s: string) => {
				s = s.trim();
				if (!this.breaks[s]) {
					this.breaks[s] = [breaker];
				} else {
					this.breaks[s].push(breaker);
				}
			});

			dList.remove(dItem);
		}

		if (property === "break-before" ||
				property === "break-after" ||
				property === "page-break-before" ||
				property === "page-break-after"
		) {
			let child = declaration.value.children.first;
			let value = child.name;
			let selector = csstree.generate(rule.ruleNode.prelude);

			if (property === "page-break-before") {
				property = "break-before";
			} else if (property === "page-break-after") {
				property = "break-after";
			}

			let breaker: Breaker = {
				property: property,
				value: value,
				selector: selector
			};

			selector.split(",").forEach((s: string) => {
				s = s.trim();
				if (!this.breaks[s]) {
					this.breaks[s] = [breaker];
				} else {
					this.breaks[s].push(breaker);
				}
			});

			dList.remove(dItem);
		}
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.processBreaks(parsed, this.breaks);
	}

	processBreaks(parsed: Document | HTMLElement, breaks: Record<string, Breaker[]>): void {
		for (let b in breaks) {
			let elements = parsed.querySelectorAll(b);
			for (var i = 0; i < elements.length; i++) {
				for (let prop of breaks[b]) {

					if (prop.property === "break-after") {
						let nodeAfter = elementAfter(elements[i], parsed);

						(elements[i] as HTMLElement).dataset.breakAfter = prop.value;

						if (nodeAfter) {
							(nodeAfter as HTMLElement).dataset.previousBreakAfter = prop.value;
						}
					} else if (prop.property === "page") {
						(elements[i] as HTMLElement).dataset.page = prop.value;

						let nodeAfter = elementAfter(elements[i], parsed);

						if (nodeAfter) {
							(nodeAfter as HTMLElement).dataset.afterPage = prop.value;
						}
					} else {
						(elements[i] as HTMLElement).setAttribute("data-" + prop.property, prop.value);
					}
				}
			}
		}
	}

	mergeBreaks(pageBreaks: Record<string, Breaker[]>, newBreaks: Record<string, Breaker[]>): Record<string, Breaker[]> {
		for (let b in newBreaks) {
			if (b in pageBreaks) {
				pageBreaks[b] = pageBreaks[b].concat(newBreaks[b]);
			} else {
				pageBreaks[b] = newBreaks[b];
			}
		}
		return pageBreaks;
	}

	addBreakAttributes(pageElement: HTMLElement, page: any): void {
		let before = pageElement.querySelector("[data-break-before]");
		let after = pageElement.querySelector("[data-break-after]");
		let previousBreakAfter = pageElement.querySelector("[data-previous-break-after]");

		if (before) {
			if ((before as HTMLElement).dataset.splitFrom) {
				page.splitFrom = (before as HTMLElement).dataset.splitFrom;
				pageElement.dataset.splitFrom = (before as HTMLElement).dataset.splitFrom;
			} else if ((before as HTMLElement).dataset.breakBefore && (before as HTMLElement).dataset.breakBefore !== "avoid") {
				page.breakBefore = (before as HTMLElement).dataset.breakBefore;
				pageElement.dataset.breakBefore = (before as HTMLElement).dataset.breakBefore;
			}
		}

		if (after && (after as HTMLElement).dataset) {
			if ((after as HTMLElement).dataset.splitTo) {
				page.splitTo = (after as HTMLElement).dataset.splitTo;
				pageElement.dataset.splitTo = (after as HTMLElement).dataset.splitTo;
			} else if ((after as HTMLElement).dataset.breakAfter && (after as HTMLElement).dataset.breakAfter !== "avoid") {
				page.breakAfter = (after as HTMLElement).dataset.breakAfter;
				pageElement.dataset.breakAfter = (after as HTMLElement).dataset.breakAfter;
			}
		}

		if (previousBreakAfter && (previousBreakAfter as HTMLElement).dataset) {
			if ((previousBreakAfter as HTMLElement).dataset.previousBreakAfter && (previousBreakAfter as HTMLElement).dataset.previousBreakAfter !== "avoid") {
				page.previousBreakAfter = (previousBreakAfter as HTMLElement).dataset.previousBreakAfter;
			}
		}
	}

	afterPageLayout(pageElement: HTMLElement, page: any): void {
		this.addBreakAttributes(pageElement, page);
	}
}

export default Breaks;
