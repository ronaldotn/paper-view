import Chunker from "./chunker/chunker";
import Polisher from "./polisher/polisher";
import Previewer from "./polyfill/previewer";
import Handler from "./modules/handler";
import { registerHandlers, initializeHandlers } from "./utils/handlers";

// Page Numbering Module
import PageNumberingModule from "./modules/page-numbering/index.js";
import PageNumberRenderer from "./modules/page-numbering/renderer.js";
import PageNumberingHandler from "./modules/page-numbering/handler.js";

// Page Numbering Utilities
import * as pageNumberingConfig from "./modules/page-numbering/config.js";
import * as pageNumberingFormatter from "./modules/page-numbering/formatter.js";
import * as pageNumberingPositions from "./modules/page-numbering/positions.js";
import * as pageNumberingCSS from "./modules/page-numbering/css-integration.js";

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

export {
	Chunker,
	Polisher,
	Previewer,
	Handler,
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
