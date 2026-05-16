export class PageNumberFormatter {
	format(pageNumber: number, style: string = "decimal"): string {
		if (!Number.isInteger(pageNumber) || pageNumber < 1) {
			throw new Error(`Invalid page number: ${pageNumber}. Must be a positive integer.`);
		}

		switch (style) {
			case "decimal":
				return this.formatDecimal(pageNumber);
			case "upper-roman":
				return this.toRoman(pageNumber, true);
			case "lower-roman":
				return this.toRoman(pageNumber, false);
			case "upper-alpha":
				return this.toAlpha(pageNumber, true);
			case "lower-alpha":
				return this.toAlpha(pageNumber, false);
			default:
				throw new Error(`Unsupported numbering style: ${style}`);
		}
	}

	applyTemplate(formattedNumber: string, totalPages: number | null = null, template: string = "{current}"): string {
		if (!template || typeof template !== "string") {
			throw new Error("Template must be a non-empty string");
		}

		let result = template.replace(/\{current\}/g, formattedNumber);

		if (totalPages !== null) {
			const formattedTotal = this.formatDecimal(totalPages);
			result = result.replace(/\{total\}/g, formattedTotal);
		}

		return result;
	}

	formatDecimal(num: number): string {
		return num.toString();
	}

	toRoman(num: number, uppercase: boolean = true): string {
		if (num < 1 || num > 3999) {
			throw new Error(`Roman numerals only supported for numbers 1-3999. Got: ${num}`);
		}

		const romanNumerals: { value: number; numeral: string }[] = [
			{ value: 1000, numeral: "M" },
			{ value: 900, numeral: "CM" },
			{ value: 500, numeral: "D" },
			{ value: 400, numeral: "CD" },
			{ value: 100, numeral: "C" },
			{ value: 90, numeral: "XC" },
			{ value: 50, numeral: "L" },
			{ value: 40, numeral: "XL" },
			{ value: 10, numeral: "X" },
			{ value: 9, numeral: "IX" },
			{ value: 5, numeral: "V" },
			{ value: 4, numeral: "IV" },
			{ value: 1, numeral: "I" }
		];

		let result = "";
		let remaining = num;

		for (const { value, numeral } of romanNumerals) {
			while (remaining >= value) {
				result += numeral;
				remaining -= value;
			}
		}

		return uppercase ? result : result.toLowerCase();
	}

	toAlpha(num: number, uppercase: boolean = true): string {
		if (num < 1) {
			throw new Error(`Alpha numbering requires positive numbers. Got: ${num}`);
		}

		let result = "";
		let remaining = num;

		while (remaining > 0) {
			remaining--;
			const charCode = (remaining % 26) + 65;
			result = String.fromCharCode(charCode) + result;
			remaining = Math.floor(remaining / 26);
		}

		return uppercase ? result : result.toLowerCase();
	}

	formatWithTemplate(pageNumber: number, style: string = "decimal", totalPages: number | null = null, template: string = "{current}"): string {
		const formatted = this.format(pageNumber, style);
		return this.applyTemplate(formatted, totalPages, template);
	}
}

export const formatter = new PageNumberFormatter();

export function format(pageNumber: number, style: string = "decimal"): string {
	return formatter.format(pageNumber, style);
}

export function applyTemplate(formattedNumber: string, totalPages: number | null = null, template: string = "{current}"): string {
	return formatter.applyTemplate(formattedNumber, totalPages, template);
}

export function formatWithTemplate(pageNumber: number, style: string = "decimal", totalPages: number | null = null, template: string = "{current}"): string {
	return formatter.formatWithTemplate(pageNumber, style, totalPages, template);
}
