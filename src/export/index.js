/**
 * PDF Export Module
 * Unified API for browser and Node.js PDF generation
 */
import BrowserPDFExporter from './browser-pdf-exporter.js';

class PDFExporter {
	/**
	 * Create a new PDFExporter instance
	 * @param {Object} previewer - Previewer instance (browser only)
	 */
	constructor(previewer) {
		this.previewer = previewer;
		this.browserExporter = previewer ? new BrowserPDFExporter(previewer) : null;
	}

	/**
	 * Export rendered document as PDF (browser)
	 * @param {Object} options - Export options
	 * @param {string} [options.filename='document.pdf'] - Filename for download
	 * @param {Object} [options.metadata] - PDF metadata (title, author, subject)
	 * @param {Function} [options.onProgress] - Progress callback
	 * @returns {Promise<Blob|null>} PDF blob or null (user saves manually)
	 */
	async export(options = {}) {
		if (!this.browserExporter) {
			throw new Error('PDFExporter.export() is only available in browser context. Use NodePDFExporter for server-side generation.');
		}

		return this.browserExporter.export(options);
	}
}

export default PDFExporter;
export { PDFExporter, BrowserPDFExporter };
