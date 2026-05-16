import Handler from "../handler";
import * as csstree from "css-tree";
import pageSizes from "../../polisher/sizes";
import { rebuildAncestors } from "../../utils/dom";
import { CSSValueToString } from "../../utils/utils";

interface SizeValue {
	value: number | string;
	unit: string;
}

interface BleedValue {
	top: SizeValue | string;
	right: SizeValue | string;
	bottom: SizeValue | string;
	left: SizeValue | string;
}

interface MarginModel {
	top: any;
	right: any;
	left: any;
	bottom: any;
}

interface PageModel {
	selector: string;
	name: string | undefined;
	psuedo: string | undefined;
	nth: string | undefined;
	has: string | undefined;
	is: string[] | undefined;
	marginalia: Record<string, any>;
	width: SizeValue | undefined;
	height: SizeValue | undefined;
	orientation: string | undefined;
	margin: MarginModel;
	block: any;
	marks: any;
	added?: boolean;
	size?: any;
	format?: string;
	bleed?: any;
}

interface MarginaliaEntry {
	page: PageModel;
	selector: string;
	block: any;
	hasContent: boolean;
}

interface HasMatch {
	selector: string;
	hasSelector: string;
	className: string;
}

class AtPage extends Handler {
	pages: Record<string, PageModel>;
	width: SizeValue | undefined;
	height: SizeValue | undefined;
	orientation: string | undefined;
	marginalia: Record<string, MarginaliaEntry>;
	format: string | undefined;

	constructor(chunker: any, polisher: any, caller: any) {
		super(chunker, polisher, caller);

		this.pages = {};

		this.width = undefined;
		this.height = undefined;
		this.orientation = undefined;

		this.marginalia = {};
	}

	pageModel(selector: string): PageModel {
		return {
			selector: selector,
			name: undefined,
			psuedo: undefined,
			nth: undefined,
			has: undefined,
			is: undefined,
			marginalia: {},
			width: undefined,
			height: undefined,
			orientation: undefined,
			margin : {
				top: {},
				right: {},
				left: {},
				bottom: {}
			},
			block: {},
			marks: undefined
		};
	}

