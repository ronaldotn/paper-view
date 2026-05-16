import {
	getBoundingClientRect,
	getClientRects
} from "../utils/utils";
import {
	walk,
	nodeAfter,
	nodeBefore,
	rebuildAncestors,
	needsBreakBefore,
	needsPreviousBreakAfter,
	needsPageBreak,
	isElement,
	isText,
	indexOf,
	indexOfTextNode,
	cloneNode,
	findElement,
	child,
	isContainer,
	hasContent,
	validNode,
	prevValidNode,
	words,
	letters
} from "../utils/dom";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";

interface BreakToken {
	node: Node;
	offset: number;
}

interface LayoutHooks {
	layout: Hook;
	renderNode: Hook;
	layoutNode: Hook;
	beforeOverflow: Hook;
	onOverflow: Hook;
	onBreakToken: Hook;
}

const MAX_CHARS_PER_BREAK = 1500;

class Layout {

	element: HTMLElement;
	bounds: DOMRect;
	hooks: LayoutHooks;
	maxChars: number;
	chunker?: {
		hyphenateCharacter?: string;
		hyphenateLimitChars?: { before: number; after: number; total: number };
	};

	constructor(element: HTMLElement, hooks: Record<string, any> | undefined, maxChars?: number) {
		this.element = element;

		this.bounds = this.element.getBoundingClientRect();

		if (hooks) {
			this.hooks = hooks as unknown as LayoutHooks;
		} else {
			this.hooks = {} as LayoutHooks;
			this.hooks.layout = new Hook();
			this.hooks.renderNode = new Hook();
			this.hooks.layoutNode = new Hook();
			this.hooks.beforeOverflow = new Hook();
			this.hooks.onOverflow = new Hook();
			this.hooks.onBreakToken = new Hook();
		}

		this.maxChars = maxChars || MAX_CHARS_PER_BREAK;
	}

	async renderTo(wrapper: HTMLElement, source: Node, breakToken?: BreakToken, bounds: DOMRect = this.bounds): Promise<BreakToken | undefined> {
		let start = this.getStart(source, breakToken);
		let walker = walk(start, source);

		let node: Node | undefined;
		let done: boolean | undefined;
		let next: IteratorResult<Node, void>;

		let hasRenderedContent = false;
		let newBreakToken: BreakToken | undefined;

		let length = 0;

		while (!done && !newBreakToken) {
			next = walker.next();
			node = next.value;
			done = next.done;

			if (!node) {
				this.hooks && this.hooks.layout.trigger(wrapper, this);

				let imgs = wrapper.querySelectorAll("img");
				if (imgs.length) {
					await this.waitForImages(imgs);
				}

				newBreakToken = this.findBreakToken(wrapper, source, bounds);
				return newBreakToken;
			}

			this.hooks && this.hooks.layoutNode.trigger(node);

			if (hasRenderedContent && this.shouldBreak(node)) {

				this.hooks && this.hooks.layout.trigger(wrapper, this);

				let imgs = wrapper.querySelectorAll("img");
				if (imgs.length) {
					await this.waitForImages(imgs);
				}

				newBreakToken = this.findBreakToken(wrapper, source, bounds);

				if (!newBreakToken) {
					newBreakToken = this.breakAt(node);
				}

				length = 0;

				break;
			}

			let shallow = isContainer(node);

			let rendered = this.append(node, wrapper, breakToken, shallow);

			length += rendered.textContent!.length;

			if (!hasRenderedContent) {
				hasRenderedContent = hasContent(node);
			}

			if (!shallow) {
				walker = walk(nodeAfter(node, source)!, source);
			}

			if (length >= this.maxChars) {

				this.hooks && this.hooks.layout.trigger(wrapper, this);

				let imgs = wrapper.querySelectorAll("img");
				if (imgs.length) {
					await this.waitForImages(imgs);
				}

				newBreakToken = this.findBreakToken(wrapper, source, bounds);

				if (newBreakToken) {
					length = 0;
				}
			}

		}

		return newBreakToken;
	}

