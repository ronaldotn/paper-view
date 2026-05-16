/**
 * @jest-environment jsdom
 */
import hyphenator, { Hyphenator, HYPHENATION_PATTERNS } from '../../../src/utils/hyphenator.ts';
import * as csstree from 'css-tree';

describe('Hyphenator', () => {
	describe('hyphenate()', () => {
		it('should return short words unchanged', () => {
			expect(hyphenator.hyphenate('cat', 'en')).toBe('cat');
			expect(hyphenator.hyphenate('dog', 'en')).toBe('dog');
		});

		it('should hyphenate English words with exceptions', () => {
			const result = hyphenator.hyphenate('interesting', 'en');
			expect(result).toContain('\u00AD');
		});

		it('should hyphenate beautiful correctly', () => {
			const result = hyphenator.hyphenate('beautiful', 'en');
			expect(result).toContain('\u00AD');
		});

		it('should respect custom hyphen character', () => {
			const result = hyphenator.hyphenate('beautiful', 'en', { hyphenCharacter: '-' });
			expect(result).toContain('-');
		});

		it('should handle Spanish words', () => {
			const result = hyphenator.hyphenate('comunicación', 'es');
			expect(result).toContain('\u00AD');
		});

		it('should handle French words', () => {
			const result = hyphenator.hyphenate('communication', 'fr');
			expect(result).toContain('\u00AD');
		});

		it('should handle German words', () => {
			const result = hyphenator.hyphenate('Kommunikation', 'de');
			expect(result).toContain('\u00AD');
		});

		it('should handle Italian words', () => {
			const result = hyphenator.hyphenate('comunicazione', 'it');
			expect(result).toContain('\u00AD');
		});

		it('should handle Portuguese words', () => {
			const result = hyphenator.hyphenate('comunicação', 'pt');
			expect(result).toContain('\u00AD');
		});

		it('should respect minWordLength option', () => {
			const result = hyphenator.hyphenate('test', 'en', { minWordLength: 10 });
			expect(result).toBe('test');
		});

		it('should respect minCharsBefore option', () => {
			const result = hyphenator.hyphenate('development', 'en', { minCharsBefore: 5 });
			const parts = result.split('\u00AD');
			if (parts.length > 1) {
				expect(parts[0].length).toBeGreaterThanOrEqual(5);
			}
		});

		it('should respect minCharsAfter option', () => {
			const result = hyphenator.hyphenate('development', 'en', { minCharsAfter: 5 });
			const parts = result.split('\u00AD');
			if (parts.length > 1) {
				expect(parts[parts.length - 1].length).toBeGreaterThanOrEqual(5);
			}
		});

		it('should cache results', () => {
			const result1 = hyphenator.hyphenate('extraordinary', 'en');
			const result2 = hyphenator.hyphenate('extraordinary', 'en');
			expect(result1).toBe(result2);
		});

		it('should handle words with no hyphenation points', () => {
			const result = hyphenator.hyphenate('strength', 'en');
			expect(typeof result).toBe('string');
		});
	});

	describe('findHyphenationPoints()', () => {
		it('should return array of break points', () => {
			const points = hyphenator.findHyphenationPoints('extraordinary', 'en');
			expect(Array.isArray(points)).toBe(true);
		});

		it('should return empty array for short words', () => {
			const points = hyphenator.findHyphenationPoints('cat', 'en');
			expect(points).toEqual([]);
		});

		it('should respect constraints', () => {
			const points = hyphenator.findHyphenationPoints('development', 'en', {
				minCharsBefore: 3,
				minCharsAfter: 3
			});

			for (const point of points) {
				expect(point).toBeGreaterThanOrEqual(3);
				expect(point).toBeLessThanOrEqual(11 - 3);
			}
		});
	});

	describe('getSupportedLanguages()', () => {
		it('should return supported languages', () => {
			const langs = hyphenator.getSupportedLanguages();
			expect(langs).toContain('en');
			expect(langs).toContain('es');
			expect(langs).toContain('fr');
			expect(langs).toContain('de');
			expect(langs).toContain('it');
			expect(langs).toContain('pt');
		});
	});

	describe('clearCache()', () => {
		it('should clear the cache', () => {
			hyphenator.hyphenate('extraordinary', 'en');
			hyphenator.clearCache();
			hyphenator.hyphenate('extraordinary', 'en');
		});
	});

	describe('HYPHENATION_PATTERNS', () => {
		it('should have patterns for all supported languages', () => {
			expect(HYPHENATION_PATTERNS.en).toBeDefined();
			expect(HYPHENATION_PATTERNS.es).toBeDefined();
			expect(HYPHENATION_PATTERNS.fr).toBeDefined();
			expect(HYPHENATION_PATTERNS.de).toBeDefined();
			expect(HYPHENATION_PATTERNS.it).toBeDefined();
			expect(HYPHENATION_PATTERNS.pt).toBeDefined();
		});

		it('should have exceptions for each language', () => {
			expect(HYPHENATION_PATTERNS.en.exceptions).toBeDefined();
			expect(HYPHENATION_PATTERNS.es.exceptions).toBeDefined();
			expect(HYPHENATION_PATTERNS.fr.exceptions).toBeDefined();
			expect(HYPHENATION_PATTERNS.de.exceptions).toBeDefined();
			expect(HYPHENATION_PATTERNS.it.exceptions).toBeDefined();
			expect(HYPHENATION_PATTERNS.pt.exceptions).toBeDefined();
		});
	});
});

