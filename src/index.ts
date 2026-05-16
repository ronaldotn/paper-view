import Chunker from "./chunker/chunker";
import Polisher from "./polisher/polisher";
import Previewer from "./polyfill/previewer";
import LazyRenderer from "./polyfill/lazy-renderer";
import LayoutWorkerManager from "./chunker/layout-worker-manager";
import Handler from "./modules/handler";
import { registerHandlers, initializeHandlers } from "./utils/handlers";
import PDFExporter from "./export/index";
import BrowserPDFExporter from "./export/browser-pdf-exporter";

// Page Numbering Module
import PageNumberingModule from "./modules/page-numbering/index";
import PageNumberRenderer from "./modules/page-numbering/renderer";
import PageNumberingHandler from "./modules/page-numbering/handler";

// Page Numbering Utilities
import * as pageNumberingConfig from "./modules/page-numbering/config";
import * as pageNumberingFormatter from "./modules/page-numbering/formatter";
import * as pageNumberingPositions from "./modules/page-numbering/positions";
import * as pageNumberingCSS from "./modules/page-numbering/css-integration";

// Main PaperView class (simplified API)
import PaperView from "./paperview";

// Re-export key individual functions for easier access
const {
	validateConfig,
	normalizeConfig,
	isValidConfig,
	mergeConfigs,
	VALID_POSITIONS,
	VALID_STYLES,
	DEFAULT_CONFIG
} = pageNumberingConfig;

const {
	PageNumberFormatter,
	formatter,
	format,
	applyTemplate,
	formatWithTemplate
} = pageNumberingFormatter;

const {
	calculatePosition,
	getPositionCSS,
	parseOffset,
	positionToString,
	isValidPosition,
	getValidPositions,
	calculatePositionWithOffsets
} = pageNumberingPositions;

const {
	parsePageRules,
	extractPageNumberingConfig,
	configToCSSRule,
	hasPageNumberingCSS
} = pageNumberingCSS;

export { PaperView };

export {
	Chunker,
	Polisher,
	Previewer,
	LazyRenderer,
	LayoutWorkerManager,
	Handler,
	PDFExporter,
	BrowserPDFExporter,
	registerHandlers,
	initializeHandlers,
	// Page Numbering Module
	PageNumberingModule,
	PageNumberRenderer,
	PageNumberingHandler,
	// Page Numbering Configuration Utilities (namespace)
	pageNumberingConfig,
	// Page Numbering Formatter Utilities (namespace)
	pageNumberingFormatter,
	// Page Numbering Position Utilities (namespace)
	pageNumberingPositions,
	// Page Numbering CSS Integration Utilities (namespace)
	pageNumberingCSS,
	// Individual Configuration Functions
	validateConfig,
	normalizeConfig,
	isValidConfig,
	mergeConfigs,
	VALID_POSITIONS,
	VALID_STYLES,
	DEFAULT_CONFIG,
	// Individual Formatter Functions
	PageNumberFormatter,
	formatter,
	format,
	applyTemplate,
	formatWithTemplate,
	// Individual Position Functions
	calculatePosition,
	getPositionCSS,
	parseOffset,
	positionToString,
	isValidPosition,
	getValidPositions,
	calculatePositionWithOffsets,
	// Individual CSS Integration Functions
	parsePageRules,
	extractPageNumberingConfig,
	configToCSSRule,
	hasPageNumberingCSS
};

export default PaperView;