	breakAt(node: Node, offset: number = 0): BreakToken {
		return {
			node,
			offset
		};
	}

	shouldBreak(node: Node): boolean {
		let previousSibling = node.previousSibling;
		let parentNode = node.parentNode;
		let parentBreakBefore = needsBreakBefore(node) && parentNode && !previousSibling && needsBreakBefore(parentNode);
		let doubleBreakBefore: boolean | undefined;

		if (parentBreakBefore) {
			doubleBreakBefore = (node as Element).dataset.breakBefore === (parentNode as Element).dataset.breakBefore;
		}

		return !!(doubleBreakBefore || needsBreakBefore(node) || needsPreviousBreakAfter(node) || needsPageBreak(node));
	}

	getStart(source: Node, breakToken?: BreakToken): Node {
		let start: Node;
		let node = breakToken && breakToken.node;

		if (node) {
			start = node;
		} else {
			start = source.firstChild!;
		}

		return start;
	}

	append(node: Node, dest: HTMLElement, breakToken?: BreakToken, shallow: boolean = true, rebuild: boolean = true): Node {

		let clone = cloneNode(node, !shallow);

		if (node.parentNode && isElement(node.parentNode)) {
			let parent = findElement(node.parentNode as Element, dest);
			if (parent) {
				parent.appendChild(clone);
			} else if (rebuild) {
				let fragment = rebuildAncestors(node);
				parent = findElement(node.parentNode as Element, fragment);
				if (!parent) {
					dest.appendChild(clone);
				} else if (breakToken && isText(breakToken.node) && breakToken.offset > 0) {
					clone.textContent = clone.textContent!.substring(breakToken.offset);
					parent.appendChild(clone);
				} else {
					parent.appendChild(clone);
				}

				dest.appendChild(fragment);
			} else {
				dest.appendChild(clone);
			}


		} else {
			dest.appendChild(clone);
		}

		let nodeHooks = this.hooks.renderNode.triggerSync(clone, node);
		nodeHooks.forEach((newNode: any) => {
			if (typeof newNode != "undefined") {
				clone = newNode;
			}
		});

		return clone;
	}

	async waitForImages(imgs: NodeListOf<HTMLImageElement>): Promise<void> {
		let results = Array.from(imgs).map(async (img) => {
			return this.awaitImageLoaded(img);
		});
		await Promise.all(results);
	}

	async awaitImageLoaded(image: HTMLImageElement): Promise<void> {
		return new Promise(resolve => {
			if (image.complete !== true) {
				image.onload = function() {
					let { width, height } = window.getComputedStyle(image);
					resolve();
				};
				image.onerror = function() {
					let { width, height } = window.getComputedStyle(image);
					resolve();
				};
			} else {
				resolve();
			}
		});
	}

	avoidBreakInside(node: Node, limiter: Node): Node | undefined {
		let breakNode: Node | undefined;

		if (node === limiter) {
			return;
		}

		while (node.parentNode) {
			node = node.parentNode;

			if (node === limiter) {
				break;
			}

			if (window.getComputedStyle(node as Element)["break-inside"] === "avoid") {
				breakNode = node;
				break;
			}

		}
		return breakNode;
	}

	createBreakToken(overflow: Range, rendered: HTMLElement, source: Node): BreakToken | undefined {
		let container = overflow.startContainer;
		let offset = overflow.startOffset;
		let node: Node | undefined, renderedNode: Element | undefined, parent: Element | undefined, index: number | undefined, temp: Node | undefined;

		if (isElement(container)) {
			temp = child(container, offset);

			if (temp && isElement(temp)) {
				renderedNode = findElement(temp, rendered);

				if (!renderedNode) {
					renderedNode = findElement(prevValidNode(temp)!, rendered);
					return;
				}

				node = findElement(renderedNode, source);
				offset = 0;
			} else {
				renderedNode = findElement(container, rendered);

				if (!renderedNode) {
					renderedNode = findElement(prevValidNode(container)!, rendered);
				}

				parent = findElement(renderedNode!, source);
				index = indexOfTextNode(temp as Text, parent!);
				node = child(parent!, index);
				offset = 0;
			}
		} else {
			renderedNode = findElement(container.parentNode as Element, rendered);

			if (!renderedNode) {
				renderedNode = findElement(prevValidNode(container.parentNode as Element)!, rendered);
			}

			parent = findElement(renderedNode!, source);
			index = indexOfTextNode(container as Text, parent!);

			if (index === -1) {
				return;
			}

			node = child(parent!, index);

			offset += node.textContent!.indexOf(container.textContent!);
		}

		if (!node) {
			return;
		}

		return {
			node,
			offset
		};

	}

