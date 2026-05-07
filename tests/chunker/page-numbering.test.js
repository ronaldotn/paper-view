/**
 * Test page numbering integration with Chunker
 * 
 * Validates: Requirements 1.1, 1.2, 2.2, 8.1, 8.2, 8.3
 */

import { Chunker } from '../../src/index.js';

describe('Chunker Page Numbering Integration', () => {
	let mockContent;
	let mockRenderTo;
	
	beforeEach(() => {
		// Create mock DOM elements
		mockContent = document.createElement('div');
		mockContent.innerHTML = '<p>Test content for page numbering</p>';
		
		mockRenderTo = document.createElement('div');
		document.body.appendChild(mockRenderTo);
	});
	
	afterEach(() => {
		// Clean up
		if (mockRenderTo && mockRenderTo.parentNode) {
			mockRenderTo.parentNode.removeChild(mockRenderTo);
		}
	});
	
	test('Chunker constructor accepts page numbering configuration', () => {
		const chunker = new Chunker(null, null, {
			pageNumbering: {
				enabled: true,
				position: 'bottom-center',
				style: 'decimal'
			}
		});
		
		expect(chunker.pageNumbering).toBeDefined();
		expect(chunker.pageNumbering.isEnabled()).toBe(true);
	});
	
	test('Chunker can update page numbering configuration dynamically', () => {
		const chunker = new Chunker();
		
		// Initially should not have page numbering
		expect(chunker.pageNumbering).toBeNull();
		
		// Update with configuration
		chunker.updatePageNumbering({
			enabled: true,
			position: 'top-right',
			style: 'upper-roman'
		});
		
		expect(chunker.pageNumbering).toBeDefined();
		expect(chunker.pageNumbering.isEnabled()).toBe(true);
		
		const config = chunker.getPageNumberingConfig();
		expect(config.position).toBe('top-right');
		expect(config.style).toBe('upper-roman');
	});
	
	test('Chunker can enable/disable page numbering', () => {
		const chunker = new Chunker();
		
		// Enable page numbering
		chunker.setPageNumberingEnabled(true);
		expect(chunker.pageNumbering).toBeDefined();
		expect(chunker.pageNumbering.isEnabled()).toBe(true);
		
		// Disable page numbering
		chunker.setPageNumberingEnabled(false);
		expect(chunker.pageNumbering.isEnabled()).toBe(false);
	});
	
	test('Page numbering is disabled by default', () => {
		const chunker = new Chunker();
		expect(chunker.pageNumbering).toBeNull();
		
		// Even if we initialize with empty options
		const chunker2 = new Chunker(null, null, {});
		expect(chunker2.pageNumbering).toBeNull();
	});
	
	test('Chunker methods handle page numbering module absence gracefully', () => {
		const chunker = new Chunker();
		
		// These methods should not throw when pageNumbering is null
		expect(() => {
			chunker.updatePageNumbering({ enabled: true });
		}).not.toThrow();
		
		expect(() => {
			chunker.setPageNumberingEnabled(true);
		}).not.toThrow();
		
		expect(() => {
			chunker.applyPageNumberingCSSRules([]);
		}).not.toThrow();

	});
});