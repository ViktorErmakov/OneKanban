import './style.css';

// ============================================================
// СЕКЦИЯ 1: КОНСТАНТЫ
// Настройки доски, иконки/цвета срочности, типы карточек.
// ============================================================

// Глобальные настройки доски, заполняются из 1С через sendResponse
const boardSettings = {
    currentUserId: null,
    currentUserName: null,
    urgencyLevels: [],
    urgencySettings: {},
};

window.boardSettings = boardSettings;

const URGENCY_ICONS = {
    arrowDoubleUp: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M6 17.59L7.41 19 12 14.42 16.59 19 18 17.59l-6-6z"/><path d="M6 11l1.41 1.41L12 7.83l4.59 4.58L18 11l-6-6z"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z"/></svg>',
    equals: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M4 9h16v2H4zm0 4h16v2H4z"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
    lightning: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
    exclamation: '<svg viewBox="0 0 24 24" fill="currentColor" class="urgency-icon-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
};

const URGENCY_COLORS = {
    red: '#c62828',
    orange: '#e65100',
    amber: '#ff8f00',
    yellow: '#f9a825',
    green: '#2e7d32',
    blue: '#1565c0',
};

const URGENCY_ICON_IDS = Object.keys(URGENCY_ICONS);
const URGENCY_COLOR_IDS = Object.keys(URGENCY_COLORS);
const MAX_VISIBLE_PROJECTS = 3;

const CARD_TYPES = [
    { id: 'task', name: 'Задача' },
    { id: 'bug', name: 'Ошибка' },
];

// ============================================================
// СЕКЦИЯ 2: СОСТОЯНИЕ
// Все мутабельные данные приложения в одном месте.
// ============================================================

// Хранилище задач: idTask → { idTask, status, project, user, ... }
const tasksData = new Map();
window.tasksData = tasksData;

const expandedBlocks = new Set();          // Колонки, где пользователь нажал «Ещё N» (снят лимит карточек)
let currentGroupingType = 'none';          // Текущая группировка: 'none' | 'executor' | 'project'
let statusBlocksData = null;               // Снимок структуры статусов (колонок) при первой группировке
let selectedExecutorsSet = new Set();      // Выбранные исполнители в фильтре
let selectedUrgenciesSet = new Set();      // Выбранные уровни срочности в фильтре
let selectedCardTypesSet = new Set();      // Выбранные типы карточек (задача/ошибка) в фильтре
let projectsList = [];                     // Список проектов из 1С: [{ id, name, color, checked }]
let draggingCardProjectId = null;          // ID проекта перетаскиваемой карточки (для запрета переноса между проектами)

// ============================================================
// СЕКЦИЯ 3: ЧИСТЫЕ ФУНКЦИИ
// Не зависят от DOM-замыканий, можно вызывать в любой момент.
// ============================================================

// Возвращает { svg, color } для иконки срочности или '' если не задана
const getUrgencyIconHtml = (urgencyId) => {
    if (!urgencyId || !boardSettings.urgencySettings[urgencyId]) return '';
    const { iconId, colorId } = boardSettings.urgencySettings[urgencyId];
    const icon = URGENCY_ICON_IDS.includes(iconId) ? URGENCY_ICONS[iconId] : URGENCY_ICONS[URGENCY_ICON_IDS[0]];
    const color = URGENCY_COLOR_IDS.includes(colorId) ? URGENCY_COLORS[colorId] : URGENCY_COLORS.red;
    return { svg: icon, color };
};

// Показывает/скрывает карточки по тексту поиска (CSS-класс card__search_hidden)
const filterCardsBySearch = (searchText) => {
    document.querySelectorAll('.card').forEach(card => {
        const cardTextSpan = card.querySelector('.card__text span');
        const text = cardTextSpan ? cardTextSpan.textContent.toLowerCase() : '';

        if (searchText === '' || text.includes(searchText)) {
            card.classList.remove('card__search_hidden');
        } else {
            card.classList.add('card__search_hidden');
        }
    });
};

// Уникальный ключ колонки с учётом группы (для хранения состояния «развёрнутости»)
const getBlockKey = (block) => {
    const group = block.closest('.group');
    if (group) {
        return (group.getAttribute('data-executor-id') || group.getAttribute('data-project-id') || '') + '|' + block.id;
    }
    return block.id;
};

// Ограничивает количество видимых карточек в колонке по высоте экрана.
// Если карточки не помещаются — скрывает лишние и показывает ссылку «Ещё N».
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
        const reserve = isLast ? 0 : linkReserve;

        if (totalHeight + cardH + reserve > availableHeight) {
            limitIndex = i;
            break;
        }
        totalHeight += cardH;
    }

    if (limitIndex >= visibleCards.length) {
        const existingLink = block.querySelector('.show-more-link');
        if (existingLink) existingLink.remove();
        return;
    }

    for (let i = limitIndex; i < visibleCards.length; i++) {
        visibleCards[i].style.display = 'none';
    }

    const hiddenCount = visibleCards.length - limitIndex;
    let link = block.querySelector('.show-more-link');
    if (!link) {
        link = document.createElement('span');
        link.className = 'show-more-link';
        link.addEventListener('click', () => {
            expandedBlocks.add(getBlockKey(block));
            applyCardLimits();
        });
        block.appendChild(link);
    }
    link.textContent = 'Ещё ' + hiddenCount;
    link.style.display = '';
};

// Пересчитывает лимиты карточек для всех колонок доски
function applyCardLimits() {
    document.querySelectorAll('.kanban-block').forEach(block => {
        block.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)').forEach(c => {
            c.style.display = '';
        });
        const link = block.querySelector('.show-more-link');
        if (link) link.style.display = 'none';
    });

    document.querySelectorAll('.kanban-block').forEach(block => {
        if (expandedBlocks.has(getBlockKey(block))) return;
        const blockRect = block.getBoundingClientRect();
        const maxH = window.innerHeight - blockRect.top - 16;
        if (maxH <= 0) return;
        limitBlockCards(block, maxH, 28);
    });
}

// Пересчитывает счётчики карточек в заголовках колонок и групп, затем применяет лимиты
function RecalculateKanbanBlock() {
    const kanbanBoard = document.getElementById('kanban-board');
    const isGrouped = kanbanBoard && kanbanBoard.classList.contains('grouped');
    const blockHeaders = document.querySelectorAll('.block_header');

    if (isGrouped) {
        blockHeaders.forEach((header, index) => {
            let count = 0;
            document.querySelectorAll('.group').forEach(group => {
                const groupBlocks = group.querySelectorAll('.kanban-block');
                if (groupBlocks[index]) {
                    count += groupBlocks[index].querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)').length;
                }
            });
            const number = header.querySelector('.kanban-block__number');
            if (number) number.textContent = count;
        });
    } else {
        document.querySelectorAll('.kanban-block').forEach((kanbanBlock, index) => {
            const tasks = kanbanBlock.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)');
            const header = blockHeaders[index];
            if (header) {
                const number = header.querySelector('.kanban-block__number');
                if (number) number.textContent = tasks.length;
            }
        });
    }

    document.querySelectorAll('.group').forEach(group => {
        const groupCount = group.querySelector('.group-count');
        if (groupCount) {
            groupCount.textContent = group.querySelectorAll('.card:not(.card__inactive):not(.card__search_hidden)').length;
        }
    });

    applyCardLimits();
}

// ============================================================
// СЕКЦИЯ 4: DOM-ФУНКЦИИ (карточки, группировка, drag & drop)
// Создание, обновление и перемещение карточек; Drag & Drop.
// ============================================================

