const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls, getVisibleCards } = require('../helpers/board-helper');

test.describe('Группировка', () => {
    test('по умолчанию без группировки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#grouping_label')).toHaveText('Без группировки');
        await expect(page.locator('#kanban-board')).not.toHaveClass(/grouped/);
    });

    test('меню группировки открывается по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await expect(page.locator('.grouping_dropdown')).toHaveClass(/open/);
    });

    test('меню содержит 3 опции', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        const options = page.locator('.grouping_option');
        await expect(options).toHaveCount(3);
        await expect(options.nth(0)).toHaveText('Без группировки');
        await expect(options.nth(1)).toHaveText('По исполнителю');
        await expect(options.nth(2)).toHaveText('По проектам');
    });

    test('группировка по исполнителю создаёт группы', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();

        await page.waitForTimeout(300);
        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);
        const groups = page.locator('.group');
        const count = await groups.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('группы по исполнителю содержат имена', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();

        await page.waitForTimeout(300);
        const groupNames = page.locator('.group-name');
        const count = await groupNames.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('группировка по проектам создаёт группы', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();

        await page.waitForTimeout(300);
        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);
        const groups = page.locator('.group');
        const count = await groups.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('группы по проектам содержат цветные метки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();

        await page.waitForTimeout(300);
        const colorDots = page.locator('.group-project-color');
        const count = await colorDots.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('сворачивание группы скрывает карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        const firstGroupHeader = page.locator('.group-header').first();
        await firstGroupHeader.click();

        const firstGroup = page.locator('.group').first();
        await expect(firstGroup).toHaveClass(/collapsed/);
        const content = firstGroup.locator('.group-content');
        await expect(content).toBeHidden();
    });

    test('разворачивание группы показывает карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        const firstGroupHeader = page.locator('.group-header').first();
        await firstGroupHeader.click();
        await firstGroupHeader.click();

        const firstGroup = page.locator('.group').first();
        await expect(firstGroup).not.toHaveClass(/collapsed/);
    });

    test('снятие группировки восстанавливает обычный вид', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);
        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="none"]').click();
        await page.waitForTimeout(300);
        await expect(page.locator('#kanban-board')).not.toHaveClass(/grouped/);

        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(18);
    });

    test('переключение группировок: исполнитель -> проект', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();
        await page.waitForTimeout(300);

        const groups = page.locator('.group');
        const count = await groups.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('группировка отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();

        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'settingsChanged')).toBeTruthy();
    });

    test('счётчик группы отображает количество карточек', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        const groupCounts = page.locator('.group-count');
        const count = await groupCounts.count();
        expect(count).toBeGreaterThanOrEqual(2);

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += parseInt(await groupCounts.nth(i).textContent());
        }
        expect(total).toBe(18);
    });

    test('визуальная регрессия: группировка по исполнителю', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot('grouping-executor.png', { maxDiffPixelRatio: 0.01 });
    });

    test('визуальная регрессия: группировка по проектам', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot('grouping-project.png', { maxDiffPixelRatio: 0.01 });
    });
});
