# OneKanban

Канбан доска для платформы 1С написанная на HTML/CSS/JS.

Документация https://viktorermakov.github.io/OneKanban/

Сборка фронта и эталонов YAXUnit: каталог **`OneKanban-html`**, команды **`npm run build`**, **`npm run yaxunit:apply-snapshots`**; после переноса снимков в EDT обновите проект **`Управление_задачами.YAXUNIT`** (F5) — см. **`documentation/docs/Разработка/Сборка-OneKanban-html.md`** и **`yaxunit-html-snapshots/README.md`**.

![image](https://infostart.ru/bitrix/templates/sandbox_empty/assets/tpl/abo/img/logo.svg)
https://infostart.ru/1c/tools/2398094

## Статистика использования

По умолчанию при каждом открытии канбан-доски **сервер 1С** отправляет один HTTP-запрос в [Яндекс.Метрику](https://yandex.ru/support/metrica/) (`mc.yandex.ru`). Это не браузерный счётчик — запрос инициируется из расширения. Ошибки сети **не мешают** работе доски.

| | |
|---|---|
| **Куда** | `mc.yandex.ru` (протокол Measurement Protocol) |
| **Что** | Факт открытия доски; псевдоним «пользователь в этой базе» (19 цифр `ClientID` из GUID ИБ и пользователя 1С); служебные параметры счётчика |
| **Зачем** | Оценить использование расширения и показывать агрегированную статистику на сайте проекта |
| **Чего нет** | Имён, логинов, задач, проектов, статусов, настроек и любых бизнес-данных |

**Как отключить:** на доске нажмите **Настройки** → вкладка **Глобальные** → включите **«Отключить отправку статистики»**. Настройка действует для **всех пользователей** информационной базы и сохраняется сразу при переключении. Альтернатива для администраторов — блокировка исходящих соединений к `mc.yandex.ru` на уровне сети.

Подробнее — в [документации](https://viktorermakov.github.io/OneKanban/docs/ПользовательскаяДокументация/userSettings#отключить-отправку-статистики).

## Star History

<a href="https://www.star-history.com/?repos=ViktorErmakov%2FOneKanban&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&legend=top-left" />
 </picture>
</a>
