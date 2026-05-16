import Handler from "../handler";
import * as csstree from "css-tree";

class PrintMedia extends Handler {
	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);
	}

	onAtMedia(node: any, item: any, list: any): void {
		let media = this.getMediaName(node);
		let rules: any;

		if (media === "print") {
			rules = node.block.children;

			node.block.children = new csstree.List();

			list.appendList(rules);
		}
	}

	getMediaName(node: any): string | undefined {
		let media = "";

		if (typeof node.prelude === "undefined" ||
				node.prelude.type !== "AtrulePrelude" ) {
			return;
		}

		csstree.walk(node.prelude, {
			visit: "Identifier" as any,
			enter: (identNode: any) => {
				media = identNode.name;
			}
		});
		return media;
	}
}

export default PrintMedia;
