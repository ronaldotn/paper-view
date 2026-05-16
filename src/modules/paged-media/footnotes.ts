import Handler from "../handler";
import * as csstree from "css-tree";

interface FootnoteAreaStyles {
	[property: string]: string;
}

class Footnotes extends Handler {
	footnoteSelectors: string[];
	footnoteDisplay: string;
	footnotePolicy: string;
	footnoteAreaDefined: boolean;
	footnoteAreaStyles: FootnoteAreaStyles;
	footnoteCounter: number;
	pageFootnotes: Map<string, any[]>;
	currentFootnoteNumber: number;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.footnoteSelectors = [];
		this.footnoteDisplay = "block";
		this.footnotePolicy = "line";
		this.footnoteAreaDefined = false;
		this.footnoteAreaStyles = {};
		this.footnoteCounter = 0;
		this.pageFootnotes = new Map();
		this.currentFootnoteNumber = 0;
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		const property = declaration.property;

		if (property === "float") {
			const child = declaration.value.children.first;
			if (child && child.name === "footnote") {
				let selector = "";
				if (rule && rule.ruleNode && rule.ruleNode.prelude) {
					selector = csstree.generate(rule.ruleNode.prelude);
				}

				if (selector) {
					selector.split(",").forEach((s: string) => {
						s = s.trim();
						if (s && !this.footnoteSelectors.includes(s)) {
							this.footnoteSelectors.push(s);
						}
					});
				}

				dList.remove(dItem);
			}
		}

		if (property === "footnote-display") {
			const child = declaration.value.children.first;
			if (child && ["block", "inline", "compact"].includes(child.name)) {
				this.footnoteDisplay = child.name;
			}
			dList.remove(dItem);
		}

