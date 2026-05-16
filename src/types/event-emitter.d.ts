declare module "event-emitter" {
  interface EventEmitter {
    on(type: string, listener: (...args: any[]) => void): void;
    emit(type: string, ...args: any[]): void;
    removeAllListeners(type?: string): void;
  }

  interface EventEmitterStatic {
    (obj: any): EventEmitter;
    prototype: EventEmitter;
    new(): EventEmitter;
  }

  const ee: EventEmitterStatic;
  export default ee;
}

declare module "event-emitter/pipe" {
  function pipe(source: any, target: any): void;
  export default pipe;
}
