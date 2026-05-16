/**
 * Layout Worker
 * Handles layout calculations off the main thread
 * Communicates with main thread via postMessage
 */

let layoutState = {
	source: null,
	bounds: null,
	maxChars: 1500,
	breakToken: null,
	hooks: null
};

function serializeNode(node) {
	if (!node) return null;

	const serialized = {
		nodeType: node.nodeType,
		tagName: node.tagName || null,
		textContent: node.textContent || null,
		dataRef: node.dataset && node.dataset.ref || null,
		breakBefore: node.dataset && node.dataset.breakBefore || null,
		previousBreakAfter: node.dataset && node.dataset.previousBreakAfter || null,
		breakInside: node.dataset && node.dataset.breakInside || null,
		page: node.dataset && node.dataset.page || null,
		children: []
	};

	if (node.childNodes && node.childNodes.length > 0) {
		for (let i = 0; i < node.childNodes.length; i++) {
			serialized.children.push(serializeNode(node.childNodes[i]));
		}
	}

	return serialized;
}

function deserializeNode(serialized, document) {
	if (!serialized) return null;

	let node;
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
					node.appendChild(child);
				}
			}
		}
	}

	return node;
}

function walk(start, source) {
	let node = start;
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

			if (node.firstChild) {
				node = node.firstChild;
				return { done: false, value: node };
			}

			if (node.nextSibling) {
				node = node.nextSibling;
				return { done: false, value: node };
			}

			while (node.parentNode) {
				node = node.parentNode;
				if (node === source) {
					node = null;
					return { done: true, value: null };
				}
				if (node.nextSibling) {
					node = node.nextSibling;
					return { done: false, value: node };
				}
			}

			return { done: true, value: null };
		}
	};
}

function nodeAfter(node, source) {
	if (!node) return null;

	if (node.firstChild) {
		return node.firstChild;
	}

	while (node) {
		if (node.nextSibling) {
			return node.nextSibling;
		}
		node = node.parentNode;
		if (node === source) {
			return null;
		}
	}

	return null;
}

function needsBreakBefore(node) {
	if (!node || !node.dataset) return false;
	const val = node.dataset.breakBefore;
	return val === "page" || val === "always" || val === "left" || val === "right" || val === "recto" || val === "verso";
}

function needsPreviousBreakAfter(node) {
	if (!node || !node.dataset) return false;
	const val = node.dataset.previousBreakAfter;
	return val === "page" || val === "always" || val === "left" || val === "right" || val === "recto" || val === "verso";
}

function isContainer(node) {
	if (!node || node.nodeType !== 1) return false;
	const tag = node.tagName.toLowerCase();
	return ["div", "section", "article", "main", "aside", "header", "footer", "nav", "figure", "table", "ul", "ol", "dl"].includes(tag);
}

function cloneNode(node, deep) {
	if (!node) return null;

	let clone;
	if (node.nodeType === 3) {
		clone = { type: "text", content: node.textContent };
	} else if (node.nodeType === 1) {
		clone = {
			type: "element",
			tag: node.tagName,
			attrs: {},
			children: deep && node.children ? Array.from(node.children).map(c => cloneNode(c, true)) : []
		};

		if (node.dataset) {
			for (const key in node.dataset) {
				clone.attrs[key] = node.dataset[key];
			}
		}
	}

	return clone;
}

function calculateLayout(task) {
	const { serializedSource, bounds, maxChars, breakTokenIndex } = task;

	if (!serializedSource) {
		return { error: "Serialized source is null or undefined" };
	}

	const tempDoc = {
		createTextNode: (text) => ({ nodeType: 3, textContent: text }),
		createElement: (tag) => {
			const el = { nodeType: 1, tagName: tag, dataset: {}, childNodes: [] };
			el.children = el.childNodes;
			el.appendChild = function(child) {
				this.childNodes.push(child);
			};
			return el;
		}
	};

	const source = deserializeNode(serializedSource, tempDoc);
	if (!source) {
		return { error: "Failed to deserialize source" };
	}

	const boundsObj = {
		width: bounds ? bounds.width : 800,
		height: bounds ? bounds.height : 1000,
		left: (bounds && bounds.left) || 0,
		right: (bounds && bounds.right) || (bounds ? bounds.width : 800),
		top: (bounds && bounds.top) || 0,
		bottom: (bounds && bounds.bottom) || (bounds ? bounds.height : 1000)
	};

	let currentBreakToken = breakTokenIndex != null ? { node: findNodeByIndex(source, breakTokenIndex), offset: 0 } : null;
	let nodesProcessed = 0;
	let breakFound = false;
	let breakNodeIndex = null;

	const startNode = currentBreakToken && currentBreakToken.node ? currentBreakToken.node : source.childNodes && source.childNodes[0];
	const walker = walk(startNode, source);

	let result;
	while ((result = walker.next()) && !result.done) {
		const node = result.value;
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

function findNodeByIndex(node, targetIndex, currentIndex = { value: 0 }) {
	if (!node) return null;

	if (currentIndex.value === targetIndex) {
		return node;
	}

	currentIndex.value++;

	if (node.children) {
		for (let i = 0; i < node.children.length; i++) {
			const found = findNodeByIndex(node.children[i], targetIndex, currentIndex);
			if (found) return found;
		}
	}

	return null;
}

function getNodeIndex(source, targetNode, currentIndex = { value: 0 }) {
	if (!source || !targetNode) return -1;

	if (source === targetNode) {
		return currentIndex.value;
	}

	currentIndex.value++;

	if (source.children) {
		for (let i = 0; i < source.children.length; i++) {
			const index = getNodeIndex(source.children[i], targetNode, currentIndex);
			if (index !== -1) return index;
		}
	}

	return -1;
}

self.onmessage = function(e) {
	const { type, payload } = e.data;

	switch (type) {
		case "CALCULATE_LAYOUT":
			try {
				if (!payload || !payload.serializedSource) {
					throw new Error("Invalid payload: missing serializedSource");
				}
				const result = calculateLayout(payload);
				self.postMessage({
					type: "LAYOUT_RESULT",
					taskId: payload.taskId,
					result: result
				});
			} catch (error) {
				self.postMessage({
					type: "LAYOUT_ERROR",
					taskId: payload ? payload.taskId : null,
					error: error.message + " at " + (error.stack || "").split("\n")[1]
				});
			}
			break;

		case "INIT":
			layoutState = {
				source: payload.serializedSource,
				bounds: payload.bounds,
				maxChars: payload.maxChars || 1500
			};
			self.postMessage({
				type: "INITIALIZED",
				workerId: payload.workerId
			});
			break;

		case "PING":
			self.postMessage({ type: "PONG" });
			break;

		default:
			self.postMessage({
				type: "ERROR",
				error: `Unknown message type: ${type}`
			});
	}
};

self.postMessage({ type: "WORKER_READY" });
