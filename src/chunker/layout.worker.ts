interface LayoutState {
	source: SerializedNode | null;
	bounds: Bounds | null;
	maxChars: number;
	breakToken: unknown;
	hooks: unknown;
}

interface Bounds {
	width?: number;
	height?: number;
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
}

interface SerializedNode {
	nodeType: number;
	tagName: string | null;
	textContent: string | null;
	dataRef: string | null;
	breakBefore: string | null;
	previousBreakAfter: string | null;
	breakInside: string | null;
	page: string | null;
	children: SerializedNode[];
}

interface TempTextNode {
	nodeType: number;
	textContent: string;
}

interface TempElementNode {
	nodeType: number;
	tagName: string;
	dataset: Record<string, string>;
	childNodes: (TempTextNode | TempElementNode)[];
	children: (TempTextNode | TempElementNode)[];
	appendChild: (child: TempTextNode | TempElementNode) => void;
}

interface TempDoc {
	createTextNode: (text: string) => TempTextNode;
	createElement: (tag: string) => TempElementNode;
}

interface LayoutTask {
	serializedSource: SerializedNode | null;
	bounds: Bounds | null;
	maxChars: number;
	breakTokenIndex: number | null;
	taskId?: number;
}

interface LayoutResult {
	nodesProcessed: number;
	breakFound: boolean;
	breakNodeIndex: number | null;
	hasMoreContent: boolean;
	error?: string;
}

interface WorkerMessage {
	type: string;
	payload?: {
		serializedSource?: SerializedNode;
		bounds?: Bounds;
		maxChars?: number;
		workerId?: number;
		taskId?: number;
	};
	taskId?: number;
	result?: LayoutResult;
	error?: string;
	workerId?: number;
}

let layoutState: LayoutState = {
	source: null,
	bounds: null,
	maxChars: 1500,
	breakToken: null,
	hooks: null
};

function serializeNode(node: Node): SerializedNode | null {
	if (!node) return null;

	const serialized: SerializedNode = {
		nodeType: node.nodeType,
		tagName: (node as Element).tagName || null,
		textContent: node.textContent || null,
		dataRef: (node as Element).dataset && (node as Element).dataset.ref || null,
		breakBefore: (node as Element).dataset && (node as Element).dataset.breakBefore || null,
		previousBreakAfter: (node as Element).dataset && (node as Element).dataset.previousBreakAfter || null,
		breakInside: (node as Element).dataset && (node as Element).dataset.breakInside || null,
		page: (node as Element).dataset && (node as Element).dataset.page || null,
		children: []
	};

	if (node.childNodes && node.childNodes.length > 0) {
		for (let i = 0; i < node.childNodes.length; i++) {
			const child = serializeNode(node.childNodes[i]);
			if (child) {
				serialized.children.push(child);
			}
		}
	}

	return serialized;
}

function deserializeNode(serialized: SerializedNode | null, document: TempDoc): TempTextNode | TempElementNode | null {
	if (!serialized) return null;

	let node: TempTextNode | TempElementNode;
	if (serialized.nodeType === 3) {
		node = document.createTextNode(serialized.textContent || "");
	} else if (serialized.nodeType === 1) {
		node = document.createElement(serialized.tagName);
		if (serialized.dataRef) {
			node.dataset.ref = serialized.dataRef;
		}
		if (serialized.breakBefore) {
			node.dataset.breakBefore = serialized.breakBefore;
		}
		if (serialized.previousBreakAfter) {
			node.dataset.previousBreakAfter = serialized.previousBreakAfter;
		}
		if (serialized.breakInside) {
			node.dataset.breakInside = serialized.breakInside;
		}
		if (serialized.page) {
			node.dataset.page = serialized.page;
		}

		if (serialized.children) {
			for (let i = 0; i < serialized.children.length; i++) {
				const child = deserializeNode(serialized.children[i], document);
				if (child) {
					(node as TempElementNode).appendChild(child);
				}
			}
		}
	} else {
		return null;
	}

	return node;
}

