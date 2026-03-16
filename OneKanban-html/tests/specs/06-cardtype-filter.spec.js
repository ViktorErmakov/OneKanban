const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards, sendResponse } = require('../helpers/board-helper');

test.describe('Фильтр по типу карточки', () => {
    test('меню типов открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#cardtype_toggle');
        await expect(page.locator('.cardtype_dropdown')).toHaveClass(/open/);
    });

    test('меню содержит 2 типа: Задача и Ошибка', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#cardtype_toggle');
        const options = page.locator('.cardtype_option');
        await expect(options).toHaveCount(2);
        await expect(options.nth(0)).toHaveText('Задача');
        await expect(options.nth(1)).toHaveText('Ошибка');
    });

    test('выбор типа "Задача" показывает только задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="task"]').click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(16);
    });

    test('выбор типа "Ошибка" показывает только ошибки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="bug"]').click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(2);
    });

    test('крестик сбрасывает фильтр типа', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="bug"]').click();
        await page.waitForTimeout(100);

        const clearBtn = page.locator('#cardtype_clear');
        await clearBtn.click({ force: true });

        await page.waitForTimeout(200);
        await expect(page.locator('#cardtype_label')).toHaveText('Тип');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(18);
    });

    test('карточка-ошибка отображается с красной полоской', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                isBug: true,
            }],
        });

        const bugCard = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(bugCard).toHaveClass(/card-type-bug/);
    });

    test('фильтр "Ошибка" показывает карточки-ошибки', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [
                { idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b', isBug: true },
                { idTask: 'taskb49a3cd9-3026-11f0-952c-107b4419808b', isBug: true },
            ],
        });

        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="bug"]').click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(4);
    });

    test('фильтр типа отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option').first().click();

        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'settingsChanged')).toBeTruthy();
    });

    test('label обновляется при выборе типа', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#cardtype_label')).toHaveText('Тип');

        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="task"]').click();

        await expect(page.locator('#cardtype_label')).toHaveText('Задача');
    });
});