// Обновляет CSS-классы и иконку срочности на карточке.
// Передаётся undefined для полей, которые не нужно менять.
const updateCardClasses = (card, project, user, user_name, urgencyId, isBug) => {
    const classList = Array.from(card.classList);
    const currentProject = classList.find(cls => cls.startsWith('project')) || '';
    const currentUser = classList.find(cls => cls.startsWith('user') && !cls.startsWith('user_name')) || '';
    const currentUserNameClass = classList.find(cls => cls.startsWith('user_name')) || '';

    if (project !== undefined && project !== currentProject) {
        if (currentProject) card.classList.remove(currentProject);
        if (project) card.classList.add(project);
        const tagTask = card.querySelector('.tag_task');
        if (tagTask) {
            const pd = project ? projectsList.find(p => p.id === project) : null;
            tagTask.title = pd ? pd.name : '';
            if (pd && pd.color) tagTask.style.setProperty('--project-color', pd.color);
        }
    }

    if (user !== undefined && user !== currentUser) {
        if (currentUser) card.classList.remove(currentUser);
        if (user) card.classList.add(user);
    }

    const newUserNameClass = user_name ? user_name.split(' ').join('_') : '';
    if (user_name !== undefined && newUserNameClass !== currentUserNameClass) {
        if (currentUserNameClass) card.classList.remove(currentUserNameClass);
        if (newUserNameClass) card.classList.add(newUserNameClass);
    }

    if (urgencyId !== undefined) {
        const currentUrgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-')) || '';
        const newUrgencyClass = urgencyId ? 'urgency-' + urgencyId : '';
        if (newUrgencyClass !== currentUrgencyClass) {
            if (currentUrgencyClass) card.classList.remove(currentUrgencyClass);
            if (newUrgencyClass) card.classList.add(newUrgencyClass);
        }
        let urgencyEl = card.querySelector('.card__urgency-wrap');
        const iconData = getUrgencyIconHtml(urgencyId);
        const urgencyLevel = urgencyId && boardSettings.urgencyLevels
            ? boardSettings.urgencyLevels.find(l => l.id === urgencyId) : null;
        const urgencyTitle = urgencyLevel ? urgencyLevel.name : '';
        if (iconData) {
            if (!urgencyEl) {
                urgencyEl = document.createElement('div');
                urgencyEl.className = 'card__urgency-wrap';
                const textEl = card.querySelector('.card__text');
                if (textEl) textEl.insertBefore(urgencyEl, textEl.firstChild);
            }
            urgencyEl.innerHTML = iconData.svg;
            urgencyEl.style.color = iconData.color;
            urgencyEl.title = urgencyTitle;
            urgencyEl.style.display = '';
        } else if (urgencyEl) {
            urgencyEl.innerHTML = '';
            urgencyEl.style.display = 'none';
        }
    }

    if (isBug !== undefined) {
        card.classList.toggle('card-type-bug', !!isBug);
    }
};

// Обновляет содержимое карточки: ссылку, фото, текст, полное имя объекта
const updateCardContent = (card, linkHref, linkName, photoSrc, altText, textContent, fullnameobjecttask) => {
    const link = card.querySelector('.card__link');
    if (link) {
        if (linkHref !== undefined) {
            const currentHref = link.getAttribute('href') || '';
            if (currentHref !== linkHref) link.setAttribute('href', linkHref);
        }
        if (linkName !== undefined && link.textContent !== linkName) {
            link.textContent = linkName;
        }
    }

    const photo = card.querySelector('.card__photo');
    if (photo) {
        if (photoSrc !== undefined && photo.src !== photoSrc) photo.src = photoSrc;
        if (altText !== undefined && photo.alt !== altText) {
            photo.alt = altText;
            photo.title = altText;
        }
    }

    const textSpan = card.querySelector('.card__text span');
    if (textSpan && textContent !== undefined && textSpan.textContent !== textContent) {
        textSpan.textContent = textContent;
    }

    if (fullnameobjecttask !== undefined) {
        const currentAttr = card.getAttribute('fullNameObjectTask') || '';
        if (currentAttr !== fullnameobjecttask) card.setAttribute('fullNameObjectTask', fullnameobjecttask);
    }
};

// Перемещает карточку в нужную колонку (статус), учитывая текущую группировку
const moveCardToStatus = (card, statusId) => {
    let targetBlock = null;

    if (currentGroupingType === 'executor') {
        const userClass = Array.from(card.classList).find(cls => cls.startsWith('user') && !cls.startsWith('user_name'));
        if (userClass) {
            const group = document.querySelector('.group[data-executor-id="' + userClass + '"]');
            if (group) targetBlock = group.querySelector('.kanban-block[id="' + statusId + '"]');
        }
    } else if (currentGroupingType === 'project') {
        const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
        if (projectClass) {
            const group = document.querySelector('.group[data-project-id="' + projectClass + '"]');
            if (group) targetBlock = group.querySelector('.kanban-block[id="' + statusId + '"]');
        }
    } else {
        targetBlock = document.getElementById(statusId);
    }

    if (targetBlock && card.parentElement !== targetBlock) {
        targetBlock.appendChild(card);
        const taskData = tasksData.get(card.id);
        if (taskData) taskData.status = statusId;
    }
};

// Создаёт DOM-элемент карточки из объекта данных
const createCardFromData = (data) => {
    const card = document.createElement('div');
    const userNameClass = data.user_name ? data.user_name.split(' ').join('_') : '';
    card.className = ('card ' + (data.project || '') + ' ' + (data.user || '') + ' ' + userNameClass).trim();
    card.id = data.idTask;
    card.draggable = true;
    if (data.fullnameobjecttask) {
        card.setAttribute('fullNameObjectTask', data.fullnameobjecttask);
    }

    let projectColorStyle = '';
    if (data.project && projectsList.length > 0) {
        const project = projectsList.find(p => p.id === data.project);
        if (project && project.color) {
            projectColorStyle = 'style="--project-color: ' + project.color + '"';
        }
    }

    const urgencyClass = data.urgencyId ? 'urgency-' + data.urgencyId : '';
    const urgencyIconData = getUrgencyIconHtml(data.urgencyId);
    if (urgencyClass) card.classList.add(urgencyClass);

    if (data.isBug) card.classList.add('card-type-bug');

    const projectTitle = (data.project && projectsList.length > 0)
        ? (projectsList.find(p => p.id === data.project) || {}).name || ''
        : '';
    const urgencyTitle = (data.urgencyId && boardSettings.urgencyLevels)
        ? (boardSettings.urgencyLevels.find(l => l.id === data.urgencyId) || {}).name || ''
        : '';
    const executorTitle = data.alt || '';

    const urgencyWrapHtml = urgencyIconData
        ? '<div class="card__urgency-wrap" title="' + urgencyTitle + '" style="color: ' + urgencyIconData.color + '">' + urgencyIconData.svg + '</div>'
        : '';

    card.innerHTML =
        '<div class="card__header">' +
            '<div class="tag_task" ' + projectColorStyle + ' title="' + projectTitle + '"></div>' +
            '<a class="card__link" href="' + (data.card__link_href || '#') + '">' + (data.card__link_name || '') + '</a>' +
            '<img class="card__photo" alt="' + (data.alt || '') + '" title="' + executorTitle + '" src="' + (data.card__photo || '') + '">' +
        '</div>' +
        '<div class="card__text">' + urgencyWrapHtml + '<span>' + (data.card__text || '') + '</span></div>';

    return card;
};

