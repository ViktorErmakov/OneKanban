const { test, expect } = require('@playwright/test');
const { openBoard, getVisibleCards, clearV8Calls, getV8Calls, sendResponse } = require('../helpers/board-helper');

const executorOptionUser = '.executor_option[data-value^="user"]';

test.describe('Комбинированные сценарии', () => {
    test('фильтр по проекту + поиск', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', {
                projectfilter: ['projectb49a3cc6-3026-11f0-952c-107b4419808b'],
            });
        });
        await page.waitForTimeout(200);

        await page.fill('#search_input', 'Первый эпик');
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBe(1);
    });

    test('фильтр по исполнителю + фильтр по срочности', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#executor_toggle');
        await page.locator(executorOptionUser).first().click();
        await page.waitForTimeout(200);

        await page.click('#urgency_toggle');
        await page.locator('.urgency_option').first().click();
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(16);
    });

    test('группировка + фильтр по проекту', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();
        await page.waitForTimeout(300);

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', {
                projectfilter: ['projectb49a3cc6-3026-11f0-952c-107b4419808b'],
            });
        });
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
    });

    test('группировка + поиск', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(500);

        await page.fill('#search_input', 'Четвертый эпик');
        await page.waitForTimeout(300);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThan(20);
    });

    test('тёмная тема + группировка по исполнителю', async ({ page }) => {
        await openBoard(page, 'four-projects', { theme: 'dark' });
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);
    });

    test('тёмная тема + группировка по проектам', async ({ page }) => {
        await openBoard(page, 'four-projects', { theme: 'dark' });
        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();
        await page.waitForTimeout(300);

        await expect(page.locator('#wrapper')).toHaveClass(/dark-theme/);
        await expect(page.locator('#kanban-board')).toHaveClass(/grouped/);
        await expect(page).toHaveScreenshot('dark-theme-grouping-project.png', { maxDiffPixelRatio: 0.03 });
    });

    test('все фильтры одновременно', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [
                { idTask: 'taskb49a3cd9-3026-11f0-952c-107b4419808b', isBug: true },
            ],
        });

        await page.evaluate(() => {
            window.V8Proxy.sendResponse('update', {
                projectfilter: [
                    'projectb49a3cc6-3026-11f0-952c-107b4419808b',
                    'projectb49a3cc7-3026-11f0-952c-107b4419808b',
                ],
            });
        });
        await page.waitForTimeout(100);

        await page.click('#executor_toggle');
        await page.locator(executorOptionUser).first().click();
        await page.waitForTimeout(100);

        await page.click('#urgency_toggle');
        const nemOption = page.locator('.urgency_option[data-value="Немедленно"]');
        await nemOption.click();
        await page.waitForTimeout(100);

        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="bug"]').click();
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        const count = await cards.count();
        expect(count).toBeLessThanOrEqual(1);
    });

    test('кнопка обновления отправляет refresh', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await clearV8Calls(page);

        await page.click('#update_svg');
        const calls = await getV8Calls(page);
        expect(calls.some(c => c.eventName === 'refresh')).toBeTruthy();
    });

    test('добавление задачи + фильтр видит новую задачу', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await sendResponse(page, {
            tasks: [{
                idTask: 'new-bug-001',
                status: 'a1ca3366-c296-11ee-93e4-107b4419808b',
                project: 'projectb49a3cc6-3026-11f0-952c-107b4419808b',
                user: 'user074f17ec-ce19-11f0-9551-107b4419808b',
                user_name: 'user_nameЕрмаков_Виктор',
                urgencyId: 'Немедленно',
                isBug: true,
                fullnameobjecttask: 'Справочник.канбан_Задачи',
                card__link_href: '#new-bug',
                card__link_name: 'Новая ошибка',
                card__photo: '',
                alt: 'ЕВ',
                card__text: 'Описание ошибки',
            }],
        });

        await page.click('#cardtype_toggle');
        await page.locator('.cardtype_option[data-value="bug"]').click();
        await page.waitForTimeout(200);

        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(3);
        await expect(page.locator('#new-bug-001 .card__link')).toHaveText('Новая ошибка');
    });

    test('переключение группировок сохраняет карточки', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="executor"]').click();
        await page.waitForTimeout(300);

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="project"]').click();
        await page.waitForTimeout(300);

        await page.click('#grouping_toggle');
        await page.locator('.grouping_option[data-value="none"]').click();
        await page.waitForTimeout(300);

        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('dropdown-ы закрываются при открытии другого', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.click('#executor_toggle');
        await expect(page.locator('.executor_dropdown')).toHaveClass(/open/);

        await page.click('#urgency_toggle');
        await expect(page.locator('.urgency_dropdown')).toHaveClass(/open/);
        await expect(page.locator('.executor_dropdown')).not.toHaveClass(/open/);

        await page.click('#cardtype_toggle');
        await expect(page.locator('.cardtype_dropdown')).toHaveClass(/open/);
        await expect(page.locator('.urgency_dropdown')).not.toHaveClass(/open/);

        await page.click('#grouping_toggle');
        await expect(page.locator('.grouping_dropdown')).toHaveClass(/open/);
        await expect(page.locator('.cardtype_dropdown')).not.toHaveClass(/open/);
    });

    test('reinitKanban переинициализирует доску', async ({ page }) => {
        await openBoard(page, 'four-projects');

        await page.evaluate(() => {
            if (window.V8Proxy && window.V8Proxy.reinitKanban) {
                window.V8Proxy.reinitKanban();
            }
        });
        await page.waitForTimeout(300);

        const cards = page.locator('.card');
        const count = await cards.count();
        expect(count).toBe(20);
    });
});
