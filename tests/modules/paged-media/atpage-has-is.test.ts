/**
 * @jest-environment jsdom
 */
import AtPage from '../../../src/modules/paged-media/atpage.ts';
import * as csstree from 'css-tree';

describe('AtPage :has() and :is() Selectors', () => {
	let atPage: any;
	let mockChunker: any;
	let mockPolisher: any;

	beforeEach(() => {
		mockChunker = {
			viewMode: 'spread',
			hooks: {}
		};
		mockPolisher = {
			hooks: {},
			sheet: {
				insertRule: jest.fn()
			}
		};
		atPage = new AtPage(mockChunker, mockPolisher, null);
	});

	describe('getHasSelector()', () => {
		it('should extract :has() selector with element', () => {
			const css = '@page:has(h1) { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const hasSelector = atPage.getHasSelector(node);
						expect(hasSelector).toBe('h1');
					}
				}
			});
		});

		it('should extract :has() selector with class', () => {
			const css = '@page:has(img.figure) { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const hasSelector = atPage.getHasSelector(node);
						expect(hasSelector).toBe('img.figure');
					}
				}
			});
		});

		it('should return undefined when no :has() selector', () => {
			const css = '@page { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const hasSelector = atPage.getHasSelector(node);
						expect(hasSelector).toBeUndefined();
					}
				}
			});
		});
	});

	describe('getIsSelector()', () => {
		it('should extract :is() selector with single pseudo', () => {
			const css = '@page:is(:first) { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const isSelector = atPage.getIsSelector(node);
						expect(isSelector).toEqual(['first']);
					}
				}
			});
		});

		it('should extract :is() selector with multiple pseudos', () => {
			const css = '@page:is(:first, :blank) { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const isSelector = atPage.getIsSelector(node);
						expect(isSelector).toEqual(['first', 'blank']);
					}
				}
			});
		});

		it('should return undefined when no :is() selector', () => {
			const css = '@page { margin: 2cm; }';
			const ast = csstree.parse(css);
			
			csstree.walk(ast, {
				visit: 'Atrule',
				enter: (node: any, item: any, list: any) => {
					if (csstree.keyword(node.name).basename === 'page') {
						const isSelector = atPage.getIsSelector(node);
						expect(isSelector).toBeUndefined();
					}
				}
			});
		});
	});

	describe('pageModel()', () => {
		it('should include has and is properties', () => {
			const model = atPage.pageModel(':has(h1)');
			expect(model).toHaveProperty('has');
			expect(model).toHaveProperty('is');
			expect(model.has).toBeUndefined();
			expect(model.is).toBeUndefined();
		});
	});

	describe('getHasClassName()', () => {
		it('should generate valid class name for simple selector', () => {
			const className = atPage.getHasClassName('*', 'h1');
			expect(className).toBe('pagedjs_has___h1');
		});

		it('should generate valid class name for complex selector', () => {
			const className = atPage.getHasClassName('*', 'img.figure');
			expect(className).toBe('pagedjs_has___img_figure');
		});

		it('should generate valid class name for named page', () => {
			const className = atPage.getHasClassName('chapter', 'h1');
			expect(className).toBe('pagedjs_has_chapter_h1');
		});
	});
});

describe('Specificity with :has() and :is()', () => {
	describe('Polisher calculateSpecificity()', () => {
		let Polisher: any;
		let polisher: any;

		beforeAll(async () => {
			const mod = await import('../../../src/polisher/polisher.ts');
			Polisher = mod.default;
		});

		beforeEach(() => {
			polisher = new Polisher();
		});

		it('should give higher specificity to :has() selectors', () => {
			const hasScore = polisher.calculateSpecificity(':has(h1)');
			const firstScore = polisher.calculateSpecificity(':first');
			expect(hasScore).toBeGreaterThan(firstScore);
		});

		it('should calculate specificity for :is() selectors', () => {
			const isScore = polisher.calculateSpecificity(':is(:first, :blank)');
			expect(isScore).toBeGreaterThan(0);
		});

		it('should give :has() highest specificity', () => {
			const hasScore = polisher.calculateSpecificity(':has(h1)');
			const blankScore = polisher.calculateSpecificity(':blank');
			const firstScore = polisher.calculateSpecificity(':first');
			const leftScore = polisher.calculateSpecificity(':left');
			
			expect(hasScore).toBeGreaterThan(blankScore);
			expect(hasScore).toBeGreaterThan(firstScore);
			expect(hasScore).toBeGreaterThan(leftScore);
		});
	});
});
