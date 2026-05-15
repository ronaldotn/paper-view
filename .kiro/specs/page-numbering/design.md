# Design Document: Page Numbering Feature

## Overview

The Page Numbering feature adds optional, configurable page number display to the PaperView JavaScript library. This feature enables developers to display sequential page numbers on paged media content with customizable positions, formats, and styling. Page numbering is a common requirement for document viewing applications, providing users with visual page references and navigation aids.

### Problem Statement
PaperView currently lacks built-in page numbering capabilities, requiring developers to implement custom solutions for displaying page numbers. This leads to inconsistent implementations, increased development effort, and potential accessibility issues.

### Solution Approach
Integrate page numbering as an optional module within PaperView's existing architecture, leveraging the library's page rendering pipeline and CSS styling system. The solution provides:
- Optional page numbering (disabled by default)
- Configurable positions (top/bottom, left/center/right)
- Multiple numbering styles (decimal, roman, alpha)
- CSS-based styling and customization
- Integration with existing @page rules

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PaperView Application                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Chunker   │  │   Polisher  │  │  Page Numbering    │  │
│  │             │  │             │  │      Module        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │            │
│         ▼                ▼                     ▼            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Page Layout │  │ CSS Parsing │  │ Page Number        │  │
│  │   Engine    │  │   & Style   │  │   Renderer         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Chunker Integration**: Page numbers are rendered during page creation in the `Chunker.addPage()` method
2. **Polisher Integration**: CSS @page rules are parsed to extract page numbering configuration
3. **Page Class Integration**: Page number elements are added to page DOM structure
4. **Configuration System**: User configuration is merged with CSS-derived settings

### Module Structure

```
src/modules/page-numbering/
├── index.js              # Main module entry point
├── config.js            # Configuration parsing and validation
├── renderer.js          # Page number rendering logic
├── formatter.js         # Page number formatting (decimal, roman, alpha)
├── positions.js         # Position calculation utilities
└── css-integration.js   # CSS @page rule integration
```

## Components and Interfaces

### 1. PageNumberingModule Class

**Responsibilities**:
- Manage page numbering configuration
- Coordinate with Chunker for page rendering
- Handle dynamic updates (page count changes)
- Integrate with CSS @page rules

**Interface**:
```javascript
class PageNumberingModule {
  constructor(options = {}) {
    this.enabled = options.enabled || false;
    this.config = this.normalizeConfig(options);
    this.pageCount = 0;
  }
  
  // Enable/disable page numbering
  enable() { /* ... */ }
  disable() { /* ... */ }
  
  // Update configuration
  updateConfig(newConfig) { /* ... */ }
  
  // Render page numbers for a page
  renderPageNumber(pageElement, pageIndex, totalPages) { /* ... */ }
  
  // Handle page count changes
  updatePageCount(totalPages) { /* ... */ }
}
```

### 2. Configuration System

**Configuration Schema**:
```javascript
{
  enabled: boolean,           // Whether page numbering is enabled
  position: string,           // 'top-left', 'top-center', 'top-right', 
                              // 'bottom-left', 'bottom-center', 'bottom-right'
  style: string,              // 'decimal', 'upper-roman', 'lower-roman',
                              // 'upper-alpha', 'lower-alpha'
  start: number,              // Starting page number (default: 1)
  template: string,           // Content template with placeholders
                              // e.g., "Page {current} of {total}"
  className: string,          // CSS class for page number elements
  css: object                 // Additional CSS properties
}
```

**Configuration Sources** (priority order):
1. JavaScript API configuration (highest priority)
2. CSS @page rules
3. Default values (lowest priority)

### 3. PageNumberRenderer Class

**Responsibilities**:
- Create and position page number DOM elements
- Apply CSS styling
- Handle dynamic content updates

**Interface**:
```javascript
class PageNumberRenderer {
  // Create page number element
  createElement(pageNumber, totalPages, config) { /* ... */ }
  
  // Position element on page
  positionElement(element, pageElement, position) { /* ... */ }
  
  // Apply CSS styles
  applyStyles(element, config) { /* ... */ }
  
  // Update element content (for dynamic page counts)
  updateContent(element, pageNumber, totalPages, config) { /* ... */ }
}
```

### 4. PageNumberFormatter Class

**Responsibilities**:
- Format page numbers according to specified style
- Handle different numbering systems
- Support custom templates

**Interface**:
```javascript
class PageNumberFormatter {
  // Format page number
  format(pageNumber, style = 'decimal') { /* ... */ }
  
  // Apply template
  applyTemplate(formattedNumber, totalPages, template) { /* ... */ }
  
  // Convert to roman numerals
  toRoman(num, uppercase = true) { /* ... */ }
  
  // Convert to alpha (A, B, C...)
  toAlpha(num, uppercase = true) { /* ... */ }
}
```

