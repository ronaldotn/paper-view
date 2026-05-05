const chalk = require('chalk');
const { TestEnvironment } = require('jest-environment-node');
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { WS_ENDPOINT_PATH, DIR, DEBUG, ORIGIN, PDF_SETTINGS } = require('./constants');

class PuppeteerEnvironment extends TestEnvironment {
	constructor(config) {
		super(config);
	}

	async setup() {
		await super.setup()
		const wsEndpoint = fs.readFileSync(WS_ENDPOINT_PATH, 'utf8');
		if (!wsEndpoint) {
			throw new Error('wsEndpoint not found');
		}
		this.global.browser = await puppeteer.connect({
			browserWSEndpoint: wsEndpoint,
		})
		
		this.global.loadPage = this.loadPage.bind(this);
		
		this.global.ORIGIN = ORIGIN;
		this.global.DEBUG = DEBUG;
		this.global.PDF_SETTINGS = PDF_SETTINGS;
	}

	async teardown() {
		DEBUG && console.log(chalk.yellow('Teardown Test Environment.'));
		await super.teardown();
	}

	runScript(script) {
		return super.runScript(script);
	}

	handleError(error) {
		console.error(error);
	}

	async loadPage(path) {
		if (!this.global.browser) {
			throw new Error('Browser not initialized');
		}
		let page = await this.global.browser.newPage();
		
		page.on('pageerror', (error) => {
			console.error('Page error:', error.message, error.stack);
		});
		
		page.on('error', (error) => {
			console.error('Page crash:', error);
		});
		
		page.on('requestfailed', (error) => {
			console.error('Request failed:', error);
		});

		page.on('console', (msg) => {
		  for (let i = 0; i < msg.args().length; ++i)
		    console.log(`TestPage - ${i}: ${msg.args()[i]}`);
		});

		await page.exposeFunction('onRendered', (msg, width, height, orientation) => {
			// This will be handled by the page's JavaScript
		});

		await page.evaluateOnNewDocument(() => {
			window.PaperViewConfig = window.PaperViewConfig || {};
			window.PaperViewConfig.after = (previewer) => {
				previewer.on("rendered", (flow) => {
					let msg = "Rendering " + flow.total + " pages took " + flow.performance + " milliseconds.";
					if (window.onRendered) {
						window.onRendered(msg, flow.width, flow.height, flow.orientation);
					}
				});
			};
		});

		await page.goto(ORIGIN + '/specs/' + path, { waitUntil: 'networkidle2' });

		// Wait for PagedPolyfill to render (max 10 seconds)
		try {
			await page.waitForFunction(() => {
				return document.querySelectorAll('.pagedjs_page').length > 0;
			}, { timeout: 10000 });
			console.log('Page rendered:', path);
		} catch(e) {
			// If timeout, take screenshot for debugging
			console.error('Timeout waiting for .pagedjs_page:', e.message);
			await page.screenshot({ path: 'C:/temp/timeout_debug.png' }).catch(() => {});
			// Check what's on the page
			let content = await page.evaluate(() => {
				return {
					hasPaperView: typeof window.PaperView !== 'undefined',
					bodyHTML: document.body.innerHTML.substring(0, 500)
				};
			});
			console.error('Page state:', JSON.stringify(content));
		}

		return page;
	}
}

module.exports = PuppeteerEnvironment;
