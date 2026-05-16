import Handler from "../handler";
import * as csstree from "css-tree";

interface PageFloatRule {
	property: string;
	value: string;
	selector: string;
}

interface FloatElement {
	element: HTMLElement;
	type: string;
	defer: number;
	clear: string;
}

class PageFloats extends Handler {
	private floatRules: Record<string, PageFloatRule[]>;
	private floatSelectors: Set<string>;
	private deferredFloats: FloatElement[];
	private processedFloats: Set<string>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.floatRules = {};
		this.floatSelectors = new Set();
		this.deferredFloats = [];
		this.processedFloats = new Set();
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		const property = declaration.property;

		if (property === "float") {
			if (!declaration.value || !declaration.value.children || !declaration.value.children.first) {
				return;
			}
			const child = declaration.value.children.first;
			const value = child.name;

			if (["top", "bottom", "page", "here", "snap", "snap-block", "snap-inline"].includes(value)) {
				let selector = "";
				if (rule && rule.ruleNode && rule.ruleNode.prelude) {
					selector = csstree.generate(rule.ruleNode.prelude);
				}

				if (selector) {
					selector.split(",").forEach((s: string) => {
						s = s.trim();
						if (s && !this.floatSelectors.has(s)) {
							this.floatSelectors.add(s);

							const floatRule: PageFloatRule = {
								property: "float",
								value: value,
								selector: s
							};

							if (!this.floatRules[s]) {
								this.floatRules[s] = [];
							}
							this.floatRules[s].push(floatRule);
						}
					});
				}

				dList.remove(dItem);
			}
		}

		if (property === "float-defer") {
			if (!declaration.value || !declaration.value.children || !declaration.value.children.first) {
				return;
			}
			const child = declaration.value.children.first;
			const value = parseInt(child.value, 10);

			if (!isNaN(value)) {
				let selector = "";
				if (rule && rule.ruleNode && rule.ruleNode.prelude) {
					selector = csstree.generate(rule.ruleNode.prelude);
				}

				if (selector) {
					selector.split(",").forEach((s: string) => {
						s = s.trim();
						if (s && this.floatRules[s]) {
							this.floatRules[s].forEach((r) => {
								r.property = "float-defer";
								r.value = String(value);
							});
						}
					});
				}
			}

			dList.remove(dItem);
		}

