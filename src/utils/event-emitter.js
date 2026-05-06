// Simple EventEmitter compatible with browsers
function EventEmitter(instance) {
	if (!(this instanceof EventEmitter)) {
		// Called as a mixin function
		var proto = EventEmitter.prototype;
		for (var key in proto) {
			if (Object.prototype.hasOwnProperty.call(proto, key)) {
				instance[key] = proto[key].bind ? proto[key].bind(instance) : proto[key];
			}
		}
		return instance;
	}
	this._events = {};
}

EventEmitter.prototype.on = function(type, listener) {
	if (!this._events[type]) {
		this._events[type] = [];
	}
	this._events[type].push(listener);
};

EventEmitter.prototype.emit = function(type) {
	var listeners = this._events[type];
	if (!listeners || listeners.length === 0) return;
	var args = Array.prototype.slice.call(arguments, 1);
	for (var i = 0; i < listeners.length; i++) {
		listeners[i].apply(this, args);
	}
};

EventEmitter.prototype.removeAllListeners = function(type) {
	if (type) {
		delete this._events[type];
	} else {
		this._events = {};
	}
};

export default EventEmitter;
