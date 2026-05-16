/* eslint-disable */

interface Window {
  PaperView: typeof import("../index");
  PaperViewConfig?: {
    auto?: boolean;
    before?: () => Promise<void>;
    after?: (done?: any) => Promise<void>;
    content?: string | HTMLElement;
    stylesheets?: any[];
    renderTo?: HTMLElement;
  };
  __previewDone?: any;
  __previewError?: { message: string; stack: string };
  __afterError?: string;
  CSS: {
    escape: (value: string) => string;
  };
}

interface ResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  target: Element;
}

interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

declare var ResizeObserver: {
  new(callback: ResizeObserverCallback): ResizeObserver;
  prototype: ResizeObserver;
};

interface ResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

interface NodeListOf<TNode extends Node> extends NodeList {
  [index: number]: TNode;
}

interface Response {
  status: number;
  responseText: string;
}

interface CSSPageRule extends CSSRule {
  selectorText: string;
  style: CSSStyleDeclaration;
}

// For Layout.worker.js - web worker self
interface DedicatedWorkerGlobalScope {
  onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => any) | null;
  postMessage(message: any, transfer?: Transferable[]): void;
  close(): void;
}

interface Intl {
  Segmenter: new(locale: string, options?: { granularity?: "grapheme" | "word" | "sentence" }) => {
    segment(input: string): Intl.Segment[];
  };
}

declare namespace Intl {
  interface Segment {
    segment: string;
    index: number;
    input: string;
    isWordLike: boolean;
  }
}
