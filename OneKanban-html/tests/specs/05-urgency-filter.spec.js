const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards } = require('../helpers/board-helper');

test.describe('Фильтр по срочности', () => {
    test('меню срочности открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await expect(page.locator('.urgency_dropdown')).toHaveClass(/open/);
    });

    test('меню содержит 3 уровня срочности', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        const options = page.locator('.urgency_option');
        await expect(options).toHaveCount(3);
    });

    test('уровни срочности имеют иконки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        const previews = page.locator('.urgency_option_preview');
        const count = await previews.count();
        expect(count).toBe(3);
    });

    test('выбор срочности фильтрует карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.locator('.urgency_option').first().click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
        expect(count).toBeGreaterThan(0);
    });

    test('выбор "Немедленно" показывает только карточку с urgencyId=Немедленно', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');

        const nemOption = page.locator('.urgency_option[data-value="Немедленно"]');
        await nemOption.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(1);
    });

    test('label обновляется при выборе', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#urgency_label')).toHaveText('Срочность');

        await page.click('#urgency_toggle');
        await page.locator('.urgency_option').first().click();

        const label = page.locator('#urgency_label');
        const text = await label.textContent();
        expect(text).not.toBe('Срочность');
    });

    test('крестик сбрасывает фильтр срочности', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.locator('.urgency_option').first().click();
        await page.waitForTimeout(100);

        const clearBtn = page.locator('#urgency_clear');
        await clearBtn.click({ force: true });

        await page.waitForTimeout(200);
        await expect(page.locator('#urgency_label')).toHaveText('Срочность');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('иконки срочности отображаются на карточках', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const urgencyWraps = page.locator('.card__urgency-wrap');
        const count = await urgencyWraps.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('клик по иконке срочности на карточке фильтрует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const urgencyIcon = page.locator('.card__urgency-wrap').first();
        await urgencyIcon.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
    });

    test('кнопка настройки срочности присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        const settingsBtns = page.locator('.urgency_option_settings');
        const count = await settingsBtns.count();
        expect(count).toBe(3);
    });

    test('фильтр срочности отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#urgency_toggle');
        await page.locator('.urgency_option').first().click();

        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'settingsChanged')).toBeTruthy();
    });
});
