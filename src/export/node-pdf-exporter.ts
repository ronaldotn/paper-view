declare function require(module: string): any;
declare class Buffer {
	constructor(data: any, encoding?: string);
	static from(data: any): Buffer;
	length: number;
	toString(encoding?: string): string;
}

interface PDFOptions {
	headless?: boolean;
	timeout?: number;
	format?: string;
	landscape?: boolean;
	scale?: number;
	displayHeaderFooter?: boolean;
	headerTemplate?: string;
	footerTemplate?: string;
	printBackground?: boolean;
	margin?: {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
	};
	pageRanges?: string;
	preferCSSPageSize?: boolean;
}

interface PuppeteerPDFOptions {
	format: string;
	landscape: boolean;
	scale: number;
	displayHeaderFooter: boolean;
	headerTemplate?: string;
	footerTemplate?: string;
	printBackground: boolean;
	margin: {
		top: string;
		right: string;
		bottom: string;
		left: string;
	};
	pageRanges?: string;
	preferCSSPageSize: boolean;
	timeout?: number;
}

interface PreviewerLike {
	chunker: {
		pagesArea?: HTMLElement;
	};
}

class NodePDFExporter {
	static async fromHTML(html: string, css: (string | Record<string, string>)[] = [], options: PDFOptions = {}): Promise<Buffer> {
		const puppeteer = require("puppeteer");

		const browser = await puppeteer.launch({
			headless: options.headless !== false ? "new" : false,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage"
			]
		});

		try {
			const page = await browser.newPage();

			const fullHTML = this._buildHTML(html, css);

			await page.setContent(fullHTML, {
				waitUntil: "networkidle0",
				timeout: options.timeout || 30000
			});

			await page.evaluateHandle("document.fonts.ready");

			const pdfBuffer = await page.pdf(this._getPDFOptions(options));

			return pdfBuffer as Buffer;
		} finally {
			await browser.close();
		}
	}

	/**
	 * @warning SSRF RISK: Only call this method with trusted, validated URLs.
	 * If the URL is user-controlled, an attacker could make the server
	 * navigate to internal network resources (cloud metadata, localhost services).
	 * Validate against an allowlist and block private IP ranges before calling.
	 */
	static async fromURL(url: string, options: PDFOptions = {}): Promise<Buffer> {
		const puppeteer = require("puppeteer");

		const browser = await puppeteer.launch({
			headless: options.headless !== false ? "new" : false,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage"
			]
		});

		try {
			const page = await browser.newPage();

			await page.goto(url, {
				waitUntil: "networkidle0",
				timeout: options.timeout || 30000
			});

			await page.evaluateHandle("document.fonts.ready");

			const pdfBuffer = await page.pdf(this._getPDFOptions(options));

			return pdfBuffer as Buffer;
		} finally {
			await browser.close();
		}
	}

	static async fromPreviewer(previewer: PreviewerLike, options: PDFOptions = {}): Promise<Buffer> {
		const pagesArea = previewer.chunker.pagesArea;
		if (!pagesArea) {
			throw new Error("No rendered pages found in previewer");
		}

		const html = pagesArea.outerHTML;

		const css: string[] = [];
		if (typeof document !== "undefined") {
			document.querySelectorAll("style").forEach(style => {
				css.push(style.textContent || "");
			});
			document.querySelectorAll("link[rel=\"stylesheet\"]").forEach((link: Element) => {
				css.push((link as HTMLLinkElement).href);
			});
		}

		return this.fromHTML(html, css, options);
	}

	static async save(pdfBuffer: Buffer, filePath: string): Promise<void> {
		const fs = require("fs").promises;
		const path = require("path");

		const dir = path.dirname(filePath);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(filePath, pdfBuffer);
	}

	static _buildHTML(html: string, css: (string | Record<string, string>)[]): string {
		let styles = "";

		for (const item of css) {
			if (typeof item === "string") {
				if (item.startsWith("http") || item.startsWith("/")) {
					const safeHref = item.replace(/"/g, "&quot;");
					styles += `<link rel="stylesheet" href="${safeHref}">`;
				} else {
					const safeStyle = item.replace(/<\/style>/gi, "<\\/style>");
					styles += `<style>${safeStyle}</style>`;
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

	static _getPDFOptions(options: PDFOptions = {}): PuppeteerPDFOptions {
		const {
			format = "Letter",
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
				top: margin.top || "0",
				right: margin.right || "0",
				bottom: margin.bottom || "0",
				left: margin.left || "0"
			},
			pageRanges,
			preferCSSPageSize,
			timeout
		};
	}
}

export default NodePDFExporter;
