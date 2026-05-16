import Layout from "./layout";
import EventEmitter from "event-emitter";
import { browserAgent } from "../utils/utils";

interface BreakToken {
	node: Node;
	offset: number;
}

class Page {
	pagesArea: HTMLElement;
	pageTemplate: HTMLTemplateElement;
	blank: boolean | undefined;
	width: number | undefined;
	height: number | undefined;
	hooks: Record<string, any>;
	viewMode: string;
	element: HTMLElement | undefined;
	pagebox: HTMLElement | undefined;
	area: HTMLElement | undefined;
	wrapper: HTMLElement | undefined;
	position: number | undefined;
	id: string | undefined;
	name: string | undefined;
	startToken: BreakToken | undefined;
	endToken: BreakToken | undefined;
	layoutMethod: Layout | undefined;
	listening: boolean | undefined;
	ro: ResizeObserver | undefined;
	_onOverflow: ((token: BreakToken) => void) | undefined;
	_onUnderflow: ((token: BreakToken) => void) | undefined;
	_onScroll: (() => void) | undefined;
	_checkOverflowAfterResize: ((contents: Node) => void) | undefined;

	constructor(pagesArea: HTMLElement, pageTemplate: HTMLTemplateElement, blank: boolean | undefined, hooks: Record<string, any>, viewMode: string = "spread") {
		this.pagesArea = pagesArea;
		this.pageTemplate = pageTemplate;
		this.blank = blank;

		this.width = undefined;
		this.height = undefined;

		this.hooks = hooks;
		this.viewMode = viewMode;
	}

	create(template?: string, after?: Element | null): HTMLElement {
		let clone = document.importNode(this.pageTemplate.content, true);

		let page: HTMLElement, index: number;
		if (after) {
			this.pagesArea.insertBefore(clone, after.nextElementSibling);
			index = Array.prototype.indexOf.call(this.pagesArea.children, after.nextElementSibling);
			page = this.pagesArea.children[index] as HTMLElement;
		} else {
			this.pagesArea.appendChild(clone);
			page = this.pagesArea.lastChild as HTMLElement;
		}

		let pagebox = page.querySelector(".pagedjs_pagebox") as HTMLElement;
		let area = page.querySelector(".pagedjs_page_content") as HTMLElement;

		let size = area.getBoundingClientRect();

		area.style.columnWidth = Math.round(size.width) + "px";
		if (browserAgent() !== "Edge" && browserAgent() !== "IE") {
			area.style.columnGap = "calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";
		}

		this.width = Math.round(size.width);
		this.height = Math.round(size.height);

		this.element = page;
		this.pagebox = pagebox;
		this.area = area;

		return page;
	}

	createWrapper(): HTMLElement {
		let wrapper = document.createElement("div");

		this.area!.appendChild(wrapper);

		this.wrapper = wrapper;

		return wrapper;
	}

	index(pgnum: number): void {
		this.position = pgnum;

		let page = this.element!;

		let index = pgnum + 1;

		let id = `page-${index}`;

		this.id = id;

		page.dataset.pageNumber = String(index);
		page.setAttribute("id", id);

		if (this.name) {
			page.classList.add("pagedjs_" + this.name + "_page");
		}

		if (this.blank) {
			page.classList.add("pagedjs_blank_page");
		}

		if (pgnum === 0) {
			page.classList.add("pagedjs_first_page");
		}

		if (this.viewMode !== "single") {
			if (pgnum % 2 !== 1) {
				page.classList.remove("pagedjs_left_page");
				page.classList.add("pagedjs_right_page");
			} else {
				page.classList.remove("pagedjs_right_page");
				page.classList.add("pagedjs_left_page");
			}
		}
	}

