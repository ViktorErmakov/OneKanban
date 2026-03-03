import './style.css';

// ========== ГЛОБАЛЬНЫЕ НАСТРОЙКИ ДОСКИ ==========
const boardSettings = {
    currentUserId: null,      // ID текущего пользователя (например: 'user123')
    currentUserName: null,    // Имя текущего пользователя (например: 'Иванов Иван')
    urgencyLevels: [],        // [{ id: 'urgent_1', name: 'Критично' }, ...] — из 1С
    urgencySettings: {},     // { 'urgent_1': { iconId: 'fire', colorId: 'red' }, ... }
};

// Встроенные иконки и цвета для срочности
const URGENCY_ICONS = {
    flag: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M12 23c3.31 0 6-2.69 6-6 0-2-1-4-2.5-5.5l-.5.5c.87.87 1.5 2.11 1.5 3.5 0 2.76-2.24 5-5 5-2.76 0-5-2.24-5-5 0-1.39.63-2.63 1.5-3.5L10 10c-1.5 1.5-2.5 3.5-2.5 5.5 0 3.31 2.69 6 6 6z"/></svg>',
    lightning: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
    exclamation: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
};
const URGENCY_COLORS = {
    red: '#c62828',
    orange: '#e65100',
    amber: '#ff8f00',
    yellow: '#f9a825',
    green: '#2e7d32',
    blue: '#1565c0'
};
const URGENCY_ICON_IDS = Object.keys(URGENCY_ICONS);
const URGENCY_COLOR_IDS = Object.keys(URGENCY_COLORS);

const BUG_ICON_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" class="cardtype-icon-svg"><path d="M19 8h-1.81a5.98 5.98 0 0 0-1.82-2.43l1.92-1.92-1.41-1.41-2.2 2.2a5.9 5.9 0 0 0-1.68-.44V2h-2v2a5.9 5.9 0 0 0-1.68.44l-2.2-2.2-1.41 1.41 1.92 1.92A5.98 5.98 0 0 0 6.81 8H5v2h1.09a5.96 5.96 0 0 0 0 2H5v2h1.81c.45.83 1.07 1.54 1.82 2.08L7 17.71l1.41 1.41 1.38-1.38c.5.18 1.03.26 1.59.26h1.24c.56 0 1.09-.08 1.59-.26l1.38 1.38 1.41-1.41-1.63-1.63c.75-.54 1.37-1.25 1.82-2.08H19v-2h-1.09a5.96 5.96 0 0 0 0-2H19V8zm-7 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>';

// Общая функция применения настроек доски (для sendResponse и board-settings)
const applyBoardSettingsFromData = (data) => {
    if (!data || typeof data !== 'object') return;
    
    if (data.currentuserid !== undefined) {
        boardSettings.currentUserId = data.currentuserid;
    }
    if (data.currentusername !== undefined) {
        boardSettings.currentUserName = data.currentusername;
    }
    if (data.theme !== undefined && window.applyTheme) {
        window.applyTheme(data.theme);
    }
    if (data.grouping !== undefined && window.applyGroupingByValue) {
        window.applyGroupingByValue(data.grouping);
    }
    if (data.executorfilter !== undefined && window.setSelectedExecutors) {
        window.setSelectedExecutors(data.executorfilter);
    }
    if (data.projectfilter !== undefined && window.setSelectedProjects) {
        window.setSelectedProjects(data.projectfilter);
    }
    if (data.search !== undefined && window.setSearchQuery) {
        window.setSearchQuery(data.search);
    }
    if (data.urgencylevels !== undefined && Array.isArray(data.urgencylevels)) {
        boardSettings.urgencyLevels = data.urgencylevels;
    }
    if (data.urgencysettings !== undefined && typeof data.urgencysettings === 'object') {
        const changed = JSON.stringify(boardSettings.urgencySettings) !== JSON.stringify(data.urgencysettings);
        boardSettings.urgencySettings = data.urgencysettings;
        if (changed && window.refreshUrgencyIconsOnCards) {
            window.refreshUrgencyIconsOnCards();
        }
    }
    if (data.urgencyfilter !== undefined && window.setSelectedUrgencies) {
        window.setSelectedUrgencies(data.urgencyfilter);
    }
    if (data.cardtypefilter !== undefined && window.setSelectedCardTypes) {
        window.setSelectedCardTypes(data.cardtypefilter);
    }
    if (window.applyExecutorFilter) {
        window.applyExecutorFilter();
    }
    if (window.applyCurrentSearch) {
        window.applyCurrentSearch();
    }
    if (typeof RecalculateKanbanBlock === 'function') {
        RecalculateKanbanBlock();
    }
};

// Глобальная переменная для хранения текущего типа группировки
let currentGroupingType = 'none';

// Вспомогательные функции для получения состояния UI
const getCurrentTheme = () => {
    const wrapper = document.getElementById('wrapper');
    return wrapper && wrapper.classList.contains('dark-theme') ? 'dark' : 'light';
};

const getCurrentGrouping = () => {
    return currentGroupingType;
};

const getSelectedExecutors = () => {
    return window.selectedExecutorsSet ? Array.from(window.selectedExecutorsSet) : [];
};

const getSelectedProjects = () => {
    return window.projectsList ? window.projectsList.filter(p => p.checked).map(p => p.id) : [];
};

const getSelectedUrgencies = () => {
    return window.selectedUrgenciesSet ? Array.from(window.selectedUrgenciesSet) : [];
};

const getSelectedCardTypes = () => {
    return window.selectedCardTypesSet ? Array.from(window.selectedCardTypesSet) : [];
};

// ========== ФУНКЦИИ ОБРАБОТКИ ЗАДАЧ ==========

// HTML иконки срочности по urgencyId (из boardSettings.urgencySettings) или пустая строка
const getUrgencyIconHtml = (urgencyId) => {
    if (!urgencyId || !boardSettings.urgencySettings[urgencyId]) return '';
    const { iconId, colorId } = boardSettings.urgencySettings[urgencyId];
    const icon = URGENCY_ICON_IDS.includes(iconId) ? URGENCY_ICONS[iconId] : URGENCY_ICONS.fire;
    const color = URGENCY_COLOR_IDS.includes(colorId) ? URGENCY_COLORS[colorId] : URGENCY_COLORS.red;
    return `<span class="card__urgency" style="--urgency-color: ${color}" title="${urgencyId}">${icon}</span>`;
};

// Обновление классов карточки (проект, исполнитель, срочность)
// ОПТИМИЗАЦИЯ: меняем классы только если они реально изменились
const updateCardClasses = (card, project, user, user_name, urgencyId, isBug) => {
    
    // ===== ШАГ 1: Получаем текущие классы карточки =====
    // Преобразуем classList в обычный массив для удобства поиска
    const classList = Array.from(card.classList);
    
    // Находим текущий класс проекта (начинается с 'project')
    // Например: 'project-abc-123' или пустая строка если нет
    const currentProject = classList.find(cls => cls.startsWith('project')) || '';
    
    // Находим текущий класс исполнителя (начинается с 'user')
    const currentUser = classList.find(cls => cls.startsWith('user') && !cls.startsWith('user_name')) || '';
    
    // Находим текущий класс имени исполнителя (начинается с 'user_name')
    // Например: 'user_nameИванов_Иван' или пустая строка если нет
    const currentUserNameClass = classList.find(cls => cls.startsWith('user_name')) || '';
    
    // ===== ШАГ 2: Обновляем проект только если он изменился =====
    // Проверяем: передан ли новый проект И отличается ли он от текущего
    if (project !== undefined && project !== currentProject) {
        if (currentProject) {
            card.classList.remove(currentProject);
        }
        if (project) {
            card.classList.add(project);
        }
        const tagTask = card.querySelector('.tag_task');
        if (tagTask) {
            const pd = project && window.projectsList ? window.projectsList.find(p => p.id === project) : null;
            tagTask.title = pd ? pd.name : '';
            if (pd && pd.color) tagTask.style.setProperty('--project-color', pd.color);
        }
    }
    
    // ===== ШАГ 3: Обновляем исполнителя только если он изменился =====
    if (user !== undefined && user !== currentUser) {
        // Удаляем старый класс исполнителя (если был)
        if (currentUser) {
            card.classList.remove(currentUser);
        }
        // Добавляем новый класс исполнителя (если не пустой)
        if (user) {
            card.classList.add(user);
        }
    }
    
    // ===== ШАГ 4: Обновляем имя исполнителя только если оно изменилось =====
    // Из 1С user_name приходит уже с префиксом "user_name" (например: "user_nameИванов_Иван")
    // Только заменяем пробелы на подчёркивания (на случай если в имени есть пробелы)
    const newUserNameClass = user_name ? user_name.split(' ').join('_') : '';
    
    if (user_name !== undefined && newUserNameClass !== currentUserNameClass) {
        // Удаляем старый класс имени (если был)
        if (currentUserNameClass) {
            card.classList.remove(currentUserNameClass);
        }
        // Добавляем новый класс имени (если не пустой)
        if (newUserNameClass) {
            card.classList.add(newUserNameClass);
        }
    }
    
    // ===== ШАГ 5: Срочность — класс и иконка =====
    if (urgencyId !== undefined) {
        const currentUrgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-')) || '';
        const newUrgencyClass = urgencyId ? 'urgency-' + urgencyId : '';
        if (newUrgencyClass !== currentUrgencyClass) {
            if (currentUrgencyClass) card.classList.remove(currentUrgencyClass);
            if (newUrgencyClass) card.classList.add(newUrgencyClass);
        }
        let urgencyEl = card.querySelector('.card__urgency-wrap');
        const iconHtml = getUrgencyIconHtml(urgencyId);
        const urgencyLevel = urgencyId && boardSettings.urgencyLevels
            ? boardSettings.urgencyLevels.find(l => l.id === urgencyId) : null;
        const urgencyTitle = urgencyLevel ? urgencyLevel.name : '';
        if (iconHtml) {
            if (!urgencyEl) {
                urgencyEl = document.createElement('div');
                urgencyEl.className = 'card__urgency-wrap';
                const indicators = card.querySelector('.card__indicators');
                const tagTask = indicators ? indicators.querySelector('.tag_task') : null;
                if (indicators) {
                    if (tagTask) indicators.insertBefore(urgencyEl, tagTask.nextSibling);
                    else indicators.prepend(urgencyEl);
                }
            }
            urgencyEl.innerHTML = iconHtml;
            urgencyEl.title = urgencyTitle;
            urgencyEl.style.display = '';
        } else if (urgencyEl) {
            urgencyEl.innerHTML = '';
            urgencyEl.style.display = 'none';
        }
    }
    
    // ===== ШАГ 6: Тип карточки (task/bug) =====
    if (isBug !== undefined) {
        card.classList.toggle('card-type-bug', !!isBug);
        let bugIcon = card.querySelector('.card__bug-icon');
        if (isBug) {
            if (!bugIcon) {
                bugIcon = document.createElement('span');
                bugIcon.className = 'card__bug-icon';
                bugIcon.title = 'Ошибка';
                bugIcon.innerHTML = BUG_ICON_SVG;
                const indicators = card.querySelector('.card__indicators');
                if (indicators) indicators.appendChild(bugIcon);
            }
            bugIcon.style.display = '';
        } else if (bugIcon) {
            bugIcon.style.display = 'none';
        }
    }
};

