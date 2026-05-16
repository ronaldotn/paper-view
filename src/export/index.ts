import BrowserPDFExporter from "./browser-pdf-exporter";

import type Previewer from "../polyfill/previewer";

interface ExportOptions {
	filename?: string;
	metadata?: Record<string, string>;
	onProgress?: ((data: { stage: string; progress: number }) => void) | null;
}

class PDFExporter {
	previewer: Previewer | null;
	browserExporter: BrowserPDFExporter | null;

	constructor(previewer: Previewer | null) {
		this.previewer = previewer;
		this.browserExporter = previewer ? new BrowserPDFExporter(previewer) : null;
	}

	async export(options: ExportOptions = {}): Promise<Blob | null> {
		if (!this.browserExporter) {
			throw new Error("PDFExporter.export() is only available in browser context. Use NodePDFExporter for server-side generation.");
		}

		return this.browserExporter.export(options);
	}
}

export default PDFExporter;
export { PDFExporter, BrowserPDFExporter };
