PagerViewJS
===========

**paper-view** a javascript library to help view content in mode *paper*.

This is a fork of the [paged.js](https://www.pagedmedia.org/paged-js/) library, in which modification was made to support in browser, angular and vue.

## Example 

### Browser
The next code is for head
```html
<script src="../dist/paperview.js"></script>
<script>
    let contentText = document.querySelector("#content");
    let render = document.querySelector("#render");
    let paged = new PaperView.Previewer();
    paged.preview(contentText, render, []);
</script>
```
And for body insert the next:
```html
<div id="content">
    Here insert content!!
</div>
<div id="render" style="width: 1000px"></div>

```
## Installation NPM Module
```sh
$ npm install paper-view
```

## Installation YARN Module
```sh
$ yarn add paper-view
```

### Angular

You also need to add paper.css to your application by using, update your `angular.json` with something like:
```json
"styles": [
  "node_modules/paper-view/dist/css/paper.css"
]
```

Once installed you need to import our main module `app.modules.ts`:

```js
import {Previewer} from 'paper-view';
...

@NgModule({
  ...
  providers: [Previewer, ...],
  ...
})
export class YourAppModule {
}
```
After import in main modules update app component:
```js
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Previewer} from 'paper-view';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'Paper View Test';
    @ViewChild('render', {read: ElementRef}) refRender: ElementRef;
    @ViewChild('content', {read: ElementRef}) refContent: ElementRef;

    ngOnInit() {
        const paged = new Previewer();
        paged.preview(this.refContent.nativeElement , this.refRender.nativeElement, []);
    }

}
```
In `app.component.html` add two div's:

```html
<div>
  <div #content>
    Here Content for render
  </div>
  <div #render></div>
</div>
```

The complete example is in the [Angular](https://github.com/ronaldotn/paper-view/blob/master/example/angular) folder.

## Vue

For vue.js you also need to add paper.css, import your something like:
```js
import '../node_modules/paper-view/dist/css/paper.css'
```

Once add css, you need to import our main module:

```vue
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <div id="content" ref="content">
        Here Content for render
    </div>
    <div id="render" ref="render"></div>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import {Previewer} from 'paper-view'
import '../node_modules/paper-view/dist/css/paper.css'

export default {
  name: 'app',
  components: {
    HelloWorld
  },
  mounted() {
    this.paper();
  },
  methods: {
    paper(){
      const paged = new Previewer();
      let content = this.$refs.content;
      let render = this.$refs.render;
      paged.preview(content, render, []);
    }
  }
}
</script>
```

The complete example is in the [vue](https://github.com/ronaldotn/paper-view/blob/master/example/vue) folder.


## Chunker
Chunks up a document into paged media flows and applies print classes.

Examples:

* Process the [first 50 pages of Moby Dick](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/index.html).
* Upload and [chunk an Epub using Epub.js](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/epub.html).

## Polisher
Converts `@page` css to classes, and applies counters and content.

Examples:

* Test [styles for print](https://s3.amazonaws.com/pagedmedia/pagedjs/examples/polisher.html).


## Setup
Install dependencies
```sh
$ npm install
```

## Development
Run the local dev-server with livereload and autocompile on [http://localhost:9090/](http://localhost:9090/)
```sh
$ npm start
```

## Licence

MIT License (MIT), which you can read [here](https://github.com/ronaldotn/paper-view/blob/master/LICENSE)


## Page Numbering Feature

PaperView now includes a configurable page numbering feature that allows you to display page numbers in various positions and styles.

### Basic Usage

Enable page numbering when creating a Chunker:

```javascript
import { Chunker } from 'paper-view';

const chunker = new Chunker(contentElement, renderToElement, {
  pageNumbering: {
    enabled: true,
    position: 'bottom-center', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
    style: 'decimal', // decimal, upper-roman, lower-roman, upper-alpha, lower-alpha
    start: 1, // Starting page number
    template: 'Page {current} of {total}' // Optional template with {current} and {total} placeholders
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Whether page numbering is enabled |
| `position` | string | `'bottom-center'` | Position of page numbers: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `style` | string | `'decimal'` | Numbering style: `decimal`, `upper-roman`, `lower-roman`, `upper-alpha`, `lower-alpha` |
| `start` | number | `1` | Starting page number |
| `template` | string | `'{current}'` | Content template with `{current}` and `{total}` placeholders |
| `className` | string | `'pagedjs-page-number'` | CSS class for page number elements |
| `css` | object | `{}` | Additional CSS properties for styling |

### Dynamic Configuration

Update page numbering configuration dynamically:

```javascript
// Update configuration
chunker.updatePageNumbering({
  position: 'top-right',
  style: 'upper-roman',
  template: 'Page {current}'
});

// Enable/disable
chunker.setPageNumberingEnabled(true);
chunker.setPageNumberingEnabled(false);

// Get current configuration
const config = chunker.getPageNumberingConfig();
```

### CSS Integration

Configure page numbering using CSS @page rules:

```css
@page {
  pagedjs-page-numbering: enabled;
  pagedjs-page-numbering-position: top-right;
  pagedjs-page-numbering-style: upper-roman;
  pagedjs-page-numbering-start: 5;
  pagedjs-page-numbering-class: custom-page-number;
}

@page :first {
  pagedjs-page-numbering: disabled; /* Disable on first page */
}

@page :left {
  pagedjs-page-numbering-position: top-left; /* Left pages */
}

@page :right {
  pagedjs-page-numbering-position: top-right; /* Right pages */
}
```

### Advanced Usage

Import and use page numbering utilities directly:

```javascript
import { 
  PageNumberingModule,
  PageNumberFormatter,
  validateConfig,
  normalizeConfig,
  parsePageRules,
  extractPageNumberingConfig
} from 'paper-view';

// Create a standalone page numbering module
const pageNumbering = new PageNumberingModule({
  enabled: true,
  position: 'bottom-center',
  style: 'decimal'
});

// Use the formatter
const formatter = new PageNumberFormatter();
console.log(formatter.format(5, 'upper-roman')); // "V"
console.log(formatter.formatWithTemplate(5, 'decimal', 10, 'Page {current} of {total}')); // "Page 5 of 10"

// Parse CSS @page rules
const css = '@page { pagedjs-page-numbering: enabled; pagedjs-page-numbering-position: top-right; }';
const pageRules = parsePageRules(css);
const config = extractPageNumberingConfig(pageRules);
```

### Examples

Complete examples are available in the `examples/` directory:
- `page-numbering-example.html` - Interactive browser example
- `page-numbering-api-example.js` - API usage example

### Browser Compatibility

The page numbering feature works in all modern browsers (Chrome, Firefox, Safari, Edge) and uses standard CSS positioning and JavaScript features.

### Performance

Page numbering rendering is optimized to complete within 100ms per page, with minimal impact on overall rendering performance.