	findBreakToken(rendered: HTMLElement, source: Node, bounds: DOMRect = this.bounds, extract: boolean = true): BreakToken | undefined {
		let overflow = this.findOverflow(rendered, bounds);
		let breakToken: BreakToken | undefined;

		let overflowHooks = this.hooks.onOverflow.triggerSync(overflow, rendered, bounds, this);
		overflowHooks.forEach((newOverflow: any) => {
			if (typeof newOverflow != "undefined") {
				overflow = newOverflow;
			}
		});

		if (overflow) {
			breakToken = this.createBreakToken(overflow, rendered, source);

			let breakHooks = this.hooks.onBreakToken.triggerSync(breakToken, overflow, rendered, this);
			breakHooks.forEach((newToken: any) => {
				if (typeof newToken != "undefined") {
					breakToken = newToken;
				}
			});


			if (breakToken && breakToken.node && extract) {
				this.removeOverflow(overflow);
			}

		}
		return breakToken;
	}

	hasOverflow(element: HTMLElement, bounds: DOMRect = this.bounds): boolean {
		let constrainingElement = element && element.parentNode as Element;
		let { width } = element.getBoundingClientRect();
		let scrollWidth = constrainingElement ? constrainingElement.scrollWidth : 0;
		return Math.max(Math.floor(width), scrollWidth) > Math.round(bounds.width);
	}

	findOverflow(rendered: HTMLElement, bounds: DOMRect = this.bounds): Range | undefined {
		if (!this.hasOverflow(rendered, bounds)) return;

		let start = Math.round(bounds.left);
		let end = Math.round(bounds.right);
		let range: Range | undefined;

		let walker = walk(rendered.firstChild!, rendered);

		let next: IteratorResult<Node, void>, done: boolean | undefined, node: Node | undefined, offset: number | undefined, skip: boolean | undefined, breakAvoid: boolean | undefined, prev: Node | undefined, br: boolean | undefined;
		while (!done) {
			next = walker.next();
			done = next.done;
			node = next.value;
			skip = false;
			breakAvoid = false;
			prev = undefined;
			br = undefined;

			if (node) {
				let pos = getBoundingClientRect(node)!;
				let left = Math.floor(pos.left);
				let right = Math.floor(pos.right);

				if (!range && left >= end) {
					let isFloat = false;

					if (isElement(node)) {
						let styles = window.getComputedStyle(node as Element);
						isFloat = styles.getPropertyValue("float") !== "none";
						skip = styles.getPropertyValue("break-inside") === "avoid";
						breakAvoid = (node as Element).dataset.breakBefore === "avoid" || (node as Element).dataset.previousBreakAfter === "avoid";
						prev = breakAvoid && nodeBefore(node, rendered);
						br = (node as Element).tagName === "BR" || (node as Element).tagName === "WBR";
					}

					if (prev) {
						range = document.createRange();
						range.setStartBefore(prev);
						break;
					}

					if (!br && !isFloat && isElement(node)) {
						range = document.createRange();
						range.setStartBefore(node);
						break;
					}

					if (isText(node) && (node.textContent || "").trim().length) {
						range = document.createRange();
						range.setStartBefore(node);
						break;
					}

				}

				if (!range && isText(node) &&
					(node.textContent || "").trim().length &&
					window.getComputedStyle(node.parentNode as Element)["break-inside"] !== "avoid") {

					let rects = getClientRects(node)!;
					let rect: DOMRect;
					left = 0;
					for (let i = 0; i < rects.length; i++) {
						rect = rects[i];
						if (rect.width > 0 && (!left || rect.left > left)) {
							left = rect.left;
						}
					}

					if (left >= end) {
						range = document.createRange();
						offset = this.textBreak(node as Text, start, end);
						if (!offset) {
							range = undefined;
						} else {
							range.setStart(node, offset);
						}
						break;
					}
				}

				if (skip || right < end) {
					let nextNode = nodeAfter(node, rendered);
					if (nextNode) {
						walker = walk(nextNode, rendered);
					}

				}

			}
		}

		if (range) {
			range.setEndAfter(rendered.lastChild!);
			return range;
		}

	}

