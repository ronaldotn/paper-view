/**
 * Example demonstrating the Page Numbering API
 * 
 * This example shows how to use the page numbering module exports
 * from the main PaperView library.
 */

// Example 1: Using PageNumberingModule directly
console.log('=== Example 1: Using PageNumberingModule directly ===');

// In a real application, you would import like:
// import { PageNumberingModule, validateConfig, PageNumberFormatter } from 'paper-view';

// Create a page numbering module instance
const pageNumberingConfig = {
  enabled: true,
  position: 'bottom-center',
  style: 'decimal',
  start: 1,
  template: 'Page {current} of {total}',
  className: 'custom-page-number'
};

// Example validation
console.log('Config validation:', validateConfig(pageNumberingConfig));

// Example formatting
const formatter = new PageNumberFormatter();
console.log('Formatted page 5 (roman):', formatter.format(5, 'upper-roman'));
console.log('Formatted page 5 with template:', formatter.formatWithTemplate(5, 'decimal', 10, 'Page {current} of {total}'));

// Example position calculation
console.log('Position CSS for top-left:', getPositionCSS('top-left'));

// Example 2: Using with Chunker
console.log('\n=== Example 2: Using with Chunker ===');

// When creating a Chunker instance:
const chunkerOptions = {
  pageNumbering: pageNumberingConfig
};

// The Chunker will automatically initialize the PageNumberingModule
// with the provided configuration.

// Example 3: Using CSS integration
console.log('\n=== Example 3: Using CSS integration ===');

const cssString = `
@page {
  pagedjs-page-numbering: enabled;
  pagedjs-page-numbering-position: top-right;
  pagedjs-page-numbering-style: upper-roman;
  pagedjs-page-numbering-start: 5;
}
`;

const pageRules = parsePageRules(cssString);
console.log('Parsed page rules:', pageRules);

const extractedConfig = extractPageNumberingConfig(pageRules);
console.log('Extracted config:', extractedConfig);

// Example 4: Available positions and styles
console.log('\n=== Example 4: Available positions and styles ===');
console.log('Valid positions:', VALID_POSITIONS);
console.log('Valid styles:', VALID_STYLES);
console.log('Default config:', DEFAULT_CONFIG);

console.log('\n=== API Summary ===');
console.log('The page numbering feature provides:');
console.log('1. PageNumberingModule - Main class for managing page numbering');
console.log('2. PageNumberRenderer - Renders page number DOM elements');
console.log('3. Configuration utilities (validateConfig, normalizeConfig, etc.)');
console.log('4. Formatter utilities (PageNumberFormatter, format, etc.)');
console.log('5. Position utilities (calculatePosition, getPositionCSS, etc.)');
console.log('6. CSS integration utilities (parsePageRules, extractPageNumberingConfig, etc.)');
console.log('7. PageNumberingHandler - CSS handler for @page rules');
console.log('\nAll exports are available from the main PaperView library.');