// Обновление содержимого карточки
// ОПТИМИЗАЦИЯ: меняем содержимое только если оно реально изменилось
const updateCardContent = (card, linkHref, linkName, photoSrc, altText, textContent, fullnameobjecttask) => {
    
    // ===== Обновляем ссылку на задачу =====
    const link = card.querySelector('.card__link');
    if (link) {
        // Обновляем URL ссылки (href) только если он изменился
        if (linkHref !== undefined) {
            const currentHref = link.getAttribute('href') || '';
            if (currentHref !== linkHref) {
                link.setAttribute('href', linkHref);
            }
        }
        // Обновляем текст ссылки только если он изменился
        if (linkName !== undefined && link.textContent !== linkName) {
            link.textContent = linkName;
        }
    }
    
    // ===== Обновляем фото =====
    const photo = card.querySelector('.card__photo');
    if (photo) {
        // Обновляем src фото только если он изменился
        if (photoSrc !== undefined && photo.src !== photoSrc) {
            photo.src = photoSrc;
        }
        // Обновляем alt и title фото только если они изменились
        if (altText !== undefined && photo.alt !== altText) {
            photo.alt = altText;
            photo.title = altText;
        }
    }
    
    // ===== Обновляем текст карточки =====
    const textSpan = card.querySelector('.card__text span');
    if (textSpan && textContent !== undefined) {
        // Сравниваем текущий текст с новым
        if (textSpan.textContent !== textContent) {
            textSpan.textContent = textContent;
        }
    }
    
    // ===== Обновляем атрибут fullNameObjectTask =====
    if (fullnameobjecttask !== undefined) {
        // Получаем текущее значение атрибута
        const currentAttr = card.getAttribute('fullNameObjectTask') || '';
        // Меняем только если значение отличается
        if (currentAttr !== fullnameobjecttask) {
            card.setAttribute('fullNameObjectTask', fullnameobjecttask);
        }
    }
};

// Перемещение карточки в статус
// При группировке ищем блок на основе классов карточки (user/project), а не текущего положения в DOM
const moveCardToStatus = (card, statusId) => {
    let targetBlock = null;
    
    if (currentGroupingType === 'executor') {
        // Группировка по исполнителям — ищем группу по классу user карточки
        const userClass = Array.from(card.classList).find(cls => cls.startsWith('user') && !cls.startsWith('user_name'));
        if (userClass) {
            const group = document.querySelector(`.group[data-executor-id="${userClass}"]`);
            if (group) {
                targetBlock = group.querySelector(`.kanban-block[id="${statusId}"]`);
            }
        }
    } else if (currentGroupingType === 'project') {
        // Группировка по проектам — ищем группу по классу project карточки
        const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
        if (projectClass) {
            const group = document.querySelector(`.group[data-project-id="${projectClass}"]`);
            if (group) {
                targetBlock = group.querySelector(`.kanban-block[id="${statusId}"]`);
            }
        }
    } else {
        targetBlock = document.getElementById(statusId);
    }
    
    if (targetBlock && card.parentElement !== targetBlock) {
        targetBlock.appendChild(card);
        // Обновляем статус в хранилище данных
        const taskData = tasksData.get(card.id);
        if (taskData) taskData.status = statusId;
    }
};

// Создание карточки из данных
const createCardFromData = (data) => {
    const card = document.createElement('div');
    // user_name приходит с префиксом "user_name", заменяем пробелы на подчёркивания
    const userNameClass = data.user_name ? data.user_name.split(' ').join('_') : '';
    card.className = `card ${data.project || ''} ${data.user || ''} ${userNameClass}`.trim();
    card.id = data.idTask;
    card.draggable = true;
    if (data.fullnameobjecttask) {
        card.setAttribute('fullNameObjectTask', data.fullnameobjecttask);
    }
    
    // Получаем цвет проекта из projectsList для отображения кружочка
    let projectColorStyle = '';
    if (data.project && window.projectsList) {
        const project = window.projectsList.find(p => p.id === data.project);
        if (project && project.color) {
            projectColorStyle = `style="--project-color: ${project.color}"`;
        }
    }
    
    // Класс и иконка срочности (отдельно от проекта — иконка справа от кружка)
    const urgencyClass = data.urgencyId ? 'urgency-' + data.urgencyId : '';
    const urgencyIconHtml = getUrgencyIconHtml(data.urgencyId);
    if (urgencyClass) card.classList.add(urgencyClass);
    
    // Тип карточки (isBug — булево из 1С)
    const isBug = !!data.isBug;
    if (isBug) card.classList.add('card-type-bug');
    const bugIconHtml = isBug ? `<span class="card__bug-icon" title="Ошибка">${BUG_ICON_SVG}</span>` : '';
    
    // Подсказки (title)
    const projectTitle = (data.project && window.projectsList)
        ? (window.projectsList.find(p => p.id === data.project) || {}).name || ''
        : '';
    const urgencyTitle = (data.urgencyId && boardSettings.urgencyLevels)
        ? (boardSettings.urgencyLevels.find(l => l.id === data.urgencyId) || {}).name || ''
        : '';
    const executorTitle = data.alt || '';
    
    card.innerHTML = `
        <div class="card__header">
            <a class="card__link" href="${data.card__link_href || '#'}">${data.card__link_name || ''}</a>
            <img class="card__photo" alt="${data.alt || ''}" title="${executorTitle}" src="${data.card__photo || ''}">
        </div>
        <div class="card__text"><span>${data.card__text || ''}</span></div>
        <div class="card__indicators">
            <div class="tag_task" ${projectColorStyle} title="${projectTitle}"></div>
            ${urgencyIconHtml ? `<div class="card__urgency-wrap" title="${urgencyTitle}">${urgencyIconHtml}</div>` : ''}
            ${bugIconHtml}
        </div>
    `;
    return card;
};

// Инициализация drag для карточки
const initCardDragEvents = (card) => {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData("text", e.target.id);
        // Сохраняем projectId для проверки в dragover (только при группировке по проектам)
        const projectClass = Array.from(e.target.classList).find(cls => cls.startsWith('project'));
        window.draggingCardProjectId = projectClass || null;
    });
    
    card.addEventListener('dragend', () => {
        // Очищаем сохранённый projectId
        window.draggingCardProjectId = null;
        // Убираем все классы подсветки с блоков
        document.querySelectorAll('.kanban-block--drop-forbidden').forEach(block => {
            block.classList.remove('kanban-block--drop-forbidden');
        });
    });
};

// Найти подходящий блок для новой карточки в режиме группировки
// На основе классов карточки определяем, в какую группу она должна попасть
const findTargetBlockForNewCard = (card, statusId) => {
    // Получаем текущий тип группировки
    const groupingType = getCurrentGrouping();
    
    if (groupingType === 'executor') {
        // Группировка по исполнителям — ищем группу по классу user
        const userClass = Array.from(card.classList).find(cls => cls.startsWith('user'));
        if (userClass) {
            // Ищем группу с таким data-executor-id
            const group = document.querySelector(`.group[data-executor-id="${userClass}"]`);
            if (group) {
                // Внутри группы ищем блок с нужным статусом
                return group.querySelector(`.kanban-block[id="${statusId}"]`);
            }
        }
    } else if (groupingType === 'project') {
        // Группировка по проектам — ищем группу по классу project
        const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
        if (projectClass) {
            // Ищем группу с таким data-project-id
            const group = document.querySelector(`.group[data-project-id="${projectClass}"]`);
            if (group) {
                // Внутри группы ищем блок с нужным статусом
                return group.querySelector(`.kanban-block[id="${statusId}"]`);
            }
        }
    }
    
    // Fallback — первый блок с таким ID статуса (может быть в любой группе)
    return document.querySelector(`.kanban-block[id="${statusId}"]`);
};

