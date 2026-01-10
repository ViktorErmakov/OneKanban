import './style.css';

window['V8Proxy'] = {

    // Для запроса из JS в 1С
    fetch: (eventName, idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus) => {

         // const taskButton = document.querySelector(`.${value}`);
        const V8_request = document.querySelector(`#V8_request`);
        V8_request.value = eventName;
        V8_request.setAttribute('idTask', idTask);
        V8_request.setAttribute('fullNameObjectTask', fullNameObjectTask);

        V8_request.setAttribute('idNewStatus', idNewStatus);
        V8_request.setAttribute('fullNameObjectStatus', fullNameObjectStatus);
        V8_request.click();
    },
    // Для отправки из 1С в JS
    sendResponse: (eventName, value, userName1C) => {
        // console.log(eventName);
        // console.log(value);
        // console.log(userName1C);
        // UserName = userName1C;
        // importTasks(value);
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
        });
    };

    initTheme();

    // ========== ЗАКРЫТИЕ ВСЕХ DROPDOWN ==========
    const closeAllDropdowns = (except = null) => {
        const dropdowns = [
            document.querySelector('.project_picker'),
            document.querySelector('.executor_dropdown'),
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
        const checkboxes = document.querySelectorAll('.checkboxes .checkbox');
        
        if (!picker || !toggle || checkboxes.length === 0) return;
        
        // Собираем проекты из чекбоксов (приходят из 1С)
        const collectProjectsFromCheckboxes = () => {
            projects = [];
            checkboxes.forEach(checkbox => {
                const input = checkbox.querySelector('input[type="checkbox"]');
                const tag = checkbox.querySelector('.tag');
                if (input && tag) {
                    // Получаем цвет из background-color тега
                    const computedStyle = getComputedStyle(tag);
                    const bgColor = computedStyle.backgroundColor;
                    const color = (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') ? bgColor : null;
                    
                    projects.push({
                        id: input.id,
                        name: tag.textContent,
                        color: color,
                        checked: input.checked
                    });
                }
            });
        };
        
        // Инициализируем проекты из чекбоксов
        collectProjectsFromCheckboxes();
        
        // Функция обновления отображения
        const updateDisplay = () => {
            // Очищаем контейнеры
            selectedContainer.innerHTML = '';
            grid.innerHTML = '';
            
            const selectedProjects = projects.filter(p => p.checked);
            const visibleProjects = selectedProjects.slice(0, MAX_VISIBLE_PROJECTS);
            const hiddenCount = selectedProjects.length - MAX_VISIBLE_PROJECTS;
            
            // Отображаем видимые pills
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
                
                // Клик на × - снимает выбор
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleProject(project.id);
                });
                
                selectedContainer.appendChild(pill);
            });
            
            // Счётчик "+N"
            if (hiddenCount > 0) {
                moreCounter.textContent = '+' + hiddenCount;
            } else {
                moreCounter.textContent = '';
            }
            
            // Заполняем сетку в dropdown
            projects.forEach(project => {
                const item = document.createElement('div');
                item.className = 'project_grid_item' + (project.checked ? ' selected' : '');
                item.setAttribute('data-project-id', project.id);
                if (project.color) {
                    item.style.setProperty('--project-color', project.color);
                }
                item.textContent = project.name;
                
                // Клик - toggle проекта
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleProject(project.id);
                });
                
                grid.appendChild(item);
            });
        };
        
        // Функция toggle проекта
        const toggleProject = (projectId) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            
            project.checked = !project.checked;
            
            // Синхронизируем с оригинальным чекбоксом
            const checkbox = document.getElementById(projectId);
            if (checkbox) {
                checkbox.checked = project.checked;
                // Триггерим change event для существующей логики фильтрации
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            updateDisplay();
        };
        
        // Открытие/закрытие dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(picker);
            picker.classList.toggle('open');
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target)) {
                picker.classList.remove('open');
            }
        });
        
        // Добавляем обработчики для чекбоксов (фильтрация карточек)
        checkboxes.forEach(checkbox => {
            const input = checkbox.querySelector('input[type="checkbox"]');
            if (input) {
                input.addEventListener('change', (event) => {
                    const id = event.target.id;
                    const project = projects.find(p => p.id === id);
                    if (project) {
                        project.checked = event.target.checked;
                    }
                    
                    // Обновляем состояние тега проекта
                    const tag = document.querySelector(`.tag.${id}`);
                    if (tag) {
                        tag.classList.toggle('tag__inactive', !event.target.checked);
                    }

                    // Применяем общую фильтрацию (проекты + исполнители)
                    if (window.applyExecutorFilter) {
                        window.applyExecutorFilter();
                    } else {
                        // Fallback если executor filter не инициализирован
                        const cards = document.querySelectorAll(`.card.${id}`);
                        cards.forEach(card => {
                            card.classList.toggle('card__inactive', !event.target.checked);
                        });
                        RecalculateKanbanBlock();
                    }
                    
                    updateDisplay();
                });
            }
        });
        
        // Инициализация
        updateDisplay();
        
        // Экспортируем функции для reinitKanban
        window.updateProjectPicker = updateDisplay;
        window.collectProjectsFromCheckboxes = collectProjectsFromCheckboxes;
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
        const myTasksElement = document.getElementById('my_tasks');
        
        if (!dropdown || !toggle || !menu) return;
        
        // Обновление класса has-selected
        const updateHasSelected = () => {
            if (selectedExecutors.size > 0) {
                dropdown.classList.add('has-selected');
            } else {
                dropdown.classList.remove('has-selected');
            }
        };
        
        // Получаем ID текущего пользователя из my_tasks
        const currentUserId = myTasksElement ? myTasksElement.classList[1] : null;
        
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
                    if (cls.startsWith('user') && !cls.startsWith('user_name')) {
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
                // Проверяем, активен ли проект карточки
                const projectClass = Array.from(card.classList).find(cls => cls.startsWith('project'));
                const projectTag = projectClass ? document.querySelector(`.tag.${projectClass}`) : null;
                const projectInactive = projectTag && projectTag.classList.contains('tag__inactive');
                
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
        };
        
        // Делегирование событий для опций
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.executor_option');
            if (option) {
                e.stopPropagation();
                handleOptionClick(option);
            }
        });
        
        // Открытие/закрытие dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
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
                e.stopPropagation(); // Не открывать dropdown
                selectedExecutors.clear();
                updateLabel();
                updateHasSelected();
                populateMenu(); // Обновить визуальное состояние опций
                applyFilter();
            });
        }
        
        // Экспортируем для переинициализации
        window.applyExecutorFilter = applyFilter;
        window.populateExecutorMenu = populateMenu;
    };
    
    initExecutorFilter();

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    // Извлечение имени пользователя из классов карточки
    const getUserNameFromCard = (card) => {
        const prefix = 'user_name';
        const classList = card.className.split(' ');
        for (let i = 0; i < classList.length; i++) {
            if (classList[i].startsWith(prefix)) {
                return classList[i].substring(prefix.length).split('_').join(' '); // убираем 'user_name' и заменяем "_" на пробел
            }
        }
        return null;
    };

    // Получение фото пользователя из первой карточки с таким именем
    const getUserPhotoFromCards = (userName) => {
        const cards = document.querySelectorAll('.card');
        for (let i = 0; i < cards.length; i++) {
            if (getUserNameFromCard(cards[i]) === userName) {
                const photo = cards[i].querySelector('.card__photo');
                if (photo) {
                    return photo.src;
                }
            }
        }
        return null;
    };

    // Сохранение оригинальной структуры для восстановления
    let originalBoardContent = null;

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
            e.stopPropagation();
            closeAllDropdowns(groupingDropdown);
            groupingDropdown.classList.toggle('open');
        });

        // Закрытие при клике вне dropdown
        document.addEventListener('click', (e) => {
            if (!groupingDropdown.contains(e.target)) {
                groupingDropdown.classList.remove('open');
            }
        });

        // Выбор опции группировки
        document.querySelectorAll('.grouping_option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
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

                // Применяем группировку
                if (value === 'none') {
                    removeGrouping();
                } else if (value === 'executor') {
                    applyGroupingByExecutor();
                }

                RecalculateKanbanBlock();
            });
        });
    };

    // Применение группировки по исполнителю
    const applyGroupingByExecutor = () => {
        const kanbanBoard = document.getElementById('kanban-board');
        
        // Сохраняем оригинальную структуру если ещё не сохранена
        if (!originalBoardContent) {
            originalBoardContent = kanbanBoard.innerHTML;
        }

        // Получаем все блоки статусов
        const statusBlocks = kanbanBoard.querySelectorAll('.kanban-block');
        if (statusBlocks.length === 0) return;

        // Собираем всех уникальных исполнителей
        const executors = new Map(); // userName -> { photo, cards: Map<statusId, cards[]> }
        
        statusBlocks.forEach((block, statusIndex) => {
            const statusId = block.id;
            const cards = block.querySelectorAll('.card');
            
            cards.forEach(card => {
                const userName = getUserNameFromCard(card);
                if (userName) {
                    if (!executors.has(userName)) {
                        executors.set(userName, {
                            photo: getUserPhotoFromCards(userName),
                            statuses: new Map()
                        });
                    }
                    const executor = executors.get(userName);
                    if (!executor.statuses.has(statusIndex)) {
                        executor.statuses.set(statusIndex, []);
                    }
                    executor.statuses.get(statusIndex).push(card.cloneNode(true));
                }
            });
        });

        // Очищаем доску
        kanbanBoard.innerHTML = '';
        kanbanBoard.classList.add('grouped');

        // Создаём группы для каждого исполнителя
        executors.forEach((data, userName) => {
            const group = document.createElement('div');
            group.className = 'group';

            // Заголовок группы
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `
                <div class="group-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
                ${data.photo ? `<img class="group-photo" src="${data.photo}" alt="${userName}">` : ''}
                <span class="group-name">${userName}</span>
                <span class="group-count">0</span>
            `;
            group.appendChild(header);

            // Контент группы (блоки для каждого статуса)
            const content = document.createElement('div');
            content.className = 'group-content';

            statusBlocks.forEach((originalBlock, statusIndex) => {
                const block = document.createElement('div');
                block.className = 'kanban-block';
                block.id = originalBlock.id;
                block.setAttribute('fullNameObjectStatus', originalBlock.getAttribute('fullNameObjectStatus'));

                // Добавляем карточки этого исполнителя для этого статуса
                const cardsForStatus = data.statuses.get(statusIndex) || [];
                cardsForStatus.forEach(card => {
                    block.appendChild(card);
                });

                content.appendChild(block);
            });

            group.appendChild(content);
            kanbanBoard.appendChild(group);
        });

        // Переинициализируем обработчики
        initGroupCollapse();
        initDragDropForGroups();
    };

    // Снятие группировки
    const removeGrouping = () => {
        const kanbanBoard = document.getElementById('kanban-board');
        kanbanBoard.classList.remove('grouped');

        if (originalBoardContent) {
            kanbanBoard.innerHTML = originalBoardContent;
            originalBoardContent = null;
            // Переинициализируем обработчики
            initDragDrop();
            initCardDrag();
        }
    };

    // Инициализация drag & drop для групп
    const initDragDropForGroups = () => {
        document.querySelectorAll('.group-content .kanban-block').forEach(block => {
            block.addEventListener('dragover', (event) => {
                event.preventDefault();
                block.classList.add('kanban-block--dragover');
            });

            block.addEventListener('dragleave', (event) => {
                if (!block.contains(event.relatedTarget)) {
                    block.classList.remove('kanban-block--dragover');
                }
            });

            block.addEventListener('drop', (event) => {
                event.preventDefault();
                block.classList.remove('kanban-block--dragover');

                const idTask = event.dataTransfer.getData("text");
                const draggedElement = document.getElementById(idTask);
                if (!draggedElement) return;

                const fullNameObjectTask = draggedElement.attributes.fullNameObjectTask.nodeValue;
                const lastStatus = draggedElement.parentElement;
                
                if (block === lastStatus) return;
                
                block.appendChild(draggedElement);
                RecalculateKanbanBlock();

                const idNewStatus = event.currentTarget.id;
                const fullNameObjectStatus = block.attributes.fullNameObjectStatus.nodeValue;
                window.V8Proxy.fetch('changeStatus', idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus);
            });
        });

        document.querySelectorAll('.group-content .card').forEach(card => {
            card.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData("text", event.target.id);
            });
        });
    };

    // Инициализация drag & drop (без групп)
    const initDragDrop = () => {
        document.querySelectorAll('.kanban-block').forEach(block => {
            block.addEventListener('dragover', (event) => {
                event.preventDefault();
                block.classList.add('kanban-block--dragover');
            });

            block.addEventListener('dragleave', (event) => {
                if (!block.contains(event.relatedTarget)) {
                    block.classList.remove('kanban-block--dragover');
                }
            });

            block.addEventListener('drop', (event) => {
                event.preventDefault();
                block.classList.remove('kanban-block--dragover');

                const idTask = event.dataTransfer.getData("text");
                const draggedElement = document.getElementById(idTask);
                if (!draggedElement) return;

                const fullNameObjectTask = draggedElement.attributes.fullNameObjectTask.nodeValue;
                const lastStatus = draggedElement.parentElement;
                
                if (block === lastStatus) return;
                
                block.appendChild(draggedElement);
                RecalculateKanbanBlock();

                const idNewStatus = event.currentTarget.id;
                const fullNameObjectStatus = block.attributes.fullNameObjectStatus.nodeValue;
                window.V8Proxy.fetch('changeStatus', idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus);
            });
        });
    };

    // Инициализация перетаскивания карточек
    const initCardDrag = () => {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData("text", event.target.id);
            });
        });
    };

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
    };

    initSearch();

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
        if (window.applyExecutorFilter) {
            window.applyExecutorFilter();
        }
        initGroupCollapse();
        RecalculateKanbanBlock();
    };

});

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
}

RecalculateKanbanBlock();
