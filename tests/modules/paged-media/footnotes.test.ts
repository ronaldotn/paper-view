/**
 * @jest-environment jsdom
 */
import Footnotes from '../../../src/modules/paged-media/footnotes.ts';
import * as csstree from 'css-tree';

describe('Footnotes', () => {
	let footnotes: any;
	let mockChunker: any;
	let mockPolisher: any;

	beforeEach(() => {
		mockChunker = {
			hooks: {},
			pages: []
		};
		mockPolisher = {
			hooks: {},
			styleSheet: {
				cssRules: [] as string[],
				insertRule: jest.fn((rule: string, index: number) => {
					mockPolisher.styleSheet.cssRules.push(rule);
					return index;
				})
			}
		};
		footnotes = new Footnotes(mockChunker, mockPolisher, null);
	});

	describe('onDeclaration()', () => {
		it('should detect float: footnote', () => {
			const css = '.note { float: footnote; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteSelectors).toContain('.note');
		});

		it('should detect footnote-display: block', () => {
			const css = '.note { footnote-display: block; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteDisplay).toBe('block');
		});

		it('should detect footnote-display: inline', () => {
			const css = '.note { footnote-display: inline; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteDisplay).toBe('inline');
		});

		it('should detect footnote-display: compact', () => {
			const css = '.note { footnote-display: compact; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteDisplay).toBe('compact');
		});

		it('should detect footnote-policy: line', () => {
			const css = '.note { footnote-policy: line; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnotePolicy).toBe('line');
		});

		it('should detect footnote-policy: keep', () => {
			const css = '.note { footnote-policy: keep; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnotePolicy).toBe('keep');
		});

		it('should detect footnote-policy: block', () => {
			const css = '.note { footnote-policy: block; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnotePolicy).toBe('block');
		});

		it('should handle multiple selectors', () => {
			const css = '.note, .ref { float: footnote; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteSelectors).toContain('.note');
			expect(footnotes.footnoteSelectors).toContain('.ref');
		});

		it('should not detect other float values', () => {
			const css = '.sidebar { float: left; }';
			const ast = csstree.parse(css);
			let ruleNode: any = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node: any) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node: any, dItem: any, dList: any) => {
					footnotes.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(footnotes.footnoteSelectors).toHaveLength(0);
		});
	});

	describe('onAtPage()', () => {
		it('should detect @footnote area', () => {
			const css = '@page { @footnote { border-top: 1px solid black; } }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						footnotes.onAtPage(node, item, list);
					}
				}
			});

			expect(footnotes.footnoteAreaDefined).toBe(true);
		});

		it('should parse @footnote styles', () => {
			const css = '@page { @footnote { border-top: 1px solid black; padding-top: 6pt; } }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						footnotes.onAtPage(node, item, list);
					}
				}
			});

			expect(footnotes.footnoteAreaStyles['border-top']).toBe('1px solid black');
			expect(footnotes.footnoteAreaStyles['padding-top']).toBe('6pt');
		});
	});

	describe('afterParsed()', () => {
		it('should mark footnote elements', () => {
			footnotes.footnoteSelectors = ['.note'];

			const parsed = document.createElement('div');
			const p = document.createElement('p');
			p.textContent = 'Some text ';
			const note = document.createElement('span');
			note.className = 'note';
			note.textContent = 'This is a footnote';
			p.appendChild(note);
			parsed.appendChild(p);

			footnotes.afterParsed(parsed);

			expect(note.dataset.footnote).toBe('1');
			expect(note.dataset.footnoteOriginal).toBe('true');
		});

		it('should create footnote-call element', () => {
			footnotes.footnoteSelectors = ['.note'];

			const parsed = document.createElement('div');
			const p = document.createElement('p');
			p.textContent = 'Some text ';
			const note = document.createElement('span');
			note.className = 'note';
			note.textContent = 'This is a footnote';
			p.appendChild(note);
			parsed.appendChild(p);

			footnotes.afterParsed(parsed);

			let call = parsed.querySelector('.pagedjs_footnote_call');
			expect(call).not.toBeNull();
			expect((call as HTMLElement).dataset.footnoteCall).toBe('1');
			expect(call!.textContent).toBe('1');
		});

		it('should increment footnote numbers', () => {
			footnotes.footnoteSelectors = ['.note'];

			const parsed = document.createElement('div');
			const p1 = document.createElement('p');
			const note1 = document.createElement('span');
			note1.className = 'note';
			note1.textContent = 'First footnote';
			p1.appendChild(note1);

			const p2 = document.createElement('p');
			const note2 = document.createElement('span');
			note2.className = 'note';
			note2.textContent = 'Second footnote';
			p2.appendChild(note2);

			parsed.appendChild(p1);
			parsed.appendChild(p2);

			footnotes.afterParsed(parsed);

			expect(note1.dataset.footnote).toBe('1');
			expect(note2.dataset.footnote).toBe('2');
		});

		it('should setup footnote counter styles', () => {
			footnotes.footnoteSelectors = ['.note'];

			const parsed = document.createElement('div');
			footnotes.afterParsed(parsed);

			expect(mockPolisher.styleSheet.insertRule).toHaveBeenCalled();
		});
	});

	describe('createFootnoteCall()', () => {
		it('should create a span with correct attributes', () => {
			let call = footnotes.createFootnoteCall(5);

			expect(call.tagName).toBe('SPAN');
			expect(call.className).toBe('pagedjs_footnote_call');
			expect(call.dataset.footnoteCall).toBe('5');
			expect(call.textContent).toBe('5');
		});
	});

	describe('createFootnoteElement()', () => {
		it('should create a footnote div with marker and content', () => {
			const original = document.createElement('span');
			original.textContent = 'Footnote text';

			let fn = footnotes.createFootnoteElement(original, '3');

			expect(fn.tagName).toBe('DIV');
			expect(fn.className).toBe('pagedjs_footnote');
			expect(fn.dataset.footnoteNumber).toBe('3');

			let marker = fn.querySelector('.pagedjs_footnote_marker');
			expect(marker).not.toBeNull();
			expect(marker!.textContent).toBe('3');

			let content = fn.querySelector('.pagedjs_footnote_content');
			expect(content).not.toBeNull();
		});
	});

	describe('getFootnoteCount()', () => {
		it('should return current footnote number', () => {
			footnotes.currentFootnoteNumber = 7;
			expect(footnotes.getFootnoteCount()).toBe(7);
		});
	});

	describe('resetFootnoteCounter()', () => {
		it('should reset the counter', () => {
			footnotes.currentFootnoteNumber = 10;
			footnotes.resetFootnoteCounter();
			expect(footnotes.currentFootnoteNumber).toBe(0);
		});
	});

	describe('parseFootnoteArea()', () => {
		it('should return empty object for empty block', () => {
			const css = '@page { @footnote { } }';
			const ast = csstree.parse(css);
			let footnoteRule: any = null;

			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any) => {
					if (node.name === 'footnote') {
						footnoteRule = node;
					}
				}
			});

			let styles = footnotes.parseFootnoteArea(footnoteRule);
			expect(styles).toEqual({});
		});

		it('should parse single declaration', () => {
			const css = '@page { @footnote { border-top: 1px solid #333; } }';
			const ast = csstree.parse(css);
			let footnoteRule: any = null;

			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any) => {
					if (node.name === 'footnote') {
						footnoteRule = node;
					}
				}
			});

			let styles = footnotes.parseFootnoteArea(footnoteRule);
			expect(styles['border-top']).toBe('1px solid #333');
		});
	});
});
