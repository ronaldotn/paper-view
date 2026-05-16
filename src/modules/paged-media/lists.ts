import Handler from "../handler";

class Lists extends Handler {
	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);
	}

	afterParsed(content: Document | HTMLElement): void {
		const orderedLists = content.querySelectorAll("ol");

		for (var list of orderedLists) {
			this.addDataNumbers(list as HTMLOListElement);
		}
	}

	afterPageLayout(pageElement: HTMLElement, page: any, breakToken: any, chunker: any): void {
		var orderedLists = pageElement.getElementsByTagName("ol");
		for (var list of orderedLists) {
			if (list.hasChildNodes()) {
				list.start = parseInt((list.firstElementChild as HTMLElement).dataset.itemNum!);
			}
			else {
				list.parentNode!.removeChild(list);
			}
		}
	}

	addDataNumbers(list: HTMLOListElement): void {
		let items = list.children;
		for (var i = 0; i < items.length; i++) {
			(items[i] as HTMLElement).dataset.itemNum = String(i + 1);
		}
	}
}

export default Lists;