	async layout(contents: Node, breakToken: BreakToken | undefined, maxChars: number): Promise<BreakToken | undefined> {

		this.clear();

		this.startToken = breakToken;

		this.layoutMethod = new Layout(this.area!, this.hooks, maxChars);

		let newBreakToken = await this.layoutMethod.renderTo(this.wrapper!, contents, breakToken);

		this.addListeners(contents);

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	async append(contents: Node, breakToken: BreakToken | undefined): Promise<BreakToken | undefined> {

		if (!this.layoutMethod) {
			return this.layout(contents, breakToken);
		}

		let newBreakToken = await this.layoutMethod.renderTo(this.wrapper!, contents, breakToken);

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	getByParent(ref: string, entries: HTMLElement[]): HTMLElement | undefined {
		let e: HTMLElement;
		for (let i = 0; i < entries.length; i++) {
			e = entries[i];
			if (e.dataset.ref === ref) {
				return e;
			}
		}
	}

	onOverflow(func: (token: BreakToken) => void): void {
		this._onOverflow = func;
	}

	onUnderflow(func: (token: BreakToken) => void): void {
		this._onUnderflow = func;
	}

	clear(): void {
		this.removeListeners();
		this.wrapper && this.wrapper.remove();
		this.createWrapper();
	}

	addListeners(contents: Node): boolean {
		if (typeof ResizeObserver !== "undefined") {
			this.addResizeObserver(contents);
		} else {
			this._checkOverflowAfterResize = this.checkOverflowAfterResize.bind(this, contents);
			this.element!.addEventListener("overflow", this._checkOverflowAfterResize as EventListener, false);
			this.element!.addEventListener("underflow", this._checkOverflowAfterResize as EventListener, false);
		}

		this._onScroll = function() {
			if (this.listening) {
				this.element!.scrollLeft = 0;
			}
		}.bind(this);

		this.element!.addEventListener("scroll", this._onScroll);

		this.listening = true;

		return true;
	}

	removeListeners(): void {
		this.listening = false;

		if (typeof ResizeObserver !== "undefined" && this.ro) {
			this.ro.disconnect();
		} else if (this.element) {
			this.element.removeEventListener("overflow", this._checkOverflowAfterResize as EventListener, false);
			this.element.removeEventListener("underflow", this._checkOverflowAfterResize as EventListener, false);
		}

		this.element && this.element.removeEventListener("scroll", this._onScroll!);
	}

	addResizeObserver(contents: Node): void {
		let wrapper = this.wrapper!;
		let prevHeight = wrapper.getBoundingClientRect().height;
		this.ro = new ResizeObserver(entries => {

			if (!this.listening) {
				return;
			}

			for (let entry of entries) {
				const cr = entry.contentRect;

				if (cr.height > prevHeight) {
					this.checkOverflowAfterResize(contents);
					prevHeight = wrapper.getBoundingClientRect().height;
				} else if (cr.height < prevHeight) {
					this.checkUnderflowAfterResize(contents);
					prevHeight = cr.height;
				}
			}
		});

		this.ro.observe(wrapper);
	}

	checkOverflowAfterResize(contents: Node): void {
		if (!this.listening || !this.layoutMethod) {
			return;
		}

		let newBreakToken = this.layoutMethod.findBreakToken(this.wrapper!, contents);

		if (newBreakToken) {
			this.endToken = newBreakToken;
			this._onOverflow && this._onOverflow(newBreakToken);
		}
	}

	checkUnderflowAfterResize(contents: Node): void {
		if (!this.listening || !this.layoutMethod) {
			return;
		}

		let endToken = this.layoutMethod.findEndToken(this.wrapper!, contents);

		if (endToken) {
			this._onUnderflow && this._onUnderflow(endToken);
		}
	}

	get overset(): boolean {
		return this.endToken !== undefined && this.endToken !== null;
	}

	destroy(): void {
		this.removeListeners();

		this.element!.remove();

		this.element = undefined;
		this.wrapper = undefined;
	}
}

interface Page extends EventEmitter {}
EventEmitter(Page.prototype);

export default Page;
