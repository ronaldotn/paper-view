import pagedMediaHandlers from "../modules/paged-media/index";
import generatedContentHandlers from "../modules/generated-content/index";
import EventEmitter from "event-emitter";
import pipe from "event-emitter/pipe";

interface HandlerConstructor {
	new(chunker: any, polisher: any, caller: any): any;
}

let registeredHandlers: HandlerConstructor[] = [...pagedMediaHandlers, ...generatedContentHandlers];

class Handlers {
	constructor(chunker: any, polisher: any, caller: any) {
		const handlers: any[] = [];

		registeredHandlers.forEach((Handler: HandlerConstructor) => {
			const handler = new Handler(chunker, polisher, caller);
			handlers.push(handler);
			pipe(handler, this);
		});
	}
}

EventEmitter(Handlers.prototype);

export function registerHandlers(...handlers: HandlerConstructor[]): void {
	for (let i = 0; i < handlers.length; i++) {
		registeredHandlers.push(handlers[i]);
	}
}

export function initializeHandlers(chunker: any, polisher: any, caller: any): Handlers {
	const handlers = new Handlers(chunker, polisher, caller);
	return handlers;
}
