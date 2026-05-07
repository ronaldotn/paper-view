/**
 * Position Calculation Utilities
 * 
 * Provides utilities for calculating and converting page number positions.
 * 
 * @module modules/page-numbering/positions
 */

/**
 * Calculate position object from position string
 * 
 * @param {string} position - Position string (e.g., 'top-left', 'bottom-center')
 * @returns {object} Position object with vertical, horizontal, offsetX, offsetY properties
 */
export function calculatePosition(position) {
	if (!position || typeof position !== 'string') {
		return {
			vertical: 'bottom',
			horizontal: 'center',
			offsetX: '0',
			offsetY: '0'
		};
	}
	
	const parts = position.split('-');
	if (parts.length !== 2) {
		return {
			vertical: 'bottom',
			horizontal: 'center',
			offsetX: '0',
			offsetY: '0'
		};
	}
	
	const [vertical, horizontal] = parts;
	
	// Validate vertical position
	const validVertical = ['top', 'bottom'].includes(vertical) ? vertical : 'bottom';
	
	// Validate horizontal position
	const validHorizontal = ['left', 'center', 'right'].includes(horizontal) ? horizontal : 'center';
	
	return {
		vertical: validVertical,
		horizontal: validHorizontal,
		offsetX: '0',
		offsetY: '0'
	};
}

/**
 * Get CSS properties for a position
 * 
 * @param {string} position - Position string (e.g., 'top-left', 'bottom-center')
 * @returns {object} CSS properties object
 */
export function getPositionCSS(position) {
	const pos = calculatePosition(position);
	const css = {
		position: 'absolute'
	};
	
	// Set vertical position
	if (pos.vertical === 'top') {
		css.top = '0';
		css.bottom = 'auto';
	} else {
		css.top = 'auto';
		css.bottom = '0';
	}
	
	// Set horizontal position
	switch (pos.horizontal) {
		case 'left':
			css.left = '0';
			css.right = 'auto';
			css.transform = 'none';
			break;
		case 'center':
			css.left = '50%';
			css.right = 'auto';
			css.transform = 'translateX(-50%)';
			break;
		case 'right':
			css.left = 'auto';
			css.right = '0';
			css.transform = 'none';
			break;
	}
	
	// Apply offsets if specified
	if (pos.offsetX && pos.offsetX !== '0') {
		if (pos.horizontal === 'center') {
			// For center position, adjust transform
			css.transform = `translateX(calc(-50% + ${pos.offsetX}))`;
		} else if (pos.horizontal === 'left') {
			css.left = pos.offsetX;
		} else if (pos.horizontal === 'right') {
			css.right = pos.offsetX;
		}
	}
	
	if (pos.offsetY && pos.offsetY !== '0') {
		if (pos.vertical === 'top') {
			css.top = pos.offsetY;
		} else {
			css.bottom = pos.offsetY;
		}
	}
	
	return css;
}

/**
 * Parse offset string to ensure valid CSS value
 * 
 * @param {string} offset - Offset string (e.g., '10px', '1em', '2%')
 * @returns {string} Valid CSS offset value
 */
export function parseOffset(offset) {
	if (!offset || typeof offset !== 'string') {
		return '0';
	}
	
	// Check if it's a valid CSS length/percentage
	// Simple validation - could be expanded for more complex cases
	const validPattern = /^(\d+(\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|cm|mm|in|pt|pc)$/i;
	if (validPattern.test(offset.trim())) {
		return offset.trim();
	}
	
	// Check if it's just a number (assume pixels)
	const numPattern = /^\d+(\.\d+)?$/;
	if (numPattern.test(offset.trim())) {
		return `${offset.trim()}px`;
	}
	
	return '0';
}

/**
 * Convert position object to position string
 * 
 * @param {object} positionObj - Position object with vertical and horizontal properties
 * @returns {string} Position string
 */
export function positionToString(positionObj) {
	if (!positionObj || typeof positionObj !== 'object') {
		return 'bottom-center';
	}
	
	const vertical = positionObj.vertical || 'bottom';
	const horizontal = positionObj.horizontal || 'center';
	
	return `${vertical}-${horizontal}`;
}

/**
 * Check if a position string is valid
 * 
 * @param {string} position - Position string to validate
 * @returns {boolean} True if position is valid
 */
export function isValidPosition(position) {
	if (!position || typeof position !== 'string') {
		return false;
	}
	
	const validPositions = [
		'top-left', 'top-center', 'top-right',
		'bottom-left', 'bottom-center', 'bottom-right'
	];
	
	return validPositions.includes(position);
}

/**
 * Get all valid position strings
 * 
 * @returns {Array} Array of valid position strings
 */
export function getValidPositions() {
	return [
		'top-left', 'top-center', 'top-right',
		'bottom-left', 'bottom-center', 'bottom-right'
	];
}

/**
 * Calculate position with custom offsets
 * 
 * @param {string} position - Base position string
 * @param {string} offsetX - Horizontal offset (e.g., '10px')
 * @param {string} offsetY - Vertical offset (e.g., '10px')
 * @returns {object} Position object with offsets
 */
export function calculatePositionWithOffsets(position, offsetX = '0', offsetY = '0') {
	const pos = calculatePosition(position);
	
	return {
		...pos,
		offsetX: parseOffset(offsetX),
		offsetY: parseOffset(offsetY)
	};
}