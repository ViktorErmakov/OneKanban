const { test, expect } = require('@playwright/test');
const { openBoard, getVisibleCards } = require('../helpers/board-helper');

test.describe('Отрисовка доски', () => {
    test('доска отображает все 20 карточек', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const cards = await getVisibleCards(page);
        await expect(cards).toHaveCount(20);
    });

    test('доска отображает 6 колонок статусов', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const columns = page.locator('.kanban-block');
        await expect(columns).toHaveCount(6);
    });

    test('заголовки статусов отображаются корректно', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const headers = page.locator('.block_header .kanban-block__name');
        await expect(headers).toHaveCount(6);
        await expect(headers.nth(0)).toHaveText('Зарегистрирована');
        await expect(headers.nth(1)).toHaveText('Ожидает ответа');
        await expect(headers.nth(2)).toHaveText('В процессе выполнения');
        await expect(headers.nth(3)).toHaveText('На тестировании');
        await expect(headers.nth(4)).toHaveText('К переносу в рабочую');
        await expect(headers.nth(5)).toHaveText('Готово');
    });

    test('счётчики карточек в заголовках корректны', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const counters = page.locator('.block_header .kanban-block__number');
        await expect(counters.nth(0)).toHaveText('7');
        await expect(counters.nth(1)).toHaveText('5');
        await expect(counters.nth(2)).toHaveText('6');
        await expect(counters.nth(3)).toHaveText('2');
        await expect(counters.nth(4)).toHaveText('0');
        await expect(counters.nth(5)).toHaveText('0');
    });

    test('карточки в первой колонке содержат правильные ссылки', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const firstColumnCards = page.locator('#a1ca3366-c296-11ee-93e4-107b4419808b .card__link');
        await expect(firstColumnCards).toHaveCount(7);
        await expect(firstColumnCards.nth(0)).toHaveText('Задача №1');
        await expect(firstColumnCards.nth(1)).toHaveText('Задача №2');
    });

    test('карточки содержат описание', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const firstCardText = page.locator('#taskb49a3cd7-3026-11f0-952c-107b4419808b .card__text span');
        await expect(firstCardText).toHaveText('Первый эпик');
    });

    test('карточки содержат фото исполнителя', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const photos = page.locator('.card__photo');
        const count = await photos.count();
        expect(count).toBe(20);
        for (let i = 0; i < count; i++) {
            const src = await photos.nth(i).getAttribute('src');
            expect(src).toBeTruthy();
        }
    });

    test('цветные метки проектов отображаются', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const tags = page.locator('.tag_task');
        const count = await tags.count();
        expect(count).toBe(20);
    });

    test('pills выбранных проектов отображаются', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const pills = page.locator('.project_pill');
        const count = await pills.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('кнопка переключения темы присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#theme_toggle')).toBeVisible();
    });

    test('поле поиска присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#search_input')).toBeVisible();
    });

    test('кнопка обновления присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#update_svg')).toBeVisible();
    });

    test('кнопка настроек присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        await expect(page.locator('#setup_svg')).toBeVisible();
    });

    test('ссылка на документацию присутствует', async ({ page }) => {
        await openBoard(page, 'four-projects');
        const logo = page.locator('#logo_link');
        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute('href', /OneKanban/);
    });
});
