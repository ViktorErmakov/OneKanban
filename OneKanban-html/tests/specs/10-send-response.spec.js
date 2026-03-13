const { test, expect } = require('@playwright/test');
const { openBoard, getVisibleCards, sendResponse } = require('../helpers/board-helper');

test.describe('sendResponse (динамическое обновление)', () => {
    test('добавление новой задачи через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const before = await getVisibleCards(page);
        await expect(before).toHaveCount(16);

        await sendResponse(page, {
            tasks: [{
                idTask: 'new-task-001',
                status: 'a1ca3366-c296-11ee-93e4-107b4419808b',
                project: 'projectb49a3cc6-3026-11f0-952c-107b4419808b',
                user: 'user074f17ec-ce19-11f0-9551-107b4419808b',
                user_name: 'user_nameЕрмаков_Виктор',
                urgencyId: '',
                isBug: false,
                fullnameobjecttask: 'Справочник.канбан_Задачи',
                card__link_href: '#new-task',
                card__link_name: 'Новая задача',
                card__photo: '',
                alt: 'ЕВ',
                card__text: 'Текст новой задачи',
            }],
        });

        const after = await getVisibleCards(page);
        await expect(after).toHaveCount(17);
        await expect(page.locator('#new-task-001')).toBeVisible();
    });

    test('обновление текста существующей задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                card__text: 'Обновлённый текст',
            }],
        });

        const textSpan = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b .card__text span');
        await expect(textSpan).toHaveText('Обновлённый текст');
    });

    test('обновление ссылки задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                card__link_name: 'Новое имя задачи',
                card__link_href: '#updated-link',
            }],
        });

        const link = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b .card__link');
        await expect(link).toHaveText('Новое имя задачи');
        await expect(link).toHaveAttribute('href', '#updated-link');
    });

    test('перемещение задачи в другой статус через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        const emptyColumn = page.locator('#a1ca3364-c296-11ee-93e4-107b4419808b .card');
        await expect(emptyColumn).toHaveCount(0);

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                status: 'a1ca3364-c296-11ee-93e4-107b4419808b',
            }],
        });

        const movedCard = page.locator('#a1ca3364-c296-11ee-93e4-107b4419808b #taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(movedCard).toBeVisible();
    });

    test('изменение проекта задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                project: 'projectb49a3cc7-3026-11f0-952c-107b4419808b',
            }],
        });

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(card).toHaveClass(/projectb49a3cc7-3026-11f0-952c-107b4419808b/);
    });

    test('изменение исполнителя задачи', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                user: 'usere7e28f5a-8d7e-11de-a1ba-005056c00008',
                user_name: 'user_nameАдминистратор',
            }],
        });

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(card).toHaveClass(/usere7e28f5a-8d7e-11de-a1ba-005056c00008/);
    });

    test('установка срочности через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                urgencyId: 'Немедленно',
            }],
        });

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(card).toHaveClass(/urgency-Немедленно/);
        const urgencyIcon = card.locator('.card__urgency-wrap');
        await expect(urgencyIcon).toBeVisible();
    });

    test('установка типа ошибки через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                isBug: true,
            }],
        });

        const card = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b');
        await expect(card).toHaveClass(/card-type-bug/);
    });

    test('смена темы через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#wrapper')).not.toHaveClass(/dark-theme/);

        await sendResponse(page, { theme: 'dark' });
        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
    });

    test('установка группировки через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, { grouping: 'executor' });
        await page.waitForTimeout(300);

        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);
        const groups = page.locator('.group');
        const count = await groups.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('установка фильтра проектов через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            projectfilter: ['projectb49a3cc6-3026-11f0-952c-107b4419808b'],
        });
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(16);
    });

    test('установка поиска через sendResponse', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, { search: 'Четвертый эпик' });
        await page.waitForTimeout(300);

        await expect(page.locator('#search_input')).toHaveValue('Четвертый эпик');
        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBe(1);
    });

    test('пакетное обновление нескольких задач', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [
                { idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b', card__text: 'Обновлено 1' },
                { idTask: 'taskb49a3cd9-3026-11f0-952c-107b4419808b', card__text: 'Обновлено 2' },
                { idTask: 'taskb49a3cdb-3026-11f0-952c-107b4419808b', card__text: 'Обновлено 3' },
            ],
        });

        await expect(page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b .card__text span')).toHaveText('Обновлено 1');
        await expect(page.locator('#taskb49a3cd9-3026-11f0-952c-107b4419808b .card__text span')).toHaveText('Обновлено 2');
        await expect(page.locator('#taskb49a3cdb-3026-11f0-952c-107b4419808b .card__text span')).toHaveText('Обновлено 3');
    });

    test('sendResponse с JSON-строкой', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            const data = JSON.stringify({
                tasks: [{
                    idTask: 'taskb49a3cd7-3026-11f0-952c-107b4419808b',
                    card__text: 'Из JSON строки',
                }],
            });
            window.V8Proxy.sendResponse('update', data);
        });
        await page.waitForTimeout(200);

        const textSpan = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b .card__text span');
        await expect(textSpan).toHaveText('Из JSON строки');
    });
});
