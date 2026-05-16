/**
 * @jest-environment jsdom
 */
import StringSets from '../../../src/modules/generated-content/string-sets.js';
import * as csstree from 'css-tree';

describe('StringSets', () => {
	let stringSets;
	let mockChunker;
	let mockPolisher;
	let mockCaller;

	beforeEach(() => {
		mockChunker = {
			hooks: {},
			pages: []
		};
		mockPolisher = {
			hooks: {},
			sheet: {
				insertRule: jest.fn()
			}
		};
		mockCaller = {};
		stringSets = new StringSets(mockChunker, mockPolisher, mockCaller);
	});

	describe('onDeclaration()', () => {
		it('should parse basic content() string-set', () => {
			const css = 'h1 { string-set: chapter content(); }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (ruleNode) => {
					csstree.walk(ruleNode.block, {
						visit: 'Declaration',
						enter: (node, dItem, dList) => {
							if (node.property === 'string-set') {
								stringSets.onDeclaration(node, dItem, dList, { ruleNode });
							}
						}
					});
				}
			});

			expect(stringSets.stringSetSelectors['chapter']).toBeDefined();
			expect(stringSets.stringSetSelectors['chapter'].keyword).toBe('first');
		});

		it('should parse content(first) string-set', () => {
			const css = 'h1 { string-set: chapter content(first); }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (ruleNode) => {
					csstree.walk(ruleNode.block, {
						visit: 'Declaration',
						enter: (node, dItem, dList) => {
							if (node.property === 'string-set') {
								stringSets.onDeclaration(node, dItem, dList, { ruleNode });
							}
						}
					});
				}
			});

			expect(stringSets.stringSetSelectors['chapter'].keyword).toBe('first');
		});

		it('should parse content(last) string-set', () => {
			const css = 'h2 { string-set: section content(last); }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (ruleNode) => {
					csstree.walk(ruleNode.block, {
						visit: 'Declaration',
						enter: (node, dItem, dList) => {
							if (node.property === 'string-set') {
								stringSets.onDeclaration(node, dItem, dList, { ruleNode });
							}
						}
					});
				}
			});

			expect(stringSets.stringSetSelectors['section'].keyword).toBe('last');
		});

		it('should parse content(start) string-set', () => {
			const css = 'h1 { string-set: title content(start); }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (ruleNode) => {
					csstree.walk(ruleNode.block, {
						visit: 'Declaration',
						enter: (node, dItem, dList) => {
							if (node.property === 'string-set') {
								stringSets.onDeclaration(node, dItem, dList, { ruleNode });
							}
						}
					});
				}
			});

			expect(stringSets.stringSetSelectors['title'].keyword).toBe('start');
		});

		it('should parse content(first-except) string-set', () => {
			const css = 'h1 { string-set: chapter content(first-except); }';
			const ast = csstree.parse(css);

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (ruleNode) => {
					csstree.walk(ruleNode.block, {
						visit: 'Declaration',
						enter: (node, dItem, dList) => {
							if (node.property === 'string-set') {
								stringSets.onDeclaration(node, dItem, dList, { ruleNode });
							}
						}
					});
				}
			});

			expect(stringSets.stringSetSelectors['chapter'].keyword).toBe('first-except');
		});
	});

	describe('afterPageLayout()', () => {
		it('should apply first keyword value', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content()',
				keyword: 'first',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			const fragment = document.createElement('div');
			const h1 = document.createElement('h1');
			h1.textContent = 'Chapter 1';
			fragment.appendChild(h1);

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const cssVar = fragment.style.getPropertyValue('--pagedjs-string-chapter');
			expect(cssVar).toContain('Chapter 1');
		});

		it('should apply last keyword value when multiple elements exist', () => {
			stringSets.stringSetSelectors['section'] = {
				identifier: 'section',
				value: 'content(last)',
				keyword: 'last',
				selector: 'h2',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			const fragment = document.createElement('div');
			const h2a = document.createElement('h2');
			h2a.textContent = 'Section A';
			const h2b = document.createElement('h2');
			h2b.textContent = 'Section B';
			fragment.appendChild(h2a);
			fragment.appendChild(h2b);

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const cssVar = fragment.style.getPropertyValue('--pagedjs-string-section');
			expect(cssVar).toContain('Section B');
		});

		it('should apply start keyword value on first page', () => {
			stringSets.stringSetSelectors['title'] = {
				identifier: 'title',
				value: 'content(start)',
				keyword: 'start',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			const fragment = document.createElement('div');
			const h1 = document.createElement('h1');
			h1.textContent = 'First Title';
			fragment.appendChild(h1);

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const cssVar = fragment.style.getPropertyValue('--pagedjs-string-title');
			expect(cssVar).toContain('First Title');
		});

		it('should return empty string for first-except on first page', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content(first-except)',
				keyword: 'first-except',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			const fragment = document.createElement('div');
			const h1 = document.createElement('h1');
			h1.textContent = 'Chapter 1';
			fragment.appendChild(h1);

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const cssVar = fragment.style.getPropertyValue('--pagedjs-string-chapter');
			expect(cssVar).toBe('""');
		});

		it('should apply first-except value on non-first pages', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content(first-except)',
				keyword: 'first-except',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			// Simulate first page
			const fragment1 = document.createElement('div');
			stringSets.afterPageLayout(fragment1, null, null, mockChunker);

			// Second page with content
			const fragment2 = document.createElement('div');
			const h1 = document.createElement('h1');
			h1.textContent = 'Chapter 2';
			fragment2.appendChild(h1);

			stringSets.afterPageLayout(fragment2, null, null, mockChunker);

			const cssVar = fragment2.style.getPropertyValue('--pagedjs-string-chapter');
			expect(cssVar).toContain('Chapter 2');
		});

		it('should persist previous value when no matching element on page', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content()',
				keyword: 'first',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: 'Previous Chapter'
			};

			const fragment = document.createElement('div');

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const cssVar = fragment.style.getPropertyValue('--pagedjs-string-chapter');
			expect(cssVar).toContain('Previous Chapter');
		});
	});

	describe('getValueForKeyword()', () => {
		it('should return first value for first keyword', () => {
			const set = {
				keyword: 'first',
				first: 'First Value',
				previous: 'Previous Value'
			};

			expect(stringSets.getValueForKeyword(set, false)).toBe('First Value');
		});

		it('should return last value for last keyword', () => {
			const set = {
				keyword: 'last',
				first: 'First Value',
				last: 'Last Value',
				previous: 'Previous Value'
			};

			expect(stringSets.getValueForKeyword(set, false)).toBe('Last Value');
		});

		it('should return start value for start keyword', () => {
			const set = {
				keyword: 'start',
				first: 'Current First',
				start: 'Start Value'
			};

			expect(stringSets.getValueForKeyword(set, false)).toBe('Current First');
		});

		it('should return empty string for first-except on first page', () => {
			const set = {
				keyword: 'first-except',
				firstExcept: null
			};

			expect(stringSets.getValueForKeyword(set, true)).toBe('');
		});

		it('should return first-except value on non-first page', () => {
			const set = {
				keyword: 'first-except',
				firstExcept: 'Except Value'
			};

			expect(stringSets.getValueForKeyword(set, false)).toBe('Except Value');
		});
	});

	describe('reset()', () => {
		it('should clear all string values', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content()',
				keyword: 'first',
				selector: 'h1',
				first: 'Chapter 1',
				last: 'Chapter 1',
				start: 'Chapter 1',
				firstExcept: null,
				previous: 'Chapter 1'
			};
			stringSets.pageCount = 5;
			stringSets.pageStringValues['chapter'] = [{ page: 1, first: 'Chapter 1' }];

			stringSets.reset();

			expect(stringSets.pageCount).toBe(0);
			expect(stringSets.stringSetSelectors['chapter'].first).toBeNull();
			expect(stringSets.pageStringValues['chapter']).toBeUndefined();
		});
	});

	describe('getStringValues()', () => {
		it('should return collected values for debugging', () => {
			stringSets.stringSetSelectors['chapter'] = {
				identifier: 'chapter',
				value: 'content()',
				keyword: 'first',
				selector: 'h1',
				first: null,
				last: null,
				start: null,
				firstExcept: null,
				previous: null
			};

			const fragment = document.createElement('div');
			const h1 = document.createElement('h1');
			h1.textContent = 'Chapter 1';
			fragment.appendChild(h1);

			stringSets.afterPageLayout(fragment, null, null, mockChunker);

			const values = stringSets.getStringValues('chapter');
			expect(values).toHaveLength(1);
			expect(values[0].first).toBe('Chapter 1');
		});
	});
});
