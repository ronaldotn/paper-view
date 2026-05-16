import Handler from "../handler";
import * as csstree from "css-tree";
import { extractPageNumberingConfig } from "./css-integration";

interface PageRule {
	selector: string;
	properties: Record<string, string>;
}

interface PageRuleWithSpecificity extends PageRule {
	specificity: number;
}

class PageNumberingHandler extends Handler {
	pageRules: PageRule[];
	config: Record<string, any> | null;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.pageRules = [];
		this.config = null;
	}

	onAtPage(node: any, item: any, list: any): void {
		let selector = "";

		if (node.prelude) {
			selector = csstree.generate(node.prelude);
		} else {
			selector = "*";
		}

		const rule: PageRule = {
			selector: selector,
			properties: {}
		};

		if (node.block && node.block.children) {
			node.block.children.forEach((child: any) => {
				if (child.type === "Declaration") {
					const propertyName = csstree.property(child.property).name;
					const propertyValue = csstree.generate(child.value);
					rule.properties[propertyName] = propertyValue;
				}
			});
		}

		const hasPageNumberingProps = Object.keys(rule.properties).some(prop =>
			prop.startsWith("pagedjs-page-numbering")
		);

		if (hasPageNumberingProps) {
			this.pageRules.push(rule);
		}
	}

	afterTreeWalk(ast: any, sheet: any): void {
		if (this.pageRules.length > 0 && this.chunker) {
			const sortedRules = this.applySpecificity(this.pageRules);

			this.config = extractPageNumberingConfig(sortedRules);

			if (this.chunker.applyPageNumberingCSSRules) {
				this.chunker.applyPageNumberingCSSRules(sortedRules);
			}

			this.emit("pageNumberingConfig", this.config);
		}

		this.pageRules = [];
	}

	applySpecificity(rules: PageRule[]): PageRule[] {
		if (!rules || rules.length === 0) {
			return [];
		}

		const rulesWithSpecificity: PageRuleWithSpecificity[] = rules.map(rule => ({
			...rule,
			specificity: this.calculateSpecificity(rule.selector)
		}));

		rulesWithSpecificity.sort((a, b) => b.specificity - a.specificity);

		const uniqueSelectors = new Set<string>();
		const filteredRules: PageRule[] = [];

		for (const rule of rulesWithSpecificity) {
			if (!uniqueSelectors.has(rule.selector)) {
				uniqueSelectors.add(rule.selector);
				filteredRules.push(rule);
			}
		}

		return filteredRules;
	}

	calculateSpecificity(selector: string): number {
		if (!selector || selector === "" || selector === "*") {
			return 0;
		}

		let score = 0;

		if (selector.includes(":first")) score += 10;
		if (selector.includes(":left")) score += 5;
		if (selector.includes(":right")) score += 5;
		if (selector.includes(":blank")) score += 10;

		if (selector && !selector.startsWith(":")) {
			score += 3;
		}

		if (selector.includes(":nth")) {
			score += 7;
		}

		if (selector.includes(":has(")) score += 15;

		if (selector.includes(":is(")) {
			score += 8;
			if (selector.includes(":first")) score += 2;
			if (selector.includes(":blank")) score += 2;
		}

		return score;
	}

	getConfig(): Record<string, any> | null {
		return this.config;
	}

	getPageRules(): PageRule[] {
		return this.pageRules;
	}

	reset(): void {
		this.pageRules = [];
		this.config = null;
	}
}

export default PageNumberingHandler;
