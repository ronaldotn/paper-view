const TIMEOUT = 30000;
const DEBUG = false;

describe("Image Overflow Handling", () => {
    let page;

    beforeAll(async () => {
        page = await loadPage("images/image-overflow/image-overflow.html");
    }, TIMEOUT);

    afterAll(async () => {
        if (!DEBUG && page) {
            await page.close();
        }
    });

    it("should render pages", async () => {
        let pages = await page.$$eval(".pagedjs_page", (r) => r.length);

        if (DEBUG) {
            console.log("pages", pages);
        }

        expect(pages).toBeGreaterThan(0);
    });

    it("should apply max-width: 100% to all images by default", async () => {
        let allImagesHaveMaxWidth = await page.evaluate(() => {
            const images = document.querySelectorAll("img");
            for (const img of images) {
                const style = window.getComputedStyle(img);
                if (style.maxWidth === "none" || style.maxWidth === "") {
                    return false;
                }
            }
            return true;
        });

        expect(allImagesHaveMaxWidth).toBe(true);
    });

    it("should not overflow images beyond page width", async () => {
        let imagesFitInPage = await page.evaluate(() => {
            const images = document.querySelectorAll(".pagedjs_page_content img");
            if (images.length === 0) return true;

            const pageContent = document.querySelector(".pagedjs_page_content");
            if (!pageContent) return false;

            const contentWidth = pageContent.getBoundingClientRect().width;

            for (const img of images) {
                const rect = img.getBoundingClientRect();
                if (rect.width > contentWidth + 1) {
                    return false;
                }
            }
            return true;
        });

        expect(imagesFitInPage).toBe(true);
    });

    it("should apply object-fit: contain to images in page content", async () => {
        let objectFitApplied = await page.evaluate(() => {
            const images = document.querySelectorAll(".pagedjs_page_content img");
            if (images.length === 0) return false;

            for (const img of images) {
                const style = window.getComputedStyle(img);
                if (style.objectFit !== "contain") {
                    return false;
                }
            }
            return true;
        });

        expect(objectFitApplied).toBe(true);
    });

    if (!DEBUG) {
        it("should create a pdf", async () => {
            let pdf = await page.pdf({
                format: "A4",
                printBackground: true
            });

            expect(pdf).toMatchPDFSnapshot(1);
        });
    }
});