### 5. CSS Integration Component

**Responsibilities**:
- Parse CSS @page rules for page numbering properties
- Convert CSS properties to configuration objects
- Handle CSS specificity and inheritance

**CSS Properties**:
```css
@page {
  /* Enable/disable page numbering */
  pagedjs-page-numbering: enabled | disabled;
  
  /* Position of page numbers */
  pagedjs-page-numbering-position: top-left | top-center | top-right |
                                   bottom-left | bottom-center | bottom-right;
  
  /* Numbering style */
  pagedjs-page-numbering-style: decimal | upper-roman | lower-roman |
                                upper-alpha | lower-alpha;
  
  /* Starting page number */
  pagedjs-page-numbering-start: <integer>;
  
  /* Custom CSS for page number elements */
  pagedjs-page-numbering-class: <string>;
}
```

## Data Models

### 1. PageNumberingConfig Object

```javascript
{
  // Core configuration
  enabled: boolean,
  position: 'top-left' | 'top-center' | 'top-right' | 
            'bottom-left' | 'bottom-center' | 'bottom-right',
  style: 'decimal' | 'upper-roman' | 'lower-roman' | 
         'upper-alpha' | 'lower-alpha',
  start: number,
  
  // Content configuration
  template: string,  // Supports {current} and {total} placeholders
  
  // Styling configuration
  className: string,
  css: {
    fontSize: string,
    color: string,
    fontFamily: string,
    // ... other CSS properties
  },
  
  // Internal state
  _pageCount: number,
  _initialized: boolean
}
```

### 2. PagePosition Object

```javascript
{
  vertical: 'top' | 'bottom',
  horizontal: 'left' | 'center' | 'right',
  offsetX: string,  // CSS value, e.g., '10px', '1em'
  offsetY: string   // CSS value, e.g., '10px', '1em'
}
```

### 3. CSSPageRule Object

```javascript
{
  selector: string,           // @page selector (e.g., ':first', ':left')
  properties: {
    'pagedjs-page-numbering': string,
    'pagedjs-page-numbering-position': string,
    'pagedjs-page-numbering-style': string,
    'pagedjs-page-numbering-start': string,
    'pagedjs-page-numbering-class': string
  },
  specificity: number         // For conflict resolution
}
```

## Error Handling

### Error Types

1. **Configuration Errors**:
   - Invalid position value
   - Invalid numbering style
   - Invalid start value (non-positive integer)
   - Malformed template string

2. **Rendering Errors**:
   - Page element not found
   - CSS application failures
   - DOM manipulation errors

3. **CSS Integration Errors**:
   - Invalid @page rule syntax
   - Unsupported CSS property values
   - Specificity calculation errors

### Error Handling Strategy

1. **Graceful Degradation**: Invalid configuration falls back to defaults
2. **Console Warnings**: Non-critical errors log warnings to console
3. **Validation Functions**: Configuration validated before application
4. **Try-Catch Blocks**: DOM operations wrapped in error handling

### Error Recovery

```javascript
try {
  this.renderer.positionElement(element, pageElement, config.position);
} catch (error) {
  console.warn('Failed to position page number:', error);
  // Fall back to default position
  this.renderer.positionElement(element, pageElement, 'bottom-center');
}
```

## Testing Strategy

### Overview
Since this feature involves UI rendering and CSS integration, property-based testing (PBT) is NOT appropriate. Instead, we'll use a combination of unit tests, integration tests, and snapshot tests.

### Test Categories

#### 1. Unit Tests (Jest)
- **Configuration validation and normalization**
- **Page number formatting** (decimal, roman, alpha conversions)
- **Position calculation utilities**
- **Template string parsing and rendering**
- **CSS property parsing**

#### 2. Integration Tests (Jest + Puppeteer)
- **End-to-end page rendering with page numbers**
- **CSS @page rule integration**
- **Dynamic page count updates**
- **Browser compatibility testing**

#### 3. Snapshot Tests
- **Visual regression testing** for page number rendering
- **CSS styling verification**
- **Position accuracy across browsers**

### Test Configuration

```javascript
// Example test configuration
describe('PageNumberingModule', () => {
  describe('Configuration', () => {
    test('validates position values', () => { /* ... */ });
    test('normalizes configuration with defaults', () => { /* ... */ });
    test('merges multiple configuration sources', () => { /* ... */ });
  });
  
  describe('Rendering', () => {
    test('creates page number DOM elements', () => { /* ... */ });
    test('positions elements correctly', () => { /* ... */ });
    test('applies CSS styles', () => { /* ... */ });
  });
  
  describe('Formatting', () => {
    test('formats decimal numbers', () => { /* ... */ });
    test('converts to roman numerals', () => { /* ... */ });
    test('converts to alpha characters', () => { /* ... */ });
    test('applies content templates', () => { /* ... */ });
  });
});
```

