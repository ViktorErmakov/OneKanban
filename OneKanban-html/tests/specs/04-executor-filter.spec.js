const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards } = require('../helpers/board-helper');

/** Опции с классом исполнителя из 1С (не пункт «Без исполнителя») */
const executorOptionUser = () => '.executor_option[data-value^="user"]';

test.describe('Фильтр по исполнителю', () => {
    test('меню исполнителей открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await expect(page.locator('.executor_dropdown')).toHaveClass(/open/);
    });

    test('первая опция — «Без исполнителя»', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const none = page.locator('.executor_option[data-value="__no_executor__"]');
        await expect(none).toHaveCount(1);
        await expect(none).toContainText('Без исполнителя');
    });

    test('меню содержит список исполнителей', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const options = page.locator(executorOptionUser());
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('выбор исполнителя фильтрует карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstUserOption = page.locator(executorOptionUser()).first();
        await firstUserOption.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
        expect(count).toBeGreaterThan(0);
    });

    test('выбор «Без исполнителя» показывает только такие задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await page.locator('.executor_option[data-value="__no_executor__"]').click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(2);
    });

    test('метка «Без исполнителя» при одном выборе пункта без исполнителя', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await page.locator('.executor_option[data-value="__no_executor__"]').click();

        await expect(page.locator('#executor_label')).toHaveText('Без исполнителя');
    });

    test('мультивыбор: без исполнителя и исполнитель объединяются', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await page.locator('.executor_option[data-value="__no_executor__"]').click();
        await page.locator(executorOptionUser()).first().click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeGreaterThan(2);
        expect(count).toBeLessThan(20);
    });

    test('выбранный исполнитель имеет класс selected', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstUserOption = page.locator(executorOptionUser()).first();
        await firstUserOption.click();
        await expect(firstUserOption).toHaveClass(/selected/);
    });

    test('повторный клик снимает выделение', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstUserOption = page.locator(executorOptionUser()).first();
        await firstUserOption.click();
        await firstUserOption.click();
        await expect(firstUserOption).not.toHaveClass(/selected/);

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('label обновляется при выборе одного исполнителя', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#executor_label')).toHaveText('Исполнитель');

        await page.click('#executor_toggle');
        await page.locator(executorOptionUser()).first().click();

        const label = page.locator('#executor_label');
        const text = await label.textContent();
        expect(text).not.toBe('Исполнитель');
    });

    test('крестик сбрасывает фильтр', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await page.locator(executorOptionUser()).first().click();

        await page.waitForTimeout(100);
        const clearBtn = page.locator('#executor_clear');
        await clearBtn.click({ force: true });

        await page.waitForTimeout(200);
        await expect(page.locator('#executor_label')).toHaveText('Исполнитель');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('фильтр по исполнителю отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#executor_toggle');
        await page.locator(executorOptionUser()).first().click();

        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'settingsChanged')).toBeTruthy();
    });

    test('клик по фото исполнителя на карточке фильтрует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const photo = page.locator('.card__photo').first();
        await photo.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
        expect(count).toBeGreaterThan(0);
    });

    test('множественный выбор исполнителей', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');

        const options = page.locator(executorOptionUser());
        const count = await options.count();
        if (count >= 2) {
            await options.nth(0).click();
            await options.nth(1).click();

            const label = page.locator('#executor_label');
            await expect(label).toContainText('(2)');

            await page.waitForTimeout(200);
            const cards = await getVisibleCards(page);
            // Две карточки без исполнителя не входят в объединение двух выбранных пользователей
            await expect(cards).toHaveCount(18);
        }
    });

    test('has-selected класс появляется при выборе', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('.executor_dropdown')).not.toHaveClass(/has-selected/);

        await page.click('#executor_toggle');
        await page.locator(executorOptionUser()).first().click();

        await expect(page.locator('.executor_dropdown')).toHaveClass(/has-selected/);
    });
});