	findEndToken(rendered: HTMLElement, source: Node, bounds: DOMRect = this.bounds): BreakToken | undefined {
		if (rendered.childNodes.length === 0) {
			return;
		}

		let lastChild = rendered.lastChild as Node;

		let lastNodeIndex: number | undefined;
		while (lastChild && lastChild.lastChild) {
			if (!validNode(lastChild)) {
				lastChild = lastChild.previousSibling as Node;
			} else if (!validNode(lastChild.lastChild)) {
				lastChild = prevValidNode(lastChild.lastChild)!;
				break;
			} else {
				lastChild = lastChild.lastChild;
			}
		}

		if (isText(lastChild)) {

			if ((lastChild.parentNode as Element).dataset.ref) {
				lastNodeIndex = indexOf(lastChild);
				lastChild = lastChild.parentNode!;
			} else {
				lastChild = lastChild.previousSibling!;
			}
		}

		let original = findElement(lastChild as Element, source);

		if (lastNodeIndex !== undefined) {
			original = original!.childNodes[lastNodeIndex] as Element;
		}

		let after = nodeAfter(original!);

		return this.breakAt(after!);
	}

	textBreak(node: Text, start: number, end: number): number | undefined {
		let wordwalker = words(node);
		let left = 0;
		let right = 0;
		let word: Range | undefined, next: IteratorResult<Range, void>, done: boolean | undefined, pos: DOMRect;
		let offset: number | undefined;
		let parentElement = node.parentNode as Element | null;
		let hyphenMode: string | null = parentElement ? parentElement.dataset.hyphens || null : null;
		let lang = "en";

		if (parentElement) {
			let langAttr = parentElement.closest("[lang]");
			if (langAttr) {
				lang = langAttr.getAttribute("lang")!.substring(0, 2);
			}
		}

		let shouldHyphenate = hyphenMode === "auto" || hyphenMode === "manual";

		while (!done) {
			next = wordwalker.next();
			word = next.value;
			done = next.done;

			if (!word) {
				break;
			}

			pos = getBoundingClientRect(word)!;

			left = Math.floor(pos.left);
			right = Math.floor(pos.right);

			if (left >= end) {
				offset = word.startOffset;
				break;
			}

			if (right > end) {
				let wordText = word.toString();
				let hyphenBreakOffset: number | null = null;

				if (shouldHyphenate && wordText.length >= 5) {
					hyphenBreakOffset = this.findHyphenBreakPoint(word, wordText, start, end, lang);
				}

				if (hyphenBreakOffset !== null) {
					offset = hyphenBreakOffset;
					done = true;
				} else {
					let letterwalker = letters(word);
					let letter: Range | undefined, nextLetter: IteratorResult<Range, void>, doneLetter: boolean | undefined;

					while (!doneLetter) {
						nextLetter = letterwalker.next();
						letter = nextLetter.value;
						doneLetter = nextLetter.done;

						if (!letter) {
							break;
						}

						pos = getBoundingClientRect(letter)!;
						left = Math.floor(pos.left);

						if (left >= end) {
							offset = letter.startOffset;
							done = true;

							break;
						}
					}
				}
			}

		}

		return offset;
	}

