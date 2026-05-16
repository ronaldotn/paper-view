import Handler from "../handler";
import * as csstree from "css-tree";

interface HyphenRule {
	property: string;
	value: string;
	selector: string;
}

interface HyphenateLimitChars {
	before: number;
	after: number;
	total: number;
}

interface HyphenOptions {
	hyphenCharacter: string;
	minCharsBefore: number;
	minCharsAfter: number;
	minWordLength: number;
}

class Hyphens extends Handler {
	private hyphenRules: Record<string, HyphenRule[]>;
	hyphenateCharacter: string;
	hyphenateLimitChars: HyphenateLimitChars;
	hyphenateLimitLines: number;
	hyphenateLimitZone: string;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.hyphenRules = {};
		this.hyphenateCharacter = "\u00AD";
		this.hyphenateLimitChars = { before: 2, after: 2, total: 5 };
		this.hyphenateLimitLines = 0;
		this.hyphenateLimitZone = "0px";
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		const property = declaration.property;
		let selector = "";
		if (rule && rule.ruleNode && rule.ruleNode.prelude) {
			selector = csstree.generate(rule.ruleNode.prelude);
		}

		if (property === "hyphens") {
			if (!declaration.value || !declaration.value.children || !declaration.value.children.first) {
				return;
			}
			const child = declaration.value.children.first;
			const value = child.name;

			if (["auto", "manual", "none"].includes(value)) {
				const hyphenRule: HyphenRule = {
					property: "hyphens",
					value: value,
					selector: selector
				};

				if (selector) {
					selector.split(",").forEach((s) => {
						s = s.trim();
						if (!this.hyphenRules[s]) {
							this.hyphenRules[s] = [];
						}
						this.hyphenRules[s].push(hyphenRule);
					});
				}

				dList.remove(dItem);
			}
		}

		if (property === "hyphenate-character") {
			if (!declaration.value) {
				return;
			}
			let value = csstree.generate(declaration.value);
			value = value.replace(/^["']|["']$/g, "");

			if (value.startsWith("\\")) {
				const codePoint = parseInt(value.substring(1), 16);
				this.hyphenateCharacter = String.fromCodePoint(codePoint);
			} else {
				this.hyphenateCharacter = value;
			}

			dList.remove(dItem);
		}

		if (property === "hyphenate-limit-chars") {
			if (!declaration.value || !declaration.value.children) {
				return;
			}
			const children = declaration.value.children.toArray();
			const values = children.map((c: any) => parseInt(c.value, 10)).filter((v: number) => !isNaN(v));

			if (values.length === 1) {
				this.hyphenateLimitChars = {
					before: 2,
					after: 2,
					total: values[0]
				};
			} else if (values.length === 2) {
				this.hyphenateLimitChars = {
					before: values[0],
					after: values[1],
					total: values[0] + values[1]
				};
			} else if (values.length >= 3) {
				this.hyphenateLimitChars = {
					before: values[0],
					after: values[1],
					total: values[2]
				};
			}

			dList.remove(dItem);
		}

		if (property === "hyphenate-limit-lines") {
			if (!declaration.value || !declaration.value.children || !declaration.value.children.first) {
				return;
			}
			const child = declaration.value.children.first;
			const value = parseInt(child.value, 10);

			if (!isNaN(value)) {
				this.hyphenateLimitLines = value;
			}

			dList.remove(dItem);
		}

		if (property === "hyphenate-limit-zone") {
			if (!declaration.value) {
				return;
			}
			const value = csstree.generate(declaration.value);
			this.hyphenateLimitZone = value;
			dList.remove(dItem);
		}
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.processHyphens(parsed, this.hyphenRules);

		if (this.chunker) {
			this.chunker.hyphenateCharacter = this.hyphenateCharacter;
			this.chunker.hyphenateLimitChars = this.hyphenateLimitChars;
			this.chunker.hyphenateLimitLines = this.hyphenateLimitLines;
			this.chunker.hyphenateLimitZone = this.hyphenateLimitZone;
		}
	}

	private processHyphens(parsed: Document | HTMLElement, rules: Record<string, HyphenRule[]>): void {
		for (const selector in rules) {
			const elements = parsed.querySelectorAll(selector);

			for (let i = 0; i < elements.length; i++) {
				for (const rule of rules[selector]) {
					if (rule.property === "hyphens") {
						(elements[i] as HTMLElement).dataset.hyphens = rule.value;
					}
				}
			}
		}
	}

	getHyphenMode(element: HTMLElement | null): string | null {
		if (!element || !element.dataset) {
			return null;
		}

		return element.dataset.hyphens || null;
	}

	getHyphenOptions(_element: HTMLElement | null): HyphenOptions {
		return {
			hyphenCharacter: this.hyphenateCharacter,
			minCharsBefore: this.hyphenateLimitChars.before,
			minCharsAfter: this.hyphenateLimitChars.after,
			minWordLength: this.hyphenateLimitChars.total
		};
	}

	afterPageLayout(pageElement: HTMLElement, page: any): void {
		if (this.chunker) {
			this.chunker.hyphenateCharacter = this.hyphenateCharacter;
			this.chunker.hyphenateLimitChars = this.hyphenateLimitChars;
			this.chunker.hyphenateLimitLines = this.hyphenateLimitLines;
			this.chunker.hyphenateLimitZone = this.hyphenateLimitZone;
		}
	}
}

export default Hyphens;