// Навешивает обработчики dragstart/dragend на карточку
const initCardDragEvents = (card) => {
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text', e.target.id);
        const projectClass = Array.from(e.target.classList).find(cls => cls.startsWith('project'));
        draggingCardProjectId = projectClass || null;
    });

    card.addEventListener('dragend', () => {
        draggingCardProjectId = null;
        document.querySelectorAll('.kanban-block--drop-forbidden').forEach(block => {
            block.classList.remove('kanban-block--drop-forbidden');
        });
    });
};

// Находит колонку для новой карточки с учётом группировки
const findTargetBlockForNewCard = (card, statusId) => {
    if (currentGroupingType === 'executor') {
        const userClass = Array.from(card.classList).find(cls => cls.startsWith('user'));
        if (userClass) {
            const group = document.querySelector('.group[data-executor-id="' + userClass + '"]');
            if (group) return group.querySelector('.kanban-block[id="' + statusId + '"]');
        }
    } else if (currentGroupingType === 'project') {
        const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
        if (projectClass) {
            const group = document.querySelector('.group[data-project-id="' + projectClass + '"]');
            if (group) return group.querySelector('.kanban-block[id="' + statusId + '"]');
        }
    }

    return document.querySelector('.kanban-block[id="' + statusId + '"]');
};

// Обрабатывает одну задачу из 1С: обновляет данные в Map и DOM.
// Если карточка уже есть — обновляет поля, если нет — создаёт новую.
const processTask = (taskData) => {
    const { idTask, status } = taskData;
    if (!idTask) return;

    const existing = tasksData.get(idTask);
    if (existing) {
        Object.keys(taskData).forEach(key => {
            if (taskData[key] !== undefined) existing[key] = taskData[key];
        });
    } else {
        tasksData.set(idTask, Object.assign({}, taskData));
    }

    const cardInDOM = document.getElementById(idTask);
    if (cardInDOM) {
        updateCardClasses(cardInDOM, taskData.project, taskData.user, taskData.user_name, taskData.urgencyId, taskData.isBug);
        updateCardContent(cardInDOM, taskData.card__link_href, taskData.card__link_name,
            taskData.card__photo, taskData.alt, taskData.card__text, taskData.fullnameobjecttask);
        if (status) moveCardToStatus(cardInDOM, status);
    } else if (status) {
        const card = createCardFromData(tasksData.get(idTask));
        const targetBlock = findTargetBlockForNewCard(card, status);
        if (targetBlock) {
            targetBlock.appendChild(card);
            initCardDragEvents(card);
        }
    }
};

// Сохраняет начальную структуру колонок (статусов) для восстановления при снятии группировки
const saveStatusBlocks = () => {
    if (statusBlocksData) return;
    statusBlocksData = [];
    document.querySelectorAll('#kanban-board .kanban-block').forEach(block => {
        statusBlocksData.push({
            id: block.id,
            fullName: block.getAttribute('fullNameObjectStatus'),
            className: block.className,
        });
    });
};

// Считывает данные всех карточек из DOM в Map tasksData (начальный сбор при загрузке)
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

        tasksData.set(card.id, {
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
            status: statusBlock ? statusBlock.id : null,
        });

        updateCardClasses(card, undefined, undefined, undefined, urgencyId, isBug);
    });
};

// Создаёт колонки (по шаблону statusBlocksData) внутри контейнера группы и раскладывает задачи
const buildGroupBlocks = (content, tasks) => {
    statusBlocksData.forEach(blockData => {
        const block = document.createElement('div');
        block.className = 'kanban-block';
        block.id = blockData.id;
        block.setAttribute('fullNameObjectStatus', blockData.fullName);

        tasks.filter(t => t.status === blockData.id).forEach(td => {
            block.appendChild(createCardFromData(td));
        });

        content.appendChild(block);
    });
};

// Drag & Drop для режима группировки: запрещает перенос между группами-проектами,
// разрешает перенос между исполнителями с обновлением карточки
const setupDragDropForGroups = () => {
    document.querySelectorAll('.group-content .kanban-block').forEach(block => {
        block.addEventListener('dragover', (e) => {
            e.preventDefault();

            if (currentGroupingType === 'project' && draggingCardProjectId) {
                const targetGroup = block.closest('.group');
                const targetProjectId = targetGroup ? targetGroup.getAttribute('data-project-id') : null;

                if (targetProjectId && draggingCardProjectId !== targetProjectId) {
                    block.classList.remove('kanban-block--dragover');
                    block.classList.add('kanban-block--drop-forbidden');
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }
            }

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

            const idTask = e.dataTransfer.getData('text');
            const draggedElement = document.getElementById(idTask);
            if (!draggedElement) return;

            const fullNameObjectTask = draggedElement.getAttribute('fullNameObjectTask');
            const lastStatus = draggedElement.parentElement;
            if (block === lastStatus) return;

            const sourceGroup = lastStatus.closest('.group');
            const targetGroup = block.closest('.group');

            if (currentGroupingType === 'project' && sourceGroup && targetGroup) {
                if (sourceGroup.getAttribute('data-project-id') !== targetGroup.getAttribute('data-project-id')) {
                    return;
                }
            }

            block.appendChild(draggedElement);

            const idNewStatus = block.id;
            const fullNameObjectStatus = block.getAttribute('fullNameObjectStatus');
            const taskData = tasksData.get(idTask);
            if (taskData) taskData.status = idNewStatus;

            const params = { idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus };

            // При группировке по исполнителям: перенос карточки в другую группу
            // меняет исполнителя задачи (обновляет CSS-классы и данные в Map)
            if (currentGroupingType === 'executor' && targetGroup) {
                const idNewExecutor = targetGroup.getAttribute('data-executor-id');
                const newExecutorName = targetGroup.getAttribute('data-executor-name');

                if (idNewExecutor) {
                    params.idNewExecutor = idNewExecutor;

                    const cl = Array.from(draggedElement.classList);
                    const oldUserClass = cl.find(c => c.startsWith('user') && !c.startsWith('user_name'));
                    const oldUserNameClass = cl.find(c => c.startsWith('user_name'));

                    if (oldUserClass) draggedElement.classList.remove(oldUserClass);
                    if (oldUserNameClass) draggedElement.classList.remove(oldUserNameClass);

                    draggedElement.classList.add(idNewExecutor);
                    const newUserNameClass = 'user_name' + newExecutorName.replace(/ /g, '_');
                    draggedElement.classList.add(newUserNameClass);

                    if (taskData) {
                        taskData.user = idNewExecutor;
                        taskData.user_name = newUserNameClass;
                    }
                }
            } else if (currentGroupingType === 'project') {
                const idNewExecutor = Array.from(draggedElement.classList).find(c => c.startsWith('user') && !c.startsWith('user_name'));
                if (idNewExecutor) params.idNewExecutor = idNewExecutor;
            }

            RecalculateKanbanBlock();
            window.V8Proxy.fetch('changeStatus', params);
        });
    });

    document.querySelectorAll('.group-content .card').forEach(card => initCardDragEvents(card));
};

// Drag & Drop для обычного режима (без группировки): перетаскивание карточки между колонками
const setupDragDrop = () => {
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

            const idTask = e.dataTransfer.getData('text');
            const draggedElement = document.getElementById(idTask);
            if (!draggedElement) return;

            const fullNameObjectTask = draggedElement.getAttribute('fullNameObjectTask');
            const lastStatus = draggedElement.parentElement;
            if (block === lastStatus) return;

            block.appendChild(draggedElement);

            const idNewStatus = block.id;
            const fullNameObjectStatus = block.getAttribute('fullNameObjectStatus');
            const taskData = tasksData.get(idTask);
            if (taskData) taskData.status = idNewStatus;

            const idNewExecutor = Array.from(draggedElement.classList).find(c => c.startsWith('user') && !c.startsWith('user_name'));

            RecalculateKanbanBlock();
            window.V8Proxy.fetch('changeStatus', { idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus, idNewExecutor });
        });
    });
};

