import Handler from "../handler";
import { UUID, attr, querySelectorEscape } from "../../utils/utils";
import * as csstree from "css-tree";

interface CounterTarget {
	func: string;
	args: string[];
	value: string;
	counter: string;
	style: string;
	selector: string;
	fullSelector: string;
	variable: string;
}

class TargetCounters extends Handler {
	polisher: any;
	counterTargets: Record<string, CounterTarget>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.polisher = polisher;
		this.counterTargets = {};
	}

	onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void {
		if (funcNode.name === "target-counter") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let first = funcNode.children.first;
			let func = first.name;

			let value = csstree.generate(funcNode);

			let args: string[] = [];

			first.children.forEach((child: any) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let counter: string;
			let style: string;
			let styleIdentifier: any;

			funcNode.children.forEach((child: any) => {
				if (child.type === "Identifier") {
					if (!counter) {
						counter = child.name;
					} else if (!style) {
						styleIdentifier = csstree.clone(child);
						style = child.name;
					}
				}
			});

			let variable = "target-counter-" + UUID();

			selector.split(",").forEach((s: string) => {
				s = s.trim();
				this.counterTargets[s] = {
					func: func,
					args: args,
					value: value,
					counter: counter,
					style: style,
					selector: s,
					fullSelector: selector,
					variable: variable
				};
			});

			funcNode.name = "counter";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable
			});
			if (styleIdentifier) {
				funcNode.children.appendData({type: "Operator", loc: null, value: ","});
				funcNode.children.appendData(styleIdentifier);
			}
		}
	}

	afterPageLayout(fragment: Document | HTMLElement, page: any, breakToken: any, chunker: any): void {
		Object.keys(this.counterTargets).forEach((name) => {
			let target = this.counterTargets[name];
			let split = target.selector.split("::");
			let query = split[0];

			let queried = chunker.pagesArea.querySelectorAll(query + ":not([data-" + target.variable + "])");

			queried.forEach((selected: Element, index: number) => {
				if (target.func !== "attr") {
					return;
				}
				let val = attr(selected, target.args);
				let element = chunker.pagesArea.querySelector(querySelectorEscape(val));

				if (element) {
					let selector = UUID();
					selected.setAttribute("data-" + target.variable, selector);
					let psuedo = "";
					if (target.counter === "page") {
						let pages = chunker.pagesArea.querySelectorAll(".pagedjs_page");
						let pg = 0;
						for (var i = 0; i < pages.length; i++) {
							let styles = window.getComputedStyle(pages[i]);
							let reset = styles["counter-reset"].replace("page", "").trim();

							if (reset !== "none") {
								pg = parseInt(reset);
							}
							pg += 1;

							if (pages[i].contains( element )){
								break;
							}
						}

						if (split.length > 1) {
							psuedo += "::" + split[1];
						}
						this.polisher.styleSheet.insertRule(`[data-${target.variable}="${selector}"]${psuedo} { counter-reset: ${target.variable} ${pg}; }`, this.polisher.styleSheet.cssRules.length);
					} else {
						let value = element.getAttribute(`data-counter-${target.counter}-value`);
						if (value) {
							this.polisher.styleSheet.insertRule(`[data-${target.variable}="${selector}"]${psuedo} { counter-reset: ${target.variable} ${target.variable} ${parseInt(value)}; }`, this.polisher.styleSheet.cssRules.length);
						}
					}
				}
			});
		});
	}
}

export default TargetCounters;