describe('Hyphens Handler', () => {
	let Hyphens;
	let mockChunker;
	let mockPolisher;

	beforeAll(() => {
		Hyphens = require('../../../src/modules/paged-media/hyphens.ts').default;
	});

	beforeEach(() => {
		mockChunker = {
			hyphenateCharacter: '\u00AD',
			hyphenateLimitChars: { before: 2, after: 2, total: 5 },
			hyphenateLimitLines: 0,
			hyphenateLimitZone: '0px',
			hooks: {}
		};
		mockPolisher = {
			hooks: {},
			sheet: {
				insertRule: jest.fn()
			}
		};
	});

	function parseAndProcess(css) {
		const hyphens = new Hyphens(mockChunker, mockPolisher, null);
		const ast = csstree.parse(css);

		csstree.walk(ast, {
			visit: 'Rule',
			enter: (ruleNode) => {
				csstree.walk(ruleNode.block, {
					visit: 'Declaration',
					enter: (node, dItem, dList) => {
						hyphens.onDeclaration(node, dItem, dList, { ruleNode });
					}
				});
			}
		});

		return { hyphens, ast };
	}

	it('should parse hyphens: auto', () => {
		const { hyphens } = parseAndProcess('p { hyphens: auto; }');
		expect(hyphens.hyphenRules['p']).toBeDefined();
		expect(hyphens.hyphenRules['p'][0].value).toBe('auto');
	});

	it('should parse hyphens: manual', () => {
		const { hyphens } = parseAndProcess('p { hyphens: manual; }');
		expect(hyphens.hyphenRules['p'][0].value).toBe('manual');
	});

	it('should parse hyphens: none', () => {
		const { hyphens } = parseAndProcess('p { hyphens: none; }');
		expect(hyphens.hyphenRules['p'][0].value).toBe('none');
	});

	it('should parse hyphenate-character', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-character: "-"; }');
		expect(hyphens.hyphenateCharacter).toBe('-');
	});

	it('should parse hyphenate-limit-chars with 3 values', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-limit-chars: 3 2 6; }');
		expect(hyphens.hyphenateLimitChars.before).toBe(3);
		expect(hyphens.hyphenateLimitChars.after).toBe(2);
		expect(hyphens.hyphenateLimitChars.total).toBe(6);
	});

	it('should parse hyphenate-limit-chars with 2 values', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-limit-chars: 4 3; }');
		expect(hyphens.hyphenateLimitChars.before).toBe(4);
		expect(hyphens.hyphenateLimitChars.after).toBe(3);
	});

	it('should parse hyphenate-limit-chars with 1 value', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-limit-chars: 6; }');
		expect(hyphens.hyphenateLimitChars.total).toBe(6);
	});

	it('should parse hyphenate-limit-lines', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-limit-lines: 2; }');
		expect(hyphens.hyphenateLimitLines).toBe(2);
	});

	it('should parse hyphenate-limit-zone', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-limit-zone: 20%; }');
		expect(hyphens.hyphenateLimitZone).toBe('20%');
	});

	it('should apply hyphens data attributes to elements', () => {
		const { hyphens } = parseAndProcess('p { hyphens: auto; }');
		const parsed = document.createElement('div');
		const p = document.createElement('p');
		p.textContent = 'Test paragraph';
		parsed.appendChild(p);

		hyphens.afterParsed(parsed);
		expect(p.dataset.hyphens).toBe('auto');
	});

	it('should get hyphen mode from element', () => {
		const hyphens = new Hyphens(mockChunker, mockPolisher, null);
		const element = document.createElement('p');
		element.dataset.hyphens = 'auto';
		expect(hyphens.getHyphenMode(element)).toBe('auto');
	});

	it('should return null for element without hyphens', () => {
		const hyphens = new Hyphens(mockChunker, mockPolisher, null);
		const element = document.createElement('p');
		expect(hyphens.getHyphenMode(element)).toBeNull();
	});

	it('should get hyphen options', () => {
		const hyphens = new Hyphens(mockChunker, mockPolisher, null);
		const options = hyphens.getHyphenOptions();
		expect(options.hyphenCharacter).toBe('\u00AD');
		expect(options.minCharsBefore).toBe(2);
		expect(options.minCharsAfter).toBe(2);
		expect(options.minWordLength).toBe(5);
	});

	it('should handle comma-separated selectors', () => {
		const { hyphens } = parseAndProcess('p, h1, h2 { hyphens: auto; }');
		expect(hyphens.hyphenRules['p']).toBeDefined();
		expect(hyphens.hyphenRules['h1']).toBeDefined();
		expect(hyphens.hyphenRules['h2']).toBeDefined();
	});

	it('should handle unicode hyphenate-character', () => {
		const { hyphens } = parseAndProcess('p { hyphenate-character: "\\2010"; }');
		expect(hyphens.hyphenateCharacter).toBe('\u2010');
	});
});
