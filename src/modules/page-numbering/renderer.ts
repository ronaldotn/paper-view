import { getPositionCSS } from "./positions";

class PageNumberRenderer {
	createElement(content: string, config: any): HTMLElement {
		const element = document.createElement("div");

		element.textContent = content;

		element.className = config.className || "pagedjs-page-number";

		if (config.position) {
			const positionClass = this._getPositionClass(config.position);
			if (positionClass) {
				element.classList.add(positionClass);
			}
		}

		this._applyInlineStyles(element, config.css || {});

		this._applyBaseStyles(element);

		return element;
	}

	positionElement(element: HTMLElement, pageElement: HTMLElement, position: string): void {
		if (!element || !pageElement || !position) {
			return;
		}

		const cssProps = getPositionCSS(position);

		Object.keys(cssProps).forEach(prop => {
			(element.style as any)[prop] = cssProps[prop];
		});

		pageElement.appendChild(element);
	}

	applyStyles(element: HTMLElement, config: any): void {
		if (!element || !config) {
			return;
		}

		if (config.className && config.className !== element.className) {
			const oldClasses = element.className.split(" ");
			oldClasses.forEach(className => {
				if (className.startsWith("pagedjs-page-number--")) {
					element.classList.remove(className);
				}
			});

			element.className = config.className;

			if (config.position) {
				const positionClass = this._getPositionClass(config.position);
				if (positionClass) {
					element.classList.add(positionClass);
				}
			}
		}

		if (config.css) {
			this._applyInlineStyles(element, config.css);
		}
	}

	updateContent(element: HTMLElement, content: string, config: any): void {
		if (!element) {
			return;
		}

		element.textContent = content;

		if (config) {
			this.applyStyles(element, config);
		}
	}

	_getPositionClass(position: string): string {
		if (!position) {
			return "";
		}

		return `pagedjs-page-number--${position.replace(/-/g, "-")}`;
	}

	_applyInlineStyles(element: HTMLElement, styles: Record<string, string>): void {
		if (!element || !styles || typeof styles !== "object") {
			return;
		}

		Object.keys(styles).forEach(property => {
			const cssProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
			element.style[cssProperty as any] = styles[property];
		});
	}

	_applyBaseStyles(element: HTMLElement): void {
		element.style.position = "absolute";
		element.style.zIndex = "1000";
		element.style.pointerEvents = "none";

		element.style.fontSize = "12px";
		element.style.color = "#666";
		element.style.fontFamily = "sans-serif";
		element.style.padding = "4px 8px";
		element.style.margin = "0";
	}
}

export default PageNumberRenderer;
