import { Chunker } from '../../src/index';

describe('Chunker', () => {

	it('should create a page area', async () => {
		let chunker = new Chunker();
		chunker.setup();
		expect(chunker.pagesArea.classList).toContain('pagedjs_pages');
	});

});

describe('Chunker Page Insertion API', () => {
	let chunker: any;

	beforeEach(() => {
		chunker = new Chunker();
		chunker.setup();
	});

	afterEach(() => {
		if (chunker.pagesArea) {
			chunker.pagesArea.remove();
		}
	});

	describe('insertPage()', () => {
		it('should insert a blank page at index 0', () => {
			chunker.addPage(false);
			chunker.addPage(false);

			const page = chunker.insertPage(0, { blank: true });

			expect(page).toBeDefined();
			expect(chunker.pages.length).toBe(3);
			expect(page.element.dataset.pageNumber).toBe('1');
		});

		it('should insert a page at a specific index', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			const page = chunker.insertPage(1, { blank: true });

			expect(chunker.pages.length).toBe(4);
			expect(page.element.dataset.pageNumber).toBe('2');
		});

		it('should insert a page at the end when index equals length', () => {
			chunker.addPage(false);
			chunker.addPage(false);

			const page = chunker.insertPage(2, { blank: true });

			expect(chunker.pages.length).toBe(3);
			expect(page.element.dataset.pageNumber).toBe('3');
		});

		it('should clamp negative index to 0', () => {
			chunker.addPage(false);

			const page = chunker.insertPage(-5, { blank: true });

			expect(page.element.dataset.pageNumber).toBe('1');
			expect(chunker.pages.length).toBe(2);
		});

		it('should clamp index greater than length to length', () => {
			chunker.addPage(false);

			const page = chunker.insertPage(100, { blank: true });

			expect(page.element.dataset.pageNumber).toBe('2');
			expect(chunker.pages.length).toBe(2);
		});

		it('should reindex pages after insertion', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			chunker.insertPage(1, { blank: true });

			expect(chunker.pages[0].element.dataset.pageNumber).toBe('1');
			expect(chunker.pages[1].element.dataset.pageNumber).toBe('2');
			expect(chunker.pages[2].element.dataset.pageNumber).toBe('3');
			expect(chunker.pages[3].element.dataset.pageNumber).toBe('4');
		});

		it('should add named page class', () => {
			const page = chunker.insertPage(0, { blank: true, name: 'cover' });

			expect(page.element.classList).toContain('pagedjs_cover_page');
		});

		it('should add custom CSS class', () => {
			const page = chunker.insertPage(0, { blank: true, className: 'my-custom-class' });

			expect(page.element.classList).toContain('my-custom-class');
		});

		it('should set page counter override', () => {
			const page = chunker.insertPage(0, { blank: true, pageNumberOverride: 5 });

			expect(page.element.style.counterReset).toContain('page 5');
		});

		it('should set breakBefore style when specified', () => {
			const page = chunker.insertPage(0, { blank: true, breakBefore: true });

			expect(page.element.style.breakBefore).toBe('page');
		});

		it('should inject string content into page', () => {
			const page = chunker.insertPage(0, { content: '<h1>Cover Page</h1>' });

			const wrapper = page.element.querySelector('.pagedjs_page_content > div');
			expect(wrapper).not.toBeNull();
			expect(wrapper.innerHTML).toContain('<h1>Cover Page</h1>');
		});

		it('should inject HTMLElement content into page', () => {
			const el = document.createElement('div');
			el.textContent = 'Dynamic TOC';
			el.className = 'toc-container';

			const page = chunker.insertPage(0, { content: el });

			const wrapper = page.element.querySelector('.pagedjs_page_content > div');
			expect(wrapper).not.toBeNull();
			expect(wrapper.querySelector('.toc-container')).not.toBeNull();
		});

		it('should emit pageInserted event', () => {
			let emittedPage: any = null;
			let emittedIndex: number | null = null;

			chunker.on('pageInserted', (page: any, index: number) => {
				emittedPage = page;
				emittedIndex = index;
			});

			const page = chunker.insertPage(0, { blank: true });

			expect(emittedPage).toBe(page);
			expect(emittedIndex).toBe(0);
		});

		it('should update total count', () => {
			chunker.addPage(false);
			expect(chunker.total).toBe(1);

			chunker.insertPage(0, { blank: true });
			expect(chunker.total).toBe(2);
		});
	});

	describe('insertPages()', () => {
		it('should insert multiple pages at once', () => {
			const pages = chunker.insertPages(0, [
				{ blank: true, name: 'cover' },
				{ blank: true, name: 'toc' },
				{ blank: true, name: 'title' }
			]);

			expect(pages.length).toBe(3);
			expect(chunker.pages.length).toBe(3);
			expect(pages[0].element.classList).toContain('pagedjs_cover_page');
			expect(pages[1].element.classList).toContain('pagedjs_toc_page');
		});

		it('should insert pages at a specific index', () => {
			chunker.addPage(false);
			chunker.addPage(false);

			const pages = chunker.insertPages(1, [
				{ blank: true, name: 'inserted-1' },
				{ blank: true, name: 'inserted-2' }
			]);

			expect(chunker.pages.length).toBe(4);
			expect(pages[0].element.classList).toContain('pagedjs_inserted-1_page');
			expect(pages[1].element.classList).toContain('pagedjs_inserted-2_page');
		});
	});

	describe('prependPage()', () => {
		it('should add a page at the beginning', () => {
			chunker.addPage(false);
			chunker.addPage(false);

			const page = chunker.prependPage({ blank: true, name: 'cover' });

			expect(chunker.pages[0]).toBe(page);
			expect(page.element.dataset.pageNumber).toBe('1');
			expect(chunker.pages.length).toBe(3);
		});
	});

	describe('appendPage()', () => {
		it('should add a page at the end', () => {
			chunker.addPage(false);
			chunker.addPage(false);

			const page = chunker.appendPage({ blank: true, name: 'appendix' });

			expect(chunker.pages[chunker.pages.length - 1]).toBe(page);
			expect(page.element.dataset.pageNumber).toBe('3');
			expect(chunker.pages.length).toBe(3);
		});
	});

	describe('removePage()', () => {
		it('should remove a page at a specific index', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			const result = chunker.removePage(1);

			expect(result).toBe(true);
			expect(chunker.pages.length).toBe(2);
		});

		it('should reindex pages after removal', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			chunker.removePage(0);

			expect(chunker.pages[0].element.dataset.pageNumber).toBe('1');
			expect(chunker.pages[1].element.dataset.pageNumber).toBe('2');
		});

		it('should return false for invalid index', () => {
			chunker.addPage(false);

			expect(chunker.removePage(-1)).toBe(false);
			expect(chunker.removePage(10)).toBe(false);
		});

		it('should emit pageRemoved event', () => {
			let emittedIndex: number | null = null;

			chunker.on('pageRemoved', (index: number) => {
				emittedIndex = index;
			});

			chunker.addPage(false);
			chunker.addPage(false);
			chunker.removePage(0);

			expect(emittedIndex).toBe(0);
		});

		it('should update total count', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			chunker.removePage(1);

			expect(chunker.total).toBe(2);
		});
	});

	describe('replacePage()', () => {
		it('should replace a page at a specific index', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			const oldPage = chunker.pages[1];
			const newPage = chunker.replacePage(1, { blank: true, name: 'replaced' });

			expect(chunker.pages.length).toBe(3);
			expect(chunker.pages[1]).toBe(newPage);
			expect(chunker.pages[1]).not.toBe(oldPage);
			expect(newPage.element.classList).toContain('pagedjs_replaced_page');
		});
	});

	describe('left/right page classes', () => {
		it('should maintain left/right page classes after insertion', () => {
			chunker.addPage(false);
			chunker.addPage(false);
			chunker.addPage(false);

			chunker.insertPage(0, { blank: true });

			expect(chunker.pages[0].element.classList).toContain('pagedjs_right_page');
			expect(chunker.pages[1].element.classList).toContain('pagedjs_left_page');
			expect(chunker.pages[2].element.classList).toContain('pagedjs_right_page');
			expect(chunker.pages[3].element.classList).toContain('pagedjs_left_page');
		});
	});
});