### Integration Test Example

```javascript
describe('Page Numbering Integration', () => {
  beforeEach(async () => {
    // Setup test page with PaperView
    await page.goto('http://localhost:8080/test-page.html');
  });
  
  test('renders page numbers at bottom-center', async () => {
    // Configure page numbering
    await page.evaluate(() => {
      window.paperView.updateConfig({
        pageNumbering: {
          enabled: true,
          position: 'bottom-center',
          style: 'decimal'
        }
      });
    });
    
    // Take screenshot and compare with snapshot
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
  
  test('updates page numbers when page count changes', async () => {
    // Test dynamic updates
    // ...
  });
});
```

### Performance Testing

```javascript
describe('Performance', () => {
  test('renders page numbers within 100ms per page', async () => {
    const startTime = performance.now();
    
    // Render 10 pages with page numbers
    for (let i = 0; i < 10; i++) {
      await pageNumberingModule.renderPageNumber(pageElement, i, 10);
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 10;
    
    expect(averageTime).toBeLessThan(100);
  });
});
```

### Browser Compatibility Testing

- **Chrome**: Latest version
- **Firefox**: Latest version  
- **Safari**: Latest version
- **Edge**: Latest version

Each browser will be tested for:
1. CSS property support
2. DOM manipulation performance
3. Visual rendering consistency
4. JavaScript feature compatibility

### Test Coverage Goals
- **Unit tests**: 90%+ coverage for core logic
- **Integration tests**: All major user flows
- **Snapshot tests**: All position and style combinations
- **Performance tests**: Key performance requirements
- **Browser tests**: All supported browsers

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Configuration Validation Consistency

*For any* configuration input, the Page Numbering Module SHALL either accept valid configuration values (positions, styles, start numbers, templates) or reject invalid ones with appropriate error handling.

**Validates: Requirements 2.1, 3.1, 4.1, 5.1, 7.2**

### Property 2: Page Number Formatting Round-Trip

*For any* page number N and numbering style S (decimal, upper-roman, lower-roman, upper-alpha, lower-alpha), formatting N with style S then parsing the result (where applicable) SHALL preserve the original page number value or produce a semantically equivalent representation.

**Validates: Requirements 3.2**

### Property 3: Template Rendering Consistency

*For any* content template T containing placeholders {current} and/or {total}, current page number C, and total page count T, rendering the template SHALL correctly replace {current} with the formatted current page number and {total} with the formatted total page count.

**Validates: Requirements 5.2, 5.3, 8.2**

### Property 4: Position-to-CSS Mapping

*For any* valid position P (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right) and page element E, applying position P to element E SHALL produce CSS properties that correctly position the element according to P's specification.

**Validates: Requirements 2.3, 6.3**

### Property 5: Configuration Source Merging

*For any* configuration sources (JavaScript API, CSS @page rules, defaults) with potentially conflicting values, the Page Numbering Module SHALL merge these sources according to the defined priority order (API > CSS > defaults) without losing valid configuration data.

**Validates: Requirements 7.1, 7.3**

### Property 6: Dynamic Page Count Updates

*For any* page number elements currently displayed with total T1, when the total page count changes to T2, all page number elements SHALL update to reflect the new total T2 while preserving their current page number values.

**Validates: Requirements 8.1**

### Property 7: Start Offset Calculation

*For any* starting page number S and page index I (0-based), the displayed page number SHALL equal S + I, regardless of the numbering style or template used.

**Validates: Requirements 4.2**

### Property 8: CSS @page Rule Parsing

*For any* valid CSS @page rule containing page numbering properties, parsing the rule SHALL extract all recognized properties (`pagedjs-page-numbering`, `pagedjs-page-numbering-position`, `pagedjs-page-numbering-style`, `pagedjs-page-numbering-start`) and convert them to equivalent configuration values.

**Validates: Requirements 7.1**

### Property 9: Configuration Normalization

*For any* configuration object C (including partial configurations), normalizing C SHALL produce a complete configuration object with all required fields populated, default values applied where missing, and invalid values replaced with defaults or rejected.

**Validates: Requirements 1.3, 3.3, 4.3**

### Property 10: Idempotent Configuration Updates

*For any* configuration C, applying C to the Page Numbering Module, then applying C again SHALL produce the same result as applying C once (no side effects from repeated application).

**Validates: Requirements 2.1, 3.1, 4.1**