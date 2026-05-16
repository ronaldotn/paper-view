import * as csstree from "css-tree";
import { UUID } from "../utils/utils";
import Hook from "../utils/hook";

interface SheetHooks {
	onUrl: Hook;
	onAtPage: Hook;
	onAtMedia: Hook;
	onRule: Hook;
	onDeclaration: Hook;
	onContent: Hook;
	onImport: Hook;
	beforeTreeParse: Hook;
	beforeTreeWalk: Hook;
	afterTreeWalk: Hook;
}

class Sheet {
	hooks: SheetHooks;
	url: URL;
	id?: string;
	_text: string = "";
	ast?: csstree.CssNode;
	imported: string[] = [];

	constructor(url: string, hooks?: SheetHooks) {
		if (hooks) {
			this.hooks = hooks;
		} else {
			this.hooks = {} as SheetHooks;
			this.hooks.onUrl = new Hook(this);
			this.hooks.onAtPage = new Hook(this);
			this.hooks.onAtMedia = new Hook(this);
			this.hooks.onRule = new Hook(this);
			this.hooks.onDeclaration = new Hook(this);
			this.hooks.onContent = new Hook(this);
			this.hooks.onImport = new Hook(this);

			this.hooks.beforeTreeParse = new Hook(this);
			this.hooks.beforeTreeWalk = new Hook(this);
			this.hooks.afterTreeWalk = new Hook(this);
		}

		try {
			this.url = new URL(url, window.location.href);
		} catch (e) {
			this.url = new URL(window.location.href);
		}
	}



	// parse
	async parse(text: string) {
		this.text = text;

		await this.hooks.beforeTreeParse.trigger(this.text, this);

		// send to csstree
		this.ast = csstree.parse(this._text);

		await this.hooks.beforeTreeWalk.trigger(this.ast);

		// Replace urls
		this.replaceUrls(this.ast);

		// Scope
		this.id = UUID();
		// this.addScope(this.ast, this.uuid);

		// Replace IDs with data-id
		this.replaceIds(this.ast);

		this.imported = [];

		// Trigger Hooks
		this.urls(this.ast);
		this.rules(this.ast);
		this.atrules(this.ast);

		await this.hooks.afterTreeWalk.trigger(this.ast, this);

		// return ast
		return this.ast;
	}

	insertRule(rule: csstree.CssNode) {
		let inserted = this.ast!.children!.appendData(rule);
		inserted.forEach((item: csstree.CssNode) => {
			this.declarations(item);
		});
	}