interface WalkResult {
	next: () => { done: boolean; value: TempTextNode | TempElementNode | null };
}

function walk(start: TempTextNode | TempElementNode | null, source: TempTextNode | TempElementNode): WalkResult {
	let node: TempTextNode | TempElementNode | null = start;
	let first = true;

	return {
		next: function() {
			if (!node) {
				return { done: true, value: null };
			}

			if (first) {
				first = false;
				return { done: false, value: node };
			}

			if ((node as TempElementNode).childNodes && (node as TempElementNode).childNodes.length) {
				node = (node as TempElementNode).childNodes[0] as TempTextNode | TempElementNode;
				return { done: false, value: node };
			}

			if ((node as TempElementNode | TempTextNode).nextSibling) {
				node = (node as TempElementNode | TempTextNode).nextSibling as TempTextNode | TempElementNode | null;
				return { done: false, value: node };
			}

			while ((node as TempElementNode | TempTextNode).parentNode) {
				node = (node as TempElementNode | TempTextNode).parentNode as TempTextNode | TempElementNode | null;
				if (node === source) {
					node = null;
					return { done: true, value: null };
				}
				if ((node as TempElementNode).nextSibling) {
					node = (node as TempElementNode).nextSibling as TempTextNode | TempElementNode;
					return { done: false, value: node };
				}
			}

			return { done: true, value: null };
		}
	};
}

function nodeAfter(node: TempTextNode | TempElementNode | null, source: TempTextNode | TempElementNode): TempTextNode | TempElementNode | null {
	if (!node) return null;

	if ((node as TempElementNode).childNodes && (node as TempElementNode).childNodes.length) {
		return (node as TempElementNode).childNodes[0] as TempTextNode | TempElementNode;
	}

	while (node) {
		if ((node as TempElementNode).nextSibling) {
			return (node as TempElementNode).nextSibling as TempTextNode | TempElementNode;
		}
		node = (node as TempElementNode).parentNode as TempTextNode | TempElementNode | null;
		if (node === source) {
			return null;
		}
	}

	return null;
}

function needsBreakBefore(node: TempTextNode | TempElementNode | null): boolean {
	if (!node || !(node as TempElementNode).dataset) return false;
	const val = (node as TempElementNode).dataset.breakBefore;
	return val === "page" || val === "always" || val === "left" || val === "right" || val === "recto" || val === "verso";
}

function needsPreviousBreakAfter(node: TempTextNode | TempElementNode | null): boolean {
	if (!node || !(node as TempElementNode).dataset) return false;
	const val = (node as TempElementNode).dataset.previousBreakAfter;
	return val === "page" || val === "always" || val === "left" || val === "right" || val === "recto" || val === "verso";
}