// Обработка задачи из 1С
const processTask = (taskData) => {
    const { idTask, status } = taskData;
    if (!idTask) return;
    
    // 1. Обновить данные в хранилище
    const existing = tasksData.get(idTask);
    if (existing) {
        // Обновить только переданные поля
        Object.keys(taskData).forEach(key => {
            if (taskData[key] !== undefined) existing[key] = taskData[key];
        });
    } else {
        // Новая задача
        tasksData.set(idTask, { ...taskData });
    }
    
    // 2. Обновить карточку в DOM (если отображается)
    const cardInDOM = document.getElementById(idTask);
    if (cardInDOM) {
        updateCardClasses(cardInDOM, taskData.project, taskData.user, taskData.user_name, taskData.urgencyId, taskData.isBug);
        updateCardContent(cardInDOM, taskData.card__link_href, taskData.card__link_name, 
                          taskData.card__photo, taskData.alt, taskData.card__text, taskData.fullnameobjecttask);
        if (status) moveCardToStatus(cardInDOM, status);
    } else if (status) {
        // Новая карточка — добавить в DOM
        const card = createCardFromData(tasksData.get(idTask));
        const targetBlock = findTargetBlockForNewCard(card, status);
        if (targetBlock) {
            targetBlock.appendChild(card);
            initCardDragEvents(card);
        }
    }
};

// ===== ХРАНИЛИЩЕ ДАННЫХ ЗАДАЧ =====
const tasksData = new Map();
window.tasksData = tasksData;

