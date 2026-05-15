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

---

## License

[MIT License](https://github.com/ronaldotn/paper-view/blob/master/LICENSE)
