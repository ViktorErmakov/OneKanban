import './style.css';
import './style_quill_1.3.7.css';
import Quill from './quill_1.3.7';

function createTaskSettings() {
    return {
      created: '',
      updated: '',
      commentId: '',
      content: '',
    }
  };

let UserName = ""; // Имя пользователя по умолчанию

const quillEditors = {};
const toolbarOptions = [
  [{ 'font': [] }],
  // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'align': [] }],
  ['clean']                                         // remove formatting button
];

window['V8Proxy'] = {

  // Для запроса из JS в 1С
  fetch: (eventName, value) => {

    // const taskButton = document.querySelector(`.${value}`);
    const V8_request = document.querySelector(`#V8_request`);
    V8_request.value = eventName;
    V8_request.textContent = value;
    V8_request.click();
  },
  // Для отправки из 1С в JS
  sendResponse: (eventName, value, userName1C) => {

    // console.log(eventName);
    // console.log(value);
    // console.log(userName1C);

    UserName = userName1C;
    importTasks(value);

  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function () {

  // НОВЫЙ РЕДАКТОР
  quillEditors['main-editor'] = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Введите текст задачи...',
    modules: {
      toolbar: toolbarOptions
    },
    // scrollingContainer: '#scrolling-container'
  });
  quillEditors['main-editor'].focus();

  window.V8Proxy.fetch('importTasks');

  document.getElementById('searchBtn').addEventListener('click', searchTasks);

  // Добавляем обработчики для поиска
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      searchTasks();
    }

    // Показываем/скрываем кнопку очистки
    if (this.value.trim() !== '') {
      clearSearchBtn.classList.add('visible');
    } else {
      clearSearchBtn.classList.remove('visible');
    }

  });

  // Обработчик для кнопки очистки
  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    this.classList.remove('visible');
    clearSearch();
  });

  // Добавление задачи по нажатию Enter (Shift+Enter для новой строки)
  document.getElementById('editor').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  });

  document.getElementById('addTaskBtn').addEventListener('click', addTask);

  // Добавление новой задачи
  function addTask() {
    // console.log(quillEditors['main-editor'].getText().trim());
    if (quillEditors['main-editor'].getText().trim() === '') {
      return; // Не добавляем пустую задачу
    }

    const tasksContainer = document.getElementById('tasksContainer');

    const now = new Date();
    const taskSettings = createTaskSettings();
    taskSettings.created = `Создано: ${formatDate(now)} ${UserName}`;
    taskSettings.commentId = 'task-' + Date.now();

    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.id = taskSettings.commentId;

    taskCard.innerHTML = editorHTML(taskSettings);
    taskCard.querySelector('.edit-btn').onclick = () => enableEdit(taskSettings.commentId); // Добавляем обработчик для кнопки редактирования
    taskCard.querySelector('.save-btn').onclick = () => saveTask(taskSettings.commentId);
    taskCard.querySelector('.cancel-btn').onclick = () => cancelEdit(taskSettings.commentId);

    const editInput = taskCard.querySelector(`.edit-input`);
    if (editInput) {
      quillEditors[taskSettings.commentId] = new Quill(editInput, {
        theme: "snow",
        modules: { toolbar: toolbarOptions }
      });
    }
    
    // Скрываем панель инструментов сразу после создания
    const toolbar = taskCard.querySelector('.ql-toolbar');
    if (toolbar) {
      toolbar.classList.add('display_none');
    }

    tasksContainer.appendChild(taskCard);

    // Вставляем текст в редактор
    quillEditors[taskSettings.commentId].clipboard.dangerouslyPasteHTML(quillEditors['main-editor'].root.innerHTML);

    // Очищаем основной редактор
    quillEditors['main-editor'].deleteText(0, quillEditors['main-editor'].getLength());

    editMode(taskSettings.commentId, false);

    // вызываем код для получения JSON
    exportTasks();

  }

  // Для отладки
  // const value = JSON.stringify(
  //   [
  //     {
  //       "created": "Создано: 19.08.2025 21:26 Администратор",
  //       "updated": "Обновлено: 19.08.2025 22:26 Администратор",
  //       "commentId": "task-1755631841882",
  //       "content": "<pre class=\"ql-syntax\" spellcheck=\"false\">// Сохранение отредактированной задачи\nfunction saveTask(taskId) {\n&nbsp;const taskCard = document.getElementById(taskId);\n&nbsp;editMode(taskId, false);\n&nbsp;exportTasks();\n}\n</pre>"
  //     },
  //     {
  //       "created": "Создано: 19.08.2025 21:27 Администратор",
  //       "updated": "Обновлено: 19.08.2025 22:27 Администратор",
  //       "commentId": "task-1755631841958",
  //       "content": "<p class=\"ql-indent-4\"><strong class=\"ql-size-large\" style=\"background-color: rgb(204, 224, 245); color: rgb(153, 51, 255);\"><em>Обычный текст </em></strong><sup class=\"ql-size-large\" style=\"background-color: rgb(204, 224, 245); color: rgb(153, 51, 255);\"><strong><em>степень</em></strong></sup><sub class=\"ql-size-large\" style=\"background-color: rgb(204, 224, 245); color: rgb(153, 51, 255);\"><strong><em> корень</em></strong></sub></p>"
  //     },
  //     {
  //       "created": "Создано: 19.08.2025 21:27 Администратор",
  //       "updated": "Обновлено: 19.08.2025 22:27 Администратор",
  //       "commentId": "task-1755631842035",
  //       "content": "<ol><li class=\"ql-direction-rtl ql-align-center\"><span class=\"ql-font-serif ql-size-huge\" style=\"color: rgb(230, 0, 0);\">Первый пункт</span></li><li class=\"ql-direction-rtl ql-align-center\"><span class=\"ql-font-serif ql-size-huge\" style=\"color: rgb(230, 0, 0);\">Второй пункт</span></li><li class=\"ql-direction-rtl ql-align-center\"><span class=\"ql-font-serif ql-size-huge\" style=\"color: rgb(230, 0, 0);\">Третий пункт</span></li></ol>"
  //     },
  //     {
  //       "created": "Создано: 19.08.2025 21:27 Администратор",
  //       "updated": "Обновлено: 19.08.2025 22:27 Администратор",
  //       "commentId": "task-1755631842106",
  //       "content": "<p><span class=\"ql-font-monospace ql-size-huge\" style=\"background-color: rgb(102, 185, 102);\">Четвертый </span><span class=\"ql-font-monospace ql-size-huge\" style=\"background-color: rgb(102, 185, 102); color: rgb(161, 0, 0);\">комментарий</span></p>"
  //     }
  //   ]
  // );
  // importTasks(value);

});

