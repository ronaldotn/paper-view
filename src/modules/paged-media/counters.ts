import Handler from "../handler";
import * as csstree from "css-tree";

interface CounterData {
	name: string;
	increments: Record<string, { selector: string; number: number }>;
	resets: Record<string, { selector: string; number: number }>;
}

class Counters extends Handler {
	polisher: any;
	counters: Record<string, CounterData>;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.polisher = polisher;
		this.counters = {};
	}

	onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void {
		let property = declaration.property;

		if (property === "counter-increment") {
			let inc = this.handleIncrement(declaration, rule);
			if (inc) {
				dList.remove(dItem);
			}
		} else if (property === "counter-reset") {
			let reset = this.handleReset(declaration, rule);
			if (reset) {
				dList.remove(dItem);
			}
		}
	}

	onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void {
		if (funcNode.name === "counter") {
		}
	}

	afterParsed(parsed: Document | HTMLElement): void {
		this.processCounters(parsed, this.counters);
	}

	addCounter(name: string): CounterData {
		if (name in this.counters) {
			return this.counters[name];
		}

		this.counters[name] = {
			name: name,
			increments: {},
			resets: {}
		};

		return this.counters[name];
	}

	handleIncrement(declaration: any, rule: any): { selector: string; number: number } | undefined {
		let identifier = declaration.value.children.first;
		let number = declaration.value.children.size > 1
							&& declaration.value.children.last && declaration.value.children.last.value;
		let name = identifier && identifier.name;

		if (name === "page" || name.indexOf("target-counter-") === 0) {
			return;
		}

		let selector = csstree.generate(rule.ruleNode.prelude);

		let counter: CounterData;
		if (!(name in this.counters)) {
			counter = this.addCounter(name);
		} else {
			counter = this.counters[name];
		}

		return counter.increments[selector] = {
			selector: selector,
			number: number || 1
		};
	}

	handleReset(declaration: any, rule: any): { selector: string; number: number } | undefined {
		let identifier = declaration.value.children.first;
		let number = declaration.value.children.size > 1
							&& declaration.value.children.last && declaration.value.children.last.value;
		let name = identifier && identifier.name;
		let selector = csstree.generate(rule.ruleNode.prelude);
		let counter: CounterData;

		if (!(name in this.counters)) {
			counter = this.addCounter(name);
		} else {
			counter = this.counters[name];
		}

		return counter.resets[selector] = {
			selector: selector,
			number: number || 0
		};
	}

	processCounters(parsed: Document | HTMLElement, counters: Record<string, CounterData>): void {
		let counter: CounterData;
		for (let c in counters) {
			counter = this.counters[c];
			this.processCounterIncrements(parsed, counter);
			this.processCounterResets(parsed, counter);
			this.addCounterValues(parsed, counter);
		}
	}

	processCounterIncrements(parsed: Document | HTMLElement, counter: CounterData): void {
		let increment: { selector: string; number: number };
		for (let inc in counter.increments) {
			increment = counter.increments[inc];
			let incrementElements = parsed.querySelectorAll(increment.selector);
			for (var i = 0; i < incrementElements.length; i++) {
				(incrementElements[i] as HTMLElement).setAttribute("data-counter-"+ counter.name +"-increment", String(increment.number));
			}
		}
	}

	processCounterResets(parsed: Document | HTMLElement, counter: CounterData): void {
		let reset: { selector: string; number: number };
		for (let r in counter.resets) {
			reset = counter.resets[r];
			let resetElements = parsed.querySelectorAll(reset.selector);
			for (var i = 0; i < resetElements.length; i++) {
				(resetElements[i] as HTMLElement).setAttribute("data-counter-"+ counter.name +"-reset", String(reset.number));
			}
		}
	}

	addCounterValues(parsed: Document | HTMLElement, counter: CounterData): void {
		let counterName = counter.name;
		let elements = parsed.querySelectorAll("[data-counter-"+ counterName +"-reset], [data-counter-"+ counterName +"-increment]");

		let count = 0;
		let element: Element;
		let increment: string, reset: string;

		for (var i = 0; i < elements.length; i++) {
			element = elements[i];

			if (element.hasAttribute("data-counter-"+ counterName +"-reset")) {
				reset = element.getAttribute("data-counter-"+ counterName +"-reset")!;
				count = parseInt(reset);
			}

			if (element.hasAttribute("data-counter-"+ counterName +"-increment")) {
				increment = element.getAttribute("data-counter-"+ counterName +"-increment")!;

				this.polisher.styleSheet.insertRule(`[data-ref="${(element as HTMLElement).dataset.ref}"] { counter-reset: ${counterName} ${count} }`, this.polisher.styleSheet.cssRules.length);
				this.polisher.styleSheet.insertRule(`[data-ref="${(element as HTMLElement).dataset.ref}"] { counter-increment: ${counterName} ${increment} }`, this.polisher.styleSheet.cssRules.length);

				count += parseInt(increment);

				(element as HTMLElement).setAttribute("data-counter-"+counterName+"-value", String(count));
			}
		}
	}

	afterPageLayout(pageElement: HTMLElement, page: any): void {
		let pgreset = Array.prototype.slice.call(pageElement.querySelectorAll("[data-counter-page-reset]"));
		pgreset.forEach((reset: HTMLElement) => {
			let value = reset.datasetCounterPageReset;
			this.polisher.styleSheet.insertRule(`[data-page-number="${pageElement.dataset.pageNumber}"] { counter-reset: page ${value} }`, this.polisher.styleSheet.cssRules.length);
		});
	}
}

export default Counters;