	onAtPage(node: any, item: any, list: any): void {
		let page: PageModel, marginalia: Record<string, any>;
		let selector = "";
		let named: string | undefined, psuedo: string | undefined, nth: string | undefined, hasSelector: string | undefined, isSelector: string[] | undefined;
		let needsMerge = false;

		if (node.prelude) {
			named = this.getTypeSelector(node);
			psuedo = this.getPsuedoSelector(node);
			nth = this.getNthSelector(node);
			hasSelector = this.getHasSelector(node);
			isSelector = this.getIsSelector(node);
			selector = csstree.generate(node.prelude);
		} else {
			selector = "*";
		}

		if (selector in this.pages) {
			page = this.pages[selector];
			marginalia = this.replaceMarginalia(node);
			needsMerge = true;
		} else {
			page = this.pageModel(selector);
			marginalia = this.replaceMarginalia(node);
			this.pages[selector] = page;
		}

		page.name = named;
		page.psuedo = psuedo;
		page.nth = nth;
		page.has = hasSelector;
		page.is = isSelector;

		if (needsMerge) {
			page.marginalia = Object.assign(page.marginalia, marginalia);
		} else {
			page.marginalia = marginalia;
		}

		let declarations = this.replaceDeclartations(node) || {};

		if (declarations && declarations.size) {
			page.size = declarations.size;
			page.width = declarations.size.width;
			page.height = declarations.size.height;
			page.orientation = declarations.size.orientation;
			page.format = declarations.size.format;
		}

		if (declarations.bleed && declarations.bleed[0] != "auto") {
			switch (declarations.bleed.length) {
				case 4:
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[2],
						left: declarations.bleed[3]
					};
					break;
				case 3:
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[2],
						left: declarations.bleed[1]
					};
					break;
				case 2:
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[1],
						bottom: declarations.bleed[0],
						left: declarations.bleed[1]
					};
					break;
				default:
					page.bleed = {
						top: declarations.bleed[0],
						right: declarations.bleed[0],
						bottom: declarations.bleed[0],
						left: declarations.bleed[0]
					};
			}
		}

		if (declarations.marks) {
			if (!declarations.bleed || declarations.bleed && declarations.bleed[0] === "auto") {
				page.bleed = {
					top: { value: 6, unit: "mm" },
					right: { value: 6, unit: "mm" },
					bottom: { value: 6, unit: "mm" },
					left: { value: 6, unit: "mm" }
				};
			}

			page.marks = declarations.marks;
		}

		if (declarations.margin) {
			page.margin = declarations.margin;
		}

		if (declarations.marks) {
			page.marks = declarations.marks;
		}

		if (needsMerge) {
			page.block.children.appendList(node.block.children);
		} else {
			page.block = node.block;
		}

		list.remove(item);
	}

	afterTreeWalk(ast: any, sheet: any): void {
		this.addPageClasses(this.pages, ast, sheet);

		if ("*" in this.pages) {
			let width = this.pages["*"].width;
			let height = this.pages["*"].height;
			let format = this.pages["*"].format;
			let orientation = this.pages["*"].orientation;
			let bleed = this.pages["*"].bleed;
			let marks = this.pages["*"].marks;

			if ((width && height) &&
					(this.width !== width || this.height !== height)) {
				this.width = width;
				this.height = height;
				this.format = format;
				this.orientation = orientation;

				this.addRootVars(ast, width, height, orientation, bleed, marks);
				this.addRootPage(ast, this.pages["*"].size, bleed);

				this.emit("size", { width, height, orientation, format, bleed });
				this.emit("atpages", this.pages);
			}
		}
	}

	getTypeSelector(ast: any): string | undefined {
		let name: string | undefined;

		csstree.walk(ast, {
			visit: "TypeSelector" as any,
			enter: (node: any) => {
				name = node.name;
			}
		});

		return name;
	}

	getPsuedoSelector(ast: any): string | undefined {
		let name: string | undefined;
		csstree.walk(ast, {
			visit: "PseudoClassSelector" as any,
			enter: (node: any) => {
				if (node.name !== "nth") {
					name = node.name;
				}
			}
		});

		return name;
	}

	getNthSelector(ast: any): string | undefined {
		let nth: string | undefined;
		csstree.walk(ast, {
			visit: "PseudoClassSelector" as any,
			enter: (node: any) => {
				if (node.name === "nth" && node.children) {
					let raw = node.children.first;
					nth = raw.value;
				}
			}
		});

		return nth;
	}

	getHasSelector(ast: any): string | undefined {
		let hasSelector: string | undefined;
		csstree.walk(ast, {
			visit: "PseudoClassSelector" as any,
			enter: (node: any) => {
				if (node.name === "has" && node.children) {
					let firstSelector = node.children.first;
					if (firstSelector) {
						hasSelector = csstree.generate(firstSelector);
					}
				}
			}
		});
		return hasSelector;
	}

	getIsSelector(ast: any): string[] | undefined {
		let isSelectors: string[] = [];
		csstree.walk(ast, {
			visit: "PseudoClassSelector" as any,
			enter: (node: any) => {
				if (node.name === "is" && node.children) {
					csstree.walk(node, {
						visit: "PseudoClassSelector" as any,
						enter: (pseudoNode: any) => {
							if (pseudoNode.name !== "is") {
								isSelectors.push(pseudoNode.name);
							}
						}
					});
				}
			}
		});
		return isSelectors.length > 0 ? isSelectors : undefined;
	}

	replaceMarginalia(ast: any): Record<string, any> {
		let parsed: Record<string, any> = {};

		csstree.walk(ast.block, {
			visit: "Atrule" as any,
			enter: (node: any, item: any, list: any) => {
				let name = node.name;
				if (name === "top") {
					name = "top-center";
				}
				if (name === "right") {
					name = "right-middle";
				}
				if (name === "left") {
					name = "left-middle";
				}
				if (name === "bottom") {
					name = "bottom-center";
				}
				parsed[name] = node.block;
				list.remove(item);
			}
		});

		return parsed;
	}

	replaceDeclartations(ast: any): Record<string, any> | undefined {
		let parsed: Record<string, any> = {};

		csstree.walk(ast.block, {
			visit: "Declaration" as any,
			enter: (declaration: any, dItem: any, dList: any) => {
				let prop = csstree.property(declaration.property).name;

				if (prop === "marks") {
					parsed.marks = [];
					csstree.walk(declaration, {
						visit: "Identifier" as any,
						enter: (ident: any) => {
							parsed.marks.push(ident.name);
						}
					});
					dList.remove(dItem);
				} else if (prop === "margin") {
					parsed.margin = this.getMargins(declaration);
					dList.remove(dItem);
				} else if (prop.indexOf("margin-") === 0) {
					let m = prop.substring("margin-".length);
					if (!parsed.margin) {
						parsed.margin = {
							top: {},
							right: {},
							left: {},
							bottom: {}
						};
					}
					parsed.margin[m] = declaration.value.children.first;
					dList.remove(dItem);
				} else if (prop === "size") {
					parsed.size = this.getSize(declaration);
					dList.remove(dItem);
				} else if (prop === "bleed") {
					parsed.bleed = [];

					csstree.walk(declaration, {
						enter: (subNode: any) => {
							switch (subNode.type) {
								case "String":
									if (subNode.value.indexOf("auto") > -1) {
										parsed.bleed.push("auto");
									}
									break;
								case "Dimension":
									parsed.bleed.push({
										value: subNode.value,
										unit: subNode.unit
									});
									break;
								case "Number":
									parsed.bleed.push({
										value: subNode.value,
										unit: "px"
									});
									break;
							}
						}
					});

					dList.remove(dItem);
				}
			}
		});

		return parsed;
	}

	getSize(declaration: any): { width?: SizeValue; height?: SizeValue; orientation?: string; format?: string } {
		let width: SizeValue | undefined;
		let height: SizeValue | undefined;
		let orientation: string | undefined;
		let format: string | undefined;

		csstree.walk(declaration, {
			visit: "Dimension" as any,
			enter: (node: any) => {
				let {value, unit} = node;
				if (typeof width === "undefined") {
					width = { value, unit };
				} else if (typeof height === "undefined") {
					height = { value, unit };
				}
			}
		});

		csstree.walk(declaration, {
			visit: "String" as any,
			enter: (node: any) => {
				let name = node.value.replace(/["|']/g, "");
				let s = (pageSizes as Record<string, any>)[name];
				if (s) {
					width = s.width;
					height = s.height;
				}
			}
		});

		csstree.walk(declaration, {
			visit: "Identifier" as any,
			enter: (node: any) => {
				let name = node.name;
				if (name === "landscape" || name === "portrait") {
					orientation = node.name;
				} else if (name !== "auto") {
					let s = (pageSizes as Record<string, any>)[name];
					if (s) {
						width = s.width;
						height = s.height;
					}
					format = name;
				}
			}
		});

		return {
			width,
			height,
			orientation,
			format
		};
	}

	getMargins(declaration: any): MarginModel {
		let margins: any[] = [];
		let margin: MarginModel = {
			top: {},
			right: {},
			left: {},
			bottom: {}
		};

		csstree.walk(declaration, {
			visit: "Dimension" as any,
			enter: (node: any) => {
				margins.push(node);
			}
		});

		if (margins.length === 1) {
			for (let m in margin) {
				margin[m] = margins[0];
			}
		} else if (margins.length === 2) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[0];
			margin.left = margins[1];
		} else if (margins.length === 3) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[2];
			margin.left = margins[1];
		} else if (margins.length === 4) {
			margin.top = margins[0];
			margin.right = margins[1];
			margin.bottom = margins[2];
			margin.left = margins[3];
		}

		return margin;
	}

	addPageClasses(pages: Record<string, PageModel>, ast: any, sheet: any): void {
		if ("*" in pages && !pages["*"].added) {
			let p = this.createPage(pages["*"], ast.children, sheet);
			sheet.insertRule(p);
			pages["*"].added = true;
		}
		if (this.chunker.viewMode !== "single") {
			if (":left" in pages && !pages[":left"].added) {
				let left = this.createPage(pages[":left"], ast.children, sheet);
				sheet.insertRule(left);
				pages[":left"].added = true;
			}
		}
		if (this.chunker.viewMode !== "single") {
			if (":right" in pages && !pages[":right"].added) {
				let right = this.createPage(pages[":right"], ast.children, sheet);
				sheet.insertRule(right);
				pages[":right"].added = true;
			}
		}
		if (":first" in pages && !pages[":first"].first) {
			let first = this.createPage(pages[":first"], ast.children, sheet);
			sheet.insertRule(first);
			pages[":first"].added = true;
		}
		if (":blank" in pages && !pages[":blank"].added) {
			let blank = this.createPage(pages[":blank"], ast.children, sheet);
			sheet.insertRule(blank);
			pages[":blank"].added = true;
		}
		for (let pg in pages) {
			if (pages[pg].nth && !pages[pg].added) {
				let nth = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(nth);
				pages[pg].added = true;
			}
		}
		for (let pg in pages) {
			if (pages[pg].has && !pages[pg].added) {
				let hasRule = this.createPageWithHas(pages[pg], ast.children, sheet);
				sheet.insertRule(hasRule);
				pages[pg].added = true;
			}
		}
		for (let pg in pages) {
			if (pages[pg].is && !pages[pg].added) {
				let isRules = this.createPageWithIs(pages[pg], ast.children, sheet);
				isRules.forEach((rule: any) => sheet.insertRule(rule));
				pages[pg].added = true;
			}
		}
		for (let pg in pages) {
			if (pages[pg].name && !pages[pg].added) {
				let named = this.createPage(pages[pg], ast.children, sheet);
				sheet.insertRule(named);
				pages[pg].added = true;
			}
		}
	}

	createPage(page: PageModel, ruleList: any, sheet: any): any {
		let selectors = this.selectorsForPage(page);
		let children = page.block.children.copy();
		let block = {
			type: "Block",
			loc: 0,
			children: children
		};
		let rule = this.createRule(selectors, block);

		this.addMarginVars(page.margin, children, children.first);

		if (page.width) {
			this.addDimensions(page.width, page.height, page.orientation, children, children.first);
		}

		if (page.marginalia) {
			this.addMarginaliaStyles(page, ruleList, rule, sheet);
			this.addMarginaliaContent(page, ruleList, rule, sheet);
		}

		return rule;
	}

	createPageWithHas(page: PageModel, ruleList: any, sheet: any): any {
		let selectors = this.selectorsForPageWithHas(page);
		let children = page.block.children.copy();
		let block = {
			type: "Block",
			loc: 0,
			children: children
		};
		let rule = this.createRule(selectors, block);

		this.addMarginVars(page.margin, children, children.first);

		if (page.width) {
			this.addDimensions(page.width, page.height, page.orientation, children, children.first);
		}

		if (page.marginalia) {
			this.addMarginaliaStyles(page, ruleList, rule, sheet);
			this.addMarginaliaContent(page, ruleList, rule, sheet);
		}

		return rule;
	}

	createPageWithIs(page: PageModel, ruleList: any, sheet: any): any[] {
		let rules: any[] = [];

		if (!page.is || page.is.length === 0) {
			return rules;
		}

		page.is.forEach((isSelector: string) => {
			let selectors = this.selectorsForPageWithIs(page, isSelector);
			let children = page.block.children.copy();
			let block = {
				type: "Block",
				loc: 0,
				children: children
			};
			let rule = this.createRule(selectors, block);

			this.addMarginVars(page.margin, children, children.first);

			if (page.width) {
				this.addDimensions(page.width, page.height, page.orientation, children, children.first);
			}

			if (page.marginalia) {
				this.addMarginaliaStyles(page, ruleList, rule, sheet);
				this.addMarginaliaContent(page, ruleList, rule, sheet);
			}

			rules.push(rule);
		});

		return rules;
	}

	addMarginVars(margin: MarginModel, list: any, item: any): void {
		for (let m in margin) {
			if (typeof margin[m].value !== "undefined") {
				let value = margin[m].value + (margin[m].unit || "");
				let mVar = list.createItem({
					type: "Declaration",
					property: "--pagedjs-margin-" + m,
					value: {
						type: "Raw",
						value: value
					}
				});
				list.append(mVar, item);
			}
		}
	}

	addDimensions(width: SizeValue, height: SizeValue | undefined, orientation: string | undefined, list: any, item: any): void {
		let widthString: string, heightString: string;

		widthString = CSSValueToString(width);
		heightString = CSSValueToString(height);

		if (orientation && orientation !== "portrait") {
			[widthString, heightString] = [heightString, widthString];
		}

		let wVar = this.createVariable("--pagedjs-pagebox-width", widthString);
		list.appendData(wVar);

		let hVar = this.createVariable("--pagedjs-pagebox-height", heightString);
		list.appendData(hVar);
	}

	addMarginaliaStyles(page: PageModel, list: any, item: any, sheet: any): void {
		for (let loc in page.marginalia) {
			let block = csstree.clone(page.marginalia[loc]);
			let hasContent = false;

			if(block.children.isEmpty) {
				continue;
			}

			csstree.walk(block, {
				visit: "Declaration" as any,
				enter: (node: any, _item: any, _list: any) => {
					if (node.property === "content") {
						if (node.value.children && node.value.children.first.name === "none") {
							hasContent = false;
						} else {
							hasContent = true;
						}
						_list.remove(_item);
					}
					if (node.property === "vertical-align") {
						csstree.walk(node, {
							visit: "Identifier" as any,
							enter: (identNode: any) => {
								let name = identNode.name;
								if (name === "top") {
									identNode.name = "flex-start";
								} else if (name === "middle") {
									identNode.name = "center";
								} else if (name === "bottom") {
									identNode.name = "flex-end";
								}
							}
						});
						node.property = "align-items";
					}

					if (node.property === "width" &&
						(loc === "top-left" ||
						 loc === "top-center" ||
						 loc === "top-right" ||
						 loc === "bottom-left" ||
						 loc === "bottom-center" ||
						 loc === "bottom-right")) {
						let c = csstree.clone(node);
						c.property = "max-width";
						_list.appendData(c);
					}

					if (node.property === "height" &&
						(loc === "left-top" ||
						 loc === "left-middle" ||
						 loc === "left-bottom" ||
						 loc === "right-top" ||
						 loc === "right-middle" ||
						 loc === "right-bottom")) {
						let c = csstree.clone(node);
						c.property = "max-height";
						_list.appendData(c);
					}
				}
			});

			let marginSelectors = this.selectorsForPageMargin(page, loc);
			let marginRule = this.createRule(marginSelectors, block);

			list.appendData(marginRule);

			let sel = csstree.generate({
				type: "Selector",
				children: marginSelectors
			});

			this.marginalia[sel] = {
				page: page,
				selector: sel,
				block: page.marginalia[loc],
				hasContent: hasContent
			};
		}
	}

	addMarginaliaContent(page: PageModel, list: any, item: any, sheet: any): void {
		let displayNone: boolean | undefined;
		for (let loc in page.marginalia) {
			let content = csstree.clone(page.marginalia[loc]);
			csstree.walk(content, {
				visit: "Declaration" as any,
				enter: (node: any, _item: any, _list: any) => {
					if (node.property !== "content") {
						_list.remove(_item);
					}

					if (node.value.children && node.value.children.first.name === "none") {
						displayNone = true;
					}
				}
			});

			if(content.children.isEmpty) {
				continue;
			}

			let displaySelectors = this.selectorsForPageMargin(page, loc);
			let displayDeclaration: any;

			displaySelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			displaySelectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_margin-content"
			});

			displaySelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			displaySelectors.insertData({
				type: "TypeSelector",
				name: "*"
			});

			if (displayNone) {
				displayDeclaration = this.createDeclaration("display", "none");
			} else {
				displayDeclaration = this.createDeclaration("display", "block");
			}

			let displayRule = this.createRule(displaySelectors, [displayDeclaration]);
			sheet.insertRule(displayRule);

			let contentSelectors = this.selectorsForPageMargin(page, loc);

			contentSelectors.insertData({
				type: "Combinator",
				name: ">"
			});

			contentSelectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_margin-content"
			});

			contentSelectors.insertData({
				type: "PseudoElementSelector",
				name: "after",
				children: null
			});

			let contentRule = this.createRule(contentSelectors, content);
			sheet.insertRule(contentRule);
		}
	}

	addRootVars(ast: any, width: SizeValue, height: SizeValue, orientation: string | undefined, bleed: any, marks: any): void {
		let rules: any[] = [];
		let selectors = new csstree.List();
		selectors.insertData({
			type: "PseudoClassSelector",
			name: "root",
			children: null
		});

		let widthString: string, heightString: string;

		if (!bleed) {
			widthString = CSSValueToString(width);
			heightString = CSSValueToString(height);
		} else {
			widthString = `calc( ${CSSValueToString(width)} + ${CSSValueToString(bleed.left)} + ${CSSValueToString(bleed.right)} )`;
			heightString = `calc( ${CSSValueToString(height)} + ${CSSValueToString(bleed.top)} + ${CSSValueToString(bleed.bottom)} )`;

			let bleedTop = this.createVariable("--pagedjs-bleed-top", CSSValueToString(bleed.top));
			let bleedRight = this.createVariable("--pagedjs-bleed-right", CSSValueToString(bleed.right));
			let bleedBottom = this.createVariable("--pagedjs-bleed-bottom", CSSValueToString(bleed.bottom));
			let bleedLeft = this.createVariable("--pagedjs-bleed-left", CSSValueToString(bleed.left));

			let pageWidthVar = this.createVariable("--pagedjs-width", CSSValueToString(width));
			let pageHeightVar = this.createVariable("--pagedjs-height", CSSValueToString(height));

			rules.push(bleedTop, bleedRight, bleedBottom, bleedLeft, pageWidthVar, pageHeightVar);
		}

		if (marks) {
			marks.forEach((mark: string) => {
				let markDisplay = this.createVariable("--pagedjs-mark-" + mark + "-display", "block");
				rules.push(markDisplay);
			});
		}

		if (orientation) {
			let oVar = this.createVariable("--pagedjs-orientation", orientation);
			rules.push(oVar);

			if (orientation !== "portrait") {
				[widthString, heightString] = [heightString, widthString];
			}
		}

		let wVar = this.createVariable("--pagedjs-width", widthString);
		let hVar = this.createVariable("--pagedjs-height", heightString);

		rules.push(wVar, hVar);

		let rule = this.createRule(selectors, rules);

		ast.children.appendData(rule);
	}

	addRootPage(ast: any, size: any, bleed: any): void {
		let { width, height, orientation, format } = size;
		let children = new csstree.List();
		let dimensions = new csstree.List();

		if (bleed) {
			let widthCalculations = new csstree.List();
			let heightCalculations = new csstree.List();

			widthCalculations.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Dimension",
				unit: bleed.left.unit,
				value: bleed.left.value
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			widthCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			widthCalculations.appendData({
				type: "Dimension",
				unit: bleed.right.unit,
				value: bleed.right.value
			});

			heightCalculations.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Dimension",
				unit: bleed.top.unit,
				value: bleed.top.value
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Operator",
				value: "+"
			});

			heightCalculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			heightCalculations.appendData({
				type: "Dimension",
				unit: bleed.bottom.unit,
				value: bleed.bottom.value
			});

			dimensions.appendData({
				type: "Function",
				name: "calc",
				children: widthCalculations
			});

			dimensions.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensions.appendData({
				type: "Function",
				name: "calc",
				children: heightCalculations
			});

		} else if (format) {
			dimensions.appendData({
				type: "Identifier",
				name: format
			});

			if (orientation) {
				dimensions.appendData({
					type: "WhiteSpace",
					value: " "
				});

				dimensions.appendData({
					type: "Identifier",
					name: orientation
				});
			}
		} else {
			dimensions.appendData({
				type: "Dimension",
				unit: width.unit,
				value: width.value
			});

			dimensions.appendData({
				type: "WhiteSpace",
				value: " "
			});

			dimensions.appendData({
				type: "Dimension",
				unit: height.unit,
				value: height.value
			});
		}

		children.appendData({
			type: "Declaration",
			property: "size",
			loc: null,
			value: {
				type: "Value",
				children: dimensions
			}
		});

		children.appendData({
			type: "Declaration",
			property: "margin",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: "Dimension",
					unit: "px",
					value: 0
				}]
			}
		});

		children.appendData({
			type: "Declaration",
			property: "padding",
			loc: null,
			value: {
				type: "Value",
				children: [{
					type: "Dimension",
					unit: "px",
					value: 0
				}]
			}
		});

		let rule = ast.children.createItem({
			type: "Atrule",
			prelude: null,
			name: "page",
			block: {
				type: "Block",
				loc: null,
				children: children
			}
		});

		ast.children.append(rule);
	}

	getNth(nth: string): any {
		let n = nth.indexOf("n");
		let plus = nth.indexOf("+");
		let splitN = nth.split("n");
		let splitP = nth.split("+");
		let a: string | null = null;
		let b: string | null = null;
		if (n > -1) {
			a = splitN[0];
			if (plus > -1) {
				b = splitP[1];
			}
		} else {
			b = nth;
		}

		return {
			type: "Nth",
			loc: null,
			selector: null,
			nth: {
				type: "AnPlusB",
				loc: null,
				a: a,
				b: b
			}
		};
	}

	addPageAttributes(page: any, start: HTMLElement, pages: any): void {
		let named = start.dataset.page;

		if (named) {
			page.name = named;
			page.element.classList.add("pagedjs_named_page");
			page.element.classList.add("pagedjs_" + named + "_page");

			if (!start.dataset.splitFrom) {
				page.element.classList.add("pagedjs_" + named + "_first_page");
			}
		}
	}

	getStartElement(content: any, breakToken: any): HTMLElement | undefined {
		let node = breakToken && breakToken.node;

		if (!content && !breakToken) {
			return;
		}

		if ((!content.children) && !(content.children && typeof content.children === "object" && content.children.constructor === Array)) {
			return;
		}

		if (!node) {
			return content.children[0];
		}

		if (node.nodeType === 1 && node.parentNode.nodeType === 11) {
			return node;
		}

		if (node.nodeType === 1 && node.dataset.page) {
			return node;
		}

		let fragment = rebuildAncestors(node);
		let pages = fragment.querySelectorAll("[data-page]");

		if (pages.length) {
			return pages[pages.length - 1] as HTMLElement;
		} else {
			return fragment.children[0] as HTMLElement;
		}
	}

	beforePageLayout(page: any, contents: any, breakToken: any, chunker: any): void {
		let start = this.getStartElement(contents, breakToken);
		if (start) {
			this.addPageAttributes(page, start, chunker.pages);
		}
	}

	afterPageLayout(fragment: any, page: any, breakToken: any, chunker: any): void {
		this.applyHasSelectors(page, chunker);

		for (let m in this.marginalia) {
			let margin = this.marginalia[m];
			let sels = m.split(" ");

			let content: HTMLElement;
			if (page.element.matches(sels[0]) && margin.hasContent) {
				content = page.element.querySelector(sels[1]);
				content.classList.add("hasContent");
			}
		}

		["top", "bottom"].forEach((loc) => {
			let marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
			let center = page.element.querySelector(".pagedjs_margin-" + loc + "-center");
			let left = page.element.querySelector(".pagedjs_margin-" + loc + "-left");
			let right = page.element.querySelector(".pagedjs_margin-" + loc + "-right");

			let centerContent = center.classList.contains("hasContent");
			let leftContent = left.classList.contains("hasContent");
			let rightContent = right.classList.contains("hasContent");
			let centerWidth: string, leftWidth: string, rightWidth: string;

			if (leftContent) {
				leftWidth = window.getComputedStyle(left)["max-width"];
			}

			if (rightContent) {
				rightWidth = window.getComputedStyle(right)["max-width"];
			}

			if (centerContent) {
				centerWidth = window.getComputedStyle(center)["max-width"];

				if(centerWidth === "none" || centerWidth === "auto") {
					if(!leftContent && !rightContent){
						marginGroup.style["grid-template-columns"] = "0 1fr 0";
					}else if(leftContent){
						if(!rightContent){
							if(leftWidth !== "none" && leftWidth !== "auto"){
								marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
							}else{
								marginGroup.style["grid-template-columns"] = "auto auto 1fr";
								left.style["white-space"] = "nowrap";
								center.style["white-space"] = "nowrap";
								let leftOuterWidth = left.offsetWidth;
								let centerOuterWidth = center.offsetWidth;
								let outerwidths = leftOuterWidth + centerOuterWidth;
								let newcenterWidth = centerOuterWidth * 100 / outerwidths;
								marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
								left.style["white-space"] = "normal";
								center.style["white-space"] = "normal";
							}
						}else{
							if(leftWidth !== "none" && leftWidth !== "auto"){
								if(rightWidth !== "none" && rightWidth !== "auto"){
									marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
								}else{
									marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
								}
							}else{
								if(rightWidth !== "none" && rightWidth !== "auto"){
									marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
								}else{
									marginGroup.style["grid-template-columns"] = "auto auto 1fr";
									left.style["white-space"] = "nowrap";
									center.style["white-space"] = "nowrap";
									right.style["white-space"] = "nowrap";
									let leftOuterWidth = left.offsetWidth;
									let centerOuterWidth = center.offsetWidth;
									let rightOuterWidth = right.offsetWidth;
									let outerwidths = leftOuterWidth + centerOuterWidth + rightOuterWidth;
									let newcenterWidth = centerOuterWidth * 100 / outerwidths;
									if(newcenterWidth > 40){
										marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
									}else{
										marginGroup.style["grid-template-columns"] = "repeat(3, 1fr)";
									}
									left.style["white-space"] = "normal";
									center.style["white-space"] = "normal";
									right.style["white-space"] = "normal";
								}
							}
						}
					}else{
						if(rightWidth !== "none" && rightWidth !== "auto"){
							marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
						}else{
							marginGroup.style["grid-template-columns"] = "auto auto 1fr";
							right.style["white-space"] = "nowrap";
							center.style["white-space"] = "nowrap";
							let rightOuterWidth = right.offsetWidth;
							let centerOuterWidth = center.offsetWidth;
							let outerwidths = rightOuterWidth + centerOuterWidth;
							let newcenterWidth = centerOuterWidth * 100 / outerwidths;
							marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
							right.style["white-space"] = "normal";
							center.style["white-space"] = "normal";
						}
					}
				}else if(centerWidth !== "none" && centerWidth !== "auto"){
					if(leftContent && leftWidth !== "none" && leftWidth !== "auto"){
						marginGroup.style["grid-template-columns"] = leftWidth + " " + centerWidth + " 1fr";
					}else if(rightContent && rightWidth !== "none" && rightWidth !== "auto"){
						marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " " + rightWidth;
					}else{
						marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " 1fr";
					}
				}
			}else{
				if(leftContent){
					if(!rightContent){
						marginGroup.style["grid-template-columns"] = "1fr 0 0";
					}else{
						if(leftWidth !== "none" && leftWidth !== "auto"){
							if(rightWidth !== "none" && rightWidth !== "auto"){
								marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
							}else{
								marginGroup.style["grid-template-columns"] = leftWidth + " 0 1fr";
							}
						}else{
							if(rightWidth !== "none" && rightWidth !== "auto"){
								marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
							}else{
								marginGroup.style["grid-template-columns"] = "auto 1fr auto";
								left.style["white-space"] = "nowrap";
								right.style["white-space"] = "nowrap";
								let leftOuterWidth = left.offsetWidth;
								let rightOuterWidth = right.offsetWidth;
								let outerwidths = leftOuterWidth + rightOuterWidth;
								let newLeftWidth = leftOuterWidth * 100 / outerwidths;
								marginGroup.style["grid-template-columns"] = "minmax(16.66%, " + newLeftWidth  + "%) 0 1fr";
								left.style["white-space"] = "normal";
								right.style["white-space"] = "normal";
							}
						}
					}
				}else{
					if(rightWidth !== "none" && rightWidth !== "auto"){
						marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
					}else{
						marginGroup.style["grid-template-columns"] = "0 0 1fr";
					}
				}
			}
		});

		["left", "right"].forEach((loc) => {
			let middle = page.element.querySelector(".pagedjs_margin-" + loc + "-middle.hasContent");
			let marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
			let top = page.element.querySelector(".pagedjs_margin-" + loc + "-top");
			let bottom = page.element.querySelector(".pagedjs_margin-" + loc + "-bottom");
			let topContent = top.classList.contains("hasContent");
			let bottomContent = bottom.classList.contains("hasContent");
			let middleHeight: string, topHeight: string, bottomHeight: string;

			if (topContent) {
				topHeight = window.getComputedStyle(top)["max-height"];
			}

			if (bottomContent) {
				bottomHeight = window.getComputedStyle(bottom)["max-height"];
			}

			if (middle) {
				middleHeight = window.getComputedStyle(middle)["max-height"];

				if(middleHeight === "none" || middleHeight === "auto") {
					if(!topContent && !bottomContent){
						marginGroup.style["grid-template-rows"] = "0 1fr 0";
					}else if(topContent){
						if(!bottomContent){
							if(topHeight !== "none" && topHeight !== "auto"){
								marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
							}
						}else{
							if(topHeight !== "none" && topHeight !== "auto"){
								if(bottomHeight !== "none" && bottomHeight !== "auto"){
									marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + " - " + bottomHeight + ") " + bottomHeight;
								}else{
									marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
								}
							}else{
								if(bottomHeight !== "none" && bottomHeight !== "auto"){
									marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
								}
							}
						}
					}else{
						if(bottomHeight !== "none" && bottomHeight !== "auto"){
							marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
						}
					}
				}else{
					if(topContent && topHeight !== "none" && topHeight !== "auto"){
						marginGroup.style["grid-template-rows"] = topHeight +" " + middleHeight + " calc(100% - (" + topHeight + " + " + middleHeight + "))";
					}else if(bottomContent && bottomHeight !== "none" && bottomHeight !== "auto"){
						marginGroup.style["grid-template-rows"] = "1fr " + middleHeight + " " + bottomHeight;
					}else{
						marginGroup.style["grid-template-rows"] = "calc((100% - " + middleHeight + ")/2) " + middleHeight + " calc((100% - " + middleHeight + ")/2)";
					}
				}
			}else{
				if(topContent){
					if(!bottomContent){
						marginGroup.style["grid-template-rows"] = "1fr 0 0";
					}else{
						if(topHeight !== "none" && topHeight !== "auto"){
							if(bottomHeight !== "none" && bottomHeight !== "auto"){
								marginGroup.style["grid-template-rows"] = topHeight + " 1fr " + bottomHeight;
							}else{
								marginGroup.style["grid-template-rows"] = topHeight + " 0 1fr";
							}
						}else{
							if(bottomHeight !== "none" && bottomHeight !== "auto"){
								marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
							}else{
								marginGroup.style["grid-template-rows"] = "1fr 0 1fr";
							}
						}
					}
				}else{
					if(bottomHeight !== "none" && bottomHeight !== "auto"){
						marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
					}else{
						marginGroup.style["grid-template-rows"] = "0 0 1fr";
					}
				}
			}
		});
	}

	applyHasSelectors(page: any, chunker: any): void {
		let hasPages: PageModel[] = [];
		for (let sel in this.pages) {
			let pg = this.pages[sel];
			if (pg.has) {
				hasPages.push(pg);
			}
		}

		if (hasPages.length === 0) {
			return;
		}

		let contentArea = page.element.querySelector(".pagedjs_page_content");
		if (!contentArea) {
			return;
		}

		hasPages.forEach((pg) => {
			try {
				if (contentArea.matches(`:has(${pg.has})`)) {
					let hasClass = this.getHasClassName(pg.selector, pg.has);
					page.element.classList.add(hasClass);

					if (!page.hasMatches) {
						page.hasMatches = [];
					}
					page.hasMatches.push({
						selector: pg.selector,
						hasSelector: pg.has,
						className: hasClass
					});
				}
			} catch (e) {
				if (contentArea.querySelector(pg.has)) {
					let hasClass = this.getHasClassName(pg.selector, pg.has);
					page.element.classList.add(hasClass);

					if (!page.hasMatches) {
						page.hasMatches = [];
					}
					page.hasMatches.push({
						selector: pg.selector,
						hasSelector: pg.has,
						className: hasClass
					});
				}
			}
		});
	}

	getHasClassName(pageSelector: string, hasSelector: string): string {
		let safeHas = hasSelector.replace(/[^a-zA-Z0-9_-]/g, "_");
		let safePage = pageSelector.replace(/[^a-zA-Z0-9_-]/g, "_") || "page";
		return `pagedjs_has_${safePage}_${safeHas}`;
	}

	selectorsForPage(page: PageModel): any {
		let nthlist: any;
		let nth: any;

		let selectors = new csstree.List();

		selectors.insertData({
			type: "ClassSelector",
			name: "pagedjs_page"
		});

		if (page.name) {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_named_page"
			});

			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.name + "_page"
			});
		}

		if (page.psuedo && !(page.name && page.psuedo === "first")) {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.psuedo + "_page"
			});
		}

		if (page.name && page.psuedo === "first") {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.name + "_" + page.psuedo + "_page"
			});
		}

		if (page.nth) {
			nthlist = new csstree.List();
			nth = this.getNth(page.nth);

			nthlist.insertData(nth);

			selectors.insertData({
				type: "PseudoClassSelector",
				name: "nth-of-type",
				children: nthlist
			});
		}

		return selectors;
	}

	selectorsForPageWithHas(page: PageModel): any {
		let selectors = this.selectorsForPage(page);

		if (page.has) {
			let hasClass = this.getHasClassName(page.selector, page.has);
			selectors.insertData({
				type: "ClassSelector",
				name: hasClass
			});
		}

		return selectors;
	}

	selectorsForPageWithIs(page: PageModel, isSelector: string): any {
		let selectors = new csstree.List();

		selectors.insertData({
			type: "ClassSelector",
			name: "pagedjs_page"
		});

		let classMapping: Record<string, string> = {
			"first": "pagedjs_first_page",
			"left": "pagedjs_left_page",
			"right": "pagedjs_right_page",
			"blank": "pagedjs_blank_page"
		};

		if (page.name) {
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_named_page"
			});
			selectors.insertData({
				type: "ClassSelector",
				name: "pagedjs_" + page.name + "_page"
			});
		}

		if (classMapping[isSelector]) {
			selectors.insertData({
				type: "ClassSelector",
				name: classMapping[isSelector]
			});
		} else if (isSelector.startsWith("nth")) {
			let nthValue = isSelector.replace(/^nth\((.*)\)$/, "$1");
			if (nthValue !== isSelector) {
				let nthlist = new csstree.List();
				let nth = this.getNth(nthValue);
				nthlist.insertData(nth);
				selectors.insertData({
					type: "PseudoClassSelector",
					name: "nth-of-type",
					children: nthlist
				});
			}
		}

		return selectors;
	}

	selectorsForPageMargin(page: PageModel, margin: string): any {
		let selectors = this.selectorsForPage(page);

		selectors.insertData({
			type: "Combinator",
			name: " "
		});

		selectors.insertData({
			type: "ClassSelector",
			name: "pagedjs_margin-" + margin
		});

		return selectors;
	}

	createDeclaration(property: string, value: string, important?: boolean): any {
		let children = new csstree.List();

		children.insertData({
			type: "Identifier",
			loc: null,
			name: value
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createVariable(property: string, value: string): any {
		return {
			type: "Declaration",
			loc: null,
			property: property,
			value: {
				type: "Raw",
				value: value
			}
		};
	}

	createCalculatedDimension(property: string, items: any[], important?: boolean, operator: string = "+"): any {
		let children = new csstree.List();
		let calculations = new csstree.List();

		items.forEach((item, index) => {
			calculations.appendData({
				type: "Dimension",
				unit: item.unit,
				value: item.value
			});

			calculations.appendData({
				type: "WhiteSpace",
				value: " "
			});

			if (index + 1 < items.length) {
				calculations.appendData({
					type: "Operator",
					value: operator
				});

				calculations.appendData({
					type: "WhiteSpace",
					value: " "
				});
			}
		});

		children.insertData({
			type: "Function",
			loc: null,
			name: "calc",
			children: calculations
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createDimension(property: string, cssValue: SizeValue, important?: boolean): any {
		let children = new csstree.List();

		children.insertData({
			type: "Dimension",
			loc: null,
			value: cssValue.value,
			unit: cssValue.unit
		});

		return {
			type: "Declaration",
			loc: null,
			important: important,
			property: property,
			value: {
				type: "Value",
				loc: null,
				children: children
			}
		};
	}

	createBlock(declarations: any[]): any {
		let block = new csstree.List();

		declarations.forEach((declaration) => {
			block.insertData(declaration);
		});

		return {
			type: "Block",
			loc: null,
			children: block
		};
	}

	createRule(selectors: any, block: any): any {
		let selectorList = new csstree.List();
		selectorList.insertData({
			type: "Selector",
			children: selectors
		});

		if (Array.isArray(block)) {
			block = this.createBlock(block);
		}

		return {
			type: "Rule",
			prelude: {
				type: "SelectorList",
				children: selectorList
			},
			block: block
		};
	}
}

export default AtPage;
