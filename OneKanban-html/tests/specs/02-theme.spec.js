const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls } = require('../helpers/board-helper');

test.describe('Переключение темы', () => {
    test('по умолчанию светлая тема', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#wrapper')).not.toHaveClass(/dark-theme/);
    });

    test('клик переключает на тёмную тему', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#theme_toggle');
        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
        await expect(page.locator('#theme_toggle')).toHaveClass(/active/);
    });

    test('повторный клик возвращает светлую тему', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#theme_toggle');
        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
        await page.click('#theme_toggle');
        await expect(page.locator('#wrapper')).not.toHaveClass(/dark-theme/);
        await expect(page.locator('#theme_toggle')).not.toHaveClass(/active/);
    });

    test('переключение темы отправляет settingsChanged в 1С', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);
        await page.click('#theme_toggle');
        const calls = await getV8Calls(page);
        expect(calls.length).toBe(1);
        expect(calls[0].eventName).toBe('settingsChanged');
    });

    test('тёмная тема через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects', { theme: 'dark' });
        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
    });

    test('визуальная регрессия: светлая тема', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page).toHaveScreenshot('board-light-theme.png', { maxDiffPixelRatio: 0.01 });
    });

    test('визуальная регрессия: тёмная тема', async ({ page }) => {
        await openBoard(page, 'four-projects', { theme: 'dark' });
        await expect(page).toHaveScreenshot('board-dark-theme.png', { maxDiffPixelRatio: 0.01 });
    });
});
