import type Previewer from "../polyfill/previewer";

interface ExportOptions {
	filename?: string;
	metadata?: Record<string, string>;
	onProgress?: ((data: { stage: string; progress: number }) => void) | null;
}

interface PageMargin {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
}

interface AtPageInfo {
	margin?: PageMargin;
}

class BrowserPDFExporter {
	previewer: Previewer;

	constructor(previewer: Previewer) {
		this.previewer = previewer;
	}

	async export(options: ExportOptions = {}): Promise<Blob | null> {
		const {
			filename = "document.pdf",
			metadata = {},
			onProgress = null
		} = options;

		if (!this.previewer.rendered) {
			throw new Error("Document must be rendered before exporting to PDF");
		}

		if (onProgress) {
			onProgress({ stage: "preparing", progress: 0 });
		}

		const originalTitle = document.title;

		if (metadata.title) {
			document.title = metadata.title;
		}

		const printStyle = document.createElement("style");
		printStyle.setAttribute("data-pagedjs-pdf-export", "true");
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
			onProgress({ stage: "printing", progress: 50 });
		}

		const pdfBlob = await this._triggerPrint(filename);

		document.head.removeChild(printStyle);
		document.title = originalTitle;

		if (onProgress) {
			onProgress({ stage: "complete", progress: 100 });
		}

		return pdfBlob;
	}

	_triggerPrint(filename: string): Promise<Blob | null> {
		return new Promise((resolve, reject) => {
			const printWindow = window.open("", "_blank");
			if (!printWindow) {
				reject(new Error("Popup blocked: cannot open print window"));
				return;
			}

			const pagesArea = this.previewer.chunker.pagesArea;
			if (!pagesArea) {
				reject(new Error("No rendered pages found"));
				return;
			}

			const html = this._buildPrintHTML();

			printWindow.document.open();
			printWindow.document.write(html);
			printWindow.document.close();

			printWindow.onload = () => {
				setTimeout(() => {
					printWindow.print();
					resolve(null);
				}, 500);
			};
		});
	}

	_buildPrintHTML(): string {
		const pagesArea = this.previewer.chunker.pagesArea;
		const size = this.previewer.size;

		let styles = "";
		document.querySelectorAll("style").forEach(style => {
			if (!style.hasAttribute("data-pagedjs-pdf-export")) {
				styles += style.outerHTML;
			}
		});

		document.querySelectorAll("link[rel=\"stylesheet\"]").forEach(link => {
			const href = link.getAttribute("href");
			if (href) {
				styles += `<link rel="stylesheet" href="${href.replace(/"/g, "&quot;")}">`;
			}
		});

		const width = size.width ? `${size.width.value}${size.width.unit}` : "8.5in";
		const height = size.height ? `${size.height.value}${size.height.unit}` : "11in";
		const safeTitle = document.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<title>${safeTitle}</title>
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
				${pagesArea!.outerHTML}
			</body>
			</html>
		`;
	}

	_getPageSize(): string {
		const size = this.previewer.size;
		if (size.format) {
			return size.format + (size.orientation ? " " + size.orientation : "");
		}
		const width = size.width ? `${size.width.value}${size.width.unit}` : "8.5in";
		const height = size.height ? `${size.height.value}${size.height.unit}` : "11in";
		return `${width} ${height}`;
	}

	_getPageMargins(): string {
		const atpages = (this.previewer.atpages as AtPageInfo[]) || [];
		if (atpages.length > 0 && atpages[0].margin) {
			const m = atpages[0].margin;
			return `${m.top || 0} ${m.right || 0} ${m.bottom || 0} ${m.left || 0}`;
		}
		return "1in";
	}
}

export default BrowserPDFExporter;
