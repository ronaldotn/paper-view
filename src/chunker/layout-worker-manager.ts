import EventEmitter from "event-emitter";

const DEFAULT_WORKER_COUNT = 2;

interface WorkerInfo {
	instance: Worker;
	id: number;
	busy: boolean;
	lastTask: number | null;
}

interface LayoutTask {
	taskId: number;
	serializedSource: unknown;
	bounds: unknown;
	maxChars: number;
	breakTokenIndex: number | null;
	resolve: ((result: unknown) => void) | null;
	reject: ((reason: unknown) => void) | null;
}

interface ActiveTask {
	worker: WorkerInfo;
	task: LayoutTask;
	startTime: number;
}

interface WorkerManagerOptions {
	workerCount?: number;
	workerUrl?: string;
	onTaskComplete?: (taskId: number, result: unknown, duration: number) => void;
	onTaskError?: (taskId: number, error: string) => void;
}

interface WorkerErrorDetails {
	message: string;
	filename: string;
	lineno: number;
	colno: number;
	workerIndex: number;
	errorObject: ErrorEvent;
}

interface WorkerMessage {
	type: string;
	taskId?: number;
	result?: unknown;
	error?: string;
	workerId?: number;
}

class LayoutWorkerManager {
	workerCount: number;
	workerUrl: string;
	workers: WorkerInfo[];
	taskQueue: LayoutTask[];
	activeTasks: Map<number, ActiveTask>;
	taskIdCounter: number;
	initialized: boolean;
	readyWorkers: number;
	_onTaskComplete: ((taskId: number, result: unknown, duration: number) => void) | null;
	_onTaskError: ((taskId: number, error: string) => void) | null;
	_listeners?: Record<string, Array<(data: unknown) => void>>;

	constructor(options: WorkerManagerOptions = {}) {
		this.workerCount = options.workerCount || DEFAULT_WORKER_COUNT;
		this.workerUrl = options.workerUrl || getWorkerUrl();
		this.workers = [];
		this.taskQueue = [];
		this.activeTasks = new Map();
		this.taskIdCounter = 0;
		this.initialized = false;
		this.readyWorkers = 0;

		this._onTaskComplete = options.onTaskComplete || null;
		this._onTaskError = options.onTaskError || null;
	}

	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		if (typeof Worker === "undefined") {
			console.warn("Web Workers not supported, falling back to main thread");
			this.initialized = false;
			return;
		}

		const promises: Promise<void>[] = [];

		for (let i = 0; i < this.workerCount; i++) {
			const promise = new Promise<void>((resolve, reject) => {
				let worker: Worker;
				try {
					worker = new Worker(this.workerUrl, { type: "module" });
				} catch (e) {
					try {
						worker = new Worker(this.workerUrl);
					} catch (e2) {
						console.error("Failed to create worker:", e2);
						reject(e2);
						return;
					}
				}

				const initTimeout = setTimeout(() => {
					const err = new Error(`Worker ${i} failed to initialize within 5 seconds`);
					worker.terminate();
					reject(err);
				}, 5000);

				worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
					const { type, taskId, result, error, workerId } = e.data;

					if (type === "WORKER_READY" || type === "INITIALIZED") {
						clearTimeout(initTimeout);
						this.readyWorkers++;
						if (this.readyWorkers === this.workerCount) {
							this.initialized = true;
							this.emit("ready", { workerCount: this.workerCount });
						}
						resolve();
					} else if (type === "LAYOUT_RESULT") {
						this.handleTaskComplete(taskId!, result);
					} else if (type === "LAYOUT_ERROR") {
						this.handleTaskError(taskId!, error!);
					} else if (type === "PONG") {
						// Health check response
					}
				};

				worker.onerror = (error: ErrorEvent) => {
					clearTimeout(initTimeout);
					const errorDetails: WorkerErrorDetails = {
						message: error.message || error.toString() || "Worker script error occurred",
						filename: error.filename || this.workerUrl || "unknown",
						lineno: error.lineno || 0,
						colno: error.colno || 0,
						workerIndex: i,
						errorObject: error
					};
					console.error("Layout worker error:", errorDetails);
					this.handleWorkerError(i, errorDetails);
					reject(new Error(errorDetails.message));
				};

				this.workers.push({
					instance: worker,
					id: i,
					busy: false,
					lastTask: null
				});
			});

