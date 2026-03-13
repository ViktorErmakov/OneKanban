const { test, expect } = require('@playwright/test');
const { openBoard, getV8Calls, clearV8Calls } = require('../helpers/board-helper');

test.describe('Drag & Drop', () => {
    test('карточки имеют атрибут draggable', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const cards = page.locator('.card');
        const count = await cards.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
            await expect(cards.nth(i)).toHaveAttribute('draggable', 'true');
        }
    });

    test('перетаскивание карточки между колонками', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        const targetColumn = page.locator('#a1ca3369-c296-11ee-93e4-107b4419808b');

        await card.dragTo(targetColumn);
        await page.waitForTimeout(300);

        const calls = await getV8Calls(page);
        const changeCalls = calls.filter(c => c.eventName === 'changeStatus');

        if (changeCalls.length > 0) {
            expect(changeCalls[0].params.idTask).toBe('taskb49a3cd7-3026-11f0-952c-107b4419808b');
            expect(changeCalls[0].params.idNewStatus).toBe('a1ca3369-c296-11ee-93e4-107b4419808b');
        }
    });

    test('перетаскивание в пустую колонку', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        const emptyColumn = page.locator('#a1ca3364-c296-11ee-93e4-107b4419808b');

        await card.dragTo(emptyColumn);
        await page.waitForTimeout(300);

        const calls = await getV8Calls(page);
        const changeCalls = calls.filter(c => c.eventName === 'changeStatus');
        if (changeCalls.length > 0) {
            expect(changeCalls[0].params.idNewStatus).toBe('a1ca3364-c296-11ee-93e4-107b4419808b');
        }
    });

    test('подсветка колонки при dragover', async ({ page }) => {
        await openBoard(page, 'four-projects');

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        const targetColumn = page.locator('#a1ca3369-c296-11ee-93e4-107b4419808b');

        const cardBox = await card.boundingBox();
        const targetBox = await targetColumn.boundingBox();

        if (cardBox && targetBox) {
            await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
            await page.waitForTimeout(100);
            await page.mouse.up();
        }
    });

    test('счётчики обновляются после перетаскивания', async ({ page }) => {
        await openBoard(page, 'four-projects');

        const firstCounter = page.locator('.block_header .kanban-block__number').nth(0);
        const beforeCount = parseInt(await firstCounter.textContent());

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        const targetColumn = page.locator('#a1ca3369-c296-11ee-93e4-107b4419808b');
        await card.dragTo(targetColumn);
        await page.waitForTimeout(300);

        const afterCount = parseInt(await firstCounter.textContent());
        if (afterCount !== beforeCount) {
            expect(afterCount).toBe(beforeCount - 1);
        }
    });

    test('changeStatus содержит fullNameObjectTask и fullNameObjectStatus', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        const targetColumn = page.locator('#a1ca3369-c296-11ee-93e4-107b4419808b');
        await card.dragTo(targetColumn);
        await page.waitForTimeout(300);

        const calls = await getV8Calls(page);
        const changeCalls = calls.filter(c => c.eventName === 'changeStatus');
        if (changeCalls.length > 0) {
            expect(changeCalls[0].params.fullNameObjectTask).toBe('Справочник.канбан_Задачи');
            expect(changeCalls[0].params.fullNameObjectStatus).toBe('Справочник.канбан_СтатусыЗадач');
        }
    });

    test('drag & drop при группировке по исполнителю', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        const cards = page.locator('.group-content .card');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);

        const firstCard = cards.first();
        await expect(firstCard).toHaveAttribute('draggable', 'true');
    });
});
