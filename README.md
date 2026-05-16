# PaperView

[![npm version](https://img.shields.io/npm/v/paper-view.svg)](https://www.npmjs.com/package/paper-view)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ronaldotn/paper-view/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/paper-view.svg)](https://www.npmjs.com/package/paper-view)

> A JavaScript library for paged media viewing. Fork of [paged.js](https://www.pagedmedia.org/paged-js/) with enhanced support for browser, Angular, and Vue.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Browser](#browser)
  - [Angular](#angular)
  - [Vue.js](#vuejs)
- [API Reference](#api-reference)
  - [Previewer](#previewer)
  - [Chunker](#chunker)
  - [Polisher](#polisher)
- [Advanced Features](#advanced-features)
  - [Page Numbering](#page-numbering)
  - [PDF Export](#pdf-export)
  - [Lazy Rendering](#lazy-rendering)
  - [Web Workers](#web-workers)
  - [Image Overflow Handling](#image-overflow-handling)
  - [Overset Content Handling](#overset-content-handling)
  - [CSS Level 4 Selectors](#css-level-4-selectors-has-and-is)
  - [Running Headers and String-Sets](#running-headers-and-string-sets)
  - [CSS Hyphens Support](#css-hyphens-support)
  - [CSS Footnotes](#css-footnotes)
  - [Spread Viewer (Book View)](#spread-viewer-book-view)
- [Configuration](#configuration)
- [Development](#development)
- [Examples](#examples)
- [License](#license)

---

## Features

- **Paged Media Rendering**: Chunks documents into paginated flows with print styles
- **CSS @page Support**: Full support for `@page` rules, margins, sizes, and named pages
- **Page Breaks**: `break-before`, `break-after`, `break-inside` with left/right/recto/verso
- **Generated Content**: Running headers, string-sets, target-counters, target-text
- **Page Numbering**: Configurable page numbers with multiple positions and styles
- **PDF Export**: Browser and Node.js PDF generation
- **Lazy Rendering**: Render only visible pages for large documents (100+ pages)
- **Web Workers**: Offload layout calculations to background threads
- **Image Handling**: Automatic image overflow prevention
- **Overset Detection**: Automatic detection and handling of content that doesn't fit
- **CSS Level 4 Selectors**: `:has()` and `:is()` for powerful page matching
- **Running Headers**: Full `string-set` support with `first`, `last`, `start`, `first-except` keywords
- **CSS Hyphens**: Automatic hyphenation with dictionaries for 6 languages (en, es, fr, de, it, pt)
- **CSS Footnotes**: Full `float: footnote` support with `::footnote-call`, `::footnote-marker`, and `@footnote` area
- **Spread Viewer**: Book view with navigation, zoom, and touch support
- **Framework Support**: Works with vanilla JS, Angular, and Vue.js

---

## Installation

### npm

```bash
npm install paper-view
```

### yarn

```bash
yarn add paper-view
```

### CDN

```html
<script src="https://unpkg.com/paper-view/dist/paperview.js"></script>
```

---

## Quick Start

### Browser

```html
<!DOCTYPE html>
<html>
<head>
  <script src="dist/paperview.js"></script>
  <link rel="stylesheet" href="dist/css/paper.css">
</head>
<body>
  <!-- Source content (hidden) -->
  <div id="content" style="display: none;">
    <h1>My Document</h1>
    <p>Your content goes here...</p>
  </div>

  <!-- Render target -->
  <div id="render"></div>

  <script>
    const content = document.getElementById('content');
    const renderTo = document.getElementById('render');

    const previewer = new PaperView.Previewer();
    previewer.preview(content, renderTo, []).then((flow) => {
      console.log(`Rendered ${flow.total} pages in ${flow.performance}ms`);
    });
  </script>
</body>
</html>
```

### Angular

**1. Add CSS to `angular.json`:**

```json
{
  "styles": [
    "node_modules/paper-view/dist/css/paper.css"
  ]
}
```

**2. Import and use in your component:**

```typescript
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Previewer } from 'paper-view';

@Component({
  selector: 'app-root',
  template: `
    <div #content style="display: none;">
      <h1>My Document</h1>
      <p>Content here...</p>
    </div>
    <div #render></div>
  `
})
export class AppComponent implements OnInit {
  @ViewChild('content', { read: ElementRef }) contentRef!: ElementRef;
  @ViewChild('render', { read: ElementRef }) renderRef!: ElementRef;

  ngOnInit() {
    const previewer = new Previewer();
    previewer.preview(
      this.contentRef.nativeElement,
      this.renderRef.nativeElement,
      []
    );
  }
}
```

### Vue.js

```vue
<template>
  <div id="app">
    <div ref="content" style="display: none;">
      <h1>My Document</h1>
      <p>Content here...</p>
    </div>
    <div ref="render"></div>
  </div>
</template>

<script>
import { Previewer } from 'paper-view';
import 'paper-view/dist/css/paper.css';

export default {
  name: 'App',
  mounted() {
    const previewer = new Previewer();
    previewer.preview(this.$refs.content, this.$refs.render, []);
  }
};
</script>
```

---

## API Reference

### Previewer

The main entry point for rendering documents.

```javascript
const previewer = new Previewer(options);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `viewMode` | `string` | `'spread'` | View mode: `'single'` or `'spread'` |
| `lazyRender` | `boolean` | `false` | Enable lazy rendering |
| `lazyRenderOptions` | `object` | `{}` | Lazy rendering configuration |
| `useWorkers` | `boolean` | `false` | Enable Web Workers for layout |
| `workerOptions` | `object` | `{}` | Web Workers configuration |

#### Methods

| Method | Description |
|--------|-------------|
| `preview(content, renderTo, stylesheets)` | Render content to target element |
| `exportPDF(options)` | Export rendered document as PDF |
| `scrollToPage(index)` | Scroll to page by index |
| `scrollToPageNumber(pageNumber)` | Scroll to page by number |
| `getLazyRenderInfo()` | Get lazy rendering statistics |
| `getWorkerStats()` | Get Web Workers statistics |
| `getOversetInfo()` | Get overset content information |
| `destroy()` | Clean up resources |

#### Events

```javascript
previewer.on('rendered', (flow) => {
  console.log(`Rendered ${flow.total} pages`);
});

previewer.on('page', (page) => {
  console.log(`Page ${page.index} rendered`);
});

previewer.on('chunkingComplete', (data) => {
  console.log(`Chunked ${data.totalPages} pages`);
});

previewer.on('oversetDetected', (data) => {
  console.log(`Overset on page ${data.pageIndex}`);
});
```

### Chunker

Chunks documents into paged media flows.

```javascript
import { Chunker } from 'paper-view';

const chunker = new Chunker(content, renderTo, options);
```

### Polisher

Processes CSS stylesheets for paged media.

```javascript
import { Polisher } from 'paper-view';

const polisher = new Polisher();
await polisher.add('styles.css');
```

---

## Advanced Features

### Page Numbering

Add configurable page numbers to your documents.

#### Basic Usage

```javascript
const previewer = new Previewer();
const flow = await previewer.preview(content, renderTo, stylesheets);

// Enable page numbering
flow.setPageNumberingEnabled(true);

// Update configuration
flow.updatePageNumbering({
  position: 'bottom-center',
  style: 'decimal',
  template: 'Page {current} of {total}'
});
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable page numbering |
| `position` | `string` | `'bottom-center'` | Position: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `style` | `string` | `'decimal'` | Style: `decimal`, `upper-roman`, `lower-roman`, `upper-alpha`, `lower-alpha` |
| `start` | `number` | `1` | Starting page number |
| `template` | `string` | `'{current}'` | Template with `{current}` and `{total}` |

#### CSS Integration

```css
@page {
  pagedjs-page-numbering: enabled;
  pagedjs-page-numbering-position: top-right;
  pagedjs-page-numbering-style: upper-roman;
}

@page :first {
  pagedjs-page-numbering: disabled;
}
```

### PDF Export

Export documents as PDF in browser or Node.js.

#### Browser Export

```javascript
const previewer = new Previewer();
const flow = await previewer.preview(content, renderTo, stylesheets);

await previewer.exportPDF({
  filename: 'document.pdf',
  metadata: {
    title: 'My Document',
    author: 'John Doe'
  },
  onProgress: ({ stage, progress }) => {
    console.log(`${stage}: ${progress}%`);
  }
});
```

#### Node.js Export

```javascript
const { NodePDFExporter } = require('paper-view/dist/paperview.node-pdf.js');

const pdfBuffer = await NodePDFExporter.fromHTML(html, css, {
  format: 'A4',
  margin: { top: '2cm', bottom: '2cm' }
});

await NodePDFExporter.save(pdfBuffer, 'output.pdf');
```

### Lazy Rendering

Render only visible pages for large documents.

```javascript
const previewer = new Previewer({
  viewMode: 'single',
  lazyRender: true,
  lazyRenderOptions: {
    bufferPages: 3,      // Pages to render around viewport
    unloadPages: 5,      // Pages away before unloading
    enableUnload: true   // Unload pages when out of view
  }
});

const flow = await previewer.preview(content, renderTo, stylesheets);

// Get render statistics
const info = previewer.getLazyRenderInfo();
console.log(info);
// { totalPages: 150, renderedPages: 12, progress: 8, chunkingComplete: true }
```

### Web Workers

Offload layout calculations to background threads.

```javascript
const previewer = new Previewer({
  useWorkers: true,
  workerOptions: {
    workerCount: 2  // Number of workers
  }
});

// Listen for worker events
previewer.on('workersReady', (data) => {
  console.log(`${data.workerCount} workers ready`);
});

previewer.on('workerTaskComplete', (data) => {
  console.log(`Task completed in ${data.duration}ms`);
});
```

### Image Overflow Handling

Images are automatically constrained to fit within page boundaries.

```css
/* Applied automatically */
img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}
```

Images that exceed the page area are scaled down while maintaining aspect ratio. Constrained images receive the `pagedjs_image_constrained` class.

### Overset Content Handling

PaperView automatically detects and handles content that doesn't fit within the allocated pages (overset content). When content overflows a page, new pages are created and the remaining content is re-flowed.

#### Automatic Handling

Overset handling is automatic and runs after the initial render:

```javascript
const previewer = new Previewer();
const flow = await previewer.preview(content, renderTo, stylesheets);

// Overset content is automatically detected and handled
// New pages are added as needed
```

#### Detecting Overset Content

Check if any pages have overset content:

```javascript
// Get overset information
const oversetInfo = previewer.getOversetInfo();
console.log(oversetInfo);
// {
//   hasOverset: false,
//   oversetPageCount: 0,
//   oversetPages: []
// }
```

#### Listening for Overset Events

Subscribe to overset events for debugging or custom handling:

```javascript
previewer.on('oversetDetected', (data) => {
  console.log(`Overset on page ${data.pageIndex}, iteration ${data.iteration}`);
  console.log('Break token:', data.breakToken);
});

previewer.on('oversetMaxIterations', (data) => {
  console.warn(`Overset handling stopped after ${data.iterations} iterations`);
  console.warn('Some content may be truncated');
});
```

#### Manual Overset Handling

For advanced use cases, you can manually handle overset content:

```javascript
const chunker = flow; // Chunker instance

// Find pages with overset content
const oversetPages = chunker.oversetPages();

if (oversetPages.length > 0) {
  console.log(`${oversetPages.length} pages have overset content`);

  // Manually trigger overset handling
  await chunker.handleOverset(chunker.source, {
    maxIterations: 100  // Custom max iterations
  });
}
```

#### Page Overset Property

Each page has an `overset` property that indicates if it has remaining content:

```javascript
flow.pages.forEach((page, index) => {
  if (page.overset) {
    console.log(`Page ${index + 1} has overset content`);
    console.log('Remaining content starts at:', page.endToken);
  }
});
```

---

## Configuration

### CSS @page Rules

```css
@page {
  size: A4;
  margin: 2cm;
}

@page :first {
  margin-top: 4cm;
}

@page :left {
  margin-left: 3cm;
}

@page :right {
  margin-right: 3cm;
}
```

### Named Pages

```css
@page chapter {
  size: A5;
  margin: 1.5cm;
}

.chapter {
  page: chapter;
}
```

### Page Breaks

```css
h1 {
  break-before: page;
}

figure {
  break-inside: avoid;
}

.chapter-end {
  break-after: right;
}
```

### CSS Level 4 Selectors: `:has()` and `:is()`

PaperView supports CSS Level 4 `:has()` and `:is()` selectors for powerful page matching based on content.

#### `:has()` Selector

Style pages that contain specific elements:

```css
/* Style pages that contain h1 elements */
@page:has(h1) {
  margin-top: 3cm;
  background: #f9f9f9;
}

/* Style pages with figures */
@page:has(img.figure) {
  margin: 1.5cm;
}

/* Style pages with tables */
@page:has(table) {
  size: landscape;
}

/* Combine with named pages */
@page chapter:has(h1) {
  @top-center {
    content: "Chapter Start";
  }
}
```

#### `:is()` Selector

Apply styles to pages matching any of multiple conditions:

```css
/* Style both first and blank pages */
@page:is(:first, :blank) {
  margin: 3cm;
}

/* Style first, left, and right pages differently */
@page:is(:first, :left, :right) {
  bleed: 6mm;
  marks: crop cross;
}

/* Combine with named pages */
@page chapter:is(:first, :nth(1)) {
  margin-top: 5cm;
}
```

#### Specificity Order

Selectors are applied based on specificity (highest to lowest):

1. `:has()` - Content-based matching (highest)
2. `:first`, `:blank` - Position-based
3. `:is()` - Multi-selector matching
4. `:nth()` - Position-based
5. Named pages (e.g., `@page chapter`)
6. `:left`, `:right` - Spread position
7. `*` - Default (lowest)

#### Browser Compatibility

The `:has()` selector requires browser support for `:has()` in `matches()`. For older browsers, PaperView automatically falls back to `querySelector()` for matching.

### Running Headers and String-Sets

PaperView supports CSS Paged Media `string-set` for running headers and footers with advanced keyword support.

#### Basic Usage

```css
/* Set a string from h1 elements */
h1 {
  string-set: chapter content();
}

/* Use it in page margins */
@page {
  @top-center {
    content: string(chapter);
  }
}
```

#### String-Set Keywords

PaperView supports all CSS Paged Media string-set keywords:

| Keyword | Description |
|---------|-------------|
| `content()` or `content(first)` | First value on the page (default) |
| `content(last)` | Last value on the page |
| `content(start)` | First value from the first page, or first value from current page |
| `content(first-except)` | First value except on the first page (empty on first page) |

#### Examples

```css
/* Use first heading on each page */
h1 {
  string-set: chapter content(first);
}

/* Use last heading on each page (useful for section endings) */
h2 {
  string-set: section content(last);
}

/* Use title from first page throughout document */
h1.title {
  string-set: doctitle content(start);
}

/* Show chapter title except on first page */
h1.chapter {
  string-set: chapter content(first-except);
}

@page {
  @top-left {
    content: string(doctitle);
  }
  @top-right {
    content: string(chapter);
  }
}
```

#### Multiple String-Sets

You can define multiple string-sets in one declaration:

```css
h1 {
  string-set: chapter content(first), chapter-last content(last);
}

@page {
  @top-left {
    content: string(chapter);
  }
  @top-right {
    content: string(chapter-last);
  }
}
```

#### Fallback Behavior

If no matching element exists on a page, the previous page's value is used (persistent behavior), ensuring running headers remain consistent across pages without headings.

### CSS Hyphens Support

PaperView provides comprehensive support for the CSS `hyphens` property with automatic hyphenation using language-specific dictionaries.

#### Basic Usage

```css
/* Enable automatic hyphenation */
p {
  hyphens: auto;
}

/* Only hyphenate at explicit soft hyphens (&shy; or \u00AD) */
p {
  hyphens: manual;
}

/* Disable hyphenation */
p {
  hyphens: none;
}
```

#### Hyphens Modes

| Value | Description |
|-------|-------------|
| `auto` | Automatic hyphenation using language dictionaries |
| `manual` | Only break at soft hyphens (`&shy;` or `\u00AD`) |
| `none` | No hyphenation |

#### Hyphenation Properties

PaperView supports all CSS hyphenation-related properties:

```css
/* Custom hyphen character */
body {
  hyphenate-character: "\2010";  /* Hyphen bullet: ‐ */
}

/* Minimum characters before/after hyphen and minimum word length */
body {
  hyphenate-limit-chars: 3 2 6;  /* before after total */
}

/* Maximum consecutive hyphenated lines */
body {
  hyphenate-limit-lines: 2;
}

/* Unsqueezed space threshold to trigger hyphenation */
body {
  hyphenate-limit-zone: 20%;
}
```

#### Language Support

Hyphenation uses the `lang` attribute on elements to select the appropriate dictionary:

```html
<article lang="en">
  <p>This text will be hyphenated using English rules.</p>
</article>

<article lang="es">
  <p>Este texto se separará usando reglas en español.</p>
</article>

<article lang="de">
  <p>Dieser Text wird nach deutschen Regeln getrennt.</p>
</article>
```

**Supported languages:** English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt)

#### How It Works

The hyphenation engine uses the **Knuth-Liang algorithm**, which matches word patterns against language-specific dictionaries to identify valid syllable boundaries. The system includes:

1. **Pattern-based hyphenation**: Compact pattern dictionaries for each language
2. **Exception words**: Hundreds of common words with predefined hyphenation points
3. **Browser API fallback**: Uses `Intl.Segmenter` when available for better performance
4. **Result caching**: Hyphenated words are cached to avoid redundant calculations

#### Example

See `examples/hyphens-example.html` for an interactive demo showing different hyphenation modes, languages, and configuration options.

### CSS Footnotes

PaperView implements CSS Paged Media footnotes support, allowing you to create professional-quality documents with footnotes.

#### Basic Usage

```css
/* Mark elements as footnotes */
.footnote {
  float: footnote;
}

/* Style the footnote area */
@page {
  @footnote {
    border-top: 1px solid #333;
    padding-top: 6pt;
    margin-top: 12pt;
    font-size: 9pt;
  }
}

/* Style footnote markers */
::footnote-call {
  color: #0066cc;
  font-size: 0.75em;
}

::footnote-marker {
  font-weight: bold;
}
```

```html
<p>This is some text with a footnote.<span class="footnote">This is the footnote content.</span></p>
```

#### Float: Footnote

The `float: footnote` property removes the element from normal flow and places it in the footnote area at the bottom of the page. A footnote-call (superscript number) is automatically inserted at the original location.

#### Footnote Display

The `footnote-display` property controls how footnotes are rendered:

| Value | Description |
|-------|-------------|
| `block` (default) | Each footnote displayed as a block with marker |
| `inline` | Footnotes displayed inline, one after another |
| `compact` | Compact display minimizing vertical space |

```css
.footnote {
  float: footnote;
  footnote-display: block;
}
```

#### Footnote Policy

The `footnote-policy` property determines behavior when there is insufficient space:

| Value | Description |
|-------|-------------|
| `line` (default) | Footnote may move to next page if area is full |
| `keep` | Reference and footnote kept together on same page |
| `block` | Same as keep, for block-level elements |

```css
.footnote {
  float: footnote;
  footnote-policy: keep;
}
```

#### @footnote Area

The `@footnote` at-rule within `@page` allows styling the footnote area:

```css
@page {
  @footnote {
    border-top: 1px solid #333;
    padding-top: 6pt;
    font-size: 9pt;
    line-height: 1.3;
  }
}
```

#### Pseudo-elements

PaperView supports the following footnote pseudo-elements:

- `::footnote-call`: The reference marker in the main text (superscript number)
- `::footnote-marker`: The number marker in the footnote area

```css
::footnote-call {
  color: #0066cc;
  vertical-align: super;
  font-size: 0.75em;
}

::footnote-marker {
  font-weight: bold;
  color: #333;
}
```

#### How It Works

1. Elements with `float: footnote` are identified during CSS parsing
2. Each footnote is replaced in the text flow with a footnote-call span
3. Original footnote content is collected and placed in the footnote area
4. Footnotes are numbered sequentially using CSS counters
5. The footnote area is styled according to `@footnote` rules

#### Example

See `examples/footnotes-example.html` for an interactive demo showing footnotes with different display modes and policies.

### Spread Viewer (Book View)

PaperView includes an enhanced spread viewer that provides a book-like reading experience with navigation, zoom, and mode switching.

#### Basic Usage

```javascript
const previewer = new PaperView.Previewer({
  viewMode: "single",
  spreadViewer: true,
  spreadViewerOptions: {
    spreadMode: "book",    // "book" or "scroll"
    zoom: 1,               // Initial zoom level
    minZoom: 0.5,          // Minimum zoom
    maxZoom: 3,            // Maximum zoom
    zoomStep: 0.25,        // Zoom increment
    enableKeyboard: true,  // Keyboard navigation
    enableTouch: true      // Touch/swipe support
  }
});

const flow = await previewer.preview(content, renderTo, stylesheets);
```

#### Features

| Feature | Description |
|---------|-------------|
| **Book View** | Side-by-side page spreads with spine effect |
| **Scroll View** | All pages in a scrollable column |
| **Arrow Navigation** | Click arrows or use keyboard to navigate spreads |
| **Zoom** | Mouse wheel (Ctrl+scroll), buttons, or keyboard shortcuts |
| **Touch/Swipe** | Swipe left/right on mobile to change spreads |
| **Page Indicator** | Shows current spread and page numbers |

#### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `PageUp` | Previous spread |
| `→` / `PageDown` | Next spread |
| `Home` | First spread |
| `End` | Last spread |
| `Ctrl` + `+` | Zoom in |
| `Ctrl` + `-` | Zoom out |
| `Ctrl` + `0` | Reset zoom |

#### Programmatic Control

```javascript
// Get the spread viewer instance
const spreadViewer = previewer.getSpreadViewer();

// Navigate
spreadViewer.nextSpread();
spreadViewer.prevSpread();
spreadViewer.goToSpread(5);

// Zoom
spreadViewer.zoomIn();
spreadViewer.zoomOut();
spreadViewer.setZoom(1.5);
spreadViewer.zoomToFit();

// Switch mode
previewer.setSpreadViewerMode("book");  // or "scroll"

// Get state
const state = spreadViewer.getState();
console.log(state);
// { currentSpread: 2, totalSpreads: 10, zoom: 1, mode: "book" }

// Listen for events
spreadViewer.on("spreadChange", (data) => {
  console.log(`Now viewing spread ${data.spread}`);
  console.log(`Pages: ${data.pages}`);
});

spreadViewer.on("zoomChange", (data) => {
  console.log(`Zoom: ${data.zoom * 100}%`);
});
```

---

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Server

Run local dev-server with livereload at [http://localhost:9090/](http://localhost:9090/):

```bash
npm start
```

### Run Tests

```bash
# Unit tests
npm run tests

# Integration tests
npm run specs

# Lint
npm run lint
```

### Project Structure

```
paper-view/
├── src/
│   ├── index.js              # Main entry point
│   ├── paperview.js          # Core PaperView class
│   ├── chunker/              # Content chunking
│   ├── polisher/             # CSS processing
│   ├── modules/              # Feature modules
│   ├── export/               # PDF export
│   └── polyfill/             # Polyfills & Previewer
├── examples/                 # Example projects
├── tests/                    # Unit tests
├── specs/                    # Integration tests
└── dist/                     # Built bundles
```

---

## Examples

Complete examples are available in the `examples/` directory:

| Example | Description |
|---------|-------------|
| `index.html` | Basic browser usage |
| `page-numbering-example.html` | Page numbering with controls |
| `pdf-export-example.html` | PDF export with options |
| `pdf-export-node-example.js` | Node.js PDF generation |
| `lazy-render-example.html` | Lazy rendering for large docs |
| `worker-layout-example.html` | Web Workers for layout |
| `spread-viewer-example.html` | Book view with navigation & zoom |
| `hyphens-example.html` | CSS hyphens with multiple languages |
| `footnotes-example.html` | CSS footnotes with float: footnote |

---

## License

[MIT License](https://github.com/ronaldotn/paper-view/blob/master/LICENSE)
