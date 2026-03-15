const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const OUTPUT_DIR = resolve(__dirname, '../../documentation/static/img/user');

const placeholders = [
    'ПанельУправления',
    'БыстрыеОтборы',
    'СписокПроектов',
    'ФильтрИсполнитель',
    'ФильтрСрочность',
    'НастройкаСрочности',
    'ФильтрТип',
    'Группировка',
    'ГруппировкаИсполнитель',
    'Поиск',
    'ТемнаяТема',
    'Добавить',
    'DragDrop',
    'ЕщёN',
    'Обновление',
    'Настройки',
];

function createPlaceholderSvg(label) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <rect width="800" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2" rx="8"/>
  <text x="400" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#999">Скриншот: ${label}</text>
  <text x="400" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#bbb">Замените этот файл реальным скриншотом</text>
</svg>`;
}

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
}

placeholders.forEach(name => {
    const filePath = resolve(OUTPUT_DIR, name + '.png');
    if (!existsSync(filePath)) {
        writeFileSync(filePath, createPlaceholderSvg(name), 'utf-8');
        console.log('Created placeholder: ' + name + '.png');
    }
});

console.log('Placeholder generation complete.');
