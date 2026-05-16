export function getBoundingClientRect(element: Node | null | undefined): DOMRect | undefined {
	if (!element) {
		return;
	}
	let rect: DOMRect;
	if (typeof (element as any).getBoundingClientRect !== "undefined") {
		rect = (element as Element).getBoundingClientRect();
	} else {
		const range = document.createRange();
		range.selectNode(element);
		rect = range.getBoundingClientRect();
	}
	return rect;
}

export function getClientRects(element: Node | null | undefined): DOMRectList | undefined {
	if (!element) {
		return;
	}
	let rect: DOMRectList;
	if (typeof (element as any).getClientRects !== "undefined") {
		rect = (element as Element).getClientRects();
	} else {
		const range = document.createRange();
		range.selectNode(element);
		rect = range.getClientRects();
	}
	return rect;
}

export function UUID(): string {
	let d = new Date().getTime();
	if (typeof performance !== "undefined" && typeof performance.now === "function"){
		d += performance.now();
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c: string) {
		const r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

export function positionInNodeList(element: Node, nodeList: NodeList | Node[] | HTMLCollection): number {
	for (let i = 0; i < nodeList.length; i++) {
		if (element === nodeList[i]) {
			return i;
		}
	}
	return -1;
}

export function findCssSelector(ele: Element): string | undefined {
	const doc = ele.ownerDocument!;
	const cssEscape = window.CSS.escape;

	if (ele.id &&
			doc.querySelectorAll("#" + cssEscape(ele.id)).length === 1) {
		return "#" + cssEscape(ele.id);
	}

	const tagName = ele.localName;
	if (tagName === "html") {
		return "html";
	}
	if (tagName === "head") {
		return "head";
	}
	if (tagName === "body") {
		return "body";
	}

	let selector: string | undefined, index: number, matches: NodeListOf<Element>;
	if (ele.classList.length > 0) {
		for (let i = 0; i < ele.classList.length; i++) {
			selector = "." + cssEscape(ele.classList.item(i)!);
			matches = doc.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			selector = cssEscape(tagName) + selector;
			matches = doc.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			index = positionInNodeList(ele, ele.parentNode!.children) + 1;
			selector = selector + ":nth-child(" + index + ")";
			matches = doc.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
		}
	}

	if (ele.parentNode !== doc && ele.parentNode!.nodeType === 1) {
		index = positionInNodeList(ele, ele.parentNode!.children) + 1;
		selector = findCssSelector(ele.parentNode as Element) + " > " +
			cssEscape(tagName) + ":nth-child(" + index + ")";
	}

	return selector;
}

export function attr(element: Element, attributes: string[]): string | null | undefined {
	for (let i = 0; i < attributes.length; i++) {
		if(element.hasAttribute(attributes[i])) {
			return element.getAttribute(attributes[i]);
		}
	}
}

export function querySelectorEscape(value: string): string {
	if (arguments.length == 0) {
		throw new TypeError("`CSS.escape` requires an argument.");
	}
	const string = String(value);
	const length = string.length;
	let index = -1;
	let codeUnit: number;
	let result = "";
	const firstCodeUnit = string.charCodeAt(0);
	while (++index < length) {
		codeUnit = string.charCodeAt(index);
		if (codeUnit == 0x0000) {
			result += "\uFFFD";
			continue;
		}

		if (
			(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
			(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			(
				index == 1 &&
				codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
				firstCodeUnit == 0x002D
			)
		) {
			result += "\\" + codeUnit.toString(16) + " ";
			continue;
		}

		if (
			index == 0 &&
			length == 1 &&
			codeUnit == 0x002D
		) {
			result += "\\" + string.charAt(index);
			continue;
		}

		if (
			codeUnit >= 0x0080 ||
			codeUnit == 0x002D ||
			codeUnit == 0x005F ||
			codeUnit == 35 ||
			codeUnit == 46 ||
			codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
			codeUnit >= 0x0041 && codeUnit <= 0x005A ||
			codeUnit >= 0x0061 && codeUnit <= 0x007A
		) {
			result += string.charAt(index);
			continue;
		}

		result += "\\" + string.charAt(index);
	}
	return result;
}

export function defer(this: any): void {
	this.resolve = null;
	this.reject = null;
	this.id = UUID();
	this.promise = new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
		this.resolve = resolve;
		this.reject = reject;
	});
	Object.freeze(this);
}

export const requestIdleCallback: any = typeof window !== "undefined" && ("requestIdleCallback" in window ? (window as any).requestIdleCallback : (window as any).requestAnimationFrame);

interface CSSValueObject {
	value: string | number;
	unit?: string;
}

export function CSSValueToString(obj: CSSValueObject): string {
	return obj.value + (obj.unit || "");
}

export function browserAgent(): string {
	if (window.navigator.userAgent.indexOf("Edge/") > 0) {
		return "Edge";
	} else if (window.navigator.userAgent.indexOf("Trident/") > 0) {
		return "IE";
	} else if (window.navigator.userAgent.indexOf("Firefox/") > 0) {
		return "Firefox";
	} else if (window.navigator.userAgent.indexOf("Chrome/") > 0) {
		return "Chrome";
	} else {
		return "unknown";
	}
}