function calculateLayout(task: LayoutTask): LayoutResult {
	const { serializedSource, bounds, maxChars, breakTokenIndex } = task;

	if (!serializedSource) {
		return { error: "Serialized source is null or undefined", nodesProcessed: 0, breakFound: false, breakNodeIndex: null, hasMoreContent: false };
	}

	const tempDoc: TempDoc = {
		createTextNode: (text: string) => ({ nodeType: 3, textContent: text }),
		createElement: (tag: string) => {
			const el: TempElementNode = { nodeType: 1, tagName: tag, dataset: {}, childNodes: [], children: [] };
			el.appendChild = function(child: TempTextNode | TempElementNode) {
				this.childNodes.push(child);
			};
			return el;
		}
	};

	const source = deserializeNode(serializedSource, tempDoc);
	if (!source) {
		return { error: "Failed to deserialize source", nodesProcessed: 0, breakFound: false, breakNodeIndex: null, hasMoreContent: false };
	}

	let currentBreakToken: { node: TempTextNode | TempElementNode | null; offset: number } | null = breakTokenIndex != null ? { node: findNodeByIndex(source, breakTokenIndex), offset: 0 } : null;
	let nodesProcessed = 0;
	let breakFound = false;
	let breakNodeIndex: number | null = null;

	const startNode = currentBreakToken && currentBreakToken.node ? currentBreakToken.node : (source as TempElementNode).childNodes && (source as TempElementNode).childNodes[0] || null;
	const walker = walk(startNode, source);

	let result: { done: boolean; value: TempTextNode | TempElementNode | null };
	while ((result = walker.next()) && !result.done) {
		const node = result.value;
		if (!node) continue;
		nodesProcessed++;

		if (needsBreakBefore(node)) {
			breakFound = true;
			breakNodeIndex = getNodeIndex(source, node);
			break;
		}

		if (needsPreviousBreakAfter(node)) {
			breakFound = true;
			breakNodeIndex = getNodeIndex(source, node);
			break;
		}

		if (nodesProcessed >= maxChars) {
			breakFound = true;
			breakNodeIndex = getNodeIndex(source, node);
			break;
		}
	}

	return {
		nodesProcessed,
		breakFound,
		breakNodeIndex,
		hasMoreContent: !result.done || (result.done && !breakFound)
	};
}

function findNodeByIndex(node: TempTextNode | TempElementNode | null, targetIndex: number, currentIndex: { value: number } = { value: 0 }): TempTextNode | TempElementNode | null {
	if (!node) return null;

	if (currentIndex.value === targetIndex) {
		return node;
	}

	currentIndex.value++;

	if ((node as TempElementNode).children) {
		for (let i = 0; i < (node as TempElementNode).children.length; i++) {
			const found = findNodeByIndex((node as TempElementNode).children[i] as TempTextNode | TempElementNode, targetIndex, currentIndex);
			if (found) return found;
		}
	}

	return null;
}

function getNodeIndex(source: TempTextNode | TempElementNode | null, targetNode: TempTextNode | TempElementNode | null, currentIndex: { value: number } = { value: 0 }): number {
	if (!source || !targetNode) return -1;

	if (source === targetNode) {
		return currentIndex.value;
	}

	currentIndex.value++;

	if ((source as TempElementNode).children) {
		for (let i = 0; i < (source as TempElementNode).children.length; i++) {
			const index = getNodeIndex((source as TempElementNode).children[i] as TempTextNode | TempElementNode, targetNode, currentIndex);
			if (index !== -1) return index;
		}
	}

	return -1;
}

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
	const { type, payload } = e.data;

	switch (type) {
		case "CALCULATE_LAYOUT":
			try {
				if (!payload || !payload.serializedSource) {
					throw new Error("Invalid payload: missing serializedSource");
				}
				const result = calculateLayout(payload as unknown as LayoutTask);
				(self as unknown as Worker).postMessage({
					type: "LAYOUT_RESULT",
					taskId: payload.taskId,
					result: result
				});
			} catch (error: unknown) {
				const err = error as Error;
				(self as unknown as Worker).postMessage({
					type: "LAYOUT_ERROR",
					taskId: payload ? payload.taskId : null,
					error: err.message + " at " + (err.stack || "").split("\n")[1]
				});
			}
			break;

		case "INIT":
			layoutState = {
				source: payload!.serializedSource || null,
				bounds: payload!.bounds || null,
				maxChars: payload!.maxChars || 1500,
				breakToken: null,
				hooks: null
			};
			(self as unknown as Worker).postMessage({
				type: "INITIALIZED",
				workerId: payload!.workerId
			});
			break;

		case "PING":
			(self as unknown as Worker).postMessage({ type: "PONG" });
			break;

		default:
			(self as unknown as Worker).postMessage({
				type: "ERROR",
				error: `Unknown message type: ${type}`
			});
	}
};

(self as unknown as Worker).postMessage({ type: "WORKER_READY" });
