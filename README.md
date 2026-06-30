# OneKanban

Канбан доска для платформы 1С написанная на HTML/CSS/JS.

Документация https://viktorermakov.github.io/OneKanban/

Сборка фронта и эталонов YAXUnit: каталог **`OneKanban-html`**, команды **`npm run build`**, **`npm run yaxunit:apply-snapshots`**; после переноса снимков в EDT обновите проект **`Управление_задачами.YAXUNIT`** (F5) — см. **`documentation/docs/Разработка/Сборка-OneKanban-html.md`** и **`yaxunit-html-snapshots/README.md`**.

![image](https://infostart.ru/bitrix/templates/sandbox_empty/assets/tpl/abo/img/logo.svg)
https://infostart.ru/1c/tools/2398094

## Статистика использования

При каждом открытии канбан-доски **сервер 1С** отправляет один HTTP-запрос в [Яндекс.Метрику](https://yandex.ru/support/metrica/) (`mc.yandex.ru`). Это не браузерный счётчик и не cookie на компьютере пользователя — запрос инициируется из расширения на стороне платформы. Ошибки сети **не мешают** работе доски.

**Зачем:** понять, сколько информационных баз и пользователей реально пользуются расширением, и показывать агрегированную динамику на сайте проекта (см. план в `documentation/plans/metrika-stats-readme-docs.md`).

**Что отправляется:**

| Данные | Описание |
|--------|----------|
| Событие «просмотр страницы» | Факт открытия доски и время визита |
| Числовой идентификатор (`ClientID`, 19 цифр) | Стабильный псевдоним «пользователь в этой базе»: 10 цифр из UUID информационной базы и 9 цифр из UUID пользователя 1С (берутся только символы `0–9` из GUID, слева направо; буквы и дефисы отбрасываются) |
| Служебные параметры счётчика | Идентификатор счётчика Метрики и технические поля протокола Measurement Protocol |

**Что не отправляется:** имена и логины пользователей, задачи, проекты, статусы, настройки доски, метаданные конфигурации и любые бизнес-данные.

**О приватности:** по отправленному `ClientID` **нельзя восстановить** исходные GUID, ФИО или содержимое базы. Владелец счётчика видит лишь агрегаты и повторные визиты одного и того же псевдонима (сколько раз открывали доску «этот пользователь в этой базе»). Данные обрабатывает Яндекс как сторонний сервис.

Администраторам корпоративных баз: если политика организации запрещает такие внешние запросы, учитывайте это при установке расширения (блокировка исходящих соединений к `mc.yandex.ru` на уровне сети также отключит отправку).

## Star History

<a href="https://www.star-history.com/?repos=ViktorErmakov%2FOneKanban&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=ViktorErmakov/OneKanban&type=date&legend=top-left" />
 </picture>
</a>