	findHyphenBreakPoint(wordRange: Range, wordText: string, start: number, end: number, lang: string): number | null {
		let cleanWord = wordText.replace(/[\u00AD\u2011]/g, "");

		if (cleanWord.length < 5) {
			return null;
		}

		let hyphenPoints: number[] = []; // placeholder - would need hyphenator import
		let letterwalker = letters(wordRange);
		let letter: Range | undefined, nextLetter: IteratorResult<Range, void>, doneLetter: boolean | undefined;
		let charIndex = 0;
		let hyphenOffsets = new Set(hyphenPoints);
		let lastValidHyphen: number | null = null;

		while (!doneLetter) {
			nextLetter = letterwalker.next();
			letter = nextLetter.value;
			doneLetter = nextLetter.done;

			if (!letter) {
				break;
			}

			let pos = getBoundingClientRect(letter)!;
			let left = Math.floor(pos.left);

			if (hyphenOffsets.has(charIndex) && charIndex >= 2 && charIndex <= cleanWord.length - 2) {
				lastValidHyphen = letter.startOffset;
			}

			if (left >= end) {
				break;
			}

			if (letter.startContainer.textContent![charIndex] && !/[\u00AD\u2011]/.test(letter.startContainer.textContent![charIndex])) {
				charIndex++;
			}
		}

		return lastValidHyphen;
	}

	removeOverflow(overflow: Range): DocumentFragment {
		let { startContainer } = overflow;
		let extracted = overflow.extractContents();

		this.hyphenateAtBreak(startContainer);

		return extracted;
	}

	hyphenateAtBreak(startContainer: Node): void {
		if (isText(startContainer)) {
			let startText = startContainer.textContent || "";
			let prevLetter = startText[startText.length - 1];
			let parentElement = startContainer.parentNode as Element | null;
			let hyphenMode = parentElement ? parentElement.dataset.hyphens : null;

			if (hyphenMode === "none") {
				return;
			}

			let hyphenChar = this.chunker && this.chunker.hyphenateCharacter ? this.chunker.hyphenateCharacter : "\u2011";

			if (hyphenMode === "manual" || hyphenMode === "auto") {
				if (/^\w|\u00AD$/.test(prevLetter)) {
					parentElement!.classList.add("pagedjs_hyphen");

					if (hyphenMode === "auto") {
						let lang = "en";
						let langAttr = parentElement!.closest("[lang]");
						if (langAttr) {
							lang = langAttr.getAttribute("lang")!.substring(0, 2);
						}

						let options = {
							hyphenCharacter: hyphenChar,
							minWordLength: 5,
							minCharsBefore: 2,
							minCharsAfter: 2
						};

						if (this.chunker && this.chunker.hyphenateLimitChars) {
							options.minCharsBefore = this.chunker.hyphenateLimitChars.before;
							options.minCharsAfter = this.chunker.hyphenateLimitChars.after;
							options.minWordLength = this.chunker.hyphenateLimitChars.total;
						}

						let lastWordMatch = startText.match(/([\w\u00C0-\u024F]+)[\s\u00AD]*$/);
						if (lastWordMatch && lastWordMatch[1].length >= options.minWordLength) {
							let lastWord = lastWordMatch[1];
							let hyphenatedWord = ""; // placeholder - would need hyphenator import

							if (hyphenatedWord !== lastWord) {
								let wordStartIndex = lastWordMatch.index!;
								let beforeWord = startText.substring(0, wordStartIndex);
								startContainer.textContent = beforeWord + hyphenatedWord;
								return;
							}
						}
					}

					startContainer.textContent += hyphenChar;
				}
			} else {
				if (/^\w|\u00AD$/.test(prevLetter)) {
					parentElement!.classList.add("pagedjs_hyphen");
					startContainer.textContent += "\u2011";
				}
			}
		}
	}
}

interface Layout extends EventEmitter {}
EventEmitter(Layout.prototype);

export default Layout;