window['V8Proxy'] = {

    // Для запроса из JS в 1С
    fetch: (eventName, params = {}) => {
        const V8_request = document.querySelector('#V8_request');
        V8_request.value = eventName;
        
        // Общие параметры состояния UI (передаются всегда)
        V8_request.setAttribute('theme', getCurrentTheme());
        V8_request.setAttribute('grouping', getCurrentGrouping());
        V8_request.setAttribute('executorfilter', JSON.stringify(getSelectedExecutors()));
        V8_request.setAttribute('projectfilter', JSON.stringify(getSelectedProjects()));
        V8_request.setAttribute('urgencyfilter', JSON.stringify(getSelectedUrgencies()));
        V8_request.setAttribute('cardtypefilter', JSON.stringify(getSelectedCardTypes()));
        V8_request.setAttribute('urgencysettings', JSON.stringify(boardSettings.urgencySettings));
        V8_request.setAttribute('task', JSON.stringify(params));
                
        V8_request.click();
    },
    
    // Для отправки из 1С в JS
    sendResponse: (eventName, data) => {
        
        // Если data - строка JSON, парсим в объект
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('sendResponse: Failed to parse JSON:', e);
                return;
            }
        }
        
        // data содержит:
        // {
        //     currentuserid: '...', currentusername: '...',
        //     theme: 'light'|'dark', grouping: 'none'|'executor'|'project',
        //     executorfilter: [], projectfilter: [], urgencyfilter: [],
        //     urgencylevels: [{ id: 'urgent_1', name: 'Критично' }, ...],  // для фильтра и настроек
        //     urgencysettings: { 'urgent_1': { iconId: 'fire', colorId: 'red' }, ... },
        //     search: '...',
        //     tasks: [
        //         {
        //             idTask, status, project, user, user_name,
        //             urgencyId: 'urgent_1',  // опционально; представление только в urgencylevels
        //             isBug: true|false,       // булево: true = ошибка, false/undefined = задача
        //             fullnameobjecttask, card__link_href, card__link_name,
        //             card__photo, alt, card__text
        //         },
        //     ]
        // }
        
        expandedBlocks.clear();
        
        // ========== 1. СНАЧАЛА ОБРАБАТЫВАЕМ ЗАДАЧИ ==========
        if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
            data.tasks.forEach(taskData => {
                processTask(taskData);
            });
        }
        
        // ========== 2. ПРИМЕНЯЕМ НАСТРОЙКИ UI ==========
        applyBoardSettingsFromData(data);
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Инициализация темы
    const initTheme = () => {
        const themeToggle = document.getElementById('theme_toggle');
        const wrapper = document.getElementById('wrapper');
        
        themeToggle.addEventListener('click', () => {
            wrapper.classList.toggle('dark-theme');
            themeToggle.classList.toggle('active');
            // Уведомляем 1С об изменении настроек
            window.V8Proxy.fetch('settingsChanged', {});
        });
        
        // Экспортируем функцию для применения темы из sendResponse
        window.applyTheme = (theme) => {
            if (theme === 'dark') {
                wrapper.classList.add('dark-theme');
                themeToggle.classList.add('active');
            } else {
                wrapper.classList.remove('dark-theme');
                themeToggle.classList.remove('active');
            }
        };
    };

    initTheme();

    // ========== ЗАКРЫТИЕ ВСЕХ DROPDOWN ==========
    const closeAllDropdowns = (except = null) => {
        const dropdowns = [
            document.querySelector('.project_picker'),
            document.querySelector('.executor_dropdown'),
            document.querySelector('.urgency_dropdown'),
            document.querySelector('.cardtype_dropdown'),
            document.querySelector('.grouping_dropdown')
        ];
        dropdowns.forEach(dropdown => {
            if (dropdown && dropdown !== except) {
                dropdown.classList.remove('open');
            }
        });
    };

    // ========== PROJECT PICKER (Tag-picker с dropdown) ==========
    const MAX_VISIBLE_PROJECTS = 3; // Максимум видимых pills
    
    // Хранилище проектов (глобальное для функций)
    let projects = [];
    
    const initProjectPicker = () => {
        const picker = document.querySelector('.project_picker');
        const toggle = document.getElementById('project_picker_toggle');
        const dropdown = document.getElementById('project_picker_dropdown');
        const selectedContainer = document.getElementById('project_picker_selected');
        const grid = document.getElementById('project_picker_grid');
        const moreCounter = document.getElementById('project_picker_more');
        
        if (!picker || !toggle) return;
        
        // Собираем проекты из script#projects-data (генерируется 1С)
        const collectProjectsFromData = () => {
            const scriptEl = document.getElementById('projects-data');
            if (!scriptEl) {
                projects = [];
                return;
            }
            try {
                const data = JSON.parse(scriptEl.textContent || '[]');
                projects = Array.isArray(data) ? data.map(p => ({
                    id: p.id || '',
                    name: p.name || '',
                    color: p.color || null,
                    checked: false
                })) : [];
            } catch (e) {
                console.error('projects-data: Failed to parse JSON:', e);
                projects = [];
            }
            projects.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        };
        
        collectProjectsFromData();
        
        // Функция обновления отображения
        const updateDisplay = () => {
            selectedContainer.innerHTML = '';
            grid.innerHTML = '';
            
            const selectedProjects = projects.filter(p => p.checked);
            const visibleProjects = selectedProjects.slice(0, MAX_VISIBLE_PROJECTS);
            const hiddenCount = selectedProjects.length - MAX_VISIBLE_PROJECTS;
            
            if (selectedProjects.length === 0 && projects.length > 0) {
                const placeholder = document.createElement('span');
                placeholder.className = 'project_picker_placeholder';
                placeholder.textContent = 'Выберите проект';
                selectedContainer.appendChild(placeholder);
                picker.classList.add('no-selection');
            } else {
                picker.classList.remove('no-selection');
                
                visibleProjects.forEach(project => {
                    const pill = document.createElement('div');
                    pill.className = 'project_pill';
                    pill.setAttribute('data-project-id', project.id);
                    if (project.color) {
                        pill.style.setProperty('--project-color', project.color);
                    }
                    pill.innerHTML = `
                        <span class="project_pill_name">${project.name}</span>
                        <span class="project_pill_close">×</span>
                    `;
                    pill.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleProject(project.id);
                    });
                    selectedContainer.appendChild(pill);
                });
            }
            
            if (hiddenCount > 0) {
                moreCounter.textContent = '+' + hiddenCount;
            } else {
                moreCounter.textContent = '';
            }
            
            projects.forEach(project => {
                const item = document.createElement('div');
                item.className = 'project_grid_item' + (project.checked ? ' selected' : '');
                item.setAttribute('data-project-id', project.id);
                if (project.color) {
                    item.style.setProperty('--project-color', project.color);
                }
                item.textContent = project.name;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleProject(project.id);
                });
                grid.appendChild(item);
            });
            
            if (projects.length > 1) {
                const separator = document.createElement('div');
                separator.className = 'project_grid_separator';
                grid.appendChild(separator);
                
                const allSelected = projects.every(p => p.checked);
                const selectAllItem = document.createElement('div');
                selectAllItem.className = 'project_grid_item project_grid_item_all' + (allSelected ? ' selected' : '');
                selectAllItem.textContent = 'Выбрать все';
                selectAllItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const shouldSelect = !projects.every(p => p.checked);
                    projects.forEach(p => { p.checked = shouldSelect; });
                    const wasOpen = picker.classList.contains('open');
                    updateDisplay();
                    
                    if (window.applyExecutorFilter) {
                        window.applyExecutorFilter();
                    } else {
                        RecalculateKanbanBlock();
                    }
                    window.V8Proxy.fetch('settingsChanged', {});
                    if (wasOpen) picker.classList.add('open');
                });
                grid.appendChild(selectAllItem);
            }
        };
        
        const toggleProject = (projectId) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            
            const wasOpen = picker.classList.contains('open');
            project.checked = !project.checked;
            updateDisplay();
            
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            } else {
                const cards = document.querySelectorAll(`.card.${projectId}`);
                cards.forEach(card => {
                    card.classList.toggle('card__inactive', !project.checked);
                });
                RecalculateKanbanBlock();
            }
            
            window.V8Proxy.fetch('settingsChanged', {});
            if (wasOpen) picker.classList.add('open');
        };
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(picker);
            picker.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target)) {
                picker.classList.remove('open');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && picker.classList.contains('open')) {
                picker.classList.remove('open');
            }
        });
        
        updateDisplay();
        
        window.updateProjectPicker = updateDisplay;
        window.collectProjectsFromCheckboxes = collectProjectsFromData;
        window.projectsList = projects;
        
        // Фильтрация по клику на кружок проекта в карточке
        window.filterByProject = (projectId) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            const onlyThisSelected = projects.filter(p => p.checked).length === 1 && project.checked;
            if (onlyThisSelected) {
                projects.forEach(p => { p.checked = true; });
            } else {
                projects.forEach(p => { p.checked = p.id === projectId; });
            }
            updateDisplay();
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            } else {
                RecalculateKanbanBlock();
            }
            window.V8Proxy.fetch('settingsChanged', {});
        };
        
        window.setSelectedProjects = (projectIds) => {
            if (!projectIds || !Array.isArray(projectIds)) return;
            
            projects.forEach(project => {
                project.checked = projectIds.includes(project.id);
            });
            
            updateDisplay();
            
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            }
        };
    };
    
    initProjectPicker();

    // ========== EXECUTOR FILTER (Фильтр по исполнителям) ==========
    let selectedExecutors = new Set(); // Выбранные исполнители
    
    const initExecutorFilter = () => {
        const dropdown = document.querySelector('.executor_dropdown');
        const toggle = document.getElementById('executor_toggle');
        const menu = document.getElementById('executor_menu');
        const label = document.getElementById('executor_label');
        const executorClear = document.getElementById('executor_clear');
        
        if (!dropdown || !toggle || !menu) return;
        
        // Обновление класса has-selected
        const updateHasSelected = () => {
            if (selectedExecutors.size > 0) {
                dropdown.classList.add('has-selected');
            } else {
                dropdown.classList.remove('has-selected');
            }
        };
        
        // Собираем исполнителей с доски
        const collectExecutors = () => {
            const executorsMap = new Map(); // userId -> { name, photo }
            const cards = document.querySelectorAll('.card');
            
            cards.forEach(card => {
                // Ищем класс user... (ID пользователя)
                const classList = card.className.split(' ');
                let userId = null;
                let userName = null;
                
                for (const cls of classList) {
                    if (cls.startsWith('user')) {
                        userId = cls;
                    }
                    if (cls.startsWith('user_name')) {
                        userName = cls.substring('user_name'.length);
                    }
                }
                
                if (userId && userName && !executorsMap.has(userId)) {
                    const photo = card.querySelector('.card__photo');
                    executorsMap.set(userId, {
                        name: userName,
                        photo: photo ? photo.src : null
                    });
                }
            });
            
            return executorsMap;
        };
        
        // Заполняем меню исполнителями
        const populateMenu = () => {
            // Очищаем меню
            menu.innerHTML = '';
            
            // Добавляем исполнителей
            const executors = collectExecutors();
            executors.forEach((data, userId) => {
                const option = document.createElement('div');
                option.className = 'executor_option';
                option.setAttribute('data-value', userId);
                
                // Добавляем фото если есть
                if (data.photo) {
                    const img = document.createElement('img');
                    img.className = 'executor_option_photo';
                    img.src = data.photo;
                    img.alt = data.name;
                    option.appendChild(img);
                }
                
                // Добавляем имя (заменяем _ на пробел для отображения)
                const nameSpan = document.createElement('span');
                nameSpan.textContent = data.name.replace(/_/g, ' ');
                option.appendChild(nameSpan);
                
                if (selectedExecutors.has(userId)) {
                    option.classList.add('selected');
                }
                
                menu.appendChild(option);
            });
        };
        
        // Обновление текста кнопки
        const updateLabel = () => {
            if (selectedExecutors.size === 0) {
                label.textContent = 'Исполнитель';
            } else if (selectedExecutors.size === 1) {
                const value = Array.from(selectedExecutors)[0];
                const option = menu.querySelector(`[data-value="${value}"]`);
                // Берём текст из span внутри option (или textContent если span нет)
                const nameSpan = option ? option.querySelector('span') : null;
                label.textContent = nameSpan ? nameSpan.textContent : (option ? option.textContent : 'Исполнитель');
            } else {
                label.textContent = `Исполнитель (${selectedExecutors.size})`;
            }
        };
        
        // Применение фильтрации по исполнителям
        const applyFilter = () => {
            const cards = document.querySelectorAll('.card');
            
            cards.forEach(card => {
                // Проверяем, активен ли проект карточки (из projectsList)
                const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
                const projectData = projectClass && window.projectsList 
                    ? window.projectsList.find(p => p.id === projectClass) 
                    : null;
                const projectInactive = projectData && !projectData.checked;
                
                if (projectInactive) {
                    // Проект неактивен — карточка скрыта
                    card.classList.add('card__inactive');
                    return;
                }
                
                if (selectedExecutors.size === 0) {
                    // Нет фильтра по исполнителям — показываем всё (с учётом проектов)
                    card.classList.remove('card__inactive');
                } else {
                    // Есть фильтр — проверяем исполнителя
                    let shouldShow = false;
                    
                    // Проверяем исполнителей
                    selectedExecutors.forEach(executorId => {
                        if (card.classList.contains(executorId)) {
                            shouldShow = true;
                        }
                    });
                    
                    card.classList.toggle('card__inactive', !shouldShow);
                }
                
                // Фильтр по срочности: если выбран хотя бы один уровень — показываем только карточки с этим уровнем
                const selectedUrgencies = window.selectedUrgenciesSet || new Set();
                if (selectedUrgencies.size > 0 && !card.classList.contains('card__inactive')) {
                    const urgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-'));
                    const urgencyId = urgencyClass ? urgencyClass.replace('urgency-', '') : null;
                    if (!urgencyId || !selectedUrgencies.has(urgencyId)) {
                        card.classList.add('card__inactive');
                    }
                }
                
                // Фильтр по типу карточки (задача/ошибка)
                const selCardTypes = window.selectedCardTypesSet || new Set();
                if (selCardTypes.size > 0 && !card.classList.contains('card__inactive')) {
                    const cType = card.classList.contains('card-type-bug') ? 'bug' : 'task';
                    if (!selCardTypes.has(cType)) {
                        card.classList.add('card__inactive');
                    }
                }
            });
            
            RecalculateKanbanBlock();
        };
        
        // Обработчик клика на опцию
        const handleOptionClick = (option) => {
            const value = option.getAttribute('data-value');
            
            if (selectedExecutors.has(value)) {
                selectedExecutors.delete(value);
                option.classList.remove('selected');
            } else {
                selectedExecutors.add(value);
                option.classList.add('selected');
            }
            
            updateLabel();
            updateHasSelected();
            applyFilter();
            
            // Уведомляем 1С об изменении настроек
            window.V8Proxy.fetch('settingsChanged', {});
        };
        
        // Делегирование событий для опций
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.executor_option');
            if (option) {
                e.stopPropagation(); // <-- Это останавливает всплытие события!
                handleOptionClick(option);
            }
        });
        
        // Открытие/закрытие dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // <-- Это останавливает всплытие события!
            closeAllDropdowns(dropdown);
            populateMenu(); // Обновляем список при открытии
            dropdown.classList.toggle('open');
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        // Очистка по клику на крестик
        if (executorClear) {
            executorClear.addEventListener('click', (e) => {
                e.stopPropagation(); // <-- Это останавливает всплытие события! // Не открывать dropdown
                selectedExecutors.clear();
                updateLabel();
                updateHasSelected();
                populateMenu(); // Обновить визуальное состояние опций
                applyFilter();
                
                // Уведомляем 1С об изменении настроек
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }
        
        // Экспортируем для переинициализации
        window.applyExecutorFilter = applyFilter;
        window.populateExecutorMenu = populateMenu;
        
        // Экспортируем selectedExecutors для получения состояния
        window.selectedExecutorsSet = selectedExecutors;
        
        // Фильтрация по клику на фото исполнителя в карточке
        window.filterByExecutor = (userId) => {
            if (selectedExecutors.size === 1 && selectedExecutors.has(userId)) {
                selectedExecutors.clear();
            } else {
                selectedExecutors.clear();
                selectedExecutors.add(userId);
            }
            populateMenu();
            updateLabel();
            updateHasSelected();
            applyFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        };
        
        // Функция для установки выбранных исполнителей из sendResponse
        window.setSelectedExecutors = (executorIds) => {
            if (!executorIds || !Array.isArray(executorIds)) return;
            
            selectedExecutors.clear();
            executorIds.forEach(id => selectedExecutors.add(id));
            
            populateMenu();       // Сначала заполняем меню
            updateLabel();        // Теперь опции существуют и label обновится корректно
            updateHasSelected();
            applyFilter();
        };
    };
    
    initExecutorFilter();

    // ========== URGENCY FILTER ==========
    let selectedUrgencies = new Set();
    
    const initUrgencyFilter = () => {
        const dropdown = document.querySelector('.urgency_dropdown');
        const toggle = document.getElementById('urgency_toggle');
        const menu = document.getElementById('urgency_menu');
        const label = document.getElementById('urgency_label');
        const urgencyClear = document.getElementById('urgency_clear');
        
        if (!dropdown || !toggle || !menu) return;
        
        const updateHasSelected = () => {
            if (selectedUrgencies.size > 0) dropdown.classList.add('has-selected');
            else dropdown.classList.remove('has-selected');
        };
        
        const populateMenu = () => {
            menu.innerHTML = '';
            const levels = boardSettings.urgencyLevels || [];
            levels.forEach(({ id, name }) => {
                const option = document.createElement('div');
                option.className = 'urgency_option';
                option.setAttribute('data-value', id);
                if (selectedUrgencies.has(id)) option.classList.add('selected');
                const iconHtml = getUrgencyIconHtml(id);
                if (iconHtml) {
                    const preview = document.createElement('span');
                    preview.className = 'urgency_option_preview';
                    preview.innerHTML = iconHtml;
                    option.appendChild(preview);
                }
                const label = document.createElement('span');
                label.className = 'urgency_option_label';
                label.textContent = name || id;
                option.appendChild(label);
                const settingsBtn = document.createElement('button');
                settingsBtn.type = 'button';
                settingsBtn.className = 'urgency_option_settings';
                settingsBtn.title = 'Настройка иконки и цвета';
                settingsBtn.setAttribute('aria-label', 'Настройка');
                settingsBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
                option.appendChild(settingsBtn);
                settingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.openUrgencySettingsPopover) window.openUrgencySettingsPopover(id, name || id, settingsBtn);
                });
                menu.appendChild(option);
            });
        };
        
        const updateLabel = () => {
            if (selectedUrgencies.size === 0) {
                label.textContent = 'Срочность';
            } else if (selectedUrgencies.size === 1) {
                const id = Array.from(selectedUrgencies)[0];
                const level = (boardSettings.urgencyLevels || []).find(l => l.id === id);
                label.textContent = level ? level.name : id;
            } else {
                label.textContent = `Срочность (${selectedUrgencies.size})`;
            }
        };
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(dropdown);
            populateMenu();
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
        });
        
        menu.addEventListener('click', (e) => {
            if (e.target.closest('.urgency_option_settings')) return;
            const option = e.target.closest('.urgency_option');
            if (!option) return;
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            if (selectedUrgencies.has(value)) {
                selectedUrgencies.delete(value);
                option.classList.remove('selected');
            } else {
                selectedUrgencies.add(value);
                option.classList.add('selected');
            }
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        });
        
        if (urgencyClear) {
            urgencyClear.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedUrgencies.clear();
                updateLabel();
                updateHasSelected();
                populateMenu();
                if (window.applyExecutorFilter) window.applyExecutorFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }
        
        window.selectedUrgenciesSet = selectedUrgencies;
        
        // Фильтрация по клику на иконку срочности в карточке
        window.filterByUrgency = (urgencyId) => {
            if (selectedUrgencies.size === 1 && selectedUrgencies.has(urgencyId)) {
                selectedUrgencies.clear();
            } else {
                selectedUrgencies.clear();
                selectedUrgencies.add(urgencyId);
            }
            populateMenu();
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        };
        
        window.setSelectedUrgencies = (urgencyIds) => {
            if (!urgencyIds || !Array.isArray(urgencyIds)) return;
            selectedUrgencies.clear();
            urgencyIds.forEach(id => selectedUrgencies.add(id));
            populateMenu();
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
        };
        window.populateUrgencyMenu = populateMenu;
    };
    
    initUrgencyFilter();

    // ========== CARD TYPE FILTER (Задача / Ошибка) ==========
    let selectedCardTypes = new Set();
    
    const initCardTypeFilter = () => {
        const dropdown = document.querySelector('.cardtype_dropdown');
        const toggle = document.getElementById('cardtype_toggle');
        const menu = document.getElementById('cardtype_menu');
        const label = document.getElementById('cardtype_label');
        const cardtypeClear = document.getElementById('cardtype_clear');
        
        if (!dropdown || !toggle || !menu) return;
        
        const CARD_TYPES = [
            { id: 'task', name: 'Задача' },
            { id: 'bug', name: 'Ошибка' }
        ];
        
        const updateHasSelected = () => {
            if (selectedCardTypes.size > 0) dropdown.classList.add('has-selected');
            else dropdown.classList.remove('has-selected');
        };
        
        const populateMenu = () => {
            menu.innerHTML = '';
            CARD_TYPES.forEach(({ id, name }) => {
                const option = document.createElement('div');
                option.className = 'cardtype_option';
                option.setAttribute('data-value', id);
                if (selectedCardTypes.has(id)) option.classList.add('selected');
                option.textContent = name;
                menu.appendChild(option);
            });
        };
        
        const updateLabel = () => {
            if (selectedCardTypes.size === 0) {
                label.textContent = 'Тип';
            } else if (selectedCardTypes.size === 1) {
                const id = Array.from(selectedCardTypes)[0];
                const t = CARD_TYPES.find(ct => ct.id === id);
                label.textContent = t ? t.name : id;
            } else {
                label.textContent = 'Тип (' + selectedCardTypes.size + ')';
            }
        };
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(dropdown);
            populateMenu();
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
        });
        
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.cardtype_option');
            if (!option) return;
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            if (selectedCardTypes.has(value)) {
                selectedCardTypes.delete(value);
                option.classList.remove('selected');
            } else {
                selectedCardTypes.add(value);
                option.classList.add('selected');
            }
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        });
        
        if (cardtypeClear) {
            cardtypeClear.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedCardTypes.clear();
                updateLabel();
                updateHasSelected();
                populateMenu();
                if (window.applyExecutorFilter) window.applyExecutorFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }
        
        window.selectedCardTypesSet = selectedCardTypes;
        
        // Фильтрация по клику на иконку ошибки в карточке
        window.filterByCardType = (typeId) => {
            if (selectedCardTypes.size === 1 && selectedCardTypes.has(typeId)) {
                selectedCardTypes.clear();
            } else {
                selectedCardTypes.clear();
                selectedCardTypes.add(typeId);
            }
            populateMenu();
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        };
        
        window.setSelectedCardTypes = (typeIds) => {
            if (!typeIds || !Array.isArray(typeIds)) return;
            selectedCardTypes.clear();
            typeIds.forEach(id => selectedCardTypes.add(id));
            populateMenu();
            updateLabel();
            updateHasSelected();
            if (window.applyExecutorFilter) window.applyExecutorFilter();
        };
    };
    
    initCardTypeFilter();

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    
    // Структура статусов (сохраняется при первой группировке)
    let statusBlocksData = null;
    
    // Сохранить структуру статусов
    const saveStatusBlocks = () => {
        if (statusBlocksData) return;
        statusBlocksData = [];
        document.querySelectorAll('#kanban-board .kanban-block').forEach(block => {
            statusBlocksData.push({
                id: block.id,
                fullName: block.getAttribute('fullNameObjectStatus'),
                className: block.className
            });
        });
    };
    
    // Собрать данные карточек из DOM (при инициализации)
    const collectCardsData = () => {
        document.querySelectorAll('.card').forEach(card => {
            const statusBlock = card.closest('.kanban-block');
            const classList = Array.from(card.classList);
            const link = card.querySelector('.card__link');
            const photo = card.querySelector('.card__photo');
            const textSpan = card.querySelector('.card__text span');
            
            const urgencyId = card.getAttribute('urgencyId') || undefined;
            const isBugAttr = card.getAttribute('isBug');
            const isBug = isBugAttr === 'Да' || isBugAttr === 'true' || isBugAttr === '1';
            
            const taskData = {
                idTask: card.id,
                project: classList.find(c => c.startsWith('project')) || '',
                user: classList.find(c => c.startsWith('user')) || '',
                user_name: classList.find(c => c.startsWith('user_name')) || '',
                urgencyId,
                isBug,
                fullnameobjecttask: card.getAttribute('fullNameObjectTask') || '',
                card__link_href: link ? link.getAttribute('href') : '',
                card__link_name: link ? link.textContent : '',
                card__photo: photo ? photo.src : '',
                alt: photo ? photo.alt : '',
                card__text: textSpan ? textSpan.textContent : '',
                status: statusBlock ? statusBlock.id : null
            };
            tasksData.set(card.id, taskData);
            
            updateCardClasses(card, undefined, undefined, undefined, urgencyId, isBug);
        });
    };
    
    // Проверить, активна ли группировка
    window.isGroupingActive = () => currentGroupingType !== 'none';

    // ========== ГРУППИРОВКА ==========
    const initGrouping = () => {
        const groupingDropdown = document.querySelector('.grouping_dropdown');
        const groupingToggle = document.getElementById('grouping_toggle');
        const groupingMenu = document.getElementById('grouping_menu');
        const groupingLabel = document.getElementById('grouping_label');
        const kanbanBoard = document.getElementById('kanban-board');

        if (!groupingToggle || !groupingMenu) return;

        // Открытие/закрытие dropdown
        groupingToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // <-- Это останавливает всплытие события!
            closeAllDropdowns(groupingDropdown);
            groupingDropdown.classList.toggle('open');
        });

        // Закрытие при клике вне dropdown
        document.addEventListener('click', (e) => {
            if (!groupingDropdown.contains(e.target)) {
                groupingDropdown.classList.remove('open');
            }
        });

        // Внутренняя функция применения группировки (без уведомления 1С)
        const applyGroupingInternal = (value) => {
            expandedBlocks.clear();
            const option = document.querySelector(`.grouping_option[data-value="${value}"]`);
            if (!option) return;
            
            const text = option.textContent;

            // Обновляем активную опцию
            document.querySelectorAll('.grouping_option').forEach(opt => {
                opt.classList.remove('active');
            });
            option.classList.add('active');

            // Обновляем текст кнопки
            groupingLabel.textContent = text;

            // Закрываем dropdown
            groupingDropdown.classList.remove('open');

            // Сохраняем текущий тип группировки
            currentGroupingType = value;

            // Применяем группировку (DOM строится из tasksData)
            if (value === 'none') {
                removeGrouping();
            } else if (value === 'executor') {
                applyGroupingByExecutor();
            } else if (value === 'project') {
                applyGroupingByProject();
            }

            // применить фильтры проектов и исполнителей
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            }
            
            // Применяем текущий поиск к новым карточкам
            if (window.applyCurrentSearch) {
                window.applyCurrentSearch();
            }

            RecalculateKanbanBlock();
        };
        
        // Выбор опции группировки (клик пользователя)
        document.querySelectorAll('.grouping_option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                applyGroupingInternal(value);
                
                // Уведомляем 1С об изменении настроек (только при клике пользователя)
                window.V8Proxy.fetch('settingsChanged', {});
            });
        });
        
        // Экспортируем функцию для применения группировки из sendResponse (без уведомления 1С)
        window.applyGroupingByValue = (value) => {
            applyGroupingInternal(value);
        };
    };

    // Группировка по исполнителям — строим DOM из tasksData
    const applyGroupingByExecutor = () => {
        saveStatusBlocks();
        const kanbanBoard = document.getElementById('kanban-board');
        
        // Группируем данные по исполнителям
        const executors = new Map(); // visibleName → { userId, photo, tasks: [] }
        
        tasksData.forEach((data) => {
            if (!data.user) return;
            // Извлекаем отображаемое имя из класса user_name
            const visibleName = data.user_name 
                ? data.user_name.replace('user_name', '').replace(/_/g, ' ') 
                : data.user;
            
            if (!executors.has(visibleName)) {
                executors.set(visibleName, { 
                    userId: data.user, 
                    photo: data.card__photo, 
                    tasks: [] 
                });
            }
            executors.get(visibleName).tasks.push(data);
        });
        
        // Строим DOM
        kanbanBoard.innerHTML = '';
        kanbanBoard.classList.add('grouped');
        
        executors.forEach((exec, visibleName) => {
            const group = document.createElement('div');
            group.className = 'group';
            group.setAttribute('data-executor-id', exec.userId);
            group.setAttribute('data-executor-name', visibleName);
            
            // Заголовок группы
            const photoHtml = exec.photo ? `<img class="group-photo" src="${exec.photo}" alt="${visibleName}">` : '';
            group.innerHTML = `
                <div class="group-header">
                    <div class="group-toggle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                    ${photoHtml}
                    <span class="group-name">${visibleName}</span>
                    <span class="group-count">0</span>
                </div>
                <div class="group-content"></div>
            `;
            
            const content = group.querySelector('.group-content');
            
            // Создаём блоки статусов
            statusBlocksData.forEach(blockData => {
                const block = document.createElement('div');
                block.className = 'kanban-block';
                block.id = blockData.id;
                block.setAttribute('fullNameObjectStatus', blockData.fullName);
                
                // Добавляем карточки этого исполнителя для этого статуса
                exec.tasks.filter(t => t.status === blockData.id).forEach(taskData => {
                    const card = createCardFromData(taskData);
                    block.appendChild(card);
                });
                
                content.appendChild(block);
            });
            
            kanbanBoard.appendChild(group);
        });
        
        initGroupCollapse();
        initDragDropForGroups();
    };

    // Группировка по проектам — строим DOM из tasksData
    const applyGroupingByProject = () => {
        saveStatusBlocks();
        const kanbanBoard = document.getElementById('kanban-board');
        
        // Группируем данные по проектам
        const projectsMap = new Map(); // projectId → { name, color, tasks: [] }
        
        tasksData.forEach((data) => {
            const projectClass = data.project;
            if (!projectClass) return;
            
            if (!projectsMap.has(projectClass)) {
                // Получаем данные проекта из projectsList
                const projectData = window.projectsList 
                    ? window.projectsList.find(p => p.id === projectClass) 
                    : null;
                const projectName = projectData ? projectData.name : projectClass;
                const projectColor = projectData ? projectData.color : null;
                
                projectsMap.set(projectClass, {
                    name: projectName,
                    color: projectColor,
                    tasks: []
                });
            }
            projectsMap.get(projectClass).tasks.push(data);
        });
        
        // Строим DOM
        kanbanBoard.innerHTML = '';
        kanbanBoard.classList.add('grouped');
        
        projectsMap.forEach((proj, projectId) => {
            const group = document.createElement('div');
            group.className = 'group';
            group.setAttribute('data-project-id', projectId);
            
            const colorStyle = proj.color ? `background-color: ${proj.color};` : '';
            group.innerHTML = `
                <div class="group-header">
                    <div class="group-toggle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                    <span class="group-project-color" style="${colorStyle}"></span>
                    <span class="group-name">${proj.name}</span>
                    <span class="group-count">0</span>
                </div>
                <div class="group-content"></div>
            `;
            
            const content = group.querySelector('.group-content');
            
            // Создаём блоки статусов
            statusBlocksData.forEach(blockData => {
                const block = document.createElement('div');
                block.className = 'kanban-block';
                block.id = blockData.id;
                block.setAttribute('fullNameObjectStatus', blockData.fullName);
                
                // Добавляем карточки этого проекта для этого статуса
                proj.tasks.filter(t => t.status === blockData.id).forEach(taskData => {
                    const card = createCardFromData(taskData);
                    block.appendChild(card);
                });
                
                content.appendChild(block);
            });
            
            kanbanBoard.appendChild(group);
        });
        
        initGroupCollapse();
        initDragDropForGroups();
    };

    // Снятие группировки — строим плоскую доску из данных
    const removeGrouping = () => {
        const kanbanBoard = document.getElementById('kanban-board');
        kanbanBoard.classList.remove('grouped');
        currentGroupingType = 'none';
        
        if (!statusBlocksData) return;
        
        // Очищаем и строим заново с обёрткой kanban_body
        kanbanBoard.innerHTML = '';
        const kanbanBody = document.createElement('div');
        kanbanBody.className = 'kanban_body';
        
        // Создаём блоки статусов
        statusBlocksData.forEach(blockData => {
            const block = document.createElement('div');
            block.id = blockData.id;
            block.className = blockData.className;
            block.setAttribute('fullNameObjectStatus', blockData.fullName);
            kanbanBody.appendChild(block);
        });
        
        kanbanBoard.appendChild(kanbanBody);
        
        // Добавляем карточки из данных
        tasksData.forEach((data) => {
            const card = createCardFromData(data);
            const targetBlock = document.getElementById(data.status);
            if (targetBlock) {
                targetBlock.appendChild(card);
            }
        });
        
        initDragDrop();
        initCardDrag();
    };

    // Инициализация drag & drop для групп
    // Drag & drop для сгруппированной доски
    const initDragDropForGroups = () => {
        document.querySelectorAll('.group-content .kanban-block').forEach(block => {
            block.addEventListener('dragover', (e) => {
                e.preventDefault();
                
                // При группировке по проектам проверяем, можно ли бросить сюда
                if (currentGroupingType === 'project' && window.draggingCardProjectId) {
                    const targetGroup = block.closest('.group');
                    const targetProjectId = targetGroup ? targetGroup.getAttribute('data-project-id') : null;
                    
                    if (targetProjectId && window.draggingCardProjectId !== targetProjectId) {
                        // Запрещённая зона — другой проект
                        block.classList.remove('kanban-block--dragover');
                        block.classList.add('kanban-block--drop-forbidden');
                        e.dataTransfer.dropEffect = 'none';
                        return;
                    }
                }
                
                // Разрешённая зона
                block.classList.remove('kanban-block--drop-forbidden');
                block.classList.add('kanban-block--dragover');
            });

            block.addEventListener('dragleave', (e) => {
                if (!block.contains(e.relatedTarget)) {
                    block.classList.remove('kanban-block--dragover');
                    block.classList.remove('kanban-block--drop-forbidden');
                }
            });

            block.addEventListener('drop', (e) => {
                e.preventDefault();
                block.classList.remove('kanban-block--dragover');
                block.classList.remove('kanban-block--drop-forbidden');

                const idTask = e.dataTransfer.getData("text");
                const draggedElement = document.getElementById(idTask);
                if (!draggedElement) return;

                const fullNameObjectTask = draggedElement.getAttribute('fullNameObjectTask');
                const lastStatus = draggedElement.parentElement;
                if (block === lastStatus) return;
                
                const sourceGroup = lastStatus.closest('.group');
                const targetGroup = block.closest('.group');
                
                // При группировке по проектам запрещаем перенос между проектами
                if (currentGroupingType === 'project' && sourceGroup && targetGroup) {
                    if (sourceGroup.getAttribute('data-project-id') !== targetGroup.getAttribute('data-project-id')) {
                        return;
                    }
                }
                
                block.appendChild(draggedElement);
                
                const idNewStatus = block.id;
                const fullNameObjectStatus = block.getAttribute('fullNameObjectStatus');
                
                // Обновляем данные в хранилище
                const taskData = tasksData.get(idTask);
                if (taskData) {
                    taskData.status = idNewStatus;
                }
                
                const params = {
                    idTask,
                    fullNameObjectTask,
                    idNewStatus,
                    fullNameObjectStatus
                };
                
                // При группировке по исполнителям — обновляем исполнителя
                if (currentGroupingType === 'executor' && targetGroup) {
                    const idNewExecutor = targetGroup.getAttribute('data-executor-id');
                    const newExecutorName = targetGroup.getAttribute('data-executor-name');
                    
                    if (idNewExecutor) {
                        params.idNewExecutor = idNewExecutor;
                        
                        // Обновляем классы на карточке в DOM
                        const classList = Array.from(draggedElement.classList);
                        const oldUserClass = classList.find(c => c.startsWith('user') && !c.startsWith('user_name'));
                        const oldUserNameClass = classList.find(c => c.startsWith('user_name'));
                        
                        if (oldUserClass) draggedElement.classList.remove(oldUserClass);
                        if (oldUserNameClass) draggedElement.classList.remove(oldUserNameClass);
                        
                        draggedElement.classList.add(idNewExecutor);
                        const newUserNameClass = 'user_name' + newExecutorName.replace(/ /g, '_');
                        draggedElement.classList.add(newUserNameClass);
                        
                        // Обновляем данные в хранилище
                        if (taskData) {
                            taskData.user = idNewExecutor;
                            taskData.user_name = newUserNameClass;
                        }
                    }
                } else if (currentGroupingType === 'project') {
                    // При группировке по проектам — передаём текущего исполнителя (он не меняется)
                    const idNewExecutor = Array.from(draggedElement.classList).find(c => c.startsWith('user') && !c.startsWith('user_name'));
                    if (idNewExecutor) {
                        params.idNewExecutor = idNewExecutor;
                    }
                }
                
                RecalculateKanbanBlock();
                window.V8Proxy.fetch('changeStatus', params);
            });
        });

        document.querySelectorAll('.group-content .card').forEach(card => {
            initCardDragEvents(card);
        });
    };

    // Drag & drop для плоской доски
    const initDragDrop = () => {
        document.querySelectorAll('.kanban-block').forEach(block => {
            block.addEventListener('dragover', (e) => {
                e.preventDefault();
                block.classList.add('kanban-block--dragover');
            });

            block.addEventListener('dragleave', (e) => {
                if (!block.contains(e.relatedTarget)) {
                    block.classList.remove('kanban-block--dragover');
                }
            });

            block.addEventListener('drop', (e) => {
                e.preventDefault();
                block.classList.remove('kanban-block--dragover');

                const idTask = e.dataTransfer.getData("text");
                const draggedElement = document.getElementById(idTask);
                if (!draggedElement) return;

                const fullNameObjectTask = draggedElement.getAttribute('fullNameObjectTask');
                const lastStatus = draggedElement.parentElement;
                if (block === lastStatus) return;
                
                block.appendChild(draggedElement);
                
                const idNewStatus = block.id;
                const fullNameObjectStatus = block.getAttribute('fullNameObjectStatus');
                
                // Обновляем данные в хранилище
                const taskData = tasksData.get(idTask);
                if (taskData) taskData.status = idNewStatus;
                
                // Получаем текущего исполнителя карточки (он не меняется в режиме без группировки)
                const idNewExecutor = Array.from(draggedElement.classList).find(c => c.startsWith('user') && !c.startsWith('user_name'));
                
                RecalculateKanbanBlock();
                window.V8Proxy.fetch('changeStatus', { idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus, idNewExecutor });
            });
        });
    };

    // Инициализация перетаскивания карточек
    const initCardDrag = () => {
        document.querySelectorAll('.card').forEach(card => initCardDragEvents(card));
    };

    // Собираем данные карточек и структуру статусов из DOM
    saveStatusBlocks();
    collectCardsData();
    
    initGrouping();

    // ========== СВОРАЧИВАНИЕ ГРУПП ==========
    const initGroupCollapse = () => {
        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', () => {
                const group = header.closest('.group');
                group.classList.toggle('collapsed');
                RecalculateKanbanBlock();
            });
        });
    };

    initGroupCollapse();

    // Перетаскивание задач по статусам
    initDragDrop();
    initCardDrag();

    // Клик по фото исполнителя — фильтр по этому исполнителю
    document.addEventListener('click', (e) => {
        const photo = e.target.closest('.card__photo');
        if (!photo) return;
        const card = photo.closest('.card');
        if (!card) return;
        let userId = null;
        for (const cls of card.className.split(' ')) {
            if (cls.startsWith('user')) userId = cls;
        }
        if (!userId || !window.filterByExecutor) return;
        e.preventDefault();
        e.stopPropagation();
        window.filterByExecutor(userId);
    });

    // Клик по кружку проекта — фильтр по этому проекту
    document.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag_task');
        if (!tag) return;
        const card = tag.closest('.card');
        if (!card) return;
        const projectId = Array.from(card.classList).find(cls => cls.startsWith('project'));
        if (!projectId || !window.filterByProject) return;
        e.preventDefault();
        e.stopPropagation();
        window.filterByProject(projectId);
    });

    // Клик по иконке срочности — фильтр по этому уровню срочности
    document.addEventListener('click', (e) => {
        const wrap = e.target.closest('.card__urgency-wrap');
        if (!wrap) return;
        const card = wrap.closest('.card');
        if (!card) return;
        const urgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-'));
        const urgencyId = urgencyClass ? urgencyClass.replace('urgency-', '') : null;
        if (!urgencyId || !window.filterByUrgency) return;
        e.preventDefault();
        e.stopPropagation();
        window.filterByUrgency(urgencyId);
    });

    // Клик по иконке ошибки — фильтр по типу "Ошибка"
    document.addEventListener('click', (e) => {
        const bugIcon = e.target.closest('.card__bug-icon');
        if (!bugIcon) return;
        const card = bugIcon.closest('.card');
        if (!card) return;
        if (!window.filterByCardType) return;
        e.preventDefault();
        e.stopPropagation();
        window.filterByCardType('bug');
    });

    // ========== ПОИСК ПО ЗАДАЧАМ ==========
    const initSearch = () => {
        const searchInput = document.getElementById('search_input');
        const searchClear = document.getElementById('search_clear');
        const searchContainer = document.querySelector('.search_container');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.card');
            
            // Показать/скрыть крестик
            if (e.target.value.trim()) {
                searchContainer.classList.add('has-text');
            } else {
                searchContainer.classList.remove('has-text');
            }
            
            cards.forEach(card => {
                const cardTextSpan = card.querySelector('.card__text span');
                const text = cardTextSpan ? cardTextSpan.textContent.toLowerCase() : '';
                
                if (searchText === '') {
                    // Пустой поиск — убираем класс скрытия от поиска
                    card.classList.remove('card__search_hidden');
                } else if (text.includes(searchText)) {
                    card.classList.remove('card__search_hidden');
                } else {
                    card.classList.add('card__search_hidden');
                }
            });
            
            // Применяем фильтры проектов и исполнителей поверх поиска
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            }
            RecalculateKanbanBlock();
        });
        
        // Очистка по клику на крестик
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchContainer.classList.remove('has-text');
                
                // Убрать скрытие от поиска со всех карточек
                document.querySelectorAll('.card').forEach(card => {
                    card.classList.remove('card__search_hidden');
                });
                
                // Применить остальные фильтры
                if (window.applyExecutorFilter) {
                    window.applyExecutorFilter();
                }
                RecalculateKanbanBlock();
            });
        }
        
        // Экспортируем функцию для установки поиска из sendResponse
        window.setSearchQuery = (query) => {
            searchInput.value = query || '';
            
            // Показать/скрыть крестик
            if (query && query.trim()) {
                searchContainer.classList.add('has-text');
            } else {
                searchContainer.classList.remove('has-text');
            }
            
            // Применяем поиск
            const searchText = (query || '').toLowerCase().trim();
            const cards = document.querySelectorAll('.card');
            
            cards.forEach(card => {
                const cardTextSpan = card.querySelector('.card__text span');
                const text = cardTextSpan ? cardTextSpan.textContent.toLowerCase() : '';
                
                if (searchText === '') {
                    card.classList.remove('card__search_hidden');
                } else if (text.includes(searchText)) {
                    card.classList.remove('card__search_hidden');
                } else {
                    card.classList.add('card__search_hidden');
                }
            });
            
            // Применяем фильтры проектов и исполнителей
            if (window.applyExecutorFilter) {
                window.applyExecutorFilter();
            }
            RecalculateKanbanBlock();
        };
        
        // Функция для повторного применения текущего поиска (вызывается после смены группировки)
        window.applyCurrentSearch = () => {
            const searchText = searchInput.value.toLowerCase().trim();
            if (searchText === '') return; // Нет поиска — ничего не делаем
            
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                const cardTextSpan = card.querySelector('.card__text span');
                const text = cardTextSpan ? cardTextSpan.textContent.toLowerCase() : '';
                
                if (text.includes(searchText)) {
                    card.classList.remove('card__search_hidden');
                } else {
                    card.classList.add('card__search_hidden');
                }
            });
        };
    };

    initSearch();

    // ========== КНОПКА ОБНОВЛЕНИЯ ==========
    const initUpdateButton = () => {
        const updateButton = document.getElementById('update_svg');
        if (!updateButton) return;
        
        updateButton.addEventListener('click', () => {
            // Обращаемся к 1С с событием 'refresh'
            // V8Proxy.fetch автоматически добавит все параметры состояния доски:
            // theme, grouping, executorfilter, projectfilter
            window.V8Proxy.fetch('refresh', {});
        });
    };

    initUpdateButton();

    // Обновить иконки срочности на всех карточках (после смены настроек)
    window.refreshUrgencyIconsOnCards = () => {
        document.querySelectorAll('.card').forEach(card => {
            const urgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-'));
            const urgencyId = urgencyClass ? urgencyClass.replace('urgency-', '') : null;
            if (urgencyId) {
                const indicators = card.querySelector('.card__indicators');
                let wrap = card.querySelector('.card__urgency-wrap');
                const iconHtml = getUrgencyIconHtml(urgencyId);
                if (iconHtml) {
                    if (!wrap) {
                        wrap = document.createElement('div');
                        wrap.className = 'card__urgency-wrap';
                        if (indicators) {
                            const tagTask = indicators.querySelector('.tag_task');
                            indicators.insertBefore(wrap, tagTask ? tagTask.nextSibling : indicators.firstChild);
                        }
                    }
                    wrap.innerHTML = iconHtml;
                    wrap.style.display = '';
                } else if (wrap) {
                    wrap.innerHTML = '';
                    wrap.style.display = 'none';
                }
            }
        });
    };

    // Popover настроек срочности (иконка + цвет для одного уровня)
    const initSettingsPopover = () => {
        const popover = document.getElementById('urgency_settings_popover');
        const listEl = document.getElementById('urgency_settings_list');
        const titleEl = popover ? popover.querySelector('.urgency-popover__title') : null;
        const saveBtn = document.getElementById('urgency_popover_save');
        const cancelBtn = document.getElementById('urgency_popover_cancel');
        
        if (!popover || !listEl) return;
        
        let settingsSnapshot = null;
        let currentEditId = null;
        let draftSettings = {};
        
        const renderSingleUrgencySettings = (urgencyId) => {
            listEl.innerHTML = '';
            const s = draftSettings[urgencyId] || {};
            const iconId = s.iconId || 'fire';
            const colorId = s.colorId || 'red';
            const row = document.createElement('div');
            row.className = 'urgency_setting_row';
            row.innerHTML = `
                <div class="urgency_setting_icons" data-urgency-id="${urgencyId}">
                    ${URGENCY_ICON_IDS.map(iid => `
                        <button type="button" class="urgency_icon_btn ${iid === iconId ? 'selected' : ''}" data-icon="${iid}" title="${iid}">${URGENCY_ICONS[iid]}</button>
                    `).join('')}
                </div>
                <div class="urgency_setting_colors" data-urgency-id="${urgencyId}">
                    ${URGENCY_COLOR_IDS.map(cid => `
                        <button type="button" class="urgency_color_btn ${cid === colorId ? 'selected' : ''}" data-color="${cid}" style="background-color: ${URGENCY_COLORS[cid]}" title="${cid}"></button>
                    `).join('')}
                </div>
            `;
            listEl.appendChild(row);
            listEl.querySelectorAll('.urgency_icon_btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const wrap = btn.closest('.urgency_setting_icons');
                    const id = wrap.getAttribute('data-urgency-id');
                    if (!draftSettings[id]) draftSettings[id] = {};
                    draftSettings[id].iconId = btn.getAttribute('data-icon');
                    wrap.querySelectorAll('.urgency_icon_btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
            listEl.querySelectorAll('.urgency_color_btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const wrap = btn.closest('.urgency_setting_colors');
                    const id = wrap.getAttribute('data-urgency-id');
                    if (!draftSettings[id]) draftSettings[id] = {};
                    draftSettings[id].colorId = btn.getAttribute('data-color');
                    wrap.querySelectorAll('.urgency_color_btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
        };
        
        const positionPopover = (anchorEl) => {
            const rect = anchorEl.getBoundingClientRect();
            const popW = 300;
            let left = rect.right + 8;
            let top = rect.top;
            if (left + popW > window.innerWidth) {
                left = rect.left - popW - 8;
            }
            if (left < 4) left = 4;
            if (top + 300 > window.innerHeight) {
                top = Math.max(4, window.innerHeight - 340);
            }
            popover.style.left = left + 'px';
            popover.style.top = top + 'px';
        };
        
        const closePopover = (applyChanges) => {
            if (applyChanges) {
                boardSettings.urgencySettings = JSON.parse(JSON.stringify(draftSettings));
                window.V8Proxy.fetch('settingsChanged', {});
                window.refreshUrgencyIconsOnCards();
                if (window.populateUrgencyMenu) window.populateUrgencyMenu();
            } else if (settingsSnapshot) {
                boardSettings.urgencySettings = JSON.parse(settingsSnapshot);
            }
            popover.classList.remove('open');
            popover.setAttribute('aria-hidden', 'true');
            settingsSnapshot = null;
            currentEditId = null;
        };
        
        window.openUrgencySettingsPopover = (urgencyId, name, anchorEl) => {
            closeAllDropdowns();
            if (popover.classList.contains('open') && currentEditId === urgencyId) {
                closePopover(false);
                return;
            }
            settingsSnapshot = JSON.stringify(boardSettings.urgencySettings);
            draftSettings = JSON.parse(JSON.stringify(boardSettings.urgencySettings));
            currentEditId = urgencyId;
            if (titleEl) titleEl.textContent = 'Настройка: ' + (name || urgencyId);
            renderSingleUrgencySettings(urgencyId);
            positionPopover(anchorEl);
            popover.classList.add('open');
            popover.setAttribute('aria-hidden', 'false');
        };
        
        if (saveBtn) saveBtn.addEventListener('click', () => closePopover(true));
        if (cancelBtn) cancelBtn.addEventListener('click', () => closePopover(false));
        
        document.addEventListener('mousedown', (e) => {
            if (!popover.classList.contains('open')) return;
            if (popover.contains(e.target)) return;
            closePopover(false);
        });
        
        popover.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopover(false);
        });
    };
    
    initSettingsPopover();

    // document.querySelectorAll('.add_task').forEach(button => {
    //     button.addEventListener('click', (event) => {
    //         // логика добавления задачи, возможно, с извлечением ID статуса из класса
    //         // const statusClass = Array.from(event.currentTarget.classList).find(cls => cls.startsWith('status'));
    //         // const statusId = statusClass ? statusClass.replace('status', '') : null;
    //         // console.log('Добавить задачу в статус:', statusId);

    //     });
    // });

    // Подсветка блока под перетаскиваемыми задачами
    const blockHeaders = document.querySelectorAll('.block_header');
    const kanbanBlocks = document.querySelectorAll('.kanban-block');
    kanbanBlocks.forEach((kanbanBlock, index) => {
        const correspondingHeader = blockHeaders[index];

        // Добавляем обработчик события 'mouseenter' (наведение курсора)
        kanbanBlock.addEventListener('mouseenter', () => {
            if (correspondingHeader) { // Проверяем, что заголовок существует
                correspondingHeader.classList.add('block_header--hovered');
            }
        });

        // Добавляем обработчик события 'mouseleave' (уход курсора)
        kanbanBlock.addEventListener('mouseleave', () => {
            if (correspondingHeader) {
                correspondingHeader.classList.remove('block_header--hovered');
            }
        });
    });

    // Функция для повторной инициализации (вызывается из 1С после перерисовки)
    window.reinitKanban = () => {
        // Пересобираем проекты из чекбоксов (от 1С)
        if (window.collectProjectsFromCheckboxes) {
            window.collectProjectsFromCheckboxes();
        }
        if (window.updateProjectPicker) {
            window.updateProjectPicker();
        }
        // Обновляем меню исполнителей и применяем фильтр
        if (window.populateExecutorMenu) {
            window.populateExecutorMenu();
        }
        if (window.populateUrgencyMenu) {
            window.populateUrgencyMenu();
        }
        if (window.applyExecutorFilter) {
            window.applyExecutorFilter();
        }
        initGroupCollapse();
        RecalculateKanbanBlock();
    };

    // Пересчёт лимита карточек при изменении размера окна
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            RecalculateKanbanBlock();
        }, 150);
    });

    // Применяем начальные настройки доски из script#board-settings (генерируется 1С при построении страницы)
    const scriptEl = document.getElementById('board-settings');
    if (scriptEl && scriptEl.textContent && scriptEl.textContent.trim() !== '{}') {
        try {
            applyBoardSettingsFromData(JSON.parse(scriptEl.textContent));
        } catch (e) {
            console.error('board-settings: Failed to parse JSON:', e);
        }
    }
});

