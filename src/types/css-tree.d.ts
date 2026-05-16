declare module "css-tree" {
  export interface CssNode {
    type: string;
    name?: string;
    value?: any;
    children?: List<CssNode>;
    prelude?: CssNode;
    block?: CssNode;
    property?: string;
    loc?: any;
    flags?: string | null;
    matcher?: string;
  }

  export class List<T> {
    head: ListItem<T> | null;
    tail: ListItem<T> | null;
    empty: boolean;
    size: number;
    createItem(data: T): ListItem<T>;
    prepend(item: ListItem<T>): void;
    appendData(data: T): List<T>;
    forEach(fn: (item: T, index: number, list: List<T>) => void, thisArg?: any): void;
    remove(item: ListItem<T>): void;
    [Symbol.iterator](): Iterator<T>;
    get first(): T | null;
  }

  export interface ListItem<T> {
    data: T;
    prev: ListItem<T> | null;
    next: ListItem<T> | null;
  }

  export function parse(text: string, options?: any): CssNode;
  export function walk(ast: CssNode, visitors: Record<string, any>): void;
  export function generate(ast: CssNode): string;
  export function keyword(name: string): { basename: string };
}