	urls(ast: csstree.CssNode) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node: csstree.CssNode, item: any, list: any) => {
				this.hooks.onUrl.trigger(node, item, list);
			}
		});
	}

	atrules(ast: csstree.CssNode) {
		csstree.walk(ast, {
			visit: "Atrule",
			enter: (node: csstree.CssNode, item: any, list: any) => {
				const basename = csstree.keyword(node.name!).basename;

				if (basename === "page") {
					this.hooks.onAtPage.trigger(node, item, list);
					this.declarations(node, item, list);
				}

				if (basename === "media") {
					this.hooks.onAtMedia.trigger(node, item, list);
					this.declarations(node, item, list);
				}

				if (basename === "import") {
					this.hooks.onImport.trigger(node, item, list);
					this.imports(node, item, list);
				}
			}
		});
	}


	rules(ast: csstree.CssNode) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (ruleNode: csstree.CssNode, ruleItem: any, rulelist: any) => {
				// console.log("rule", ruleNode);

				this.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
				this.declarations(ruleNode, ruleItem, rulelist);
			}
		});
	}

	declarations(ruleNode: csstree.CssNode, ruleItem?: any, rulelist?: any) {
		csstree.walk(ruleNode, {
			visit: "Declaration",
			enter: (declarationNode: csstree.CssNode, dItem: any, dList: any) => {
				// console.log(declarationNode);

				this.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {ruleNode, ruleItem, rulelist});

				if (declarationNode.property === "content") {
					csstree.walk(declarationNode, {
						visit: "Function",
						enter: (funcNode: csstree.CssNode, fItem: any, fList: any) => {
							this.hooks.onContent.trigger(funcNode, fItem, fList, {declarationNode, dItem, dList}, {ruleNode, ruleItem, rulelist});
						}
					});
				}

			}
		});
	}

	replaceUrls(ast: csstree.CssNode) {
		csstree.walk(ast, {
			visit: "Url",
			enter: (node: any, item: any, list: any) => {
				// In css-tree v2, Url.value is a string directly
				let href: string;
				if (typeof node.value === "string") {
					href = node.value.replace(/["']/g, "");
				} else if (node.value && typeof node.value.value === "string") {
					href = node.value.value.replace(/["']/g, "");
				} else {
					return;
				}
				let url = new URL(href, this.url);
				if (typeof node.value === "string") {
					node.value = url.toString();
				} else {
					node.value.value = url.toString();
				}
			}
		});
	}

	addScope(ast: csstree.CssNode, id: string) {
		// Get all selector lists
		// add an id
		csstree.walk(ast, {
			visit: "Selector",
			enter: (node: csstree.CssNode, item: any, list: any) => {
				let children = node.children!;
				children.prepend(children.createItem({
					type: "WhiteSpace",
					value: " "
				}));
				children.prepend(children.createItem({
					type: "IdSelector",
					name: id,
					loc: null,
					children: null as any
				}));
			}
		});
	}

	getNamedPageSelectors(ast: csstree.CssNode) {
		let namedPageSelectors: Record<string, { name: string; selector: string }> = {};
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node: csstree.CssNode, item: any, list: any) => {
				csstree.walk(node, {
					visit: "Declaration",
					enter: (declaration: any, dItem: any, dList: any) => {
						if (declaration.property === "page") {
							let value = declaration.value.children.first;
							let name = value.name;
							let selector = csstree.generate(node.prelude!);
							namedPageSelectors[name] = {
								name: name,
								selector: selector
							};

							// dList.remove(dItem);

							// Add in page break
							declaration.property = "break-before";
							value.type = "Identifier";
							value.name = "always";

						}
					}
				});
			}
		});
		return namedPageSelectors;
	}

	replaceIds(ast: csstree.CssNode) {
		csstree.walk(ast, {
			visit: "Rule",
			enter: (node: csstree.CssNode, item: any, list: any) => {

				csstree.walk(node, {
					visit: "IdSelector",
					enter: (idNode: any, idItem: any, idList: any) => {
						let name = idNode.name;
						idNode.flags = null;
						idNode.matcher = "=";
						idNode.name = {type: "Identifier", loc: null, name: "data-id"};
						idNode.type = "AttributeSelector";
						idNode.value = {type: "String", loc: null, value: `"${name}"`};
					}
				});
			}
		});
	}

	imports(node: csstree.CssNode, item: any, list: any) {
		// console.log("import", node, item, list);
		let queries: string[] = [];
		csstree.walk(node, {
			visit: "MediaQuery",
			enter: (mqNode: csstree.CssNode, mqItem: any, mqList: any) => {
				csstree.walk(mqNode, {
					visit: "Identifier",
					enter: (identNode: any, identItem: any, identList: any) => {
						queries.push(identNode.name);
					}
				});
			}
		});

		// Just basic media query support for now
		let shouldNotApply = queries.some((query, index) => {
			let q = query;
			if (q === "not") {
				q = queries[index + 1];
				return !(q === "screen" || q === "speech");
			} else {
				return (q === "screen" || q === "speech");
			}
		});

		if (shouldNotApply) {
			return;
		}

		// Extract URL from either String node (bare @import "url") or Url node (@import url("url"))
		let importUrl: string | null = null;

		csstree.walk(node, {
			visit: "Url",
			enter: (urlNode: any) => {
				if (importUrl) return;
				// In css-tree v2, Url.value is a string directly
				if (typeof urlNode.value === "string") {
					importUrl = urlNode.value.replace(/["']/g, "");
				} else if (urlNode.value && typeof urlNode.value.value === "string") {
					// fallback for older structure
					importUrl = urlNode.value.value.replace(/["']/g, "");
				}
			}
		});

		if (!importUrl) {
			csstree.walk(node, {
				visit: "String",
				enter: (strNode: any) => {
					if (importUrl) return;
					importUrl = strNode.value.replace(/["']/g, "");
				}
			});
		}

		if (!importUrl) return;

		let url = new URL(importUrl, this.url);
		let value = url.toString();

		this.imported.push(value);

		// Remove the original
		list.remove(item);
	}

	set text(t: string) {
		this._text = t;
	}

	get text(): string {
		return this._text;
	}

	// generate string
	toString(ast?: csstree.CssNode) {
		return csstree.generate(ast || this.ast!);
	}
}

export default Sheet;
