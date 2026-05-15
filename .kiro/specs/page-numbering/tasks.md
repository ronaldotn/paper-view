# Implementation Plan: Page Numbering Feature

## Overview

The Page Numbering feature adds optional, configurable page number display to the PaperView JavaScript library. This implementation will create a new module in the `src/modules/page-numbering/` directory with components for configuration management, page number rendering, formatting, and CSS integration. The feature integrates with existing Chunker and Polisher components.

## Tasks

- [x] 1. Set up page numbering module structure and core interfaces
  - Create `src/modules/page-numbering/` directory structure
  - Define core interfaces and configuration schema
  - Set up module entry point and exports
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_

- [x] 2. Implement configuration system
  - [x] 2.1 Create configuration validation and normalization
    - Implement `config.js` with validation functions
    - Support all position values: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
    - Support all numbering styles: decimal, upper-roman, lower-roman, upper-alpha, lower-alpha
    - Validate start page number and content templates
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 7.2_
  
  - [ ]* 2.2 Write property test for configuration validation consistency
    - **Property 1: Configuration Validation Consistency**
    - **Validates: Requirements 2.1, 3.1, 4.1, 5.1, 7.2**
  
  - [ ]* 2.3 Write property test for configuration normalization
    - **Property 9: Configuration Normalization**
    - **Validates: Requirements 1.3, 3.3, 4.3**
  
  - [ ]* 2.4 Write property test for idempotent configuration updates
    - **Property 10: Idempotent Configuration Updates**
    - **Validates: Requirements 2.1, 3.1, 4.1**

- [x] 3. Implement page number formatter
  - [x] 3.1 Create formatter for different numbering styles
    - Implement `formatter.js` with decimal, roman, and alpha conversions
    - Support template rendering with {current} and {total} placeholders
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3_
  
  - [ ]* 3.2 Write property test for page number formatting round-trip
    - **Property 2: Page Number Formatting Round-Trip**
    - **Validates: Requirements 3.2**
  
  - [ ]* 3.3 Write property test for template rendering consistency
    - **Property 3: Template Rendering Consistency**
    - **Validates: Requirements 5.2, 5.3, 8.2**

- [x] 4. Checkpoint - Core logic validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement page number renderer
  - [x] 5.1 Create renderer for DOM element creation and positioning
    - Implement `renderer.js` with element creation and CSS styling
    - Support all position configurations with CSS positioning
    - Apply CSS classes and custom styles
    - _Requirements: 2.2, 2.3, 6.1, 6.2, 6.3_
  
  - [ ]* 5.2 Write property test for position-to-CSS mapping
    - **Property 4: Position-to-CSS Mapping**
    - **Validates: Requirements 2.3, 6.3**
  
  - [x] 5.3 Implement position calculation utilities
    - Create `positions.js` with position calculation logic
    - Handle offset calculations for different positions
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Implement CSS integration
  - [x] 6.1 Create CSS @page rule parser
    - Implement `css-integration.js` to parse @page rules
    - Extract page numbering properties from CSS
    - Convert CSS properties to configuration values
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 6.2 Write property test for CSS @page rule parsing
    - **Property 8: CSS @page Rule Parsing**
    - **Validates: Requirements 7.1**
  
  - [ ]* 6.3 Write property test for configuration source merging
    - **Property 5: Configuration Source Merging**
    - **Validates: Requirements 7.1, 7.3**

- [~] 7. Checkpoint - CSS integration validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement main page numbering module
  - [x] 8.1 Create PageNumberingModule class
    - Implement `index.js` as main module entry point
    - Manage configuration and coordinate with other components
    - Handle enable/disable functionality
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1, 5.1_
  
  - [x] 8.2 Implement dynamic page count handling
    - Add methods to update page numbers when total changes
    - Handle start offset calculations
    - _Requirements: 4.2, 8.1, 8.2, 8.3_
  
  - [ ]* 8.3 Write property test for dynamic page count updates
    - **Property 6: Dynamic Page Count Updates**
    - **Validates: Requirements 8.1**
  
  - [ ]* 8.4 Write property test for start offset calculation
    - **Property 7: Start Offset Calculation**
    - **Validates: Requirements 4.2**

- [x] 9. Integrate with Chunker component
  - [x] 9.1 Modify Chunker to support page numbering
    - Update `src/chunker/chunker.js` to accept page numbering configuration
    - Call page numbering module during page creation
    - Pass page elements and indices to renderer
    - _Requirements: 1.1, 1.2, 2.2, 8.1, 8.2, 8.3_
  
  - [x] 9.2 Update Page class for page number rendering
    - Modify `src/chunker/page.js` to include page number elements
    - Ensure page numbers are properly positioned within page boundaries
    - _Requirements: 2.2, 2.3, 6.1, 6.2, 6.3_

- [x] 10. Integrate with Polisher component
  - [x] 10.1 Update Polisher to parse page numbering CSS
    - Modify `src/polisher/polisher.js` to extract @page rules
    - Pass CSS configuration to page numbering module
    - Handle CSS specificity and inheritance
    - _Requirements: 7.1, 7.2, 7.3_

- [~] 11. Checkpoint - Integration validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Add public API and documentation
  - [x] 12.1 Update main library exports
    - Add page numbering module to `src/index.js` exports
    - Create public API methods for configuration
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1, 5.1_
  
  - [~] 12.2 Create usage examples and documentation
    - Add example to `examples/` directory
    - Update README with page numbering feature documentation
    - _Requirements: All requirements_

- [ ] 13. Performance optimization and testing
  - [~] 13.1 Implement performance optimizations
    - Add caching for page number calculations
    - Optimize DOM operations for speed
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [~] 13.2 Create performance tests
    - Test rendering within 100ms per page requirement
    - Measure memory usage and optimization impact
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [~] 13.3 Implement browser compatibility tests
    - Test in Chrome, Firefox, Safari, and Edge
    - Add fallbacks for browser-specific features
    - _Requirements: 10.1, 10.2, 10.3_

- [~] 14. Final checkpoint - Complete feature validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- Performance tests verify the 100ms per page requirement

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3"] },
    { "id": 2, "tasks": ["5.1", "5.3"] },
    { "id": 3, "tasks": ["5.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "8.1", "8.2"] },
    { "id": 5, "tasks": ["8.3", "8.4", "9.1", "9.2"] },
    { "id": 6, "tasks": ["10.1", "12.1"] },
    { "id": 7, "tasks": ["12.2", "13.1"] },
    { "id": 8, "tasks": ["13.2", "13.3"] }
  ]
}
```