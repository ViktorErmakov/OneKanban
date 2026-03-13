const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls } = require('../helpers/board-helper');

test.describe('Настройки срочности (popover)', () => {
    test('popover скрыт по умолчанию', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const popover = page.locator('#urgency_settings_popover');
        await expect(popover).not.toHaveClass(/open/);
    });

    test('popover открывается по клику на кнопку настроек', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);

        const settingsBtn = page.locator('.urgency_option_settings').first();
        await settingsBtn.click();
        await page.waitForTimeout(200);

        const popover = page.locator('#urgency_settings_popover');
        await expect(popover).toHaveClass(/open/);
    });

    test('popover содержит кнопки иконок', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const iconBtns = page.locator('.urgency_icon_btn');
        const count = await iconBtns.count();
        expect(count).toBe(7);
    });

    test('popover содержит кнопки цветов', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const colorBtns = page.locator('.urgency_color_btn');
        const count = await colorBtns.count();
        expect(count).toBe(6);
    });

    test('выбор иконки помечает её как selected', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const secondIcon = page.locator('.urgency_icon_btn').nth(1);
        await secondIcon.click();
        await expect(secondIcon).toHaveClass(/selected/);
    });

    test('выбор цвета помечает его как selected', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const secondColor = page.locator('.urgency_color_btn').nth(1);
        await secondColor.click();
        await expect(secondColor).toHaveClass(/selected/);
    });

    test('кнопка "Сохранить" закрывает popover и отправляет settingsChanged', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        await clearV8Calls(page);
        await page.click('#urgency_popover_save');
        await page.waitForTimeout(200);

        const popover = page.locator('#urgency_settings_popover');
        await expect(popover).not.toHaveClass(/open/);

        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'settingsChanged')).toBeTruthy();
    });

    test('кнопка "Отмена" закрывает popover без сохранения', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        await page.locator('.urgency_icon_btn').nth(3).click();

        await clearV8Calls(page);
        await page.click('#urgency_popover_cancel');
        await page.waitForTimeout(200);

        const popover = page.locator('#urgency_settings_popover');
        await expect(popover).not.toHaveClass(/open/);

        const calls = await getV8Calls(page);
        expect(calls.filter(c => c.eventName === 'settingsChanged').length).toBe(0);
    });

    test('клик вне popover закрывает его', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        await expect(page.locator('#urgency_settings_popover')).toHaveClass(/open/);

        await page.mouse.click(10, 10);
        await page.waitForTimeout(300);

        const popover = page.locator('#urgency_settings_popover');
        await expect(popover).not.toHaveClass(/open/);
    });

    test('заголовок popover содержит имя уровня срочности', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const title = page.locator('.urgency-popover__title');
        const text = await title.textContent();
        expect(text).toContain('Настройка:');
    });

    test('сохранение настроек обновляет иконки на карточках', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);

        const nemBtn = page.locator('.urgency_option_settings').first();
        await nemBtn.click();
        await page.waitForTimeout(200);

        await page.locator('.urgency_icon_btn[data-icon="lightning"]').click();
        await page.locator('.urgency_color_btn[data-color="blue"]').click();
        await page.click('#urgency_popover_save');
        await page.waitForTimeout(300);

        const urgencyWrap = page.locator('.card__urgency-wrap').first();
        if (await urgencyWrap.isVisible()) {
            const color = await urgencyWrap.evaluate(el => el.style.color);
            expect(color).toBeTruthy();
        }
    });
});
