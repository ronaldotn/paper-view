/**
 * @jest-environment jsdom
 */
import LayoutWorkerManager from "../../src/chunker/layout-worker-manager.js";

describe("LayoutWorkerManager", () => {
	let manager;

	beforeEach(() => {
		global.Worker = jest.fn(function(url, options) {
			this.postMessage = jest.fn();
			this.terminate = jest.fn();
			this.onmessage = null;
			this.onerror = null;

			const workerInstance = this;
			setTimeout(() => {
				if (workerInstance.onmessage) {
					workerInstance.onmessage({
						data: { type: "WORKER_READY" }
					});
				}
			}, 10);

			return this;
		});

		manager = new LayoutWorkerManager({ workerCount: 2 });
	});

	afterEach(() => {
		if (manager) {
			manager.terminate();
		}
		jest.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should create a LayoutWorkerManager instance", () => {
			expect(manager).toBeInstanceOf(LayoutWorkerManager);
		});

		it("should use default worker count", () => {
			const m = new LayoutWorkerManager();
			expect(m.workerCount).toBe(2);
		});

		it("should accept custom worker count", () => {
			const m = new LayoutWorkerManager({ workerCount: 4 });
			expect(m.workerCount).toBe(4);
		});
	});

	describe("initialize", () => {
		it("should create workers", async () => {
			await manager.initialize();
			expect(manager.workers.length).toBe(2);
		});

		it("should set initialized flag", async () => {
			await manager.initialize();
			expect(manager.initialized).toBe(true);
		});

		it("should not reinitialize if already initialized", async () => {
			await manager.initialize();
			const workerCount = manager.workers.length;
			await manager.initialize();
			expect(manager.workers.length).toBe(workerCount);
		});

		it("should emit ready event when all workers are ready", async () => {
			const callback = jest.fn();
			manager.on("ready", callback);
			await manager.initialize();
			expect(callback).toHaveBeenCalledWith({ workerCount: 2 });
		});
	});

	describe("getStats", () => {
		it("should return stats object", async () => {
			await manager.initialize();
			const stats = manager.getStats();

			expect(stats).toBeDefined();
			expect(stats.workerCount).toBe(2);
			expect(stats.readyWorkers).toBe(2);
			expect(stats.initialized).toBe(true);
		});

		it("should show zero active tasks initially", async () => {
			await manager.initialize();
			const stats = manager.getStats();
			expect(stats.activeTasks).toBe(0);
			expect(stats.queuedTasks).toBe(0);
		});
	});

	describe("terminate", () => {
		it("should terminate all workers", async () => {
			await manager.initialize();
			manager.terminate();

			for (const worker of manager.workers) {
				expect(worker.instance.terminate).toHaveBeenCalled();
			}
		});

		it("should clear workers array", async () => {
			await manager.initialize();
			manager.terminate();
			expect(manager.workers.length).toBe(0);
		});

		it("should reset initialized flag", async () => {
			await manager.initialize();
			manager.terminate();
			expect(manager.initialized).toBe(false);
		});

		it("should clear task queue", async () => {
			await manager.initialize();
			manager.terminate();
			expect(manager.taskQueue.length).toBe(0);
		});
	});

	describe("events", () => {
		it("should emit and listen to events", () => {
			const callback = jest.fn();
			manager.on("testEvent", callback);
			manager.emit("testEvent", { data: "test" });
			expect(callback).toHaveBeenCalledWith({ data: "test" });
		});

		it("should support multiple listeners", () => {
			const callback1 = jest.fn();
			const callback2 = jest.fn();

			manager.on("testEvent", callback1);
			manager.on("testEvent", callback2);
			manager.emit("testEvent", {});

			expect(callback1).toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});
	});

	describe("healthCheck", () => {
		it("should send ping to all workers", async () => {
			await manager.initialize();
			manager.healthCheck();

			for (const worker of manager.workers) {
				expect(worker.instance.postMessage).toHaveBeenCalledWith(
					expect.objectContaining({ type: "PING" })
				);
			}
		});
	});
});
