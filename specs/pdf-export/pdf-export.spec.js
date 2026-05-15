const puppeteer = require('puppeteer');
const path = require('path');

describe('PDF Export Integration', () => {
	let browser;
	let page;

	beforeAll(async () => {
		browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
	});

	afterAll(async () => {
		if (browser) {
			await browser.close();
		}
	});

	beforeEach(async () => {
		page = await browser.newPage();
	});

	afterEach(async () => {
		await page.close();
	});

	it('should generate PDF from HTML content', async () => {
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					@page {
						size: A4;
						margin: 2cm;
					}
					body {
						font-family: Arial, sans-serif;
					}
					h1 {
						color: #333;
					}
				</style>
			</head>
			<body>
				<h1>Test Document</h1>
				<p>This is a test paragraph for PDF export.</p>
			</body>
			</html>
		`;

		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true
		});

		expect(pdfBuffer).toBeDefined();
		expect(pdfBuffer.length).toBeGreaterThan(0);
		expect(pdfBuffer.slice(0, 5).toString()).toBe('%PDF-');
	});

	it('should generate PDF with custom page size', async () => {
		await page.setContent(`
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					@page {
						size: letter landscape;
					}
				</style>
			</head>
			<body>
				<h1>Landscape Document</h1>
			</body>
			</html>
		`, { waitUntil: 'networkidle0' });

		const pdfBuffer = await page.pdf({
			format: 'Letter',
			landscape: true,
			preferCSSPageSize: true
		});

		expect(pdfBuffer).toBeDefined();
		expect(pdfBuffer.length).toBeGreaterThan(0);
	});

	it('should generate PDF with headers and footers', async () => {
		await page.setContent(`
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					@page {
						size: A4;
						margin: 2cm;
					}
				</style>
			</head>
			<body>
				<h1>Document with Headers/Footers</h1>
				<p>Content here.</p>
			</body>
			</html>
		`, { waitUntil: 'networkidle0' });

		const pdfBuffer = await page.pdf({
			format: 'A4',
			displayHeaderFooter: true,
			headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Test Header</div>',
			footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
			margin: {
				top: '3cm',
				bottom: '2cm'
			}
		});

		expect(pdfBuffer).toBeDefined();
		expect(pdfBuffer.length).toBeGreaterThan(0);
	});
});
