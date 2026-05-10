const { test, expect } = require('@playwright/test');
const { openBoard, getVisibleCards } = require('../helpers/board-helper');

test.describe('Поиск', () => {
    test('поле поиска пустое по умолчанию', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#search_input')).toHaveValue('');
    });

    test('ввод текста фильтрует карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'Первый эпик');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
        expect(count).toBeGreaterThan(0);
    });

    test('поиск регистронезависимый', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'первый эпик');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('поиск по частичному совпадению', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'третьего эпика');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBe(3);
    });

    test('поиск без результатов скрывает все карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'несуществующая задача zzz');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(0);
    });

    test('очистка поиска показывает все карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'эпик');
        await page.waitForTimeout(200);

        await page.fill('#search_input', '');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('крестик очистки появляется при вводе', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const container = page.locator('.search_container');
        await expect(container).not.toHaveClass(/has-text/);

        await page.fill('#search_input', 'тест');
        await expect(container).toHaveClass(/has-text/);
    });

    test('крестик очистки сбрасывает поиск', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'эпик');
        await page.waitForTimeout(200);

        await page.click('#search_clear');
        await page.waitForTimeout(200);

        await expect(page.locator('#search_input')).toHaveValue('');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('поиск "задача" находит все задачи с этим словом', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'задача');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBe(14);
    });

    test('поиск работает с группировкой по исполнителю', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(500);

        await page.fill('#search_input', 'Четвертый эпик');
        await page.waitForTimeout(300);

        const visibleCards = await getVisibleCards(page);
        const count = await visibleCards.count();
        expect(count).toBeLessThan(20);
    });

    test('поиск через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', { search: 'Четвертый эпик' });
        });
        await page.waitForTimeout(300);

        await expect(page.locator('#search_input')).toHaveValue('Четвертый эпик');
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBe(1);
    });

    test('счётчики обновляются при поиске', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.fill('#search_input', 'Первый эпик');
        await page.waitForTimeout(200);

        const firstCounter = page.locator('.block_header .kanban-block__number').first();
        const val = parseInt(await firstCounter.textContent());
        expect(val).toBeLessThan(5);
    });
});
