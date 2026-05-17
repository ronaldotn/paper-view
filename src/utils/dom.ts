export function isElement(node: Node | null | undefined): node is Element {
	return !!(node && node.nodeType === 1);
}

export function isText(node: Node | null | undefined): node is Text {
	return !!(node && node.nodeType === 3);
}

export function *walk(start: Node | null | undefined, limiter?: Node | null): Generator<Node, void, undefined> {
	let node = start;

	while (node) {
		yield node;

		if (node.childNodes.length) {
			node = node.firstChild;
		} else if (node.nextSibling) {
			if (limiter && node === limiter) {
				node = undefined;
				break;
			}
			node = node.nextSibling;
		} else {
			while (node) {
				node = node.parentNode;
				if (limiter && node === limiter) {
					node = undefined;
					break;
				}
				if (node && node.nextSibling) {
					node = node.nextSibling;
					break;
				}
			}
		}
	}
}

export function nodeAfter(node: Node, limiter?: Node | null): Node | null | undefined {
	let after: Node | null | undefined = node;

	if (after.nextSibling) {
		if (limiter && node === limiter) {
			return;
		}
		after = after.nextSibling;
	} else {
		while (after) {
			after = after.parentNode;
			if (limiter && after === limiter) {
				after = undefined;
				break;
			}
			if (after && after.nextSibling) {
				after = after.nextSibling;
				break;
			}
		}
	}

	return after;
}

export function nodeBefore(node: Node, limiter?: Node | null): Node | null | undefined {
	let before: Node | null | undefined = node;
	if (before.previousSibling) {
		if (limiter && node === limiter) {
			return;
		}
		before = before.previousSibling;
	} else {
		while (before) {
			before = before.parentNode;
			if (limiter && before === limiter) {
				before = undefined;
				break;
			}
			if (before && before.previousSibling) {
				before = before.previousSibling;
				break;
			}
		}
	}

	return before;
}

export function elementAfter(node: Node, limiter?: Node | null): Element | null | undefined {
	let after = nodeAfter(node, limiter);

	while (after && after.nodeType !== 1) {
		after = nodeAfter(after, limiter);
	}

	return after as Element | null | undefined;
}

export function elementBefore(node: Node, limiter?: Node | null): Element | null | undefined {
	let before = nodeBefore(node, limiter);

	while (before && before.nodeType !== 1) {
		before = nodeBefore(before, limiter);
	}

	return before as Element | null | undefined;
}

export function stackChildren(currentNode: Element, stacked?: Element[]): Element[] {
	const stack = stacked || [];

	stack.unshift(currentNode);

	const children = currentNode.children;
	for (let i = 0, length = children.length; i < length; i++) {
		stackChildren(children[i] as Element, stack);
	}

	return stack;
}

export function rebuildAncestors(node: Node): DocumentFragment {
	let parent: HTMLElement;
	let ancestor: HTMLElement;
	const ancestors: HTMLElement[] = [];
	let added: HTMLElement[] = [];

	const fragment = document.createDocumentFragment();

	let element: Node | null = node;
	while(element.parentNode && element.parentNode.nodeType === 1) {
		ancestors.unshift(element.parentNode as HTMLElement);
		element = element.parentNode;
	}

	for (let i = 0; i < ancestors.length; i++) {
		ancestor = ancestors[i];
		parent = ancestor.cloneNode(false) as HTMLElement;

		parent.dataset.splitFrom = parent.getAttribute("data-ref")!;

		if (parent.hasAttribute("id")) {
			const dataID = parent.getAttribute("id")!;
			parent.dataset.id = dataID;
			parent.removeAttribute("id");
		}

		if (parent.hasAttribute("data-break-before")) {
			parent.removeAttribute("data-break-before");
		}

		if (parent.hasAttribute("data-previous-break-after")) {
			parent.removeAttribute("data-previous-break-after");
		}

		if (added.length) {
			const container = added[added.length-1];
			container.appendChild(parent);
		} else {
			fragment.appendChild(parent);
		}
		added.push(parent);
	}

	(added as any) = undefined;
	return fragment;
}

