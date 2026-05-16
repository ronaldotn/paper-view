class Hook {
	context: any;
	hooks: Array<(...args: any[]) => any>;

	constructor(context?: any){
		this.context = context || this;
		this.hooks = [];
	}

	register(): void {
		for(let i = 0; i < arguments.length; ++i) {
			if (typeof arguments[i]  === "function") {
				this.hooks.push(arguments[i]);
			} else {
				for(let j = 0; j < arguments[i].length; ++j) {
					this.hooks.push(arguments[i][j]);
				}
			}
		}
	}

	trigger(...args: any[]): Promise<any[]> {
		const context = this.context;
		const promises: Promise<any>[] = [];

		this.hooks.forEach(function(task: (...args: any[]) => any) {
			const executing = task.apply(context, args);

			if(executing && typeof executing["then"] === "function") {
				promises.push(executing);
			}
			promises.push(new Promise((resolve: (value?: any) => void, reject: (reason?: any) => void) => {
				resolve(executing);
			}));
		});

		return Promise.all(promises);
	}

	triggerSync(...args: any[]): any[] {
		const context = this.context;
		const results: any[] = [];

		this.hooks.forEach(function(task: (...args: any[]) => any) {
			  const executing = task.apply(context, args);
			  results.push(executing);
		});

		return results;
	}

	list(): Array<(...args: any[]) => any> {
		return this.hooks;
	}

	clear(): Array<(...args: any[]) => any> {
		return this.hooks = [];
	}
}

export default Hook;