// Функция очистки поиска
function clearSearch() {
  const tasks = document.querySelectorAll('.task-card');
  tasks.forEach(task => {
    task.style.display = '';
    const quill = quillEditors[task.id];
    if (quill) {
      // Восстанавливаем исходный background, если был сохранён
      if (task.dataset.originalContent) {
        quill.root.innerHTML = task.dataset.originalContent;
        delete task.dataset.originalContent;
      } else {
        quill.formatText(0, quill.getLength(), { background: false });
      }
    }
  });
  document.getElementById('searchInfo').textContent = '';
}

// Поиск задач
function searchTasks() {
  
  const searchInputEl = document.getElementById('searchInput');
  const searchText = (searchInputEl && searchInputEl.value) ? searchInputEl.value.trim().toLowerCase() : '';

  // Если в поисковой строке ничего не введено — прерываем выполнение
  if (!searchText) {
    // clearSearch();
    return;
  }

  const tasks = document.querySelectorAll('.task-card');
  let foundCount = 0;

  tasks.forEach(task => {
    const quill = quillEditors[task.id];
    let text = '';
    let found = false;

    if (quill) {
      text = quill.getText().toLowerCase();

      // Сохраняем исходный HTML перед поиском
      if (!task.dataset.originalContent) {
        task.dataset.originalContent = quill.root.innerHTML;
      }

      // Снимаем старую подсветку
      // quill.formatText(0, quill.getLength(), { background: false });

      // Ищем все вхождения и подсвечиваем
      let startIndex = 0;
      while (true) {
        const index = text.indexOf(searchText, startIndex);
        if (index === -1) break;
        quill.formatText(index, searchText.length, { background: '#fff9c4' }); // цвет как в стилях .highlight
        startIndex = index + searchText.length;
        found = true;
      }
    }

    if (found) {
      task.style.display = '';
      foundCount++;
    } else {
      task.style.display = 'none';
    }
  });

  // Информация о результатах
  const searchInfo = document.getElementById('searchInfo');
  if (foundCount === 0) {
    searchInfo.textContent = 'Задачи не найдены';
  } else {
    searchInfo.textContent = `Найдено задач: ${foundCount}`;
  }
}

// Форматирование даты в русском формате
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Экспорт задач в JSON
function exportTasks() {
  const tasks = [];
  const taskCards = document.querySelectorAll('.task-card');

  taskCards.forEach(card => {
    const taskSettings = createTaskSettings();
    taskSettings.content = quillEditors[card.id].root.innerHTML;
    taskSettings.commentId = card.id;

    taskSettings.created = card.querySelector('.created').textContent;
    taskSettings.updated = card.querySelector('.updated').textContent;

    tasks.push(taskSettings);
  });

  const dataStr = JSON.stringify(tasks, null, 2);
  window.V8Proxy.fetch('exportTasks', dataStr);

}

