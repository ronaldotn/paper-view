import Handler from "../handler";
import { UUID, attr, querySelectorEscape } from "../../utils/utils";
import * as csstree from "css-tree";

interface TextTarget {
	func: string;
	args: string[];
	value: string;
	style: string;
	selector: string;
	fullSelector: string;
	variable: string;
}

class TargetText extends Handler {
	polisher: any;
	textTargets: Record<string, TextTarget>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.polisher = polisher;
		this.textTargets = {};
	}

	onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void {
		if (funcNode.name === "target-text") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let first = funcNode.children.first;
			let last = funcNode.children.last;
			let func = first.name;

			let value = csstree.generate(funcNode);

			let args: string[] = [];

			first.children.forEach((child: any) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let style: string;
			if (last !== first) {
				style = last.name;
			}

			let variable = "--pagedjs-" + UUID();

			selector.split(",").forEach((s: string) => {
				s = s.trim();
				this.textTargets[s] = {
					func: func,
					args: args,
					value: value,
					style: style || "content",
					selector: s,
					fullSelector: selector,
					variable: variable
				};
			});

			funcNode.name = "var";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable
			});
		}
	}

	afterParsed(fragment: Document | HTMLElement): void {
		Object.keys(this.textTargets).forEach((name) => {
			let target = this.textTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = fragment.querySelectorAll(query);
			queried.forEach((selected: Element, index: number) => {
				let val = attr(selected, target.args);
				let element = fragment.querySelector(querySelectorEscape(val));
				if (element) {
					if (target.style === "content") {
						let selector = UUID();
						(selected as HTMLElement).dataset.targetText = selector;

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}

						let textContent = element.textContent!.trim().replace(/["']/g, (match: string) => {
							return "\\" + match;
						}).replace(/[\n]/g, (match: string) => {
							return "\\00000A";
						});

						this.polisher.styleSheet.insertRule(`[data-target-text="${selector}"]${psuedo} { ${target.variable}: "${textContent}" }`, this.polisher.styleSheet.cssRules.length);
					}
				} else {
					console.warn("missed target", val);
				}
			});
		});
	}
}

export default TargetText;
