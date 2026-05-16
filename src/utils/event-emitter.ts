interface EventEmitterInstance {
	_events: Record<string, Array<(...args: any[]) => void>>;
	on(type: string, listener: (...args: any[]) => void): void;
	emit(type: string, ...args: any[]): void;
	removeAllListeners(type?: string): void;
}

function EventEmitter(this: EventEmitterInstance | void, instance?: any): any {
	if (!(this instanceof EventEmitter)) {
		const proto = EventEmitter.prototype as unknown as EventEmitterInstance;
		for (const key in proto) {
			if (Object.prototype.hasOwnProperty.call(proto, key)) {
				instance[key] = (proto as any)[key].bind ? (proto as any)[key].bind(instance) : (proto as any)[key];
			}
		}
		return instance;
	}
	(this as unknown as EventEmitterInstance)._events = {};
}

EventEmitter.prototype.on = function(this: EventEmitterInstance, type: string, listener: (...args: any[]) => void): void {
	if (!this._events[type]) {
		this._events[type] = [];
	}
	this._events[type].push(listener);
};

EventEmitter.prototype.emit = function(this: EventEmitterInstance, type: string, ...args: any[]): void {
	const listeners = this._events[type];
	if (!listeners || listeners.length === 0) return;
	const callArgs = args.length ? args : Array.prototype.slice.call(arguments, 1);
	for (let i = 0; i < listeners.length; i++) {
		listeners[i].apply(this, callArgs);
	}
};

EventEmitter.prototype.removeAllListeners = function(this: EventEmitterInstance, type?: string): void {
	if (type) {
		delete this._events[type];
	} else {
		this._events = {};
	}
};

export default EventEmitter;