			promises.push(promise);
		}

		try {
			await Promise.all(promises);
		} catch (e) {
			const err = e as Error;
			console.warn("Worker initialization failed, falling back to main thread:", err.message);
			this.initialized = false;
			this.terminate();
		}
	}

	async calculateLayout(serializedSource: unknown, bounds: unknown, maxChars: number, breakTokenIndex: number | null): Promise<unknown> {
		const taskId = ++this.taskIdCounter;

		if (!this.initialized) {
			await this.initialize();
		}

		const task: LayoutTask = {
			taskId,
			serializedSource,
			bounds,
			maxChars,
			breakTokenIndex,
			resolve: null,
			reject: null
		};

		return new Promise((resolve, reject) => {
			task.resolve = resolve;
			task.reject = reject;

			const availableWorker = this.workers.find(w => !w.busy);

			if (availableWorker) {
				this.executeTask(availableWorker, task);
			} else {
				this.taskQueue.push(task);
			}
		});
	}

	executeTask(worker: WorkerInfo, task: LayoutTask): void {
		worker.busy = true;
		worker.lastTask = task.taskId;

		this.activeTasks.set(task.taskId, {
			worker: worker,
			task: task,
			startTime: performance.now()
		});

		worker.instance.postMessage({
			type: "CALCULATE_LAYOUT",
			payload: {
				taskId: task.taskId,
				serializedSource: task.serializedSource,
				bounds: task.bounds,
				maxChars: task.maxChars,
				breakTokenIndex: task.breakTokenIndex
			}
		});
	}

	handleTaskComplete(taskId: number, result: unknown): void {
		const activeTask = this.activeTasks.get(taskId);
		if (!activeTask) {
			return;
		}

		const { worker, task, startTime } = activeTask;

		const duration = performance.now() - startTime;

		worker.busy = false;

		this.activeTasks.delete(taskId);

		if (this._onTaskComplete) {
			this._onTaskComplete(taskId, result, duration);
		}

		this.emit("taskComplete", { taskId, result, duration });

		task.resolve!(result);

		this.processQueue();
	}

	handleTaskError(taskId: number, error: string): void {
		const activeTask = this.activeTasks.get(taskId);
		if (!activeTask) {
			return;
		}

		const { worker, task } = activeTask;

		console.error(`Worker task ${taskId} failed:`, error);

		worker.busy = false;

		this.activeTasks.delete(taskId);

		if (this._onTaskError) {
			this._onTaskError(taskId, error);
		}

		this.emit("taskError", { taskId, error });

		task.reject!(new Error(error));

		this.processQueue();
	}

	handleWorkerError(workerIndex: number, error: WorkerErrorDetails): void {
		const worker = this.workers[workerIndex];
		if (!worker) {
			return;
		}

		worker.busy = false;

		this.emit("workerError", { workerIndex, error });

		for (const [taskId, activeTask] of this.activeTasks) {
			if (activeTask.worker === worker) {
				activeTask.task.reject!(new Error("Worker failed"));
				this.activeTasks.delete(taskId);
			}
		}
	}

	processQueue(): void {
		if (this.taskQueue.length === 0) {
			return;
		}

		const availableWorker = this.workers.find(w => !w.busy);
		if (!availableWorker) {
			return;
		}

		const task = this.taskQueue.shift()!;
		this.executeTask(availableWorker, task);
	}

	async calculateLayoutBatch(tasks: Array<{ serializedSource: unknown; bounds: unknown; maxChars: number; breakTokenIndex: number | null }>): Promise<unknown[]> {
		const promises = tasks.map(task =>
			this.calculateLayout(
				task.serializedSource,
				task.bounds,
				task.maxChars,
				task.breakTokenIndex
			)
		);

		return Promise.all(promises);
	}

	getStats(): { workerCount: number; readyWorkers: number; initialized: boolean; activeTasks: number; queuedTasks: number; busyWorkers: number; idleWorkers: number } {
		return {
			workerCount: this.workerCount,
			readyWorkers: this.readyWorkers,
			initialized: this.initialized,
			activeTasks: this.activeTasks.size,
			queuedTasks: this.taskQueue.length,
			busyWorkers: this.workers.filter(w => w.busy).length,
			idleWorkers: this.workers.filter(w => !w.busy).length
		};
	}

	terminate(): void {
		for (const worker of this.workers) {
			worker.instance.terminate();
		}
		this.workers = [];
		this.taskQueue = [];
		this.activeTasks.clear();
		this.initialized = false;
		this.readyWorkers = 0;
	}

	healthCheck(): void {
		for (const worker of this.workers) {
			worker.instance.postMessage({ type: "PING" });
		}
	}

	on(event: string, callback: (data: unknown) => void): void {
		if (!this._listeners) {
			this._listeners = {};
		}
		if (!this._listeners[event]) {
			this._listeners[event] = [];
		}
		this._listeners[event].push(callback);
	}

	emit(event: string, data: unknown): void {
		if (!this._listeners || !this._listeners[event]) {
			return;
		}
		for (const callback of this._listeners[event]) {
			callback(data);
		}
	}
}

function getWorkerUrl(): string {
	try {
		const importMetaUrl = (0, eval)("import.meta.url") as string;
		if (importMetaUrl) {
			return new URL("layout.worker.js", importMetaUrl).href;
		}
	} catch (e) {
		// ignore
	}
	return "layout.worker.js";
}

interface LayoutWorkerManager extends EventEmitter {}
EventEmitter(LayoutWorkerManager.prototype);

export default LayoutWorkerManager;
