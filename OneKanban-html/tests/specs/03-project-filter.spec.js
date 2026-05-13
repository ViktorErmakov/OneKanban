const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards } = require('../helpers/board-helper');

test.describe('Фильтр по проектам', () => {
    test('все 4 проекта выбраны по умолчанию', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const pills = page.locator('.project_pill');
        const count = await pills.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('dropdown проектов открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#project_picker_toggle');
        await expect(page.locator('.project_picker')).toHaveClass(/open/);
        const gridItems = page.locator('.project_grid_item:not(.project_grid_item_all)');
        await expect(gridItems).toHaveCount(4);
    });

    test('dropdown закрывается по клику вне его', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#project_picker_toggle');
        await expect(page.locator('.project_picker')).toHaveClass(/open/);
        await page.click('body', { position: { x: 1, y: 1 } });
        await expect(page.locator('.project_picker')).not.toHaveClass(/open/);
    });

    test('dropdown закрывается по Escape', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#project_picker_toggle');
        await expect(page.locator('.project_picker')).toHaveClass(/open/);
        await page.keyboard.press('Escape');
        await expect(page.locator('.project_picker')).not.toHaveClass(/open/);
    });

    test('снятие проекта скрывает его карточки', async ({ page }) => {
        const fixture = await openBoard(page, 'four-projects');

        const cardsBefore = await getVisibleCards(page);
        await expect(cardsBefore).toHaveCount(20);

        await page.click('#project_picker_toggle');
        const firstProject = page.locator('.project_grid_item:not(.project_grid_item_all)').first();
        await firstProject.click();

        await page.waitForTimeout(200);
        const cardsAfter = await getVisibleCards(page);
        const count = await cardsAfter.count();
        expect(count).toBeLessThan(20);
    });

    test('удаление проекта через крестик на pill', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const pillClose = page.locator('.project_pill_close').first();
        await pillClose.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
    });

    test('кнопка "Выбрать все" выбирает все проекты', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', {
                projectfilter: ['projectb49a3cc6-3026-11f0-952c-107b4419808b'],
            });
        });
        await page.waitForTimeout(300);

        const cardsBeforeSelectAll = await getVisibleCards(page);
        const before = await cardsBeforeSelectAll.count();
        expect(before).toBeLessThan(20);

        await page.click('#project_picker_toggle');
        await page.waitForTimeout(300);
        const selectAll = page.locator('.project_grid_item_all');
        await selectAll.click({ force: true });

        await page.waitForTimeout(500);
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('счётчик "+N" отображается при > 3 выбранных проектах', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const more = page.locator('#project_picker_more');
        await expect(more).toHaveText('+1');
    });

    test('лимит видимых проектов в панели (1–5) меняет пилюли и +N', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#project_picker_toggle');
        await page.locator('.project_picker_count_btn[data-count="2"]').click();
        await page.waitForTimeout(150);
        await expect(page.locator('.project_pill')).toHaveCount(2);
        await expect(page.locator('#project_picker_more')).toHaveText('+2');
    });

    test('плейсхолдер отображается когда нет выбранных проектов', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', {
                projectfilter: [],
            });
        });
        await page.waitForTimeout(200);

        const placeholder = page.locator('.project_picker_placeholder');
        await expect(placeholder).toBeVisible();
        await expect(placeholder).toHaveText('Выберите проект');
    });

    test('изменение проекта отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#project_picker_toggle');
        const firstProject = page.locator('.project_grid_item:not(.project_grid_item_all)').first();
        await firstProject.click();

        const calls = await getV8Calls(page);
        const settingsCalls = calls.filter(c => c.eventName === 'settingsChanged');
        expect(settingsCalls.length).toBeGreaterThanOrEqual(1);
    });

    test('клик по метке проекта на карточке фильтрует по проекту', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const tagTask = page.locator('.tag_task').first();
        await tagTask.click();

        await page.waitForTimeout(200);
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
        expect(count).toBeGreaterThan(0);
    });
});
