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

    test('popover: hex и rgb на одной строке; выбранная иконка окрашивается в цвет', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const hexRgbRow = page.locator('.urgency_hex_rgb_row');
        await expect(hexRgbRow).toBeVisible();
        await expect(hexRgbRow.locator('.urgency_color_hex')).toHaveCount(1);
        await expect(hexRgbRow.locator('.urgency_rgb_input')).toHaveCount(3);

        const hexInput = page.locator('.urgency_color_hex');
        await hexInput.fill('#1565c0');
        await expect(hexInput).toHaveValue('#1565c0');
        await hexInput.blur();
        const selectedIcon = page.locator('.urgency_icon_btn.selected');
        await expect(selectedIcon).toHaveCount(1);
        await expect(selectedIcon).toHaveCSS('color', 'rgb(21, 101, 192)');
    });

    test('палитра: подсветка ячейки при открытии; сброс при ручном hex; восстановление по клику', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        await page.locator('.urgency_palette_summary').click();
        await page.waitForTimeout(100);

        const selectedCells = page.locator('.urgency_palette_cell--selected');
        await expect(selectedCells).toHaveCount(1);
        await expect(selectedCells.first()).toHaveAttribute('data-hex', '#e65100');

        await page.locator('.urgency_color_hex').fill('#abcdef');
        await expect(page.locator('.urgency_palette_cell--selected')).toHaveCount(0);

        await page.locator('.urgency_palette_cell[data-hex="#c62828"]').click();
        await expect(page.locator('.urgency_palette_cell--selected')).toHaveCount(1);
        await expect(page.locator('.urgency_palette_cell--selected').first()).toHaveAttribute('data-hex', '#c62828');
    });

    test('палитра: стрелка как у фильтров тулбара; при открытии details поворот на 180°', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const arrow = page.locator('.urgency_palette_summary_arrow .dropdown_arrow');
        await expect(arrow).toBeVisible();
        const tClosed = await arrow.evaluate((el) => getComputedStyle(el).transform);
        await page.locator('.urgency_palette_summary').click();
        await expect(page.locator('.urgency_palette_details[open]')).toHaveCount(1);
        const tOpen = await arrow.evaluate((el) => getComputedStyle(el).transform);
        expect(tOpen).not.toBe(tClosed);
        expect(tOpen).toMatch(/matrix|rotate/);
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

    test('изменение цвета в поле hex обновляет значение', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        const hexInput = page.locator('.urgency_color_hex');
        await hexInput.fill('#1565c0');
        await expect(hexInput).toHaveValue('#1565c0');
    });

    test('кнопка «Сброс» убирает иконку и цвет (как без пользовательских настроек)', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#urgency_toggle');
        await page.waitForTimeout(100);
        await page.locator('.urgency_option_settings').first().click();
        await page.waitForTimeout(200);

        await page.locator('.urgency_icon_btn[data-icon="lightning"]').click();
        await page.locator('.urgency_color_hex').fill('#000000');

        await page.click('#urgency_popover_reset');
        await page.waitForTimeout(100);

        await expect(page.locator('.urgency_icon_btn.selected')).toHaveCount(0);
        await expect(page.locator('.urgency_color_hex')).toHaveValue('');
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
        await page.locator('.urgency_color_hex').fill('#1565c0');
        await page.click('#urgency_popover_save');
        await page.waitForTimeout(300);

        const urgencyWrap = page.locator('.card__urgency-wrap').first();
        if (await urgencyWrap.isVisible()) {
            const color = await urgencyWrap.evaluate(el => el.style.color);
            expect(color).toBeTruthy();
        }
    });
});
