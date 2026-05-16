/**
 * @jest-environment jsdom
 */
import PDFExporter, { BrowserPDFExporter } from '../../src/export/index';

describe('PDFExporter', () => {
	describe('BrowserPDFExporter', () => {
		let mockPreviewer: any;

		beforeEach(() => {
			mockPreviewer = {
				rendered: true,
				size: {
					width: { value: 8.5, unit: 'in' },
					height: { value: 11, unit: 'in' },
					format: undefined,
					orientation: undefined
				},
				atpages: [],
				chunker: {
					pagesArea: {
						outerHTML: '<div class="pagedjs_pages"><div class="pagedjs_page">Page 1</div></div>'
					}
				}
			};

			// Mock document
			(global as any).document = {
				title: 'Test Document',
				head: {
					appendChild: jest.fn(),
					removeChild: jest.fn()
				},
				querySelectorAll: jest.fn(() => [])
			};

			// Mock window.open for tests that don't actually call it
			(global as any).window.open = jest.fn(() => null);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should create a BrowserPDFExporter instance', () => {
			const exporter = new BrowserPDFExporter(mockPreviewer);
			expect(exporter).toBeInstanceOf(BrowserPDFExporter);
			expect(exporter.previewer).toBe(mockPreviewer);
		});

		it('should throw error if document is not rendered', async () => {
			mockPreviewer.rendered = false;
			const exporter = new BrowserPDFExporter(mockPreviewer);

			await expect(exporter.export()).rejects.toThrow(
				'Document must be rendered before exporting to PDF'
			);
		});

		it('should get page size correctly', () => {
			const exporter = new BrowserPDFExporter(mockPreviewer);
			const size = exporter._getPageSize();
			expect(size).toBe('8.5in 11in');
		});

		it('should get page size with format', () => {
			mockPreviewer.size.format = 'A4';
			mockPreviewer.size.orientation = 'landscape';
			const exporter = new BrowserPDFExporter(mockPreviewer);
			const size = exporter._getPageSize();
			expect(size).toBe('A4 landscape');
		});

		it('should get page margins from atpages', () => {
			mockPreviewer.atpages = [{
				margin: { top: '2cm', right: '1.5cm', bottom: '2cm', left: '1.5cm' }
			}];
			const exporter = new BrowserPDFExporter(mockPreviewer);
			const margins = exporter._getPageMargins();
			expect(margins).toBe('2cm 1.5cm 2cm 1.5cm');
		});

		it('should return default margins when no atpages', () => {
			const exporter = new BrowserPDFExporter(mockPreviewer);
			const margins = exporter._getPageMargins();
			expect(margins).toBe('1in');
		});

		it('should build print HTML', () => {
			const exporter = new BrowserPDFExporter(mockPreviewer);
			const html = exporter._buildPrintHTML();
			expect(html).toContain('<!DOCTYPE html>');
			expect(html).toContain('pagedjs_pages');
		});
	});

	describe('PDFExporter class', () => {
		it('should export PDFExporter class', () => {
			expect(PDFExporter).toBeDefined();
		});

		it('should create instance with previewer', () => {
			const mockPreviewer: any = { rendered: true };
			const exporter = new PDFExporter(mockPreviewer);
			expect(exporter).toBeInstanceOf(PDFExporter);
			expect(exporter.browserExporter).toBeDefined();
		});

		it('should throw error when export called without browser exporter', async () => {
			const exporter = new PDFExporter(null);
			await expect(exporter.export()).rejects.toThrow(
				'PDFExporter.export() is only available in browser context'
			);
		});
	});
});
