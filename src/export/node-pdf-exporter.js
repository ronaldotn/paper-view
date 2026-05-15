/**
 * Node.js PDF Exporter
 * Uses Puppeteer for server-side PDF generation
 */
class NodePDFExporter {
	/**
	 * Create PDF from HTML content
	 * @param {string} html - HTML content to render
	 * @param {string|Array} css - CSS stylesheets (URLs or inline CSS)
	 * @param {Object} options - PDF options
	 * @returns {Promise<Buffer>} PDF buffer
	 */
	static async fromHTML(html, css = [], options = {}) {
		const puppeteer = require('puppeteer');

		const browser = await puppeteer.launch({
			headless: options.headless !== false ? 'new' : false,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage'
			]
		});

		try {
			const page = await browser.newPage();

			// Build HTML document with styles
			const fullHTML = this._buildHTML(html, css);

			await page.setContent(fullHTML, {
				waitUntil: 'networkidle0',
				timeout: options.timeout || 30000
			});

			// Wait for fonts
			await page.evaluateHandle('document.fonts.ready');

			// Generate PDF
			const pdfBuffer = await page.pdf(this._getPDFOptions(options));

			return pdfBuffer;
		} finally {
			await browser.close();
		}
	}

	/**
	 * Create PDF from a URL
	 * @param {string} url - URL to render
	 * @param {Object} options - PDF options
	 * @returns {Promise<Buffer>} PDF buffer
	 */
	static async fromURL(url, options = {}) {
		const puppeteer = require('puppeteer');

		const browser = await puppeteer.launch({
			headless: options.headless !== false ? 'new' : false,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage'
			]
		});

		try {
			const page = await browser.newPage();

			await page.goto(url, {
				waitUntil: 'networkidle0',
				timeout: options.timeout || 30000
			});

			// Wait for fonts
			await page.evaluateHandle('document.fonts.ready');

			// Generate PDF
			const pdfBuffer = await page.pdf(this._getPDFOptions(options));

			return pdfBuffer;
		} finally {
			await browser.close();
		}
	}

	/**
	 * Create PDF from a Previewer instance (browser context serialized for Node)
	 * @param {Object} previewer - Previewer instance
	 * @param {Object} options - PDF options
	 * @returns {Promise<Buffer>} PDF buffer
	 */
	static async fromPreviewer(previewer, options = {}) {
		const pagesArea = previewer.chunker.pagesArea;
		if (!pagesArea) {
			throw new Error('No rendered pages found in previewer');
		}

		const html = pagesArea.outerHTML;

		// Collect styles
		const css = [];
		if (typeof document !== 'undefined') {
			document.querySelectorAll('style').forEach(style => {
				css.push(style.textContent);
			});
			document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
				css.push(link.href);
			});
		}

		return this.fromHTML(html, css, options);
	}

	/**
	 * Save PDF buffer to file
	 * @param {Buffer} pdfBuffer - PDF buffer
	 * @param {string} filePath - Output file path
	 * @returns {Promise<void>}
	 */
	static async save(pdfBuffer, filePath) {
		const fs = require('fs').promises;
		const path = require('path');

		const dir = path.dirname(filePath);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(filePath, pdfBuffer);
	}

	/**
	 * Build full HTML document with styles
	 * @param {string} html - HTML content
	 * @param {Array} css - CSS styles
	 * @returns {string}
	 * @private
	 */
	static _buildHTML(html, css) {
		let styles = '';

		for (const item of css) {
			if (typeof item === 'string') {
				if (item.startsWith('http') || item.startsWith('/')) {
					styles += `<link rel="stylesheet" href="${item}">`;
				} else {
					styles += `<style>${item}</style>`;
				}
			}
		}

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				${styles}
				<style>
					@media print {
						body {
							-webkit-print-color-adjust: exact;
							print-color-adjust: exact;
						}
					}
				</style>
			</head>
			<body>
				${html}
			</body>
			</html>
		`;
	}

	/**
	 * Get Puppeteer PDF options
	 * @param {Object} options - User options
	 * @returns {Object}
	 * @private
	 */
	static _getPDFOptions(options = {}) {
		const {
			format = 'Letter',
			landscape = false,
			scale = 1,
			displayHeaderFooter = false,
			headerTemplate,
			footerTemplate,
			printBackground = true,
			margin = {},
			pageRanges,
			preferCSSPageSize = true,
			timeout
		} = options;

		return {
			format,
			landscape,
			scale,
			displayHeaderFooter,
			headerTemplate,
			footerTemplate,
			printBackground,
			margin: {
				top: margin.top || '0',
				right: margin.right || '0',
				bottom: margin.bottom || '0',
				left: margin.left || '0'
			},
			pageRanges,
			preferCSSPageSize,
			timeout
		};
	}
}

export default NodePDFExporter;
