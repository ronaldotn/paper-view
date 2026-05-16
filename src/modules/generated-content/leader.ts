import Handler from "../handler";
import { UUID } from "../../utils/utils";
import * as csstree from "css-tree";

interface LeaderTarget {
	selector: string;
	fullSelector: string;
	leaderType: string;
	leaderChar: string;
	variable: string;
	pseudo: string;
}

class Leader extends Handler {
	private leaderTargets: Record<string, LeaderTarget>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.polisher = polisher;
		this.leaderTargets = {};
	}

	onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void {
		if (funcNode.name === "leader") {
			const selector = csstree.generate(rule.ruleNode.prelude);
			const leaderType = this.parseLeaderType(funcNode);
			const leaderChar = this.getLeaderCharacter(leaderType);
			const variable = "--pagedjs-leader-" + UUID();

			const split = selector.split("::");
			const pseudo = split.length > 1 ? "::" + split[1] : "";

			selector.split(",").forEach((s: string) => {
				s = s.trim();
				this.leaderTargets[s] = {
					selector: s,
					fullSelector: selector,
					leaderType: leaderType,
					leaderChar: leaderChar,
					variable: variable,
					pseudo: pseudo
				};
			});

			funcNode.name = "var";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: null,
				name: variable
			});
		}
	}

	private parseLeaderType(funcNode: any): string {
		const first = funcNode.children.first;
		if (!first) return "dotted";

		if (first.type === "Identifier") {
			return first.name.toLowerCase();
		}

		if (first.type === "String") {
			return first.value.replace(/^["']|["']$/g, "");
		}

		return "dotted";
	}

	private getLeaderCharacter(leaderType: string): string {
		switch (leaderType) {
			case "dotted":
				return ". ";
			case "solid":
			case "space":
				return "\u00A0";
			case "dots":
				return "\u2022 ";
			default:
				return leaderType.length === 1 ? leaderType : ". ";
		}
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.setupLeaderStyles();
	}

	private setupLeaderStyles(): void {
		if (!this.polisher || !this.polisher.styleSheet) return;

		Object.keys(this.leaderTargets).forEach((selector) => {
			const target = this.leaderTargets[selector];
			const css = `
				${selector}${target.pseudo} {
					${target.variable}: "${this.escapeLeaderString(target.leaderChar)}";
				}
			`;

			this.polisher.styleSheet.insertRule(css, this.polisher.styleSheet.cssRules.length);
		});
	}

	private escapeLeaderString(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/"/g, "\\\"")
			.replace(/\n/g, "\\00000A");
	}

	afterPageLayout(pageElement: HTMLElement, page: any, _breakToken: any, chunker: any): void {
		this.renderLeaders(pageElement, chunker);
	}

	private renderLeaders(pageElement: HTMLElement, chunker: any): void {
		Object.keys(this.leaderTargets).forEach((selector) => {
			const target = this.leaderTargets[selector];
			const baseSelector = selector.split("::")[0];

			try {
				const entries = pageElement.querySelectorAll(baseSelector);

				entries.forEach((entry) => {
					const el = entry as HTMLElement;
					if (el.dataset.leaderProcessed) return;

					const link = el.querySelector("a[href]");
					if (!link) return;

					const href = link.getAttribute("href");
					if (!href || !href.startsWith("#")) return;

					const targetId = href.substring(1);
					const targetEl = chunker.rendered.querySelector(`[id="${targetId}"]`);

					if (!targetEl) return;

					this.createLeaderLine(el, target, targetEl, pageElement);
					el.dataset.leaderProcessed = "true";
				});
			} catch (e) {
				// Invalid selector
			}
		});
	}

	private createLeaderLine(
		entryEl: HTMLElement,
		target: LeaderTarget,
		targetEl: Element,
		pageElement: HTMLElement
	): void {
		const pageNum = this.getPageNumberForElement(targetEl, pageElement);
		if (pageNum === null) return;

		const leaderChar = target.leaderChar;
		const leaderSpan = document.createElement("span");
		leaderSpan.className = "pagedjs_leader";
		leaderSpan.setAttribute("data-leader-type", target.leaderType);

		const pageSpan = document.createElement("span");
		pageSpan.className = "pagedjs_leader_pagenum";
		pageSpan.textContent = String(pageNum);

		entryEl.style.display = "flex";
		entryEl.style.alignItems = "baseline";
		entryEl.style.justifyContent = "space-between";

		const titleSpan = document.createElement("span");
		titleSpan.className = "pagedjs_leader_title";
		titleSpan.style.flexShrink = "0";

		while (entryEl.firstChild) {
			titleSpan.appendChild(entryEl.firstChild);
		}

		entryEl.appendChild(titleSpan);
		entryEl.appendChild(leaderSpan);
		entryEl.appendChild(pageSpan);

		this.fillLeader(leaderSpan, leaderChar);
	}

	private fillLeader(leaderSpan: HTMLSpanElement, leaderChar: string): void {
		const container = leaderSpan.parentElement;
		if (!container) return;

		const updateLeader = () => {
			const containerWidth = container.clientWidth;
			const titleEl = container.querySelector(".pagedjs_leader_title");
			const pageEl = container.querySelector(".pagedjs_leader_pagenum");

			if (!titleEl || !pageEl) return;

			const titleWidth = titleEl.clientWidth;
			const pageWidth = pageEl.clientWidth;
			const availableWidth = containerWidth - titleWidth - pageWidth - 4;

			const charWidth = this.measureCharWidth(leaderChar, leaderSpan);
			const count = Math.max(2, Math.floor(availableWidth / charWidth));

			leaderSpan.textContent = leaderChar.repeat(count);
		};

		updateLeader();

		if (typeof ResizeObserver !== "undefined") {
			const observer = new ResizeObserver(() => {
				updateLeader();
			});
			observer.observe(container);
		}
	}

	private measureCharWidth(char: string, element: HTMLSpanElement): number {
		const testSpan = document.createElement("span");
		testSpan.style.visibility = "hidden";
		testSpan.style.position = "absolute";
		testSpan.style.whiteSpace = "nowrap";
		testSpan.style.fontSize = window.getComputedStyle(element).fontSize;
		testSpan.style.fontFamily = window.getComputedStyle(element).fontFamily;
		testSpan.textContent = char;
		document.body.appendChild(testSpan);

		const width = testSpan.getBoundingClientRect().width;
		document.body.removeChild(testSpan);

		return width || 8;
	}

	private getPageNumberForElement(targetEl: Element, pageElement: HTMLElement): number | null {
		const page = pageElement.closest(".pagedjs_page");
		if (!page) return null;

		const pages = pageElement.ownerDocument.querySelectorAll(".pagedjs_page");
		let pageNum = 1;

		for (let i = 0; i < pages.length; i++) {
			const p = pages[i];
			const counterReset = window.getComputedStyle(p).counterReset;

			if (counterReset && counterReset !== "none") {
				const match = counterReset.match(/page\s+(\d+)/);
				if (match) {
					pageNum = parseInt(match[1], 10);
				}
			}

			if (p === page || p.contains(targetEl)) {
				return pageNum;
			}

			pageNum++;
		}

		return null;
	}

	addLeaderStyles(): void {
		if (!this.polisher || !this.polisher.styleSheet) return;

		const css = `.pagedjs_leader {
	display: inline-block;
	flex: 1;
	overflow: hidden;
	text-align: justify;
	letter-spacing: 0.1em;
	line-height: 1;
	white-space: nowrap;
}
.pagedjs_leader[data-leader-type="dotted"] {
	letter-spacing: 0.15em;
}
.pagedjs_leader[data-leader-type="solid"] {
	border-bottom: 1px solid currentColor;
	letter-spacing: 0;
}
.pagedjs_leader[data-leader-type="solid"]::after {
	content: "";
}
.pagedjs_leader[data-leader-type="space"] {
	letter-spacing: 0.5em;
}
.pagedjs_leader_pagenum {
	flex-shrink: 0;
	text-align: right;
	margin-left: 0.5em;
}
.pagedjs_leader_title {
	flex-shrink: 0;
}
.toc-entry,
[data-leader-processed="true"] {
	display: flex;
	align-items: baseline;
	gap: 0;
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
		this.addLeaderStyles();
	}

	getLeaderCount(): number {
		return Object.keys(this.leaderTargets).length;
	}

	resetLeaderTargets(): void {
		this.leaderTargets = {};
	}
}

export default Leader;
