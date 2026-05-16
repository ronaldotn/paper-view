import { PageNumberFormatter, format, applyTemplate, formatWithTemplate } from '../../../src/modules/page-numbering/formatter.ts';

describe('PageNumberFormatter', () => {
  let formatter: PageNumberFormatter;

  beforeEach(() => {
    formatter = new PageNumberFormatter();
  });

  describe('format', () => {
    test('formats decimal numbers correctly', () => {
      expect(formatter.format(1, 'decimal')).toBe('1');
      expect(formatter.format(10, 'decimal')).toBe('10');
      expect(formatter.format(100, 'decimal')).toBe('100');
    });

    test('formats upper roman numerals correctly', () => {
      expect(formatter.format(1, 'upper-roman')).toBe('I');
      expect(formatter.format(4, 'upper-roman')).toBe('IV');
      expect(formatter.format(9, 'upper-roman')).toBe('IX');
      expect(formatter.format(40, 'upper-roman')).toBe('XL');
      expect(formatter.format(90, 'upper-roman')).toBe('XC');
      expect(formatter.format(400, 'upper-roman')).toBe('CD');
      expect(formatter.format(900, 'upper-roman')).toBe('CM');
      expect(formatter.format(1987, 'upper-roman')).toBe('MCMLXXXVII');
    });

    test('formats lower roman numerals correctly', () => {
      expect(formatter.format(1, 'lower-roman')).toBe('i');
      expect(formatter.format(4, 'lower-roman')).toBe('iv');
      expect(formatter.format(9, 'lower-roman')).toBe('ix');
      expect(formatter.format(40, 'lower-roman')).toBe('xl');
      expect(formatter.format(90, 'lower-roman')).toBe('xc');
      expect(formatter.format(400, 'lower-roman')).toBe('cd');
      expect(formatter.format(900, 'lower-roman')).toBe('cm');
      expect(formatter.format(1987, 'lower-roman')).toBe('mcmlxxxvii');
    });

    test('formats upper alpha characters correctly', () => {
      expect(formatter.format(1, 'upper-alpha')).toBe('A');
      expect(formatter.format(2, 'upper-alpha')).toBe('B');
      expect(formatter.format(26, 'upper-alpha')).toBe('Z');
      expect(formatter.format(27, 'upper-alpha')).toBe('AA');
      expect(formatter.format(28, 'upper-alpha')).toBe('AB');
      expect(formatter.format(52, 'upper-alpha')).toBe('AZ');
      expect(formatter.format(53, 'upper-alpha')).toBe('BA');
      expect(formatter.format(702, 'upper-alpha')).toBe('ZZ');
      expect(formatter.format(703, 'upper-alpha')).toBe('AAA');
    });

    test('formats lower alpha characters correctly', () => {
      expect(formatter.format(1, 'lower-alpha')).toBe('a');
      expect(formatter.format(2, 'lower-alpha')).toBe('b');
      expect(formatter.format(26, 'lower-alpha')).toBe('z');
      expect(formatter.format(27, 'lower-alpha')).toBe('aa');
      expect(formatter.format(28, 'lower-alpha')).toBe('ab');
      expect(formatter.format(52, 'lower-alpha')).toBe('az');
      expect(formatter.format(53, 'lower-alpha')).toBe('ba');
      expect(formatter.format(702, 'lower-alpha')).toBe('zz');
      expect(formatter.format(703, 'lower-alpha')).toBe('aaa');
    });

    test('throws error for invalid page numbers', () => {
      expect(() => formatter.format(0, 'decimal')).toThrow('Invalid page number');
      expect(() => formatter.format(-1, 'decimal')).toThrow('Invalid page number');
      expect(() => formatter.format(1.5, 'decimal')).toThrow('Invalid page number');
    });

    test('throws error for unsupported style', () => {
      expect(() => formatter.format(1, 'unsupported')).toThrow('Unsupported numbering style');
    });

    test('throws error for roman numerals outside range', () => {
      expect(() => formatter.format(0, 'upper-roman')).toThrow('Invalid page number: 0. Must be a positive integer.');
      expect(() => formatter.format(4000, 'upper-roman')).toThrow('Roman numerals only supported for numbers 1-3999');
    });

    test('throws error for alpha numbering with zero or negative', () => {
      expect(() => formatter.format(0, 'upper-alpha')).toThrow('Invalid page number: 0. Must be a positive integer.');
      expect(() => formatter.format(-1, 'upper-alpha')).toThrow('Invalid page number: -1. Must be a positive integer.');
    });
  });

  describe('applyTemplate', () => {
    test('replaces {current} placeholder', () => {
      expect(formatter.applyTemplate('5', null, 'Page {current}')).toBe('Page 5');
      expect(formatter.applyTemplate('XII', null, 'Page {current}')).toBe('Page XII');
      expect(formatter.applyTemplate('C', null, '{current}')).toBe('C');
    });

    test('replaces {total} placeholder when provided', () => {
      expect(formatter.applyTemplate('5', 10, 'Page {current} of {total}')).toBe('Page 5 of 10');
      expect(formatter.applyTemplate('XII', 24, 'Page {current} of {total}')).toBe('Page XII of 24');
      expect(formatter.applyTemplate('C', 100, '{current}/{total}')).toBe('C/100');
    });

    test('handles multiple placeholders', () => {
      expect(formatter.applyTemplate('5', 10, '{current} - {current} of {total}')).toBe('5 - 5 of 10');
    });

    test('handles template without placeholders', () => {
      expect(formatter.applyTemplate('5', null, 'Fixed Text')).toBe('Fixed Text');
    });

    test('uses default template when not provided', () => {
      expect(formatter.applyTemplate('5')).toBe('5');
      expect(formatter.applyTemplate('V')).toBe('V');
    });

    test('throws error for invalid template', () => {
      expect(() => formatter.applyTemplate('5', null, null as any)).toThrow('Template must be a non-empty string');
      expect(() => formatter.applyTemplate('5', null, '')).toThrow('Template must be a non-empty string');
    });
  });

  describe('formatWithTemplate', () => {
    test('formats and applies template in one step', () => {
      expect(formatter.formatWithTemplate(5, 'decimal', 10, 'Page {current} of {total}')).toBe('Page 5 of 10');
      expect(formatter.formatWithTemplate(12, 'upper-roman', 24, 'Page {current} of {total}')).toBe('Page XII of 24');
      expect(formatter.formatWithTemplate(3, 'lower-alpha', null, 'Page {current}')).toBe('Page c');
    });

    test('uses defaults when parameters not provided', () => {
      expect(formatter.formatWithTemplate(5)).toBe('5');
      expect(formatter.formatWithTemplate(5, 'decimal')).toBe('5');
      expect(formatter.formatWithTemplate(5, 'decimal', null)).toBe('5');
    });
  });

  describe('convenience functions', () => {
    test('format function works', () => {
      expect(format(5, 'decimal')).toBe('5');
      expect(format(5, 'upper-roman')).toBe('V');
    });

    test('applyTemplate function works', () => {
      expect(applyTemplate('5', 10, 'Page {current} of {total}')).toBe('Page 5 of 10');
    });

    test('formatWithTemplate function works', () => {
      expect(formatWithTemplate(5, 'decimal', 10, 'Page {current} of {total}')).toBe('Page 5 of 10');
    });
  });

  describe('edge cases', () => {
    test('handles large numbers for decimal', () => {
      expect(formatter.format(1000000, 'decimal')).toBe('1000000');
    });

    test('handles boundary values for roman numerals', () => {
      expect(formatter.format(1, 'upper-roman')).toBe('I');
      expect(formatter.format(3999, 'upper-roman')).toBe('MMMCMXCIX');
    });

    test('handles boundary values for alpha', () => {
      expect(formatter.format(1, 'upper-alpha')).toBe('A');
      expect(formatter.format(26, 'upper-alpha')).toBe('Z');
      expect(formatter.format(27, 'upper-alpha')).toBe('AA');
    });
  });
});
