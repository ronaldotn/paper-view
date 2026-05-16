import { UUID } from "../utils/utils";
import { isElement } from "../utils/dom";

class ContentParser {
	dom: DocumentFragment | undefined;
	refs: Record<string, Element> | undefined;

	constructor(content: string | Node | null | undefined, cb?: () => void) {
		try {
			if (content && (content as Node).nodeType) {
				this.dom = this.add(content as Node);
			} else if (typeof content === "string") {
				this.dom = this.parse(content);
			}
		} catch (e) {
			console.warn("ContentParser: parse error:", e);
		}
		return this.dom;
	}

	parse(markup: string, mime?: string): DocumentFragment {
		let range = document.createRange();
		let fragment = range.createContextualFragment(markup);

		this.addRefs(fragment);
		this.removeEmpty(fragment);

		return fragment;
	}

	add(contents: Node): DocumentFragment {
		let fragment = document.createDocumentFragment();

		let children = [...contents.childNodes] as Node[];
		for (let child of children) {
			let clone = child.cloneNode(true);
			fragment.appendChild(clone);
		}

		this.addRefs(fragment);
		this.removeEmpty(fragment);

		return fragment;
	}

	addRefs(content: Node): void {
		let treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_ELEMENT,
			{ acceptNode: function(node: Node) { return NodeFilter.FILTER_ACCEPT; } },
			false
		);

		let node = treeWalker.nextNode() as Element | null;
		while (node) {

			if (!node.hasAttribute("data-ref")) {
				let uuid = UUID();
				node.setAttribute("data-ref", uuid);
			}

			if (node.id) {
				node.setAttribute("data-id", node.id);
			}

			node = treeWalker.nextNode() as Element | null;
		}
	}

	removeEmpty(content: Node): void {
		let treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_TEXT,
			{ acceptNode: function(node: Node) {
				if ((node.textContent || "").length > 1 && !(node.textContent || "").trim()) {

					let parent = node.parentNode;
					let pre = isElement(parent) && (parent as Element).closest("pre");
					if (pre) {
						return NodeFilter.FILTER_REJECT;
					}

					return NodeFilter.FILTER_ACCEPT;
				} else {
					return NodeFilter.FILTER_REJECT;
				}
			} },
			false
		);

		let node: Node | null;
		let current: Node | null;
		node = treeWalker.nextNode();
		while (node) {
			current = node;
			node = treeWalker.nextNode();
			current.parentNode!.removeChild(current);
		}
	}

	find(ref: string): Element | undefined {
		return this.refs ? this.refs[ref] : undefined;
	}

	isText(node: Node): boolean {
		return node.nodeType === 3;
	}

	isElement(node: Node): boolean {
		return node.nodeType === 1;
	}

	hasChildren(node: Node): boolean {
		return !!(node.childNodes && node.childNodes.length);
	}

	destroy(): void {
		this.refs = undefined;
		this.dom = undefined;
	}
}

export default ContentParser;