		if (property === "clear") {
			if (!declaration.value || !declaration.value.children || !declaration.value.children.first) {
				return;
			}
			const child = declaration.value.children.first;
			const value = child.name;

			if (["page-top", "page-bottom", "both", "left", "right"].includes(value)) {
				let selector = "";
				if (rule && rule.ruleNode && rule.ruleNode.prelude) {
					selector = csstree.generate(rule.ruleNode.prelude);
				}

				if (selector) {
					selector.split(",").forEach((s: string) => {
						s = s.trim();
						if (s && this.floatRules[s]) {
							this.floatRules[s].forEach((r) => {
								r.property = "clear";
								r.value = value;
							});
						}
					});
				}
			}

			dList.remove(dItem);
		}
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.markFloatElements(parsed);
	}

	private markFloatElements(parsed: Document | HTMLElement): void {
		for (const selector of this.floatSelectors) {
			try {
				const elements = parsed.querySelectorAll(selector);
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i] as HTMLElement;
					if (!el.dataset.pageFloat) {
						const rules = this.floatRules[selector];
						const floatType = this.getFloatTypeFromRules(rules);
						const defer = this.getFloatDeferrFromRules(rules);
						const clear = this.getClearFromRules(rules);

						el.dataset.pageFloat = floatType;
						el.dataset.pageFloatDeferr = String(defer);
						if (clear) {
							el.dataset.pageFloatClear = clear;
						}
					}
				}
			} catch (e) {
				// Invalid selector
			}
		}
	}

	private getFloatTypeFromRules(rules: PageFloatRule[] | undefined): string {
		if (!rules) return "here";
		const floatRule = rules.find((r) => r.property === "float");
		return floatRule ? floatRule.value : "here";
	}

	private getFloatDeferrFromRules(rules: PageFloatRule[] | undefined): number {
		if (!rules) return 0;
		const deferRule = rules.find((r) => r.property === "float-defer");
		return deferRule ? parseInt(deferRule.value, 10) || 0 : 0;
	}

	private getClearFromRules(rules: PageFloatRule[] | undefined): string {
		if (!rules) return "";
		const clearRule = rules.find((r) => r.property === "clear");
		return clearRule ? clearRule.value : "";
	}

	afterPageLayout(pageElement: HTMLElement, page: any, _breakToken: any, _chunker: any): void {
		this.processPageFloats(pageElement, page);
	}

	private processPageFloats(pageElement: HTMLElement, page: any): void {
		const contentArea = pageElement.querySelector(".pagedjs_page_content") || pageElement.querySelector(".pagedjs_area");
		if (!contentArea) return;

		const floatElements = contentArea.querySelectorAll("[data-page-float]");

		floatElements.forEach((el) => {
			const floatEl = el as HTMLElement;
			const floatType = floatEl.dataset.pageFloat!;
			const defer = parseInt(floatEl.dataset.pageFloatDeferr || "0", 10);
			const clear = floatEl.dataset.pageFloatClear || "";

			const floatId = floatEl.dataset.ref || this.generateFloatId(floatEl);
			if (this.processedFloats.has(floatId)) return;

			this.positionFloat(floatEl, floatType, defer, clear, pageElement);
			this.processedFloats.add(floatId);
		});
	}

	private positionFloat(
		floatEl: HTMLElement,
		floatType: string,
		defer: number,
		clear: string,
		pageElement: HTMLElement
	): void {
		const pagebox = pageElement.querySelector(".pagedjs_pagebox");
		if (!pagebox) return;

		const floatWrapper = this.createFloatWrapper(floatEl, floatType);

		switch (floatType) {
			case "top":
				this.positionFloatTop(floatWrapper, pagebox, pageElement);
				break;
			case "bottom":
				this.positionFloatBottom(floatWrapper, pagebox, pageElement);
				break;
			case "page":
				this.positionFloatPage(floatWrapper, pagebox);
				break;
			case "here":
				this.positionFloatHere(floatWrapper, pagebox);
				break;
			case "snap":
			case "snap-block":
				this.positionFloatSnap(floatWrapper, pagebox, pageElement);
				break;
			case "snap-inline":
				this.positionFloatSnapInline(floatWrapper, pagebox);
				break;
		}
	}

	private createFloatWrapper(floatEl: HTMLElement, floatType: string): HTMLElement {
		const wrapper = document.createElement("div");
		wrapper.className = `pagedjs_page_float pagedjs_float_${floatType}`;
		wrapper.dataset.floatType = floatType;

		const clone = floatEl.cloneNode(true) as HTMLElement;
		clone.removeAttribute("data-page-float");
		clone.removeAttribute("data-page-float-defer");
		clone.removeAttribute("data-page-float-clear");
		clone.style.removeProperty("float");
		wrapper.appendChild(clone);

		floatEl.style.display = "none";
		floatEl.dataset.pageFloatProcessed = "true";

		return wrapper;
	}

	private positionFloatTop(wrapper: HTMLElement, pagebox: HTMLElement, pageElement: HTMLElement): void {
		let floatArea = pageElement.querySelector(".pagedjs_float_top_area");

		if (!floatArea) {
			floatArea = document.createElement("div");
			floatArea.className = "pagedjs_float_top_area";
			const areaContent = document.createElement("div");
			areaContent.className = "pagedjs_float_top_area_content";
			floatArea.appendChild(areaContent);

			const contentArea = pageElement.querySelector(".pagedjs_area");
			if (contentArea) {
				pagebox.insertBefore(floatArea, contentArea);
			} else {
				pagebox.appendChild(floatArea);
			}
		}

		const contentArea = floatArea.querySelector(".pagedjs_float_top_area_content");
		if (contentArea) {
			contentArea.appendChild(wrapper);
		}

		pageElement.classList.add("pagedjs_has_float_top");
	}

	private positionFloatBottom(wrapper: HTMLElement, pagebox: HTMLElement, pageElement: HTMLElement): void {
		let floatArea = pageElement.querySelector(".pagedjs_float_bottom_area");

		if (!floatArea) {
			floatArea = document.createElement("div");
			floatArea.className = "pagedjs_float_bottom_area";
			const areaContent = document.createElement("div");
			areaContent.className = "pagedjs_float_bottom_area_content";
			floatArea.appendChild(areaContent);

			const bottomMargin = pageElement.querySelector(".pagedjs_margin-bottom");
			if (bottomMargin) {
				pagebox.insertBefore(floatArea, bottomMargin);
			} else {
				pagebox.appendChild(floatArea);
			}
		}

		const contentArea = floatArea.querySelector(".pagedjs_float_bottom_area_content");
		if (contentArea) {
			contentArea.appendChild(wrapper);
		}

		pageElement.classList.add("pagedjs_has_float_bottom");
	}

	private positionFloatPage(wrapper: HTMLElement, pagebox: HTMLElement): void {
		let floatArea = pagebox.querySelector(".pagedjs_float_page_area");

		if (!floatArea) {
			floatArea = document.createElement("div");
			floatArea.className = "pagedjs_float_page_area";
			const areaContent = document.createElement("div");
			areaContent.className = "pagedjs_float_page_area_content";
			floatArea.appendChild(areaContent);
			pagebox.appendChild(floatArea);
		}

		const contentArea = floatArea.querySelector(".pagedjs_float_page_area_content");
		if (contentArea) {
			contentArea.appendChild(wrapper);
		}
	}

	private positionFloatHere(wrapper: HTMLElement, pagebox: HTMLElement): void {
		const contentArea = pagebox.querySelector(".pagedjs_page_content") || pagebox.querySelector(".pagedjs_area .pagedjs_page_content");
		if (contentArea) {
			contentArea.appendChild(wrapper);
		}
	}

	private positionFloatSnap(wrapper: HTMLElement, pagebox: HTMLElement, pageElement: HTMLElement): void {
		this.positionFloatTop(wrapper, pagebox, pageElement);
	}

	private positionFloatSnapInline(wrapper: HTMLElement, pagebox: HTMLElement): void {
		const contentArea = pagebox.querySelector(".pagedjs_page_content") || pagebox.querySelector(".pagedjs_area .pagedjs_page_content");
		if (contentArea) {
			contentArea.appendChild(wrapper);
		}
	}

	private generateFloatId(el: HTMLElement): string {
		const tag = el.tagName.toLowerCase();
		const id = el.id || "";
		const cls = el.className || "";
		return `float_${tag}_${id}_${cls}_${Math.random().toString(36).substr(2, 9)}`;
	}

	addFloatStyles(): void {
		if (!this.polisher || !this.polisher.styleSheet) return;

		const css = `.pagedjs_page_float {
	position: relative;
	z-index: 1;
}
.pagedjs_float_top_area {
	display: flex;
	flex-direction: column;
	gap: 12pt;
	margin-bottom: 12pt;
}
.pagedjs_float_top_area_content {
	display: flex;
	flex-direction: column;
	gap: 12pt;
}
.pagedjs_float_bottom_area {
	display: flex;
	flex-direction: column;
	gap: 12pt;
	margin-top: 12pt;
}
.pagedjs_float_bottom_area_content {
	display: flex;
	flex-direction: column;
	gap: 12pt;
}
.pagedjs_float_page_area {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}
.pagedjs_float_page_area_content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12pt;
}
.pagedjs_float_here {
	margin: 12pt 0;
}
.pagedjs_float_top {
	margin-bottom: 12pt;
}
.pagedjs_float_bottom {
	margin-top: 12pt;
}
.pagedjs_float_page {
	max-width: 90%;
	max-height: 90%;
}
[data-page-float-processed="true"] {
	display: none !important;
}
figure[data-page-float="top"],
figure[data-page-float="bottom"],
figure[data-page-float="page"],
figure[data-page-float="here"] {
	margin: 0;
	padding: 0;
}
table[data-page-float="top"],
table[data-page-float="bottom"],
table[data-page-float="page"],
table[data-page-float="here"] {
	margin: 0;
}`;

		const rules = css.match(/[^}]+}/g) || [];
		for (const rule of rules) {
			const trimmed = rule.trim();
			if (trimmed) {
				this.polisher.styleSheet.insertRule(trimmed, this.polisher.styleSheet.cssRules.length);
			}
		}
	}

	afterRendered(_pages: any, _chunker: any): void {
		this.addFloatStyles();
	}

	getFloatCount(): number {
		return this.processedFloats.size;
	}

	resetFloatCounter(): void {
		this.processedFloats.clear();
		this.deferredFloats = [];
	}
}

export default PageFloats;
