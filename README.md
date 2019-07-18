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