export function needsBreakBefore(node: any): boolean {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakBefore !== "undefined" &&
			(node.dataset.breakBefore === "always" ||
			 node.dataset.breakBefore === "page" ||
			 node.dataset.breakBefore === "left" ||
			 node.dataset.breakBefore === "right" ||
			 node.dataset.breakBefore === "recto" ||
			 node.dataset.breakBefore === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsBreakAfter(node: any): boolean {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakAfter !== "undefined" &&
			(node.dataset.breakAfter === "always" ||
			 node.dataset.breakAfter === "page" ||
			 node.dataset.breakAfter === "left" ||
			 node.dataset.breakAfter === "right" ||
			 node.dataset.breakAfter === "recto" ||
			 node.dataset.breakAfter === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsPreviousBreakAfter(node: any): boolean {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.previousBreakAfter !== "undefined" &&
			(node.dataset.previousBreakAfter === "always" ||
			 node.dataset.previousBreakAfter === "page" ||
			 node.dataset.previousBreakAfter === "left" ||
			 node.dataset.previousBreakAfter === "right" ||
			 node.dataset.previousBreakAfter === "recto" ||
			 node.dataset.previousBreakAfter === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsPageBreak(node: any): boolean {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			(node.dataset.page || node.dataset.afterPage)
		 ) {
		return true;
	}

	return false;
}

export function *words(node: Text): Generator<Range, void, undefined> {
	const currentText = node.nodeValue!;
	const max = currentText.length;
	let currentOffset = 0;

	let range: Range | undefined;

	while(currentOffset < max) {
		const currentLetter = currentText[currentOffset];
		if (/^[\S\u202F\u00A0]$/.test(currentLetter)) {
			if (!range) {
				range = document.createRange();
				range.setStart(node, currentOffset);
			}
		} else {
			if (range) {
				range.setEnd(node, currentOffset);
				yield range;
				range = undefined;
			}
		}

		currentOffset += 1;
	}

	if (range) {
		range.setEnd(node, currentOffset);
		yield range;
		range = undefined;
	}
}

export function *letters(wordRange: Range): Generator<Range, void, undefined> {
	const currentText: Text = wordRange.startContainer as Text;
	const max = currentText.length;
	let currentOffset = wordRange.startOffset;

	let range: Range;

	while(currentOffset < max) {
		 range = document.createRange();
		 range.setStart(currentText, currentOffset);
		 range.setEnd(currentText, currentOffset+1);

		 yield range;

		 currentOffset += 1;
	}
}

export function isContainer(node: any): boolean {
	let container: boolean;

	if (typeof (node as any).tagName === "undefined") {
		return true;
	}

	if (node.style.display === "none") {
		return false;
	}

	switch (node.tagName) {
		case "A":
		case "ABBR":
		case "ACRONYM":
		case "B":
		case "BDO":
		case "BIG":
		case "BR":
		case "BUTTON":
		case "CITE":
		case "CODE":
		case "DFN":
		case "EM":
		case "I":
		case "IMG":
		case "INPUT":
		case "KBD":
		case "LABEL":
		case "MAP":
		case "OBJECT":
		case "Q":
		case "SAMP":
		case "SCRIPT":
		case "SELECT":
		case "SMALL":
		case "SPAN":
		case "STRONG":
		case "SUB":
		case "SUP":
		case "TEXTAREA":
		case "TIME":
		case "TT":
		case "VAR":
		case "P":
		case "H1":
		case "H2":
		case "H3":
		case "H4":
		case "H5":
		case "H6":
		case "FIGCAPTION":
		case "BLOCKQUOTE":
		case "PRE":
		case "LI":
		case "TR":
		case "DT":
		case "DD":
		case "VIDEO":
		case "CANVAS":
			container = false;
			break;
		default:
			container = true;
	}

	return container;
}

export function cloneNode<T extends Node>(n: T, deep: boolean = false): T {
	return n.cloneNode(deep) as T;
}

export function findElement(node: Element, doc: Document): HTMLElement | null {
	const ref = node.getAttribute("data-ref");
	return findRef(ref, doc);
}

export function findRef(ref: string | null, doc: Document): HTMLElement | null {
	if (!ref) return null;
	const safeRef = ref.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
	return doc.querySelector(`[data-ref='${safeRef}']`);
}

export function validNode(node: Node): boolean {
	if (isText(node)) {
		return true;
	}

	if (isElement(node) && (node as HTMLElement).dataset.ref) {
		return true;
	}

	return false;
}

export function prevValidNode(node: Node | null): Node | null {
	while (!validNode(node!)) {
		if (node!.previousSibling) {
			node = node!.previousSibling;
		} else {
			node = node!.parentNode;
		}

		if (!node) {
			break;
		}
	}

	return node;
}

export function nextValidNode(node: Node | null): Node | null {
	while (!validNode(node!)) {
		if (node!.nextSibling) {
			node = node!.nextSibling;
		} else {
			node = node!.parentNode!.nextSibling;
		}

		if (!node) {
			break;
		}
	}

	return node;
}

export function indexOf(node: Node): number {
	const parent = node.parentNode;
	if (!parent) {
		return 0;
	}
	return Array.prototype.indexOf.call(parent.childNodes, node);
}

export function child(node: Node, index: number): ChildNode | null {
	return node.childNodes[index];
}

export function isVisible(node: Node): boolean {
	if (isElement(node) && window.getComputedStyle(node).display !== "none") {
		return true;
	} else if (isText(node) &&
			hasTextContent(node) &&
			window.getComputedStyle(node.parentNode as HTMLElement).display !== "none") {
		return true;
	}
	return false;
}

export function hasContent(node: Node): boolean {
	if (isElement(node)) {
		return true;
	} else if (isText(node) &&
			node.textContent!.trim().length) {
		return true;
	}
	return false;
}

export function hasTextContent(node: Node): boolean {
	if (isElement(node)) {
		let child: ChildNode;
		for (let i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes[i];
			if (child && isText(child) && child.textContent!.trim().length) {
				return true;
			}
		}
	} else if (isText(node) &&
			node.textContent!.trim().length) {
		return true;
	}
	return false;
}

export function indexOfTextNode(node: Text, parent: Node): number {
	if (!isText(node)) {
		return -1;
	}
	const nodeTextContent = node.textContent!;
	let child: ChildNode;
	let index = -1;
	for (let i = 0; i < parent.childNodes.length; i++) {
		child = parent.childNodes[i];
		if (child.nodeType === 3) {
			const text = parent.childNodes[i].textContent!;
			if (text.includes(nodeTextContent)) {
				index = i;
				break;
			}
		}
	}

	return index;
}
