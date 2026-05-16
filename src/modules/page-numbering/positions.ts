export interface PositionObject {
	vertical: string;
	horizontal: string;
	offsetX: string;
	offsetY: string;
}

export function calculatePosition(position: string): PositionObject {
	if (!position || typeof position !== "string") {
		return {
			vertical: "bottom",
			horizontal: "center",
			offsetX: "0",
			offsetY: "0"
		};
	}

	const parts = position.split("-");
	if (parts.length !== 2) {
		return {
			vertical: "bottom",
			horizontal: "center",
			offsetX: "0",
			offsetY: "0"
		};
	}

	const [vertical, horizontal] = parts;

	const validVertical = ["top", "bottom"].includes(vertical) ? vertical : "bottom";
	const validHorizontal = ["left", "center", "right"].includes(horizontal) ? horizontal : "center";

	return {
		vertical: validVertical,
		horizontal: validHorizontal,
		offsetX: "0",
		offsetY: "0"
	};
}

export function getPositionCSS(position: string): Record<string, string> {
	const pos = calculatePosition(position);
	const css: Record<string, string> = {
		position: "absolute"
	};

	if (pos.vertical === "top") {
		css.top = "0";
		css.bottom = "auto";
	} else {
		css.top = "auto";
		css.bottom = "0";
	}

	switch (pos.horizontal) {
		case "left":
			css.left = "0";
			css.right = "auto";
			css.transform = "none";
			break;
		case "center":
			css.left = "50%";
			css.right = "auto";
			css.transform = "translateX(-50%)";
			break;
		case "right":
			css.left = "auto";
			css.right = "0";
			css.transform = "none";
			break;
	}

	if (pos.offsetX && pos.offsetX !== "0") {
		if (pos.horizontal === "center") {
			css.transform = `translateX(calc(-50% + ${pos.offsetX}))`;
		} else if (pos.horizontal === "left") {
			css.left = pos.offsetX;
		} else if (pos.horizontal === "right") {
			css.right = pos.offsetX;
		}
	}

	if (pos.offsetY && pos.offsetY !== "0") {
		if (pos.vertical === "top") {
			css.top = pos.offsetY;
		} else {
			css.bottom = pos.offsetY;
		}
	}

	return css;
}

export function parseOffset(offset: string): string {
	if (!offset || typeof offset !== "string") {
		return "0";
	}

	// eslint-disable-next-line security/detect-unsafe-regex
	const validPattern = /^(\d+(\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|cm|mm|in|pt|pc)$/i;
	if (validPattern.test(offset.trim())) {
		return offset.trim();
	}

	// eslint-disable-next-line security/detect-unsafe-regex
	const numPattern = /^\d+(\.\d+)?$/;
	if (numPattern.test(offset.trim())) {
		return `${offset.trim()}px`;
	}

	return "0";
}

export function positionToString(positionObj: PositionObject): string {
	if (!positionObj || typeof positionObj !== "object") {
		return "bottom-center";
	}

	const vertical = positionObj.vertical || "bottom";
	const horizontal = positionObj.horizontal || "center";

	return `${vertical}-${horizontal}`;
}

export function isValidPosition(position: string): boolean {
	if (!position || typeof position !== "string") {
		return false;
	}

	const validPositions = [
		"top-left", "top-center", "top-right",
		"bottom-left", "bottom-center", "bottom-right"
	];

	return validPositions.includes(position);
}

export function getValidPositions(): string[] {
	return [
		"top-left", "top-center", "top-right",
		"bottom-left", "bottom-center", "bottom-right"
	];
}

export function calculatePositionWithOffsets(position: string, offsetX: string = "0", offsetY: string = "0"): PositionObject {
	const pos = calculatePosition(position);

	return {
		...pos,
		offsetX: parseOffset(offsetX),
		offsetY: parseOffset(offsetY)
	};
}
