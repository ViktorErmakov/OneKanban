const { test, expect } = require('@playwright/test');
const { openBoard } = require('../helpers/board-helper');

test.describe('Фото исполнителя', () => {
    test('при showexecutorphoto=false нет img.card__photo на карточках', async ({ page }) => {
        await openBoard(page, 'four-projects', { showexecutorphoto: false });
        await expect(page.locator('.card__photo')).toHaveCount(0);
    });

    test('группировка по исполнителю без фото — нет .group-photo в заголовках', async ({ page }) => {
        await openBoard(page, 'four-projects', { showexecutorphoto: false, grouping: 'executor' });
        await expect(page.locator('.group-photo')).toHaveCount(0);
    });
});