// Инициализация событий dragstart/dragend для всех существующих карточек
const setupCardDrag = () => {
    document.querySelectorAll('.card').forEach(card => initCardDragEvents(card));
};

// ============================================================
// СЕКЦИЯ 5: ИНИЦИАЛИЗАЦИЯ (DOMContentLoaded)
// Здесь создаются все UI-контроллеры (тема, фильтры, группировка,
// поиск и т.д.), а в конце определяется V8Proxy для связи с 1С.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    saveStatusBlocks();
    collectCardsData();

    // Закрывает все выпадающие меню, кроме переданного (except)
    const closeAllDropdowns = (except) => {
        ['.project_picker', '.executor_dropdown', '.urgency_dropdown', '.cardtype_dropdown', '.grouping_dropdown']
            .forEach(sel => {
                const el = document.querySelector(sel);
                if (el && el !== except) el.classList.remove('open');
            });
    };

    // Переключатель светлой/тёмной темы.
    // Возвращает контроллер: apply(theme), getCurrent()
    const initTheme = () => {
        const toggle = document.getElementById('theme_toggle');
        const wrapper = document.getElementById('wrapper');

        toggle.addEventListener('click', () => {
            wrapper.classList.toggle('dark-theme');
            toggle.classList.toggle('active');
            window.V8Proxy.fetch('settingsChanged', {});
        });

        return {
            apply: (theme) => {
                wrapper.classList.toggle('dark-theme', theme === 'dark');
                toggle.classList.toggle('active', theme === 'dark');
            },
            getCurrent: () => wrapper.classList.contains('dark-theme') ? 'dark' : 'light',
        };
    };

    // Выбор проектов: выпадающий список с чекбоксами, «пилюли» выбранных проектов.
    // Возвращает контроллер: updateDisplay(), parseProjects(), filterByProject(id), setSelected(ids)
    const initProjectPicker = () => {
        const picker = document.querySelector('.project_picker');
        const toggle = document.getElementById('project_picker_toggle');
        const selectedContainer = document.getElementById('project_picker_selected');
        const grid = document.getElementById('project_picker_grid');
        const moreCounter = document.getElementById('project_picker_more');

        if (!picker || !toggle) return null;

        const parseProjects = () => {
            const scriptEl = document.getElementById('projects-data');
            if (!scriptEl) { projectsList = []; return; }
            try {
                const data = JSON.parse(scriptEl.textContent || '[]');
                projectsList = Array.isArray(data) ? data.map(p => ({
                    id: p.id || '', name: p.name || '', color: p.color || null, checked: false,
                })) : [];
            } catch (e) {
                console.error('projects-data: Failed to parse JSON:', e);
                projectsList = [];
            }
            projectsList.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        };

        parseProjects();

        const updateDisplay = () => {
            selectedContainer.innerHTML = '';
            grid.innerHTML = '';

            const selected = projectsList.filter(p => p.checked);
            const visible = selected.slice(0, MAX_VISIBLE_PROJECTS);
            const hiddenCount = selected.length - MAX_VISIBLE_PROJECTS;

            if (selected.length === 0 && projectsList.length > 0) {
                const placeholder = document.createElement('span');
                placeholder.className = 'project_picker_placeholder';
                placeholder.textContent = 'Выберите проект';
                selectedContainer.appendChild(placeholder);
                picker.classList.add('no-selection');
            } else {
                picker.classList.remove('no-selection');
                visible.forEach(project => {
                    const pill = document.createElement('div');
                    pill.className = 'project_pill';
                    pill.setAttribute('data-project-id', project.id);
                    if (project.color) pill.style.setProperty('--project-color', project.color);
                    pill.innerHTML =
                        '<span class="project_pill_name">' + project.name + '</span>' +
                        '<span class="project_pill_close">\u00d7</span>';
                    pill.addEventListener('click', (e) => { e.stopPropagation(); toggleProject(project.id); });
                    selectedContainer.appendChild(pill);
                });
            }

            moreCounter.textContent = hiddenCount > 0 ? '+' + hiddenCount : '';

            projectsList.forEach(project => {
                const item = document.createElement('div');
                item.className = 'project_grid_item' + (project.checked ? ' selected' : '');
                item.setAttribute('data-project-id', project.id);
                if (project.color) item.style.setProperty('--project-color', project.color);
                item.textContent = project.name;
                item.addEventListener('click', (e) => { e.stopPropagation(); toggleProject(project.id); });
                grid.appendChild(item);
            });

            if (projectsList.length > 1) {
                const separator = document.createElement('div');
                separator.className = 'project_grid_separator';
                grid.appendChild(separator);

                const allSelected = projectsList.every(p => p.checked);
                const selectAllItem = document.createElement('div');
                selectAllItem.className = 'project_grid_item project_grid_item_all' + (allSelected ? ' selected' : '');
                selectAllItem.textContent = 'Выбрать все';
                selectAllItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const shouldSelect = !projectsList.every(p => p.checked);
                    projectsList.forEach(p => { p.checked = shouldSelect; });
                    const wasOpen = picker.classList.contains('open');
                    updateDisplay();
                    executorCtrl.applyFilter();
                    window.V8Proxy.fetch('settingsChanged', {});
                    if (wasOpen) picker.classList.add('open');
                });
                grid.appendChild(selectAllItem);
            }
        };

        const toggleProject = (projectId) => {
            const project = projectsList.find(p => p.id === projectId);
            if (!project) return;
            const wasOpen = picker.classList.contains('open');
            project.checked = !project.checked;
            updateDisplay();
            executorCtrl.applyFilter();
            window.V8Proxy.fetch('settingsChanged', {});
            if (wasOpen) picker.classList.add('open');
        };

        toggle.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(picker); picker.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!picker.contains(e.target)) picker.classList.remove('open'); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && picker.classList.contains('open')) picker.classList.remove('open'); });

        updateDisplay();

        return {
            updateDisplay,
            parseProjects,
            filterByProject: (projectId) => {
                const project = projectsList.find(p => p.id === projectId);
                if (!project) return;
                const onlyThis = projectsList.filter(p => p.checked).length === 1 && project.checked;
                projectsList.forEach(p => { p.checked = onlyThis ? true : p.id === projectId; });
                updateDisplay();
                executorCtrl.applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            },
            setSelected: (ids) => {
                if (!ids || !Array.isArray(ids)) return;
                projectsList.forEach(p => { p.checked = ids.includes(p.id); });
                updateDisplay();
                executorCtrl.applyFilter();
            },
        };
    };

    // Фильтр по исполнителям: выпадающий список, множественный выбор.
    // Также содержит applyFilter() — центральную функцию фильтрации карточек
    // по проекту, исполнителю, срочности и типу одновременно.
    // Возвращает контроллер: applyFilter(), populateMenu(), filterByExecutor(id), setSelected(ids)
    const initExecutorFilter = () => {
        const dropdown = document.querySelector('.executor_dropdown');
        const toggle = document.getElementById('executor_toggle');
        const menu = document.getElementById('executor_menu');
        const label = document.getElementById('executor_label');
        const clearBtn = document.getElementById('executor_clear');

        if (!dropdown || !toggle || !menu) return null;

        const updateHasSelected = () => { dropdown.classList.toggle('has-selected', selectedExecutorsSet.size > 0); };

        const collectExecutors = () => {
            const map = new Map();
            document.querySelectorAll('.card').forEach(card => {
                const cl = card.className.split(' ');
                let userId = null, userName = null;
                for (const cls of cl) {
                    if (cls.startsWith('user')) userId = cls;
                    if (cls.startsWith('user_name')) userName = cls.substring('user_name'.length);
                }
                if (userId && userName && !map.has(userId)) {
                    const photo = card.querySelector('.card__photo');
                    map.set(userId, { name: userName, photo: photo ? photo.src : null });
                }
            });
            return map;
        };

        const populateMenu = () => {
            menu.innerHTML = '';
            collectExecutors().forEach((data, userId) => {
                const option = document.createElement('div');
                option.className = 'executor_option';
                option.setAttribute('data-value', userId);
                if (data.photo) {
                    const img = document.createElement('img');
                    img.className = 'executor_option_photo';
                    img.src = data.photo;
                    img.alt = data.name;
                    option.appendChild(img);
                }
                const nameSpan = document.createElement('span');
                nameSpan.textContent = data.name.replace(/_/g, ' ');
                option.appendChild(nameSpan);
                if (selectedExecutorsSet.has(userId)) option.classList.add('selected');
                menu.appendChild(option);
            });
        };

        const updateLabel = () => {
            if (selectedExecutorsSet.size === 0) {
                label.textContent = 'Исполнитель';
            } else if (selectedExecutorsSet.size === 1) {
                const val = Array.from(selectedExecutorsSet)[0];
                const opt = menu.querySelector('[data-value="' + val + '"]');
                const ns = opt ? opt.querySelector('span') : null;
                label.textContent = ns ? ns.textContent : 'Исполнитель';
            } else {
                label.textContent = 'Исполнитель (' + selectedExecutorsSet.size + ')';
            }
        };

        // Каскадная фильтрация: проект → исполнитель → срочность → тип.
        // Карточка скрывается (card__inactive), если не проходит хотя бы один фильтр.
        const applyFilter = () => {
            document.querySelectorAll('.card').forEach(card => {
                const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
                const pd = projectClass ? projectsList.find(p => p.id === projectClass) : null;

                if (pd && !pd.checked) { card.classList.add('card__inactive'); return; }

                if (selectedExecutorsSet.size === 0) {
                    card.classList.remove('card__inactive');
                } else {
                    let show = false;
                    selectedExecutorsSet.forEach(id => { if (card.classList.contains(id)) show = true; });
                    card.classList.toggle('card__inactive', !show);
                }

                if (selectedUrgenciesSet.size > 0 && !card.classList.contains('card__inactive')) {
                    const uc = Array.from(card.classList).find(c => c.startsWith('urgency-'));
                    const uid = uc ? uc.replace('urgency-', '') : null;
                    if (!uid || !selectedUrgenciesSet.has(uid)) card.classList.add('card__inactive');
                }

                if (selectedCardTypesSet.size > 0 && !card.classList.contains('card__inactive')) {
                    const ct = card.classList.contains('card-type-bug') ? 'bug' : 'task';
                    if (!selectedCardTypesSet.has(ct)) card.classList.add('card__inactive');
                }
            });
            RecalculateKanbanBlock();
        };

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.executor_option');
            if (!option) return;
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            if (selectedExecutorsSet.has(value)) { selectedExecutorsSet.delete(value); option.classList.remove('selected'); }
            else { selectedExecutorsSet.add(value); option.classList.add('selected'); }
            updateLabel(); updateHasSelected(); applyFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        });

        toggle.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(dropdown); populateMenu(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) dropdown.classList.remove('open'); });

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedExecutorsSet.clear(); updateLabel(); updateHasSelected(); populateMenu(); applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }

        return {
            applyFilter,
            populateMenu,
            filterByExecutor: (userId) => {
                if (selectedExecutorsSet.size === 1 && selectedExecutorsSet.has(userId)) selectedExecutorsSet.clear();
                else { selectedExecutorsSet.clear(); selectedExecutorsSet.add(userId); }
                populateMenu(); updateLabel(); updateHasSelected(); applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            },
            setSelected: (ids) => {
                if (!ids || !Array.isArray(ids)) return;
                selectedExecutorsSet.clear();
                ids.forEach(id => selectedExecutorsSet.add(id));
                populateMenu(); updateLabel(); updateHasSelected(); applyFilter();
            },
        };
    };

    // Фильтр по срочности: выпадающий список с иконками и кнопками настройки.
    // Возвращает контроллер: populateMenu(), filterByUrgency(id), setSelected(ids)
    const initUrgencyFilter = () => {
        const dropdown = document.querySelector('.urgency_dropdown');
        const toggle = document.getElementById('urgency_toggle');
        const menu = document.getElementById('urgency_menu');
        const label = document.getElementById('urgency_label');
        const clearBtn = document.getElementById('urgency_clear');

        if (!dropdown || !toggle || !menu) return null;

        const updateHasSelected = () => { dropdown.classList.toggle('has-selected', selectedUrgenciesSet.size > 0); };

        const populateMenu = () => {
            menu.innerHTML = '';
            (boardSettings.urgencyLevels || []).forEach(({ id, name }) => {
                const option = document.createElement('div');
                option.className = 'urgency_option';
                option.setAttribute('data-value', id);
                if (selectedUrgenciesSet.has(id)) option.classList.add('selected');

                const iconData = getUrgencyIconHtml(id);
                if (iconData) {
                    const preview = document.createElement('span');
                    preview.className = 'urgency_option_preview';
                    preview.style.color = iconData.color;
                    preview.innerHTML = iconData.svg;
                    option.appendChild(preview);
                }

                const labelSpan = document.createElement('span');
                labelSpan.className = 'urgency_option_label';
                labelSpan.textContent = name || id;
                option.appendChild(labelSpan);

                const settingsBtn = document.createElement('button');
                settingsBtn.type = 'button';
                settingsBtn.className = 'urgency_option_settings';
                settingsBtn.title = 'Настройка иконки и цвета';
                settingsBtn.setAttribute('aria-label', 'Настройка');
                settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
                option.appendChild(settingsBtn);
                settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsPopoverCtrl.open(id, name || id, settingsBtn); });

                menu.appendChild(option);
            });
        };

        const updateLabel = () => {
            if (selectedUrgenciesSet.size === 0) {
                label.textContent = 'Срочность';
            } else if (selectedUrgenciesSet.size === 1) {
                const id = Array.from(selectedUrgenciesSet)[0];
                const level = (boardSettings.urgencyLevels || []).find(l => l.id === id);
                label.textContent = level ? level.name : id;
            } else {
                label.textContent = 'Срочность (' + selectedUrgenciesSet.size + ')';
            }
        };

        toggle.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(dropdown); populateMenu(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) dropdown.classList.remove('open'); });

        menu.addEventListener('click', (e) => {
            if (e.target.closest('.urgency_option_settings')) return;
            const option = e.target.closest('.urgency_option');
            if (!option) return;
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            if (selectedUrgenciesSet.has(value)) { selectedUrgenciesSet.delete(value); option.classList.remove('selected'); }
            else { selectedUrgenciesSet.add(value); option.classList.add('selected'); }
            updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedUrgenciesSet.clear(); updateLabel(); updateHasSelected(); populateMenu(); executorCtrl.applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }

        return {
            populateMenu,
            filterByUrgency: (urgencyId) => {
                if (selectedUrgenciesSet.size === 1 && selectedUrgenciesSet.has(urgencyId)) selectedUrgenciesSet.clear();
                else { selectedUrgenciesSet.clear(); selectedUrgenciesSet.add(urgencyId); }
                populateMenu(); updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            },
            setSelected: (ids) => {
                if (!ids || !Array.isArray(ids)) return;
                selectedUrgenciesSet.clear();
                ids.forEach(id => selectedUrgenciesSet.add(id));
                populateMenu(); updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
            },
        };
    };

    // Фильтр по типу карточки (Задача / Ошибка).
    // Возвращает контроллер: filterByCardType(typeId), setSelected(ids)
    const initCardTypeFilter = () => {
        const dropdown = document.querySelector('.cardtype_dropdown');
        const toggle = document.getElementById('cardtype_toggle');
        const menu = document.getElementById('cardtype_menu');
        const label = document.getElementById('cardtype_label');
        const clearBtn = document.getElementById('cardtype_clear');

        if (!dropdown || !toggle || !menu) return null;

        const updateHasSelected = () => { dropdown.classList.toggle('has-selected', selectedCardTypesSet.size > 0); };

        const populateMenu = () => {
            menu.innerHTML = '';
            CARD_TYPES.forEach(({ id, name }) => {
                const option = document.createElement('div');
                option.className = 'cardtype_option';
                option.setAttribute('data-value', id);
                if (selectedCardTypesSet.has(id)) option.classList.add('selected');
                option.textContent = name;
                menu.appendChild(option);
            });
        };

        const updateLabel = () => {
            if (selectedCardTypesSet.size === 0) label.textContent = 'Тип';
            else if (selectedCardTypesSet.size === 1) {
                const t = CARD_TYPES.find(ct => ct.id === Array.from(selectedCardTypesSet)[0]);
                label.textContent = t ? t.name : 'Тип';
            } else label.textContent = 'Тип (' + selectedCardTypesSet.size + ')';
        };

        toggle.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(dropdown); populateMenu(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) dropdown.classList.remove('open'); });

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.cardtype_option');
            if (!option) return;
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            if (selectedCardTypesSet.has(value)) { selectedCardTypesSet.delete(value); option.classList.remove('selected'); }
            else { selectedCardTypesSet.add(value); option.classList.add('selected'); }
            updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
            window.V8Proxy.fetch('settingsChanged', {});
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedCardTypesSet.clear(); updateLabel(); updateHasSelected(); populateMenu(); executorCtrl.applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            });
        }

        return {
            filterByCardType: (typeId) => {
                if (selectedCardTypesSet.size === 1 && selectedCardTypesSet.has(typeId)) selectedCardTypesSet.clear();
                else { selectedCardTypesSet.clear(); selectedCardTypesSet.add(typeId); }
                populateMenu(); updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
                window.V8Proxy.fetch('settingsChanged', {});
            },
            setSelected: (ids) => {
                if (!ids || !Array.isArray(ids)) return;
                selectedCardTypesSet.clear();
                ids.forEach(id => selectedCardTypesSet.add(id));
                populateMenu(); updateLabel(); updateHasSelected(); executorCtrl.applyFilter();
            },
        };
    };

    // Обработчик сворачивания/разворачивания групп по клику на заголовок
    const initGroupCollapse = () => {
        document.querySelectorAll('.group-header').forEach(header => {
            header.addEventListener('click', () => {
                header.closest('.group').classList.toggle('collapsed');
                RecalculateKanbanBlock();
            });
        });
    };

    // Группировка по исполнителям: пересоздаёт доску, разбивая карточки по user
    const applyGroupingByExecutor = () => {
        saveStatusBlocks();
        const kanbanBoard = document.getElementById('kanban-board');

        const executors = new Map();
        tasksData.forEach((data) => {
            if (!data.user) return;
            const visibleName = data.user_name
                ? data.user_name.replace('user_name', '').replace(/_/g, ' ')
                : data.user;
            if (!executors.has(visibleName)) {
                executors.set(visibleName, { userId: data.user, photo: data.card__photo, tasks: [] });
            }
            executors.get(visibleName).tasks.push(data);
        });

        kanbanBoard.innerHTML = '';
        kanbanBoard.classList.add('grouped');

        executors.forEach((exec, visibleName) => {
            const group = document.createElement('div');
            group.className = 'group';
            group.setAttribute('data-executor-id', exec.userId);
            group.setAttribute('data-executor-name', visibleName);

            const photoHtml = exec.photo ? '<img class="group-photo" src="' + exec.photo + '" alt="' + visibleName + '">' : '';
            group.innerHTML =
                '<div class="group-header">' +
                    '<div class="group-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                    photoHtml +
                    '<span class="group-name">' + visibleName + '</span>' +
                    '<span class="group-count">0</span>' +
                '</div><div class="group-content"></div>';

            buildGroupBlocks(group.querySelector('.group-content'), exec.tasks);
            kanbanBoard.appendChild(group);
        });

        initGroupCollapse();
        setupDragDropForGroups();
    };

    // Группировка по проектам: пересоздаёт доску, разбивая карточки по project
    const applyGroupingByProject = () => {
        saveStatusBlocks();
        const kanbanBoard = document.getElementById('kanban-board');

        const projectsMap = new Map();
        tasksData.forEach((data) => {
            if (!data.project) return;
            if (!projectsMap.has(data.project)) {
                const pd = projectsList.find(p => p.id === data.project);
                projectsMap.set(data.project, { name: pd ? pd.name : data.project, color: pd ? pd.color : null, tasks: [] });
            }
            projectsMap.get(data.project).tasks.push(data);
        });

        kanbanBoard.innerHTML = '';
        kanbanBoard.classList.add('grouped');

        projectsMap.forEach((proj, projectId) => {
            const group = document.createElement('div');
            group.className = 'group';
            group.setAttribute('data-project-id', projectId);

            const colorStyle = proj.color ? 'background-color: ' + proj.color + ';' : '';
            group.innerHTML =
                '<div class="group-header">' +
                    '<div class="group-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>' +
                    '<span class="group-project-color" style="' + colorStyle + '"></span>' +
                    '<span class="group-name">' + proj.name + '</span>' +
                    '<span class="group-count">0</span>' +
                '</div><div class="group-content"></div>';

            buildGroupBlocks(group.querySelector('.group-content'), proj.tasks);
            kanbanBoard.appendChild(group);
        });

        initGroupCollapse();
        setupDragDropForGroups();
    };

    // Снятие группировки: восстанавливает исходную структуру колонок из statusBlocksData
    const removeGrouping = () => {
        const kanbanBoard = document.getElementById('kanban-board');
        kanbanBoard.classList.remove('grouped');
        currentGroupingType = 'none';
        if (!statusBlocksData) return;

        kanbanBoard.innerHTML = '';
        const kanbanBody = document.createElement('div');
        kanbanBody.className = 'kanban_body';

        statusBlocksData.forEach(blockData => {
            const block = document.createElement('div');
            block.id = blockData.id;
            block.className = blockData.className;
            block.setAttribute('fullNameObjectStatus', blockData.fullName);
            kanbanBody.appendChild(block);
        });

        kanbanBoard.appendChild(kanbanBody);
        tasksData.forEach((data) => {
            const targetBlock = document.getElementById(data.status);
            if (targetBlock) targetBlock.appendChild(createCardFromData(data));
        });

        setupDragDrop();
        setupCardDrag();
    };

    // Управление группировкой: выпадающий список «Нет / Исполнитель / Проект».
    // Возвращает контроллер: apply(value)
    const initGrouping = () => {
        const groupingDropdown = document.querySelector('.grouping_dropdown');
        const groupingToggle = document.getElementById('grouping_toggle');
        const groupingLabel = document.getElementById('grouping_label');

        if (!groupingToggle) return null;

        groupingToggle.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(groupingDropdown); groupingDropdown.classList.toggle('open'); });
        document.addEventListener('click', (e) => { if (!groupingDropdown.contains(e.target)) groupingDropdown.classList.remove('open'); });

        const applyInternal = (value) => {
            expandedBlocks.clear();
            const option = document.querySelector('.grouping_option[data-value="' + value + '"]');
            if (!option) return;

            document.querySelectorAll('.grouping_option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            groupingLabel.textContent = option.textContent;
            groupingDropdown.classList.remove('open');
            currentGroupingType = value;

            if (value === 'none') removeGrouping();
            else if (value === 'executor') applyGroupingByExecutor();
            else if (value === 'project') applyGroupingByProject();

            executorCtrl.applyFilter();
            searchCtrl.applyCurrent();
            RecalculateKanbanBlock();
        };

        document.querySelectorAll('.grouping_option').forEach(option => {
            option.addEventListener('click', () => {
                applyInternal(option.getAttribute('data-value'));
                window.V8Proxy.fetch('settingsChanged', {});
            });
        });

        return { apply: applyInternal };
    };

    // Поиск по тексту карточек: фильтрует карточки по введённой строке.
    // Возвращает контроллер: setQuery(query), applyCurrent()
    const initSearch = () => {
        const input = document.getElementById('search_input');
        const clearBtn = document.getElementById('search_clear');
        const container = document.querySelector('.search_container');
        if (!input) return null;

        input.addEventListener('input', (e) => {
            const text = e.target.value.toLowerCase().trim();
            container.classList.toggle('has-text', !!e.target.value.trim());
            filterCardsBySearch(text);
            executorCtrl.applyFilter();
            RecalculateKanbanBlock();
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                container.classList.remove('has-text');
                filterCardsBySearch('');
                executorCtrl.applyFilter();
                RecalculateKanbanBlock();
            });
        }

        return {
            setQuery: (query) => {
                input.value = query || '';
                container.classList.toggle('has-text', !!(query && query.trim()));
                filterCardsBySearch((query || '').toLowerCase().trim());
                executorCtrl.applyFilter();
                RecalculateKanbanBlock();
            },
            applyCurrent: () => {
                const text = input.value.toLowerCase().trim();
                if (text) filterCardsBySearch(text);
            },
        };
    };

    // Перерисовывает иконки срочности на всех карточках (после смены настроек иконок/цветов)
    const refreshUrgencyIcons = () => {
        document.querySelectorAll('.card').forEach(card => {
            const urgencyClass = Array.from(card.classList).find(c => c.startsWith('urgency-'));
            const urgencyId = urgencyClass ? urgencyClass.replace('urgency-', '') : null;
            if (!urgencyId) return;

            const textEl = card.querySelector('.card__text');
            let wrap = card.querySelector('.card__urgency-wrap');
            const iconData = getUrgencyIconHtml(urgencyId);
            if (iconData) {
                if (!wrap) {
                    wrap = document.createElement('div');
                    wrap.className = 'card__urgency-wrap';
                    if (textEl) textEl.insertBefore(wrap, textEl.firstChild);
                }
                wrap.innerHTML = iconData.svg;
                wrap.style.color = iconData.color;
                wrap.style.display = '';
            } else if (wrap) {
                wrap.innerHTML = '';
                wrap.style.display = 'none';
            }
        });
    };

    // Popover для настройки иконки и цвета уровня срочности.
    // Позволяет выбрать иконку и цвет, сохранить или отменить изменения.
    // Возвращает контроллер: open(urgencyId, name, anchorEl)
    const initSettingsPopover = () => {
        const popover = document.getElementById('urgency_settings_popover');
        const listEl = document.getElementById('urgency_settings_list');
        const titleEl = popover ? popover.querySelector('.urgency-popover__title') : null;
        const saveBtn = document.getElementById('urgency_popover_save');
        const cancelBtn = document.getElementById('urgency_popover_cancel');

        if (!popover || !listEl) return { open: () => {} };

        let settingsSnapshot = null;
        let currentEditId = null;
        let draftSettings = {};

        const renderSettings = (urgencyId) => {
            listEl.innerHTML = '';
            const s = draftSettings[urgencyId] || {};
            const iconId = s.iconId || URGENCY_ICON_IDS[0];
            const colorId = s.colorId || 'red';
            const row = document.createElement('div');
            row.className = 'urgency_setting_row';
            row.innerHTML =
                '<div class="urgency_setting_icons" data-urgency-id="' + urgencyId + '">' +
                    URGENCY_ICON_IDS.map(iid =>
                        '<button type="button" class="urgency_icon_btn ' + (iid === iconId ? 'selected' : '') + '" data-icon="' + iid + '" title="' + iid + '">' + URGENCY_ICONS[iid] + '</button>'
                    ).join('') +
                '</div>' +
                '<div class="urgency_setting_colors" data-urgency-id="' + urgencyId + '">' +
                    URGENCY_COLOR_IDS.map(cid =>
                        '<button type="button" class="urgency_color_btn ' + (cid === colorId ? 'selected' : '') + '" data-color="' + cid + '" style="background-color: ' + URGENCY_COLORS[cid] + '" title="' + cid + '"></button>'
                    ).join('') +
                '</div>';
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
            if (left + popW > window.innerWidth) left = rect.left - popW - 8;
            if (left < 4) left = 4;
            if (top + 300 > window.innerHeight) top = Math.max(4, window.innerHeight - 340);
            popover.style.left = left + 'px';
            popover.style.top = top + 'px';
        };

        const closePopover = (apply) => {
            if (apply) {
                boardSettings.urgencySettings = JSON.parse(JSON.stringify(draftSettings));
                window.V8Proxy.fetch('settingsChanged', {});
                refreshUrgencyIcons();
                urgencyCtrl.populateMenu();
            } else if (settingsSnapshot) {
                boardSettings.urgencySettings = JSON.parse(settingsSnapshot);
            }
            popover.classList.remove('open');
            popover.setAttribute('aria-hidden', 'true');
            settingsSnapshot = null;
            currentEditId = null;
        };

        if (saveBtn) saveBtn.addEventListener('click', () => closePopover(true));
        if (cancelBtn) cancelBtn.addEventListener('click', () => closePopover(false));
        document.addEventListener('mousedown', (e) => { if (popover.classList.contains('open') && !popover.contains(e.target)) closePopover(false); });
        popover.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(false); });

        return {
            open: (urgencyId, name, anchorEl) => {
                closeAllDropdowns();
                if (popover.classList.contains('open') && currentEditId === urgencyId) { closePopover(false); return; }
                settingsSnapshot = JSON.stringify(boardSettings.urgencySettings);
                draftSettings = JSON.parse(JSON.stringify(boardSettings.urgencySettings));
                currentEditId = urgencyId;
                if (titleEl) titleEl.textContent = 'Настройка: ' + (name || urgencyId);
                renderSettings(urgencyId);
                positionPopover(anchorEl);
                popover.classList.add('open');
                popover.setAttribute('aria-hidden', 'false');
            },
        };
    };

    // ---- Инициализация всех контроллеров ----
    // Порядок важен: executorCtrl используется в projectCtrl, urgencyCtrl и cardTypeCtrl

    const themeCtrl = initTheme();
    const projectCtrl = initProjectPicker();
    const executorCtrl = initExecutorFilter();
    const settingsPopoverCtrl = initSettingsPopover();
    const urgencyCtrl = initUrgencyFilter();
    const cardTypeCtrl = initCardTypeFilter();
    const groupingCtrl = initGrouping();
    const searchCtrl = initSearch();

    initGroupCollapse();
    setupDragDrop();
    setupCardDrag();

    const updateBtn = document.getElementById('update_svg');
    if (updateBtn) updateBtn.addEventListener('click', () => window.V8Proxy.fetch('refresh', {}));

    // Делегированные клики по элементам карточки:
    // фото → фильтр по исполнителю, метка проекта → фильтр по проекту,
    // иконка срочности → фильтр по срочности
    document.addEventListener('click', (e) => {
        const photo = e.target.closest('.card__photo');
        if (photo) {
            const card = photo.closest('.card');
            if (card) {
                let userId = null;
                for (const cls of card.className.split(' ')) { if (cls.startsWith('user')) userId = cls; }
                if (userId && executorCtrl) { e.preventDefault(); e.stopPropagation(); executorCtrl.filterByExecutor(userId); return; }
            }
        }

        const tag = e.target.closest('.tag_task');
        if (tag) {
            const card = tag.closest('.card');
            if (card) {
                const pid = Array.from(card.classList).find(cls => cls.startsWith('project'));
                if (pid && projectCtrl) { e.preventDefault(); e.stopPropagation(); projectCtrl.filterByProject(pid); return; }
            }
        }

        const wrap = e.target.closest('.card__urgency-wrap');
        if (wrap) {
            const card = wrap.closest('.card');
            if (card) {
                const uc = Array.from(card.classList).find(c => c.startsWith('urgency-'));
                const uid = uc ? uc.replace('urgency-', '') : null;
                if (uid && urgencyCtrl) { e.preventDefault(); e.stopPropagation(); urgencyCtrl.filterByUrgency(uid); return; }
            }
        }
    });

    // Подсветка заголовка колонки при наведении на саму колонку
    const blockHeaders = document.querySelectorAll('.block_header');
    document.querySelectorAll('.kanban-block').forEach((block, index) => {
        const header = blockHeaders[index];
        block.addEventListener('mouseenter', () => { if (header) header.classList.add('block_header--hovered'); });
        block.addEventListener('mouseleave', () => { if (header) header.classList.remove('block_header--hovered'); });
    });

    // Пересчёт лимитов карточек при изменении размера окна (debounce 150ms)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => RecalculateKanbanBlock(), 150);
    });

    // ============================================================
    // ИНТЕГРАЦИЯ С 1С
    // Определяется последней — все контроллеры уже инициализированы.
    // V8Proxy.fetch — отправка запроса в 1С.
    // V8Proxy.sendResponse — приём ответа из 1С (вызывается платформой).
    // V8Proxy.reinitKanban — полная переинициализация (после замены HTML).
    // ============================================================

    // Применяет пакет настроек из 1С: тема, группировка, фильтры, уровни срочности
    const applyBoardSettings = (data) => {
        if (!data || typeof data !== 'object') return;

        if (data.currentuserid !== undefined) boardSettings.currentUserId = data.currentuserid;
        if (data.currentusername !== undefined) boardSettings.currentUserName = data.currentusername;
        if (data.theme !== undefined && themeCtrl) themeCtrl.apply(data.theme);
        if (data.grouping !== undefined && groupingCtrl) groupingCtrl.apply(data.grouping);
        if (data.executorfilter !== undefined && executorCtrl) executorCtrl.setSelected(data.executorfilter);
        if (data.projectfilter !== undefined && projectCtrl) projectCtrl.setSelected(data.projectfilter);
        if (data.search !== undefined && searchCtrl) searchCtrl.setQuery(data.search);

        if (data.urgencylevels !== undefined && Array.isArray(data.urgencylevels)) {
            boardSettings.urgencyLevels = data.urgencylevels;
        }
        if (data.urgencysettings !== undefined && typeof data.urgencysettings === 'object') {
            const changed = JSON.stringify(boardSettings.urgencySettings) !== JSON.stringify(data.urgencysettings);
            boardSettings.urgencySettings = data.urgencysettings;
            if (changed) refreshUrgencyIcons();
        }
        if (data.urgencyfilter !== undefined && urgencyCtrl) urgencyCtrl.setSelected(data.urgencyfilter);
        if (data.cardtypefilter !== undefined && cardTypeCtrl) cardTypeCtrl.setSelected(data.cardtypefilter);

        if (executorCtrl) executorCtrl.applyFilter();
        if (searchCtrl) searchCtrl.applyCurrent();
        RecalculateKanbanBlock();
    };

    // Геттеры текущего состояния — передаются в 1С при каждом fetch-запросе
    const getCurrentTheme = () => themeCtrl ? themeCtrl.getCurrent() : 'light';
    const getSelectedExecutors = () => Array.from(selectedExecutorsSet);
    const getSelectedProjects = () => projectsList.filter(p => p.checked).map(p => p.id);
    const getSelectedUrgencies = () => Array.from(selectedUrgenciesSet);
    const getSelectedCardTypes = () => Array.from(selectedCardTypesSet);

    // Интерфейс взаимодействия с 1С.
    // fetch() — записывает параметры в скрытый input и «кликает» его (1С перехватывает клик).
    // sendResponse() — вызывается из 1С для передачи данных обратно в JS.
    // reinitKanban() — вызывается из 1С после полной перезагрузки HTML.
    window['V8Proxy'] = {
        fetch: (eventName, params) => {
            const req = document.querySelector('#V8_request');
            req.value = eventName;
            req.setAttribute('theme', getCurrentTheme());
            req.setAttribute('grouping', currentGroupingType);
            req.setAttribute('executorfilter', JSON.stringify(getSelectedExecutors()));
            req.setAttribute('projectfilter', JSON.stringify(getSelectedProjects()));
            req.setAttribute('urgencyfilter', JSON.stringify(getSelectedUrgencies()));
            req.setAttribute('cardtypefilter', JSON.stringify(getSelectedCardTypes()));
            req.setAttribute('urgencysettings', JSON.stringify(boardSettings.urgencySettings));
            req.setAttribute('task', JSON.stringify(params || {}));
            req.click();
        },

        sendResponse: (eventName, data) => {
            if (typeof data === 'string') {
                try { data = JSON.parse(data); }
                catch (e) { console.error('sendResponse: Failed to parse JSON:', e); return; }
            }

            expandedBlocks.clear();

            if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
                data.tasks.forEach(td => processTask(td));
            }

            applyBoardSettings(data);
        },

        reinitKanban: () => {
            if (projectCtrl) { projectCtrl.parseProjects(); projectCtrl.updateDisplay(); }
            if (executorCtrl) { executorCtrl.populateMenu(); executorCtrl.applyFilter(); }
            if (urgencyCtrl) urgencyCtrl.populateMenu();
            initGroupCollapse();
            RecalculateKanbanBlock();
        },
    };

    // Применение начальных настроек, вшитых в HTML (элемент <script id="board-settings">)
    const scriptEl = document.getElementById('board-settings');
    if (scriptEl && scriptEl.textContent && scriptEl.textContent.trim() !== '{}') {
        try { applyBoardSettings(JSON.parse(scriptEl.textContent)); }
        catch (e) { console.error('board-settings: Failed to parse JSON:', e); }
    }

    RecalculateKanbanBlock();
});
