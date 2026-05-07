/**
 * Page Number Formatter
 * 
 * Formats page numbers according to different numbering styles and applies templates.
 * Supports decimal, roman numeral, and alpha character formatting.
 * 
 * @module modules/page-numbering/formatter
 */

/**
 * Page number formatter class
 */
export class PageNumberFormatter {
  /**
   * Format a page number according to the specified style
   * 
   * @param {number} pageNumber - The page number to format (1-based)
   * @param {string} style - The numbering style: 'decimal', 'upper-roman', 'lower-roman', 'upper-alpha', 'lower-alpha'
   * @returns {string} The formatted page number
   */
  format(pageNumber, style = 'decimal') {
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new Error(`Invalid page number: ${pageNumber}. Must be a positive integer.`);
    }

    switch (style) {
      case 'decimal':
        return this.formatDecimal(pageNumber);
      case 'upper-roman':
        return this.toRoman(pageNumber, true);
      case 'lower-roman':
        return this.toRoman(pageNumber, false);
      case 'upper-alpha':
        return this.toAlpha(pageNumber, true);
      case 'lower-alpha':
        return this.toAlpha(pageNumber, false);
      default:
        throw new Error(`Unsupported numbering style: ${style}`);
    }
  }

  /**
   * Apply a template to a formatted page number
   * 
   * @param {string} formattedNumber - The formatted page number
   * @param {number} totalPages - The total number of pages (optional)
   * @param {string} template - The template string with {current} and {total} placeholders
   * @returns {string} The template with placeholders replaced
   */
  applyTemplate(formattedNumber, totalPages = null, template = '{current}') {
    if (!template || typeof template !== 'string') {
      throw new Error('Template must be a non-empty string');
    }

    let result = template.replace(/\{current\}/g, formattedNumber);
    
    if (totalPages !== null) {
      const formattedTotal = this.formatDecimal(totalPages);
      result = result.replace(/\{total\}/g, formattedTotal);
    }
    
    return result;
  }

  /**
   * Format a page number as a decimal string
   * 
   * @param {number} num - The number to format
   * @returns {string} The decimal representation
   */
  formatDecimal(num) {
    return num.toString();
  }

  /**
   * Convert a number to roman numerals
   * 
   * @param {number} num - The number to convert (1-3999)
   * @param {boolean} uppercase - Whether to use uppercase letters
   * @returns {string} The roman numeral representation
   */
  toRoman(num, uppercase = true) {
    if (num < 1 || num > 3999) {
      throw new Error(`Roman numerals only supported for numbers 1-3999. Got: ${num}`);
    }

    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];

    let result = '';
    let remaining = num;

    for (const { value, numeral } of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }

    return uppercase ? result : result.toLowerCase();
  }

  /**
   * Convert a number to alpha characters (A, B, C, ... AA, AB, ...)
   * 
   * @param {number} num - The number to convert (1-based)
   * @param {boolean} uppercase - Whether to use uppercase letters
   * @returns {string} The alpha character representation
   */
  toAlpha(num, uppercase = true) {
    if (num < 1) {
      throw new Error(`Alpha numbering requires positive numbers. Got: ${num}`);
    }

    let result = '';
    let remaining = num;

    while (remaining > 0) {
      remaining--;
      const charCode = (remaining % 26) + 65; // 65 = 'A' in ASCII
      result = String.fromCharCode(charCode) + result;
      remaining = Math.floor(remaining / 26);
    }

    return uppercase ? result : result.toLowerCase();
  }

  /**
   * Format a page number with a template in one step
   * 
   * @param {number} pageNumber - The page number to format (1-based)
   * @param {string} style - The numbering style
   * @param {number} totalPages - The total number of pages (optional)
   * @param {string} template - The template string
   * @returns {string} The formatted and templated page number
   */
  formatWithTemplate(pageNumber, style = 'decimal', totalPages = null, template = '{current}') {
    const formatted = this.format(pageNumber, style);
    return this.applyTemplate(formatted, totalPages, template);
  }
}

/**
 * Default formatter instance
 */
export const formatter = new PageNumberFormatter();

/**
 * Format a page number (convenience function)
 * 
 * @param {number} pageNumber - The page number to format
 * @param {string} style - The numbering style
 * @returns {string} The formatted page number
 */
export function format(pageNumber, style = 'decimal') {
  return formatter.format(pageNumber, style);
}

/**
 * Apply a template to a formatted page number (convenience function)
 * 
 * @param {string} formattedNumber - The formatted page number
 * @param {number} totalPages - The total number of pages
 * @param {string} template - The template string
 * @returns {string} The template with placeholders replaced
 */
export function applyTemplate(formattedNumber, totalPages = null, template = '{current}') {
  return formatter.applyTemplate(formattedNumber, totalPages, template);
}

/**
 * Format a page number with a template in one step (convenience function)
 * 
 * @param {number} pageNumber - The page number to format
 * @param {string} style - The numbering style
 * @param {number} totalPages - The total number of pages
 * @param {string} template - The template string
 * @returns {string} The formatted and templated page number
 */
export function formatWithTemplate(pageNumber, style = 'decimal', totalPages = null, template = '{current}') {
  return formatter.formatWithTemplate(pageNumber, style, totalPages, template);
}