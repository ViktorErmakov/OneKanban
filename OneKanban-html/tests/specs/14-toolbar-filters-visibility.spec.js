const { test, expect } = require('@playwright/test');
const { openBoard, sendResponse } = require('../helpers/board-helper');

test.describe('Скрытие фильтров при одном типе / одном исполнителе', () => {
    test('на four-projects фильтры типа и исполнителя видны', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('.cardtype_dropdown')).not.toHaveClass(/filter_dropdown_hidden/);
        await expect(page.locator('.executor_dropdown')).not.toHaveClass(/filter_dropdown_hidden/);
    });

    test('при одном исполнителе и только задачах — скрыты тип и исполнитель', async ({ page }) => {
        await openBoard(page, 'single-executor-tasks-only');
        await expect(page.locator('.cardtype_dropdown')).toHaveClass(/filter_dropdown_hidden/);
        await expect(page.locator('.executor_dropdown')).toHaveClass(/filter_dropdown_hidden/);
    });

    test('после добавления второго исполнителя появляется фильтр исполнителя', async ({ page }) => {
        await openBoard(page, 'single-executor-tasks-only');
        await expect(page.locator('.executor_dropdown')).toHaveClass(/filter_dropdown_hidden/);

        await sendResponse(page, {
            tasks: [{
                idTask: 'task-single-3',
                status: 'a1ca3366-c296-11ee-93e4-107b4419808b',
                project: 'projectb49a3cc6-3026-11f0-952c-107b4419808b',
                user: 'userb1edc216-ea23-11de-8634-001d600d9ad2',
                user_name: 'user_nameПетрищев_Олег',
                urgencyId: '',
                isBug: false,
                fullnameobjecttask: 'Справочник.канбан_Задачи',
                card__link_href: '#t3',
                card__link_name: 'Задача другого',
                card__photo: '',
                alt: 'Петрищев Олег',
                card__text: 'Другой исполнитель',
            }],
        });

        await expect(page.locator('.executor_dropdown')).not.toHaveClass(/filter_dropdown_hidden/);
        await expect(page.locator('.cardtype_dropdown')).toHaveClass(/filter_dropdown_hidden/);
    });

    test('после isBug у части карточек появляется фильтр типа', async ({ page }) => {
        await openBoard(page, 'single-executor-tasks-only');
        await expect(page.locator('.cardtype_dropdown')).toHaveClass(/filter_dropdown_hidden/);

        await sendResponse(page, {
            tasks: [{
                idTask: 'task-single-1',
                isBug: true,
            }],
        });

        await expect(page.locator('.cardtype_dropdown')).not.toHaveClass(/filter_dropdown_hidden/);
    });
});