// Импорт задач из JSON
function importTasks(value) {

  const tasks = JSON.parse(value); // Это будет работать без ошибок

  tasks.forEach(task => {
    
    const taskSettings = createTaskSettings();
    taskSettings.commentId = task.commentId;
    taskSettings.content = task.content;
    taskSettings.created = task.created;
    taskSettings.updated = task.updated;

    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.id = taskSettings.commentId;

    taskCard.innerHTML = editorHTML(taskSettings);
    taskCard.querySelector('.edit-btn').onclick = () => enableEdit(taskSettings.commentId); // Добавляем обработчик для кнопки редактирования
    taskCard.querySelector('.save-btn').onclick = () => saveTask(taskSettings.commentId);
    taskCard.querySelector('.cancel-btn').onclick = () => cancelEdit(taskSettings.commentId);
    
    const tasksContainer = document.getElementById('tasksContainer');
    tasksContainer.appendChild(taskCard);

    const editInput = document.querySelector(`#${taskSettings.commentId}.edit-input`);
    if (editInput) {
      quillEditors[taskSettings.commentId] = new Quill(editInput, {
        theme: "snow",
        modules: { toolbar: toolbarOptions }
      });
    };
    // Вставляем текст в редактор
    quillEditors[taskSettings.commentId].clipboard.dangerouslyPasteHTML(taskSettings.content);

    editMode(taskSettings.commentId, false);
  });
};

// Включение режима редактирования для задачи
function enableEdit(commentId) {
  editMode(commentId, true);
}

// Сохранение отредактированной задачи
function saveTask(commentId) {
  const taskCard = document.getElementById(commentId);
  editMode(commentId, false);
  
  const updated = document.querySelector(`#${commentId} .updated`);
  updated.textContent = `Обновлено: ${formatDate(new Date())} ${UserName}`;

  exportTasks();
}

// Отмена редактирования
function cancelEdit(commentId) {
  const taskCard = document.getElementById(commentId);
  const originalContent = taskCard.dataset.originalContent;
  if (originalContent !== undefined) {
    quillEditors[commentId].clipboard.dangerouslyPasteHTML(originalContent);
  }
  editMode(commentId, false);
}

function editMode(commentId, mode) {

  const editInput = document.querySelector(`#${commentId}.edit-input`);
  const taskCard = document.getElementById(commentId);

  commentId = taskCard.id;

  // Скрываем панель инструментов редактора
  const toolbar = taskCard.querySelector('.ql-toolbar');
  mode ? toolbar.classList.remove('display_none') : toolbar.classList.add('display_none');

  // Скрываем кнопки редактирования
  const editButtons = taskCard.querySelector('.edit-buttons');
  mode ? editButtons.classList.remove('display_none') : editButtons.classList.add('display_none');
  
  // Показываем панель инструментов редактора
  const task_actions = taskCard.querySelector('.task-actions');
  mode ? task_actions.classList.add('display_none') : task_actions.classList.remove('display_none');

  editInput.classList.toggle('border_none');

  // Изменяем режим редактирования 
  quillEditors[commentId].enable(mode);

  if (mode) {
    
    quillEditors[commentId].focus();
    const length = quillEditors[commentId].getLength();
    quillEditors[commentId].setSelection(length, 0);

    // Сохраняем исходное содержимое при начале редактирования
    taskCard.dataset.originalContent = quillEditors[commentId].root.innerHTML;
  }
}

function editorHTML(task) {

  const editorHTML = `
                <div id="scrolling-container">
                    <div id="editor">
                        <div class="editor_container">
                            <div class="editor_toolbar_content">
                                <div id=${task.commentId} class="edit-input"></div>
                            </div>
                            <div class="task-actions">
                                <button class="edit-btn">
                                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13.94 5L19 10.06L9.062 20H4V14.938L13.94 5ZM13.94 5L15.757 3.18299C16.144 2.79699 16.776 2.79699 17.162 3.18299L20.818 6.83899C21.204 7.22499 21.204 7.85699 20.818 8.24299L19 10.06M13.94 5L19 10.06" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="created">${task.created}</div>
                        <div class="updated">${task.updated}</div>
                        <div class="edit-buttons" class="display_none">
                            <button class="save-btn" onclick="saveTask('${task.commentId}')">Сохранить</button>
                            <button class="cancel-btn" onclick="cancelEdit('${task.commentId}')">Отмена</button>
                        </div>
                    </div>
                </div>
            `;
  return editorHTML;
}