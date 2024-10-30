import puppeteer from 'puppeteer-extra';
import { Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export default async function scrapeBlog(
    config: IBlog,
    existingPage: Page | null = null,
    limit: number | null = null
) {
    puppeteer.use(StealthPlugin());
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.goto(`${config.blogUrl}${config.indexPage}`, {
        waitUntil: "networkidle2",
    });
    let blogLinks = await page.evaluate((config) => {
        return eval(config.articleLinkSelector);
    }, config);
    if (browser) {
        await page.close();
        await browser.close();
    }
    // Cut array
    if (limit) blogLinks = blogLinks.slice(0, limit);
    const existingArticleLinks = await Article.find(
        { dataSourceId: config._id },
        'articleUrl'
    );
    const existingArticleLinksSet = new Set(
        existingArticleLinks.map((a) => a.articleUrl)
    );
    const newLinks = blogLinks.filter(
        (url: string) => !existingArticleLinksSet.has(url)
    );
    for (const url of newLinks) {
        console.log("Adding article to queue", url);
        await articleQueue.add(url, { url, config });
    }
    return blogLinks;
}