import {defer} from "./utils";

interface QueuedItem {
	task?: (...args: any[]) => any;
	args?: IArguments;
	deferred?: ReturnType<typeof defer> | { resolve: (...args: any[]) => void };
	promise: Promise<any>;
}

class Queue {
	_q: QueuedItem[];
	context: any;
	tick: (callback: FrameRequestCallback) => number;
	running: any;
	paused: boolean;
	defered: any;

	constructor(context: any){
		this._q = [];
		this.context = context;
		this.tick = requestAnimationFrame;
		this.running = false;
		this.paused = false;
	}

	enqueue(): Promise<any> {
		let deferred: any, promise: Promise<any>;
		let queued: QueuedItem;
		const task: any = [].shift.call(arguments);
		const args: IArguments = arguments;

		if(!task) {
			throw new Error("No Task Provided");
		}

		if(typeof task === "function"){
			deferred = new (defer as any)();
			promise = deferred.promise;

			queued = {
				"task" : task,
				"args"     : args,
				"deferred" : deferred,
				"promise" : promise
			};
		} else {
			queued = {
				"promise" : task
			};
		}

		this._q.push(queued);

		if (this.paused == false && !this.running) {
			this.run();
		}

		return queued.promise;
	}

	dequeue(): Promise<any> | undefined {
		let inwait: any, task: any, result: any;

		if(this._q.length && !this.paused) {
			inwait = this._q.shift();
			task = inwait.task;
			if(task){
				result = task.apply(this.context, inwait.args);

				if(result && typeof result["then"] === "function") {
					return result.then(function(this: Queue){
						inwait.deferred.resolve.apply(this.context, arguments);
					}.bind(this), function(this: Queue) {
						inwait.deferred.reject.apply(this.context, arguments);
					}.bind(this));
				} else {
					inwait.deferred.resolve.apply(this.context, result);
					return inwait.promise;
				}
			} else if(inwait.promise) {
				return inwait.promise;
			}
		} else {
			inwait = new (defer as any)();
			inwait.deferred.resolve();
			return inwait.promise;
		}
	}

	dump(): void {
		while(this._q.length) {
			this.dequeue();
		}
	}

	run(): Promise<any> {
		if(!this.running){
			this.running = true;
			this.defered = new (defer as any)();
		}

		this.tick.call(window, () => {
			if(this._q.length) {
				this.dequeue()!
					.then(function(this: Queue){
						this.run();
					}.bind(this));
			} else {
				this.defered.resolve();
				this.running = undefined;
			}
		});

		if(this.paused == true) {
			this.paused = false;
		}

		return this.defered.promise;
	}

	flush(): Promise<any> | undefined {
		if(this.running){
			return this.running;
		}

		if(this._q.length) {
			this.running = this.dequeue()!
				.then(function(this: Queue){
					this.running = undefined;
					return this.flush();
				}.bind(this));

			return this.running;
		}
	}

	clear(): void {
		this._q = [];
	}

	length(): number {
		return this._q.length;
	}

	pause(): void {
		this.paused = true;
	}

	stop(): void {
		this._q = [];
		this.running = false;
		this.paused = true;
	}
}

class Task {
	constructor(task: (...args: any[]) => any, args: any[] | IArguments, context?: any){
		return function(this: any): Promise<any>{
			const toApply: any[] = Array.from(arguments as any) || [];
			return new Promise( (resolve: (value?: any) => void, reject: (reason?: any) => void) => {
				const callback = function(value: any, err?: any){
					if (!value && err) {
						reject(err);
					} else {
						resolve(value);
					}
				};
				toApply.push(callback);
				task.apply(context || this, toApply);
			});
		};
	}
}

export default Queue;
export { Task };
