const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards } = require('../helpers/board-helper');

test.describe('Фильтр по исполнителю', () => {
    test('меню исполнителей открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await expect(page.locator('.executor_dropdown')).toHaveClass(/open/);
    });

    test('меню содержит список исполнителей', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const options = page.locator('.executor_option');
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('выбор исполнителя фильтрует карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstOption = page.locator('.executor_option').first();
        await firstOption.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(16);
        expect(count).toBeGreaterThan(0);
    });

    test('выбранный исполнитель имеет класс selected', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstOption = page.locator('.executor_option').first();
        await firstOption.click();
        await expect(firstOption).toHaveClass(/selected/);
    });

    test('повторный клик снимает выделение', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        const firstOption = page.locator('.executor_option').first();
        await firstOption.click();
        await firstOption.click();
        await expect(firstOption).not.toHaveClass(/selected/);

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(16);
    });

    test('label обновляется при выборе одного исполнителя', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#executor_label')).toHaveText('Исполнитель');

        await page.click('#executor_toggle');
        await page.locator('.executor_option').first().click();

        const label = page.locator('#executor_label');
        const text = await label.textContent();
        expect(text).not.toBe('Исполнитель');
    });

    test('крестик сбрасывает фильтр', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');
        await page.locator('.executor_option').first().click();

        await page.waitForTimeout(100);
        const clearBtn = page.locator('#executor_clear');
        await clearBtn.click({ force: true });

        await page.waitForTimeout(200);
        await expect(page.locator('#executor_label')).toHaveText('Исполнитель');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(16);
    });

    test('фильтр по исполнителю отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#executor_toggle');
        await page.locator('.executor_option').first().click();

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
        expect(count).toBeLessThan(16);
        expect(count).toBeGreaterThan(0);
    });

    test('множественный выбор исполнителей', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#executor_toggle');

        const options = page.locator('.executor_option');
        const count = await options.count();
        if (count >= 2) {
            await options.nth(0).click();
            await options.nth(1).click();

            const label = page.locator('#executor_label');
            await expect(label).toContainText('(2)');

            await page.waitForTimeout(200);
            const cards = await getVisibleCards(page);
            await expect(cards).toHaveCount(16);
        }
    });

    test('has-selected класс появляется при выборе', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('.executor_dropdown')).not.toHaveClass(/has-selected/);

        await page.click('#executor_toggle');
        await page.locator('.executor_option').first().click();

        await expect(page.locator('.executor_dropdown')).toHaveClass(/has-selected/);
    });
});
