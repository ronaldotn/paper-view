import Previewer from "./polyfill/previewer";

interface RenderOptions {
	size?: string;
	margin?: string;
	stylesheets?: any[];
	viewMode?: "single" | "spread";
	lazyRender?: boolean;
	useWorkers?: boolean;
	spreadViewer?: boolean;
	pageNumbering?: Record<string, any>;
}

class PaperView {
	private _previewer: Previewer;

	constructor(options: RenderOptions = {}) {
		this._previewer = new Previewer(options);
	}

	async render(content: string, options?: RenderOptions): Promise<any> {
		if (options) {
			if (options.viewMode) {
				this._previewer.viewMode = options.viewMode;
			}
			if (options.useWorkers !== undefined) {
				this._previewer.useWorkers = options.useWorkers;
			}
		}

		const renderTo = document.createElement("div");
		document.body.appendChild(renderTo);

		return this._previewer.preview(content, renderTo, options?.stylesheets);
	}

	destroy(): void {
		this._previewer.destroy();
	}
}

export default PaperView;