		if (property === "footnote-policy") {
			const child = declaration.value.children.first;
			if (child && ["line", "keep", "block"].includes(child.name)) {
				this.footnotePolicy = child.name;
			}
			dList.remove(dItem);
		}
	}

	onAtPage(node: any, item: any, list: any): void {
		if (node.block) {
			csstree.walk(node.block, {
				visit: "Atrule",
				enter: (atRule: any, atItem: any, atList: any) => {
					if (atRule.name === "footnote") {
						this.footnoteAreaDefined = true;
						this.footnoteAreaStyles = this.parseFootnoteArea(atRule);
						atList.remove(atItem);
					}
				}
			});
		}
	}

	parseFootnoteArea(atRule: any): FootnoteAreaStyles {
		const styles: FootnoteAreaStyles = {};

		if (atRule.block && atRule.block.children) {
			atRule.block.children.forEach((decl: any) => {
				if (decl.type === "Declaration") {
					styles[decl.property] = csstree.generate(decl.value);
				}
			});
		}

		return styles;
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.markFootnoteElements(parsed);
		this.setupFootnoteCounter(parsed);
	}

	private markFootnoteElements(parsed: Document | HTMLElement): void {
		for (const selector of this.footnoteSelectors) {
			try {
				const elements = parsed.querySelectorAll(selector);
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i] as HTMLElement;
					if (!el.dataset.footnote) {
						this.currentFootnoteNumber++;
						el.dataset.footnote = String(this.currentFootnoteNumber);
						el.dataset.footnoteOriginal = "true";

						const callSpan = this.createFootnoteCall(this.currentFootnoteNumber);
						el.parentNode!.insertBefore(callSpan, el);
					}
				}
			} catch (e) {
				// Selector might be invalid
			}
		}
	}

	createFootnoteCall(number: number): HTMLSpanElement {
		const span = document.createElement("span");
		span.className = "pagedjs_footnote_call";
		span.dataset.footnoteCall = String(number);
		span.setAttribute("data-ref", "footnote-call-" + number);
		span.textContent = String(number);
		return span;
	}

	private setupFootnoteCounter(parsed: Document | HTMLElement): void {
		if (this.polisher && this.polisher.styleSheet) {
			this.polisher.styleSheet.insertRule(`
				.pagedjs_footnote {
					counter-increment: footnote;
				}
			`, this.polisher.styleSheet.cssRules.length);

			this.polisher.styleSheet.insertRule(`
				.pagedjs_footnote_call::before {
					content: counter(footnote-call);
					counter-increment: footnote-call;
				}
			`, this.polisher.styleSheet.cssRules.length);
		}
	}

	afterPageLayout(pageElement: HTMLElement, page: any, _breakToken: any, _chunker: any): void {
		let footnoteArea = pageElement.querySelector(".pagedjs_footnote_area");

		if (!footnoteArea) {
			footnoteArea = this.createFootnoteArea(pageElement);
		}

		if (!footnoteArea) return;

		const footnotes = pageElement.querySelectorAll("[data-footnote]");
		let hasFootnotes = false;

		footnotes.forEach((fn) => {
			const fnEl = fn as HTMLElement;
			if (fnEl.dataset.footnoteProcessed) return;

			const fnNumber = fnEl.dataset.footnote!;
			const fnClone = this.createFootnoteElement(fnEl, fnNumber);

			if (fnClone) {
				const contentArea = footnoteArea!.querySelector(".pagedjs_footnote_area_content");
				if (contentArea) {
					contentArea.appendChild(fnClone);
				}
				fnEl.dataset.footnoteProcessed = "true";
				fnEl.style.display = "none";
				hasFootnotes = true;
			}
		});

		if (hasFootnotes) {
			footnoteArea.style.display = "flex";
			pageElement.classList.add("pagedjs_has_footnotes");
		} else {
			footnoteArea.style.display = "none";
		}

		this.applyFootnoteAreaStyles(footnoteArea);
	}

	private createFootnoteArea(pageElement: HTMLElement): HTMLElement | null {
		const pagebox = pageElement.querySelector(".pagedjs_pagebox");
		if (!pagebox) return null;

		const area = document.createElement("div");
		area.className = "pagedjs_footnote_area";
		area.style.display = "none";

		const areaContent = document.createElement("div");
		areaContent.className = "pagedjs_footnote_area_content";
		area.appendChild(areaContent);

		const bottomMargin = pageElement.querySelector(".pagedjs_margin-bottom");
		if (bottomMargin) {
			pagebox.insertBefore(area, bottomMargin);
		} else {
			pagebox.appendChild(area);
		}

		return area;
	}

	createFootnoteElement(originalFn: HTMLElement, number: string): HTMLDivElement {
		const fnDiv = document.createElement("div");
		fnDiv.className = "pagedjs_footnote";
		fnDiv.dataset.footnoteNumber = number;
		fnDiv.setAttribute("data-ref", "footnote-" + number);

		const marker = document.createElement("span");
		marker.className = "pagedjs_footnote_marker";
		marker.textContent = number;

		const content = document.createElement("span");
		content.className = "pagedjs_footnote_content";

		fnDiv.appendChild(marker);
		fnDiv.appendChild(content);

		const clone = originalFn.cloneNode(true) as HTMLElement;
		clone.removeAttribute("data-footnote");
		clone.removeAttribute("data-footnote-original");
		clone.removeAttribute("data-footnote-processed");
		clone.style.display = "inline";
		content.appendChild(clone);

		return fnDiv;
	}

	private applyFootnoteAreaStyles(footnoteArea: HTMLElement | null): void {
		if (!footnoteArea) return;

		const defaultStyles: FootnoteAreaStyles = {
			"border-top": "1px solid #333",
			"padding-top": "6pt",
			"margin-top": "12pt",
			"font-size": "9pt",
			"line-height": "1.3",
			"column-gap": "12pt",
			"display": "flex",
			"flex-direction": "column"
		};

		const styles = Object.assign({}, defaultStyles, this.footnoteAreaStyles);

		for (const [prop, value] of Object.entries(styles)) {
			footnoteArea.style.setProperty(prop, value);
		}

		const content = footnoteArea.querySelector(".pagedjs_footnote_area_content");
		if (content) {
			(content as HTMLElement).style.display = "flex";
			(content as HTMLElement).style.flexDirection = "column";
			(content as HTMLElement).style.gap = "4pt";
		}
	}

	addFootnoteStyles(): void {
		if (!this.polisher || !this.polisher.styleSheet) return;

		const css = `
			.pagedjs_footnote_call {
				font-size: 0.75em;
				vertical-align: super;
				line-height: 0;
				cursor: pointer;
				color: #0066cc;
			}

			.pagedjs_footnote_call:hover {
				text-decoration: underline;
			}

			.pagedjs_footnote_area {
				display: none;
			}

			.pagedjs_footnote_area_content {
				display: flex;
				flex-direction: column;
				gap: 4pt;
			}

			.pagedjs_footnote {
				display: flex;
				gap: 4pt;
				font-size: 9pt;
				line-height: 1.3;
			}

			.pagedjs_footnote_marker {
				font-size: 0.75em;
				vertical-align: super;
				flex-shrink: 0;
				width: 1.5em;
				text-align: right;
			}

			.pagedjs_footnote_content {
				flex: 1;
			}

			.pagedjs_footnote_content p {
				display: inline;
				margin: 0;
				padding: 0;
			}

			[data-footnote-original="true"] {
				display: none !important;
			}

			@counter-style footnote {
				system: numeric;
				symbols: "1" "2" "3" "4" "5" "6" "7" "8" "9" "10";
			}
		`;

		this.polisher.styleSheet.insertRule(css, this.polisher.styleSheet.cssRules.length);
	}

	afterRendered(doc: Document): void {
		this.addFootnoteStyles();

		const calls = doc.querySelectorAll(".pagedjs_footnote_call");
		calls.forEach((call) => {
			call.addEventListener("click", (e) => {
				const fnNumber = (call as HTMLElement).dataset.footnoteCall;
				const footnote = doc.querySelector(`[data-ref="footnote-${fnNumber}"]`);
				if (footnote) {
					footnote.scrollIntoView({ behavior: "smooth", block: "nearest" });
					(footnote as HTMLElement).style.backgroundColor = "#ffffcc";
					setTimeout(() => {
						(footnote as HTMLElement).style.backgroundColor = "";
					}, 2000);
				}
			});
		});
	}

	getFootnoteCount(): number {
		return this.currentFootnoteNumber;
	}

	resetFootnoteCounter(): void {
		this.currentFootnoteNumber = 0;
	}
}

export default Footnotes;
