/**
 * Browser PDF Exporter
 * Uses window.print() API to generate PDFs
 */
class BrowserPDFExporter {
	constructor(previewer) {
		this.previewer = previewer;
	}

	/**
	 * Export the rendered document as PDF
	 * @param {Object} options - Export options
	 * @param {string} [options.filename] - Filename for download
	 * @param {Object} [options.metadata] - PDF metadata
	 * @param {Function} [options.onProgress] - Progress callback
	 * @returns {Promise<Blob>} PDF blob
	 */
	async export(options = {}) {
		const {
			filename = 'document.pdf',
			metadata = {},
			onProgress = null
		} = options;

		if (!this.previewer.rendered) {
			throw new Error('Document must be rendered before exporting to PDF');
		}

		if (onProgress) {
			onProgress({ stage: 'preparing', progress: 0 });
		}

		// Store original title
		const originalTitle = document.title;

		// Set document title for PDF metadata
		if (metadata.title) {
			document.title = metadata.title;
		}

		// Create print-specific styles
		const printStyle = document.createElement('style');
		printStyle.setAttribute('data-pagedjs-pdf-export', 'true');
		printStyle.textContent = `
			@media print {
				@page {
					size: ${this._getPageSize()};
					margin: ${this._getPageMargins()};
				}
				body {
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				.pagedjs_pages {
					display: block !important;
				}
				.pagedjs_page {
					break-after: page;
					page-break-after: always;
				}
			}
		`;
		document.head.appendChild(printStyle);

		if (onProgress) {
			onProgress({ stage: 'printing', progress: 50 });
		}

		// Use promise-based print if available, fallback to regular print
		const pdfBlob = await this._triggerPrint(filename);

		// Cleanup
		document.head.removeChild(printStyle);
		document.title = originalTitle;

		if (onProgress) {
			onProgress({ stage: 'complete', progress: 100 });
		}

		return pdfBlob;
	}

	/**
	 * Trigger print and capture PDF
	 * @param {string} filename
	 * @returns {Promise<Blob>}
	 * @private
	 */
	_triggerPrint(filename) {
		return new Promise((resolve, reject) => {
			// For browsers that support print to PDF via PDF.js or similar,
			// we trigger the print dialog. The blob capture depends on browser support.
			// Most reliable approach is to use window.print() and let user save as PDF.

			const printWindow = window.open('', '_blank');
			if (!printWindow) {
				reject(new Error('Popup blocked: cannot open print window'));
				return;
			}

			// Clone the rendered content
			const pagesArea = this.previewer.chunker.pagesArea;
			if (!pagesArea) {
				reject(new Error('No rendered pages found'));
				return;
			}

			// Build HTML for print
			const html = this._buildPrintHTML();

			printWindow.document.open();
			printWindow.document.write(html);
			printWindow.document.close();

			// Wait for resources to load
			printWindow.onload = () => {
				setTimeout(() => {
					printWindow.print();
					// Note: Cannot capture PDF blob directly from print dialog
					// User must save manually. For automated PDF generation, use NodePDFExporter.
					resolve(null);
				}, 500);
			};
		});
	}

	/**
	 * Build HTML string for print window
	 * @returns {string}
	 * @private
	 */
	_buildPrintHTML() {
		const pagesArea = this.previewer.chunker.pagesArea;
		const size = this.previewer.size;

		// Collect all stylesheets
		let styles = '';
		document.querySelectorAll('style').forEach(style => {
			if (!style.hasAttribute('data-pagedjs-pdf-export')) {
				styles += style.outerHTML;
			}
		});

		document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
			styles += link.outerHTML;
		});

		const width = size.width ? `${size.width.value}${size.width.unit}` : '8.5in';
		const height = size.height ? `${size.height.value}${size.height.unit}` : '11in';

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<title>${document.title}</title>
				${styles}
				<style>
					@page {
						size: ${width} ${height};
						margin: 0;
					}
					@media print {
						body { margin: 0; }
						.pagedjs_pages {
							display: block !important;
						}
						.pagedjs_page {
							break-after: page;
							page-break-after: always;
							margin: 0;
						}
					}
					@media screen {
						body {
							margin: 0;
							padding: 0;
						}
					}
				</style>
			</head>
			<body>
				${pagesArea.outerHTML}
			</body>
			</html>
		`;
	}

	/**
	 * Get page size string for @page
	 * @returns {string}
	 * @private
	 */
	_getPageSize() {
		const size = this.previewer.size;
		if (size.format) {
			return size.format + (size.orientation ? ' ' + size.orientation : '');
		}
		const width = size.width ? `${size.width.value}${size.width.unit}` : '8.5in';
		const height = size.height ? `${size.height.value}${size.height.unit}` : '11in';
		return `${width} ${height}`;
	}

	/**
	 * Get page margins string
	 * @returns {string}
	 * @private
	 */
	_getPageMargins() {
		const atpages = this.previewer.atpages || [];
		if (atpages.length > 0 && atpages[0].margin) {
			const m = atpages[0].margin;
			return `${m.top || 0} ${m.right || 0} ${m.bottom || 0} ${m.left || 0}`;
		}
		return '1in';
	}
}

export default BrowserPDFExporter;