// ========== CARD LIMIT (ограничение видимых карточек в колонке) ==========
const expandedBlocks = new Set();

const getBlockKey = (block) => {
    const group = block.closest('.group');
    if (group) {
        return (group.getAttribute('data-executor-id') || group.getAttribute('data-project-id') || '') + '|' + block.id;
    }
    return block.id;
};

const limitBlockCards = (block, availableHeight, linkReserve) => {
    if (expandedBlocks.has(getBlockKey(block))) return;

    const visibleCards = Array.from(
        block.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)')
    );
    if (visibleCards.length === 0) return;

    let totalHeight = 0;
    let limitIndex = visibleCards.length;

    for (let i = 0; i < visibleCards.length; i++) {
        const cs = getComputedStyle(visibleCards[i]);
        const cardH = visibleCards[i].offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        const isLast = i === visibleCards.length - 1;
        const maxH = isLast ? availableHeight : availableHeight - linkReserve;

        if (totalHeight + cardH > maxH) {
            limitIndex = i;
            break;
        }
        totalHeight += cardH;
    }

    if (limitIndex >= visibleCards.length) return;
    if (limitIndex < 1) limitIndex = 1;

    for (let i = limitIndex; i < visibleCards.length; i++) {
        visibleCards[i].classList.add('card__overflow_hidden');
    }

    const link = document.createElement('span');
    link.className = 'show_all_link';
    link.textContent = 'Показать все (' + visibleCards.length + ')';
    link.addEventListener('click', () => {
        expandedBlocks.add(getBlockKey(block));
        applyCardLimits();
    });
    block.appendChild(link);
};

