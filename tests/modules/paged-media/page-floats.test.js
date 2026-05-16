/**
 * @jest-environment jsdom
 */
import PageFloats from '../../../src/modules/paged-media/page-floats.ts';
import * as csstree from 'css-tree';

describe('PageFloats', () => {
	let pageFloats;
	let mockChunker;
	let mockPolisher;

	beforeEach(() => {
		mockChunker = {
			hooks: {},
			pages: []
		};
		mockPolisher = {
			hooks: {},
			styleSheet: {
				cssRules: [],
				insertRule: jest.fn((rule, index) => {
					mockPolisher.styleSheet.cssRules.push(rule);
					return index;
				})
			}
		};
		pageFloats = new PageFloats(mockChunker, mockPolisher, null);
	});

	describe('onDeclaration()', () => {
		it('should detect float: top', () => {
			const css = 'figure { float: top; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('figure')).toBe(true);
		});

		it('should detect float: bottom', () => {
			const css = 'table { float: bottom; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('table')).toBe(true);
		});

		it('should detect float: page', () => {
			const css = '.full-figure { float: page; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('.full-figure')).toBe(true);
		});

		it('should detect float: here', () => {
			const css = '.here-figure { float: here; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('.here-figure')).toBe(true);
		});

		it('should detect float-defer', () => {
			const css = 'figure { float: top; float-defer: 1; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('figure')).toBe(true);
		});

		it('should detect clear: page-top', () => {
			const css = 'figure { float: top; clear: page-top; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('figure')).toBe(true);
		});

		it('should detect clear: page-bottom', () => {
			const css = 'table { float: bottom; clear: page-bottom; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('table')).toBe(true);
		});

		it('should not detect standard float values', () => {
			const css = '.sidebar { float: left; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('.sidebar')).toBe(false);
		});

		it('should handle multiple selectors', () => {
			const css = 'figure, table, .float-block { float: top; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('figure')).toBe(true);
			expect(pageFloats.floatSelectors.has('table')).toBe(true);
			expect(pageFloats.floatSelectors.has('.float-block')).toBe(true);
		});

		it('should detect snap values', () => {
			const css = 'figure { float: snap; }';
			const ast = csstree.parse(css);
			let ruleNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node, dItem, dList) => {
					pageFloats.onDeclaration(node, dItem, dList, { ruleNode });
				}
			});

			expect(pageFloats.floatSelectors.has('figure')).toBe(true);
		});
	});

	describe('afterParsed()', () => {
		it('should mark figure elements with float: top', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [{ property: 'float', value: 'top', selector: 'figure' }]
			};

			const parsed = document.createElement('div');
			const fig = document.createElement('figure');
			fig.textContent = 'Figure content';
			parsed.appendChild(fig);

			pageFloats.afterParsed(parsed);

			expect(fig.dataset.pageFloat).toBe('top');
		});

		it('should mark table elements with float: bottom', () => {
			pageFloats.floatSelectors = new Set(['table']);
			pageFloats.floatRules = {
				'table': [{ property: 'float', value: 'bottom', selector: 'table' }]
			};

			const parsed = document.createElement('div');
			const table = document.createElement('table');
			table.textContent = 'Table content';
			parsed.appendChild(table);

			pageFloats.afterParsed(parsed);

			expect(table.dataset.pageFloat).toBe('bottom');
		});

		it('should mark elements with float: page', () => {
			pageFloats.floatSelectors = new Set(['.full-figure']);
			pageFloats.floatRules = {
				'.full-figure': [{ property: 'float', value: 'page', selector: '.full-figure' }]
			};

			const parsed = document.createElement('div');
			const fig = document.createElement('figure');
			fig.className = 'full-figure';
			fig.textContent = 'Full page figure';
			parsed.appendChild(fig);

			pageFloats.afterParsed(parsed);

			expect(fig.dataset.pageFloat).toBe('page');
		});

		it('should mark elements with float: here', () => {
			pageFloats.floatSelectors = new Set(['.here-figure']);
			pageFloats.floatRules = {
				'.here-figure': [{ property: 'float', value: 'here', selector: '.here-figure' }]
			};

			const parsed = document.createElement('div');
			const fig = document.createElement('figure');
			fig.className = 'here-figure';
			fig.textContent = 'Here figure';
			parsed.appendChild(fig);

			pageFloats.afterParsed(parsed);

			expect(fig.dataset.pageFloat).toBe('here');
		});

		it('should respect float-defer', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [
					{ property: 'float', value: 'top', selector: 'figure' },
					{ property: 'float-defer', value: '2', selector: 'figure' }
				]
			};

			const parsed = document.createElement('div');
			const fig = document.createElement('figure');
			fig.textContent = 'Deferred figure';
			parsed.appendChild(fig);

			pageFloats.afterParsed(parsed);

			expect(fig.dataset.pageFloat).toBe('top');
			expect(fig.dataset.pageFloatDeferr).toBe('2');
		});

		it('should respect clear property', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [
					{ property: 'float', value: 'top', selector: 'figure' },
					{ property: 'clear', value: 'page-top', selector: 'figure' }
				]
			};

			const parsed = document.createElement('div');
			const fig = document.createElement('figure');
			fig.textContent = 'Cleared figure';
			parsed.appendChild(fig);

			pageFloats.afterParsed(parsed);

			expect(fig.dataset.pageFloat).toBe('top');
			expect(fig.dataset.pageFloatClear).toBe('page-top');
		});
	});

	describe('afterPageLayout()', () => {
		function createMockPage() {
			const page = document.createElement('div');
			page.className = 'pagedjs_page';

			const pagebox = document.createElement('div');
			pagebox.className = 'pagedjs_pagebox';

			const area = document.createElement('div');
			area.className = 'pagedjs_area';

			const content = document.createElement('div');
			content.className = 'pagedjs_page_content';

			area.appendChild(content);
			pagebox.appendChild(area);
			page.appendChild(pagebox);

			return { page, pagebox, content };
		}

		it('should position float: top elements', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [{ property: 'float', value: 'top', selector: 'figure' }]
			};

			const { page, content } = createMockPage();
			const fig = document.createElement('figure');
			fig.textContent = 'Top figure';
			fig.dataset.ref = 'fig-1';
			content.appendChild(fig);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);

			const floatArea = page.querySelector('.pagedjs_float_top_area');
			expect(floatArea).not.toBeNull();
			expect(page.classList.contains('pagedjs_has_float_top')).toBe(true);
		});

		it('should position float: bottom elements', () => {
			pageFloats.floatSelectors = new Set(['table']);
			pageFloats.floatRules = {
				'table': [{ property: 'float', value: 'bottom', selector: 'table' }]
			};

			const { page, content } = createMockPage();
			const table = document.createElement('table');
			table.textContent = 'Bottom table';
			table.dataset.ref = 'table-1';
			content.appendChild(table);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);

			const floatArea = page.querySelector('.pagedjs_float_bottom_area');
			expect(floatArea).not.toBeNull();
			expect(page.classList.contains('pagedjs_has_float_bottom')).toBe(true);
		});

		it('should position float: page elements', () => {
			pageFloats.floatSelectors = new Set(['.full-figure']);
			pageFloats.floatRules = {
				'.full-figure': [{ property: 'float', value: 'page', selector: '.full-figure' }]
			};

			const { page, content } = createMockPage();
			const fig = document.createElement('figure');
			fig.className = 'full-figure';
			fig.textContent = 'Full page figure';
			fig.dataset.ref = 'full-fig-1';
			content.appendChild(fig);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);

			const floatArea = page.querySelector('.pagedjs_float_page_area');
			expect(floatArea).not.toBeNull();
		});

		it('should position float: here elements', () => {
			pageFloats.floatSelectors = new Set(['.here-figure']);
			pageFloats.floatRules = {
				'.here-figure': [{ property: 'float', value: 'here', selector: '.here-figure' }]
			};

			const { page, content } = createMockPage();
			const fig = document.createElement('figure');
			fig.className = 'here-figure';
			fig.textContent = 'Here figure';
			fig.dataset.ref = 'here-fig-1';
			content.appendChild(fig);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);

			const floatWrapper = content.querySelector('.pagedjs_float_here');
			expect(floatWrapper).not.toBeNull();
		});

		it('should mark original elements as processed', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [{ property: 'float', value: 'top', selector: 'figure' }]
			};

			const { page, content } = createMockPage();
			const fig = document.createElement('figure');
			fig.textContent = 'Test figure';
			fig.dataset.ref = 'test-fig-1';
			content.appendChild(fig);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);

			expect(fig.dataset.pageFloatProcessed).toBe('true');
			expect(fig.style.display).toBe('none');
		});

		it('should not process the same float twice', () => {
			pageFloats.floatSelectors = new Set(['figure']);
			pageFloats.floatRules = {
				'figure': [{ property: 'float', value: 'top', selector: 'figure' }]
			};

			const { page, content } = createMockPage();
			const fig = document.createElement('figure');
			fig.textContent = 'Test figure';
			fig.dataset.ref = 'unique-fig-1';
			content.appendChild(fig);

			pageFloats.afterParsed(page);
			pageFloats.afterPageLayout(page, null, null, null);
			pageFloats.afterPageLayout(page, null, null, null);

			const floatAreas = page.querySelectorAll('.pagedjs_float_top_area');
			expect(floatAreas.length).toBe(1);
		});
	});

	describe('createFloatWrapper()', () => {
		it('should create wrapper with correct class', () => {
			const el = document.createElement('figure');
			el.textContent = 'Test';
			const wrapper = pageFloats.createFloatWrapper(el, 'top');

			expect(wrapper.className).toContain('pagedjs_page_float');
			expect(wrapper.className).toContain('pagedjs_float_top');
			expect(wrapper.dataset.floatType).toBe('top');
		});

		it('should clone the element content', () => {
			const el = document.createElement('figure');
			el.textContent = 'Test content';
			const wrapper = pageFloats.createFloatWrapper(el, 'bottom');

			expect(wrapper.textContent).toBe('Test content');
		});

		it('should remove float data attributes from clone', () => {
			const el = document.createElement('figure');
			el.textContent = 'Test';
			const wrapper = pageFloats.createFloatWrapper(el, 'page');

			const clone = wrapper.firstChild;
			expect(clone.dataset.pageFloat).toBeUndefined();
			expect(clone.dataset.pageFloatDeferr).toBeUndefined();
		});
	});

	describe('addFloatStyles()', () => {
		it('should insert CSS rules', () => {
			pageFloats.addFloatStyles();
			expect(mockPolisher.styleSheet.insertRule).toHaveBeenCalled();
		});
	});

	describe('getFloatCount()', () => {
		it('should return number of processed floats', () => {
			pageFloats.processedFloats = new Set(['float1', 'float2', 'float3']);
			expect(pageFloats.getFloatCount()).toBe(3);
		});
	});

	describe('resetFloatCounter()', () => {
		it('should clear processed floats', () => {
			pageFloats.processedFloats = new Set(['float1', 'float2']);
			pageFloats.deferredFloats = [{ element: document.createElement('div'), type: 'top', defer: 0, clear: '' }];
			pageFloats.resetFloatCounter();

			expect(pageFloats.processedFloats.size).toBe(0);
			expect(pageFloats.deferredFloats).toEqual([]);
		});
	});
});
