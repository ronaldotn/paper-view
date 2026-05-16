import Handler from "../handler";

class Splits extends Handler {
	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);
	}

	afterPageLayout(pageElement: HTMLElement, page: any, breakToken: any, chunker: any): void {
		let splits = Array.from(pageElement.querySelectorAll("[data-split-from]"));
		let pages = pageElement.parentNode;
		let index = Array.prototype.indexOf.call(pages.children, pageElement);
		let prevPage: Element;

		if (index === 0) {
			return;
		}

		prevPage = pages.children[index - 1];

		splits.forEach((split) => {
			let ref = (split as HTMLElement).dataset.ref;
			let from = prevPage.querySelector("[data-ref='"+ ref +"']:not([data-split-to])");

			if (from) {
				(from as HTMLElement).dataset.splitTo = ref;

				if (!(from as HTMLElement).dataset.splitFrom) {
					(from as HTMLElement).dataset.splitOriginal = true;
				}

				this.handleAlignment(from as HTMLElement);
			}
		});
	}

	handleAlignment(node: HTMLElement): void {
		let styles = window.getComputedStyle(node);
		let align = styles["text-align"];
		let alignLast = styles["text-align-last"];
		if (align === "justify" && alignLast === "auto") {
			node.style["text-align-last"] = "justify";
		}
	}
}

export default Splits;