function applyCardLimits() {
    document.querySelectorAll('.card__overflow_hidden').forEach(c => c.classList.remove('card__overflow_hidden'));
    document.querySelectorAll('.show_all_link').forEach(l => l.remove());

    const kanbanBoard = document.getElementById('kanban-board');
    if (!kanbanBoard) return;

    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const vH = window.innerHeight;
    const linkReserve = 3 * remPx;
    if (kanbanBoard.classList.contains('grouped')) return;

    {
        const headerH = 11.8 * remPx;
        kanbanBoard.querySelectorAll('.kanban-block').forEach(block => {
            const bs = getComputedStyle(block);
            const avail = vH - headerH - parseFloat(bs.paddingTop) - parseFloat(bs.paddingBottom);
            limitBlockCards(block, avail, linkReserve);
        });
    }
}

// Обновление счетчиков задач в блоках
const kanbanBlocks = document.querySelectorAll('.kanban-block');
function RecalculateKanbanBlock() {
    const kanbanBoard = document.getElementById('kanban-board');
    const isGrouped = kanbanBoard && kanbanBoard.classList.contains('grouped');
    
    let block_headers = document.querySelectorAll('.block_header');
    
    if (isGrouped) {
        // При группировке считаем задачи во всех группах для данного статуса
        block_headers.forEach((block_header, index) => {
            let count = 0;
            document.querySelectorAll('.group').forEach(group => {
                const groupBlocks = group.querySelectorAll('.kanban-block');
                if (groupBlocks[index]) {
                    count += groupBlocks[index].querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)').length;
                }
            });
            let number = block_header.querySelector('.kanban-block__number');
            if (number) {
                number.textContent = count;
            }
        });
    } else {
        // Без группировки - обычный подсчёт
        kanbanBlocks.forEach((kanbanBlock, index) => {
            let tasks = kanbanBlock.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)');
            let block_header = block_headers[index];
            if (block_header) {
                let number = block_header.querySelector('.kanban-block__number');
                if (number) {
                    number.textContent = tasks.length;
                }
            }
        });
    }

    // Счётчики в заголовках групп
    document.querySelectorAll('.group').forEach(group => {
        const groupCount = group.querySelector('.group-count');
        if (groupCount) {
            const visibleCards = group.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)');
            groupCount.textContent = visibleCards.length;
        }
    });

    applyCardLimits();
}

RecalculateKanbanBlock();
