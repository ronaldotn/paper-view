/**
 * Integration spec for single-page-centered-view feature.
 *
 * Verifies:
 * 1. In single mode: no .pagedjs_page has class pagedjs_left_page or pagedjs_right_page
 * 2. In single mode: .pagedjs_pages has class pagedjs_single_page_mode
 * 3. In spread mode (default): pages have left/right classes present
 */

describe('single-page-centered-view', () => {
	describe('single mode', () => {
		let page;

		beforeAll(async () => {
			page = await loadPage('single-page-centered-view/single-page-centered-view-single.html');
		});

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		});

		it('should render pages', async () => {
			let pageCount = await page.$$eval('.pagedjs_page', (pages) => pages.length);
			expect(pageCount).toBeGreaterThan(0);
		});

		it('should have pagedjs_single_page_mode class on .pagedjs_pages', async () => {
			let hasSingleMode = await page.$eval('.pagedjs_pages', (el) => {
				return el.classList.contains('pagedjs_single_page_mode');
			});
			expect(hasSingleMode).toBe(true);
		});

		it('should not have pagedjs_left_page class on any page', async () => {
			let leftPages = await page.$$eval('.pagedjs_page', (pages) => {
				return pages.filter(p => p.classList.contains('pagedjs_left_page')).length;
			});
			expect(leftPages).toBe(0);
		});

		it('should not have pagedjs_right_page class on any page', async () => {
			let rightPages = await page.$$eval('.pagedjs_page', (pages) => {
				return pages.filter(p => p.classList.contains('pagedjs_right_page')).length;
			});
			expect(rightPages).toBe(0);
		});

		it('should not have pagedjs_left_page or pagedjs_right_page on any page', async () => {
			let pagesWithLeftOrRight = await page.$$eval('.pagedjs_page', (pages) => {
				return pages.filter(p =>
					p.classList.contains('pagedjs_left_page') ||
					p.classList.contains('pagedjs_right_page')
				).length;
			});
			expect(pagesWithLeftOrRight).toBe(0);
		});
	});

	describe('spread mode (default)', () => {
		let page;

		beforeAll(async () => {
			page = await loadPage('single-page-centered-view/single-page-centered-view-spread.html');
		});

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		});

		it('should render pages', async () => {
			let pageCount = await page.$$eval('.pagedjs_page', (pages) => pages.length);
			expect(pageCount).toBeGreaterThan(0);
		});

		it('should NOT have pagedjs_single_page_mode class on .pagedjs_pages', async () => {
			let hasSingleMode = await page.$eval('.pagedjs_pages', (el) => {
				return el.classList.contains('pagedjs_single_page_mode');
			});
			expect(hasSingleMode).toBe(false);
		});

		it('page 1 should have pagedjs_right_page class (index 0 = right)', async () => {
			let isRight = await page.$eval("[data-page-number='1']", (el) => {
				return el.classList.contains('pagedjs_right_page');
			});
			expect(isRight).toBe(true);
		});

		it('page 2 should have pagedjs_left_page class (index 1 = left)', async () => {
			let isLeft = await page.$eval("[data-page-number='2']", (el) => {
				return el.classList.contains('pagedjs_left_page');
			});
			expect(isLeft).toBe(true);
		});

		it('should have at least one page with pagedjs_left_page class', async () => {
			let leftPages = await page.$$eval('.pagedjs_page', (pages) => {
				return pages.filter(p => p.classList.contains('pagedjs_left_page')).length;
			});
			expect(leftPages).toBeGreaterThan(0);
		});

		it('should have at least one page with pagedjs_right_page class', async () => {
			let rightPages = await page.$$eval('.pagedjs_page', (pages) => {
				return pages.filter(p => p.classList.contains('pagedjs_right_page')).length;
			});
			expect(rightPages).toBeGreaterThan(0);
		});
	});
});
