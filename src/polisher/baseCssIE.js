export default `
@page {
  size: letter;
  margin: 0;
}
.pagedjs_sheet {
  box-sizing: border-box;
  width: 8.5in;
  height: 11in;
  overflow: hidden;
  position: relative;
  -ms-grid-columns: calc(8.5in - 0mm - 0mm);
      grid-template-columns: calc(8.5in - 0mm - 0mm);
  -ms-grid-rows: calc(11in - 0mm - 0mm);
      grid-template-rows: calc(11in - 0mm - 0mm);
}
.pagedjs_bleed {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  overflow: hidden;
}
.pagedjs_bleed-top {
  grid-column: 0mm;
  grid-row: 0mm;
  flex-direction: row;
}
.pagedjs_bleed-bottom {
  grid-column: 0mm;
  grid-row: 0mm;
  flex-direction: row;
}
.pagedjs_bleed-left {
  grid-column: 0mm;
  grid-row: 0mm;
  flex-direction: column;
}
.pagedjs_bleed-right {
  grid-column: 0mm;
  grid-row: 0mm;
  flex-direction: column;
}
.pagedjs_marks-crop {
  display: none;
  flex-grow: 0;
  flex-shrink: 0;
}
.pagedjs_bleed-top .pagedjs_marks-crop:nth-child(1),
.pagedjs_bleed-bottom .pagedjs_marks-crop:nth-child(1) {
  width: calc(0mm - 1px);
  border-right: 1px solid black;
}
.pagedjs_bleed-top .pagedjs_marks-crop:nth-child(3),
.pagedjs_bleed-bottom .pagedjs_marks-crop:nth-child(3) {
  width: calc(0mm - 1px);
  border-left: 1px solid black;
}
.pagedjs_bleed-top .pagedjs_marks-crop {
  align-self: flex-start;
  height: calc(0mm - 2mm);
}
.pagedjs_bleed-bottom .pagedjs_marks-crop {
  align-self: flex-end;
  height: calc(0mm - 2mm);
}
.pagedjs_bleed-left .pagedjs_marks-crop:nth-child(1),
.pagedjs_bleed-right .pagedjs_marks-crop:nth-child(1) {
  height: calc(0mm - 1px);
  border-bottom: 1px solid black;
}
.pagedjs_bleed-left .pagedjs_marks-crop:nth-child(3),
.pagedjs_bleed-right .pagedjs_marks-crop:nth-child(3) {
  height: calc(0mm - 1px);
  border-top: 1px solid black;
}
.pagedjs_bleed-left .pagedjs_marks-crop {
  width: calc(0mm - 2mm);
  align-self: flex-start;
}
.pagedjs_bleed-right .pagedjs_marks-crop {
  width: calc(0mm - 2mm);
  align-self: flex-end;
}
.pagedjs_marks-middle {
  display: flex;
  flex-grow: 1;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
.pagedjs_marks-cross {
  display: none;
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIzMi41MzdweCIgaGVpZ2h0PSIzMi41MzdweCIgdmlld0JveD0iMC4xMDQgMC4xMDQgMzIuNTM3IDMyLjUzNyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwLjEwNCAwLjEwNCAzMi41MzcgMzIuNTM3IiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMy4zODkzIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ik0yOS45MzEsMTYuMzczYzAsNy40ODktNi4wNjgsMTMuNTYtMTMuNTU4LDEzLjU2Yy03LjQ4MywwLTEzLjU1Ny02LjA3Mi0xMy41NTctMTMuNTZjMC03LjQ4Niw2LjA3NC0xMy41NTQsMTMuNTU3LTEzLjU1NEMyMy44NjIsMi44MTksMjkuOTMxLDguODg3LDI5LjkzMSwxNi4zNzN6Ii8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMuMzg5MyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMC4xMDQiIHkxPSIxNi4zNzMiIHgyPSIzMi42NDIiIHkyPSIxNi4zNzMiLz48bGluZSBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMy4zODkzIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHgxPSIxNi4zNzMiIHkxPSIwLjEwNCIgeDI9IjE2LjM3MyIgeTI9IjMyLjY0MiIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzLjM4OTMiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iTTI0LjUwOCwxNi4zNzNjMCw0LjQ5Ni0zLjYzOCw4LjEzNS04LjEzNSw4LjEzNWMtNC40OTEsMC04LjEzNS0zLjYzOC04LjEzNS04LjEzNWMwLTQuNDg5LDMuNjQ0LTguMTM1LDguMTM1LTguMTM1QzIwLjg2OSw4LjIzOSwyNC41MDgsMTEuODg0LDI0LjUwOCwxNi4zNzN6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNMjkuOTMxLDE2LjM3M2MwLDcuNDg5LTYuMDY4LDEzLjU2LTEzLjU1OCwxMy41NmMtNy40ODMsMC0xMy41NTctNi4wNzItMTMuNTU3LTEzLjU2YzAtNy40ODYsNi4wNzQtMTMuNTU0LDEzLjU1Ny0xMy41NTRDMjMuODYyLDIuODE5LDI5LjkzMSw4Ljg4NywyOS45MzEsMTYuMzczeiIvPjxsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwLjY3NzgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgeDE9IjAuMTA0IiB5MT0iMTYuMzczIiB4Mj0iMzIuNjQyIiB5Mj0iMTYuMzczIi8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMTYuMzczIiB5MT0iMC4xMDQiIHgyPSIxNi4zNzMiIHkyPSIzMi42NDIiLz48cGF0aCBkPSJNMjQuNTA4LDE2LjM3M2MwLDQuNDk2LTMuNjM4LDguMTM1LTguMTM1LDguMTM1Yy00LjQ5MSwwLTguMTM1LTMuNjM4LTguMTM1LTguMTM1YzAtNC40ODksMy42NDQtOC4xMzUsOC4xMzUtOC4xMzVDMjAuODY5LDguMjM5LDI0LjUwOCwxMS44ODQsMjQuNTA4LDE2LjM3MyIvPjxsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIwLjY3NzgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgeDE9IjguMjM5IiB5MT0iMTYuMzczIiB4Mj0iMjQuNTA4IiB5Mj0iMTYuMzczIi8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMTYuMzczIiB5MT0iOC4yMzkiIHgyPSIxNi4zNzMiIHkyPSIyNC41MDgiLz48L3N2Zz4=);
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: 5mm;
  z-index: 2147483647;
  width: 5mm;
  height: 5mm;
}
.pagedjs_pagebox {
  box-sizing: border-box;
  width: 8.5in;
  height: 11in;
  position: relative;
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: 1in calc(8.5in - 1in - 1in) 1in;
      grid-template-columns: 1in calc(8.5in - 1in - 1in) 1in;
  -ms-grid-rows: 1in calc(11in - 1in - 1in) 1in;
      grid-template-rows: 1in calc(11in - 1in - 1in) 1in;
  -ms-grid-column-align: center;
      justify-self: center;
  grid-column: calc(8.5in - 0mm - 0mm);
  grid-row: calc(11in - 0mm - 0mm);
}
.pagedjs_pagebox * {
  box-sizing: border-box;
}
.pagedjs_margin-top {
  width: calc(8.5in - 1in - 1in);
  height: 1in;
  flex-wrap: nowrap;
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: (1fr)[3];
      grid-template-columns: repeat(3, 1fr);
  -ms-grid-rows: 100%;
      grid-template-rows: 100%;
  position: absolute;
  left: 1in;
}
.pagedjs_margin-top-left-corner-holder {
  width: 1in;
  height: 1in;
  display: flex;
  position: absolute;
}
.pagedjs_margin-top-right-corner-holder {
  width: 1in;
  height: 1in;
  display: flex;
  position: absolute;
  left: calc(8.5in - 1in);
}
.pagedjs_margin-top-left-corner {
  width: 1in;
}
.pagedjs_margin-top-right-corner {
  width: 1in;
}
.pagedjs_margin-right {
  height: calc(11in - 1in - 1in);
  width: 1in;
  right: 0;
  display: -ms-grid;
  display: grid;
  -ms-grid-rows: (33.3333%)[3];
      grid-template-rows: repeat(3, 33.3333%);
  -ms-grid-columns: 100%;
      grid-template-columns: 100%;
  position: absolute;
  top: 1in;
}
.pagedjs_margin-bottom {
  width: calc(8.5in - 1in - 1in);
  height: 1in;
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: (1fr)[3];
      grid-template-columns: repeat(3, 1fr);
  -ms-grid-rows: 100%;
      grid-template-rows: 100%;
  position: relative;
  top: calc(11in - 1in);
  left: 1in;
}
.pagedjs_margin-bottom-left-corner-holder {
  width: 1in;
  height: 1in;
  display: flex;
  position: relative;
  top: calc(11in - 1in);
}
.pagedjs_margin-bottom-right-corner-holder {
  width: 1in;
  height: 1in;
  display: flex;
  position: relative;
  top: calc(11in - 1in);
  left: calc(8.5in - 1in);
}
.pagedjs_margin-bottom-left-corner {
  width: 1in;
}
.pagedjs_margin-bottom-right-corner {
  width: 1in;
}
.pagedjs_margin-left {
  height: calc(11in - 1in - 1in);
  width: 1in;
  display: -ms-grid;
  display: grid;
  -ms-grid-rows: (33.33333%)[3];
      grid-template-rows: repeat(3, 33.33333%);
  -ms-grid-columns: 100%;
      grid-template-columns: 100%;
  position: absolute;
  top: 1in;
}
.pagedjs_pages .pagedjs_pagebox .pagedjs_margin:not(.hasContent) {
  visibility: hidden;
}
.pagedjs_pagebox > .pagedjs_area {
    break-before: page;
    page-break-before: always;
  width: calc(8.5in - 1in - 1in);
  height: calc(11in - 1in - 1in);
  position: absolute;
  left: 1in;
  top: 1in;
  -ms-grid-column-align: center;
      justify-self: center;
}
.pagedjs_pagebox > .pagedjs_area > .pagedjs_page_content {
  width: 100%;
  height: 100%;
  position: relative;
  -webkit-column-fill: auto;
     -moz-column-fill: auto;
          column-fill: auto;
}
.pagedjs_page {
  counter-increment: page;
  width: 8.5in;
  height: 11in;
}
.pagedjs_pages {
  counter-reset: pages 0;
}
.pagedjs_pagebox .pagedjs_margin-top-left-corner,
.pagedjs_pagebox .pagedjs_margin-top-right-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-left-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-right-corner,
.pagedjs_pagebox .pagedjs_margin-top-left,
.pagedjs_pagebox .pagedjs_margin-top-right,
.pagedjs_pagebox .pagedjs_margin-bottom-left,
.pagedjs_pagebox .pagedjs_margin-bottom-right,
.pagedjs_pagebox .pagedjs_margin-top-center,
.pagedjs_pagebox .pagedjs_margin-bottom-center,
.pagedjs_pagebox .pagedjs_margin-top-center,
.pagedjs_pagebox .pagedjs_margin-bottom-center,
.pagedjs_margin-right-middle,
.pagedjs_margin-left-middle {
  display: flex;
  align-items: center;
}
.pagedjs_margin-right-top,
.pagedjs_margin-left-top {
  display: flex;
  align-items: flex-top;
}
.pagedjs_margin-right-bottom,
.pagedjs_margin-left-bottom {
  display: flex;
  align-items: flex-end;
}
/*
.pagedjs_pagebox .pagedjs_margin-top-center,
.pagedjs_pagebox .pagedjs_margin-bottom-center {
\theight: 100%;
\tdisplay: none;
\talign-items: center;
\tflex: 1 0 33%;
\tmargin: 0 auto;
}

.pagedjs_pagebox .pagedjs_margin-top-left-corner,
.pagedjs_pagebox .pagedjs_margin-top-right-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-right-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-left-corner {
\tdisplay: none;
\talign-items: center;
}

.pagedjs_pagebox .pagedjs_margin-left-top,
.pagedjs_pagebox .pagedjs_margin-right-top {
\tdisplay: none;
\talign-items: flex-start;
}

.pagedjs_pagebox .pagedjs_margin-right-middle,
.pagedjs_pagebox .pagedjs_margin-left-middle {
\tdisplay: none;
\talign-items: center;
}

.pagedjs_pagebox .pagedjs_margin-left-bottom,
.pagedjs_pagebox .pagedjs_margin-right-bottom {
\tdisplay: none;
\talign-items: flex-end;
}
*/
.pagedjs_pagebox .pagedjs_margin-top-left,
.pagedjs_pagebox .pagedjs_margin-top-right-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-left,
.pagedjs_pagebox .pagedjs_margin-bottom-right-corner {
  text-align: left;
}
.pagedjs_pagebox .pagedjs_margin-top-left-corner,
.pagedjs_pagebox .pagedjs_margin-top-right,
.pagedjs_pagebox .pagedjs_margin-bottom-left-corner,
.pagedjs_pagebox .pagedjs_margin-bottom-right {
  text-align: right;
}
.pagedjs_pagebox .pagedjs_margin-top-center,
.pagedjs_pagebox .pagedjs_margin-bottom-center,
.pagedjs_pagebox .pagedjs_margin-left-top,
.pagedjs_pagebox .pagedjs_margin-left-middle,
.pagedjs_pagebox .pagedjs_margin-left-bottom,
.pagedjs_pagebox .pagedjs_margin-right-top,
.pagedjs_pagebox .pagedjs_margin-right-middle,
.pagedjs_pagebox .pagedjs_margin-right-bottom {
  text-align: center;
}
.pagedjs_pages .pagedjs_margin .pagedjs_margin-content {
  width: 100%;
}
.pagedjs_pages .pagedjs_margin-left .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-top .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-right .pagedjs_margin-content::after,
.pagedjs_pages .pagedjs_margin-bottom .pagedjs_margin-content::after {
  display: block;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-to] {
  margin-bottom: unset;
  padding-bottom: unset;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-from] {
  text-indent: unset;
  margin-top: unset;
  padding-top: unset;
  initial-letter: unset;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-from] > *::first-letter,
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-from]::first-letter {
  font-size: unset;
  font-weight: unset;
  font-family: unset;
  color: unset;
  line-height: unset;
  float: unset;
  padding: unset;
  margin: unset;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-to]:after,
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-to]::after {
  content: unset;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-from]:before,
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div [data-split-from]::before {
  content: unset;
}
.pagedjs_pages > .pagedjs_page > .pagedjs_sheet > .pagedjs_pagebox > .pagedjs_area > div li[data-split-from]:first-of-type {
  list-style: none;
}
/*
[data-page]:not([data-split-from]),
[data-break-before="page"]:not([data-split-from]),
[data-break-before="always"]:not([data-split-from]),
[data-break-before="left"]:not([data-split-from]),
[data-break-before="right"]:not([data-split-from]),
[data-break-before="recto"]:not([data-split-from]),
[data-break-before="verso"]:not([data-split-from])
{
\tbreak-before: column;
}

[data-page]:not([data-split-to]),
[data-break-after="page"]:not([data-split-to]),
[data-break-after="always"]:not([data-split-to]),
[data-break-after="left"]:not([data-split-to]),
[data-break-after="right"]:not([data-split-to]),
[data-break-after="recto"]:not([data-split-to]),
[data-break-after="verso"]:not([data-split-to])
{
\tbreak-after: column;
}
*/
.pagedjs_clear-after::after {
  content: none !important;
}
img {
  height: auto;
}
@media print {
  html {
    width: 100%;
    height: 100%;
  }
  body {
    margin: 0;
    padding: 0;
    width: 100% !important;
    height: 100% !important;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
  }
  .pagedjs_pages {
    width: 8.5in;
    display: block !important;
    -webkit-transform: none !important;
            transform: none !important;
    height: 100% !important;
    min-height: 100%;
    max-height: 100%;
    overflow: visible;
  }
  .pagedjs_page {
    margin: 0;
    padding: 0;
    max-height: 100%;
    min-height: 100%;
    height: 100% !important;
    page-break-after: always;
    -webkit-column-break-after: page;
       -moz-column-break-after: page;
            break-after: page;
  }
  .pagedjs_sheet {
    margin: 0;
    padding: 0;
    max-height: 100%;
    min-height: 100%;
    height: 100% !important;
  }
}
`;
