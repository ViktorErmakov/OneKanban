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

    // Кнопка мои задачи отрабатывает без вызова 1С
    let my_tasks = document.getElementById('my_tasks');
    let actualUserId = my_tasks.classList[1];
    my_tasks.addEventListener('click', function () {
        my_tasks.classList.toggle('my_tasks_active');
        let tasks = document.querySelectorAll('.card');
        tasks.forEach(function (taskCard) {
            let tag = document.querySelector(`.tag.${taskCard.classList[1]}`);

            if (!taskCard.classList.contains(actualUserId) && !tag.classList.contains('tag__inactive')) {
                taskCard.classList.toggle('card__inactive');
            }
        });
        RecalculateKanbanBlock();
    });

    // Обработчики для чекбоксов
    document.querySelectorAll('.checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const id = event.target.id;
            // Быстрый фильтр по проектам без вызова 1С
            const driveCheckbox = document.querySelector(`.${id}`);
            driveCheckbox.classList.toggle('tag__inactive');

            const driveCards = document.querySelectorAll(`.card.${id}`);
            driveCards.forEach(my_tasks_card => {
                if (my_tasks.classList.contains('my_tasks_active')) {
                    if (my_tasks_card.classList.contains(actualUserId)) {
                        my_tasks_card.classList.toggle('card__inactive');
                    }
                } else {
                    my_tasks_card.classList.toggle('card__inactive');
                }
            });

            RecalculateKanbanBlock();
        });
    });

    // Перетаскивание задач по статусам
    initDragDrop();
    initCardDrag();

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
                    count += groupBlocks[index].querySelectorAll('.card:not(.card__inactive)').length;
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
            let tasks = kanbanBlock.querySelectorAll('.card:not(.card__inactive)');
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
            const visibleCards = group.querySelectorAll('.card:not(.card__inactive)');
            groupCount.textContent = visibleCards.length;
        }
    });
}

RecalculateKanbanBlock();
