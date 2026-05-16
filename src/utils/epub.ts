// @ts-expect-error - epubjs has no type declarations
import ePub from "epubjs";

interface SpineItem {
	href: string;
}

interface Book {
	spine: SpineItem[];
}

class Epub {
	book: Book | undefined;

	constructor(bookData: any) {
	}

	open(bookData: any): Promise<string> {
		return ePub(bookData, {replacements: true} ).then((book: Book) => {
			this.book = book;
			return this.sections(this.book.spine);
		});
	}

	async sections(spine: SpineItem[]): Promise<string> {
		let text = "";
		const pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;

		for (const section of spine) {
			const href = section.href;
			const html = await fetch(href)
				.then((response: Response) => {
					return response.text();
				}).then((t: string) => {
					const matches = pattern.exec(t);
					return matches && matches.length && matches[1];
				});
			text += html;
		}
		return text;
	}
}

export default Epub;
