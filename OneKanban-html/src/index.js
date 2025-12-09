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
        // V8_request.setAttribute('darkTheme', document.querySelector('.wrapper').classList.contains('dark-theme') ? 'true' : 'false');

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
        const wrapper = document.querySelector('.wrapper');
        
        themeToggle.addEventListener('click', () => {
            wrapper.classList.toggle('dark-theme');
            themeToggle.classList.toggle('active');
        });
    };

    initTheme();

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

    // Перетаскивание задач по статусам +++
    // Обработчики для drag & drop
    document.querySelectorAll('.kanban-block').forEach(block => {

        // Убедимся, что dragover все еще работает для всей колонки
        block.addEventListener('dragover', (event) => {
            event.preventDefault();
            // Добавляем класс подсветки, когда элемент находится над колонкой (включая карточки)
            block.classList.add('kanban-block--dragover');
        });

        // Добавляем универсальный обработчик для удаления подсветки,
        // когда перетаскивание завершается или отменяется в любом месте
        block.addEventListener('dragleave', (event) => {
            // Убедитесь, что курсор действительно покинул блок, а не перешел на дочерний элемент
            // relatedTarget - элемент, на который перешел курсор
            if (!block.contains(event.relatedTarget)) {
                block.classList.remove('kanban-block--dragover');
            }
        });

        // Обработчик события 'drop' должен удалять подсветку
        block.addEventListener('drop', (event) => {
            event.preventDefault();
            block.classList.remove('kanban-block--dragover'); // Удаляем подсветку после успешного сброса

            const idTask = event.dataTransfer.getData("text");
            const draggedElement = document.getElementById(idTask);
            const fullNameObjectTask = draggedElement.attributes.fullNameObjectTask.nodeValue;

            const lastStatus = draggedElement.parentElement;
            if (block === lastStatus) { // Используйте === для строгого сравнения
                return;
            }
            block.appendChild(draggedElement);

            RecalculateKanbanBlock();

            const idNewStatus = event.currentTarget.id; // Correctly get the ID of the drop target
            const fullNameObjectStatus = block.attributes.fullNameObjectStatus.nodeValue;

            window.V8Proxy.fetch('changeStatus', idTask, fullNameObjectTask, idNewStatus, fullNameObjectStatus);
        });
    });

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData("text", event.target.id);
        });
    });
    // Перетаскивание задач по статусам ---

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

});

// Обновление счетчиков задач в блоках
const kanbanBlocks = document.querySelectorAll('.kanban-block');
function RecalculateKanbanBlock() {
    let block_headers = document.querySelectorAll('.block_header');
    // Рассчитываем количество задач в каждом блоке
    kanbanBlocks.forEach((kanbanBlock, index) => {
        let tasks = kanbanBlock.querySelectorAll('.card:not(.card__inactive)');
        let block_header = block_headers[index];
        let number = block_header.querySelector('.kanban-block__number');
        number.textContent = tasks.length;
    });
}

RecalculateKanbanBlock();