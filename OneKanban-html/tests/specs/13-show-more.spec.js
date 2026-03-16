const { test, expect } = require('@playwright/test');
const { openBoard, getVisibleCards, sendResponse } = require('../helpers/board-helper');

test.describe('Ссылка «Ещё N» (ограничение карточек в колонке)', () => {

    test('карточки не сжимаются при переполнении колонки', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const cards = page.locator('#a1ca3366-c296-11ee-93e4-107b4419808b .card:not(.card__inactive)');
        const count = await cards.count();

        for (let i = 0; i < count; i++) {
            const card = cards.nth(i);
            const isVisible = await card.isVisible();
            if (!isVisible) continue;
            const box = await card.boundingBox();
            expect(box.height).toBeGreaterThan(40);
        }
    });

    test('ссылка «Ещё N» появляется при переполнении колонки', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const showMoreLinks = page.locator('.show-more-link');
        const linkCount = await showMoreLinks.count();
        expect(linkCount).toBeGreaterThan(0);

        const visibleLinks = [];
        for (let i = 0; i < linkCount; i++) {
            if (await showMoreLinks.nth(i).isVisible()) {
                visibleLinks.push(showMoreLinks.nth(i));
            }
        }
        expect(visibleLinks.length).toBeGreaterThan(0);
    });

    test('ссылка «Ещё N» содержит корректное число скрытых карточек', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const showMoreLinks = page.locator('.show-more-link:visible');
        const linkCount = await showMoreLinks.count();
        expect(linkCount).toBeGreaterThan(0);

        for (let i = 0; i < linkCount; i++) {
            const text = await showMoreLinks.nth(i).textContent();
            expect(text).toMatch(/^Ещё \d+$/);
            const num = parseInt(text.replace('Ещё ', ''), 10);
            expect(num).toBeGreaterThan(0);
        }
    });

    test('скрытые карточки не видны на экране', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const firstColumnId = 'a1ca3366-c296-11ee-93e4-107b4419808b';
        const link = page.locator(`#${firstColumnId} .show-more-link`);
        const linkVisible = await link.isVisible().catch(() => false);

        if (linkVisible) {
            const allCards = page.locator(`#${firstColumnId} .card:not(.card__inactive)`);
            const total = await allCards.count();
            let hiddenCount = 0;
            for (let i = 0; i < total; i++) {
                const visible = await allCards.nth(i).isVisible();
                if (!visible) hiddenCount++;
            }
            expect(hiddenCount).toBeGreaterThan(0);
        }
    });

    test('клик по «Ещё N» показывает все карточки', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const firstColumnId = 'a1ca3366-c296-11ee-93e4-107b4419808b';
        const block = page.locator(`#${firstColumnId}`);
        const link = block.locator('.show-more-link');
        const linkVisible = await link.isVisible().catch(() => false);

        if (linkVisible) {
            await link.click();
            await page.waitForTimeout(200);

            const allCards = block.locator('.card:not(.card__inactive)');
            const total = await allCards.count();
            for (let i = 0; i < total; i++) {
                await expect(allCards.nth(i)).toBeVisible();
            }

            await expect(link).not.toBeVisible();
        }
    });

    test('ссылка «Ещё N» не появляется, если все карточки помещаются', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const showMoreLinks = page.locator('.show-more-link:visible');
        await expect(showMoreLinks).toHaveCount(0);
    });

    test('счётчик в заголовке отображает полное число карточек (не урезанное)', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const firstColumnId = 'a1ca3366-c296-11ee-93e4-107b4419808b';
        const allCardsInColumn = page.locator(`#${firstColumnId} .card:not(.card__inactive):not(.card__search_hidden)`);
        const actualCardCount = await allCardsInColumn.count();

        const counter = page.locator('.block_header .kanban-block__number').first();
        const counterText = await counter.textContent();
        expect(parseInt(counterText, 10)).toBe(actualCardCount);
    });

    test('ссылка «Ещё N» имеет CSS-стили и не содержит href', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 450 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        const link = page.locator('.show-more-link:visible').first();
        const linkExists = await link.count();
        if (linkExists > 0) {
            const cursor = await link.evaluate(el => getComputedStyle(el).cursor);
            expect(cursor).toBe('pointer');

            const textAlign = await link.evaluate(el => getComputedStyle(el).textAlign);
            expect(textAlign).toBe('center');

            const tagName = await link.evaluate(el => el.tagName.toLowerCase());
            expect(tagName).toBe('span');

            const hasHref = await link.evaluate(el => el.hasAttribute('href'));
            expect(hasHref).toBe(false);
        }
    });

    test('ссылка «Ещё N» пересчитывается при изменении размера окна', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await openBoard(page, 'four-projects');
        await page.waitForTimeout(300);

        let links = page.locator('.show-more-link:visible');
        await expect(links).toHaveCount(0);

        await page.setViewportSize({ width: 1920, height: 350 });
        await page.waitForTimeout(500);

        links = page.locator('.show-more-link:visible');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
    });
});
