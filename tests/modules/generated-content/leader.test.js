/**
 * @jest-environment jsdom
 */
import Leader from '../../../src/modules/generated-content/leader.ts';
import * as csstree from 'css-tree';

describe('Leader', () => {
	let leader;
	let mockChunker;
	let mockPolisher;

	beforeEach(() => {
		mockChunker = {
			hooks: {},
			pages: [],
			rendered: document.createElement('div')
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
		leader = new Leader(mockChunker, mockPolisher, null);
	});

	describe('onContent()', () => {
		it('should detect leader(dotted)', () => {
			const css = '.toc-entry::after { content: leader(dotted); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(Object.keys(leader.leaderTargets).length).toBe(1);
			expect(leader.leaderTargets['.toc-entry::after'].leaderType).toBe('dotted');
		});

		it('should detect leader with custom character', () => {
			const css = '.toc-entry::after { content: leader("."); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(leader.leaderTargets['.toc-entry::after'].leaderChar).toBe('.');
		});

		it('should detect leader(solid)', () => {
			const css = '.toc-entry::after { content: leader(solid); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(leader.leaderTargets['.toc-entry::after'].leaderType).toBe('solid');
		});

		it('should detect leader(space)', () => {
			const css = '.toc-entry::after { content: leader(space); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(leader.leaderTargets['.toc-entry::after'].leaderType).toBe('space');
		});

		it('should detect leader(dots)', () => {
			const css = '.toc-entry::after { content: leader(dots); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(leader.leaderTargets['.toc-entry::after'].leaderType).toBe('dots');
		});

		it('should handle multiple selectors', () => {
			const css = '.toc-entry, .index-entry::after { content: leader(dotted); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(Object.keys(leader.leaderTargets).length).toBeGreaterThan(0);
		});

		it('should replace leader() with var() in AST', () => {
			const css = '.toc-entry::after { content: leader(dotted); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			let funcNode = null;
			csstree.walk(ast, {
				visit: 'Function',
				enter: (node, fItem, fList) => {
					funcNode = node;
					leader.onContent(node, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(funcNode.name).toBe('var');
		});

		it('should work with target-counter in same content', () => {
			const css = '.toc-entry::after { content: leader(dotted) target-counter(attr(href url), page); }';
			const ast = csstree.parse(css);
			let ruleNode = null;
			let declarationNode = null;

			csstree.walk(ast, {
				visit: 'Rule',
				enter: (node) => { ruleNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Declaration',
				enter: (node) => { declarationNode = node; }
			});

			csstree.walk(ast, {
				visit: 'Function',
				enter: (funcNode, fItem, fList) => {
					leader.onContent(funcNode, fItem, fList, { declarationNode }, { ruleNode });
				}
			});

			expect(leader.leaderTargets['.toc-entry::after'].leaderType).toBe('dotted');
		});
	});

	describe('getLeaderCharacter()', () => {
		it('should return ". " for dotted', () => {
			expect(leader.getLeaderCharacter('dotted')).toBe('. ');
		});

		it('should return non-breaking space for solid', () => {
			expect(leader.getLeaderCharacter('solid')).toBe('\u00A0');
		});

		it('should return non-breaking space for space', () => {
			expect(leader.getLeaderCharacter('space')).toBe('\u00A0');
		});

		it('should return "• " for dots', () => {
			expect(leader.getLeaderCharacter('dots')).toBe('\u2022 ');
		});

		it('should return custom character', () => {
			expect(leader.getLeaderCharacter('-')).toBe('-');
		});

		it('should default to ". " for unknown types', () => {
			expect(leader.getLeaderCharacter('unknown')).toBe('. ');
		});
	});

	describe('parseLeaderType()', () => {
		it('should parse Identifier type', () => {
			const funcNode = {
				children: {
					first: { type: 'Identifier', name: 'dotted' }
				}
			};
			expect(leader.parseLeaderType(funcNode)).toBe('dotted');
		});

		it('should parse String type', () => {
			const funcNode = {
				children: {
					first: { type: 'String', value: '"-"' }
				}
			};
			expect(leader.parseLeaderType(funcNode)).toBe('-');
		});

		it('should default to dotted for empty', () => {
			const funcNode = {
				children: {
					first: null
				}
			};
			expect(leader.parseLeaderType(funcNode)).toBe('dotted');
		});
	});

	describe('afterParsed()', () => {
		it('should setup leader styles', () => {
			leader.leaderTargets = {
				'.toc-entry::after': {
					selector: '.toc-entry',
					fullSelector: '.toc-entry::after',
					leaderType: 'dotted',
					leaderChar: '. ',
					variable: '--pagedjs-leader-test',
					pseudo: '::after'
				}
			};

			leader.afterParsed(document.createElement('div'));

			expect(mockPolisher.styleSheet.insertRule).toHaveBeenCalled();
		});
	});

	describe('addLeaderStyles()', () => {
		it('should insert CSS rules', () => {
			leader.addLeaderStyles();
			expect(mockPolisher.styleSheet.insertRule).toHaveBeenCalled();
		});

		it('should include leader classes', () => {
			leader.addLeaderStyles();
			const rules = mockPolisher.styleSheet.cssRules;
			const hasLeaderClass = rules.some(rule =>
				rule.includes('.pagedjs_leader')
			);
			expect(hasLeaderClass).toBe(true);
		});
	});

	describe('getLeaderCount()', () => {
		it('should return number of leader targets', () => {
			leader.leaderTargets = {
				'.toc::after': {},
				'.index::after': {}
			};
			expect(leader.getLeaderCount()).toBe(2);
		});
	});

	describe('resetLeaderTargets()', () => {
		it('should clear leader targets', () => {
			leader.leaderTargets = { '.toc::after': {} };
			leader.resetLeaderTargets();
			expect(Object.keys(leader.leaderTargets).length).toBe(0);
		});
	});
});
