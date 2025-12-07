---
sidebar_position: 1
---

# Начало работы

OneKanban - это расширение конфигурации с открытым исходным кодом, которое визиализирует канбан доску в ПолеHTML.

![alt text](\img\OneKanban.png)

<details>
  <summary>Смотреть презентацию с YouTube</summary>

  <iframe width="560" height="315" src="https://www.youtube.com/embed/SSIYygVDklw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</details>

<details>
  <summary>Смотреть презентацию ВКонтакте</summary>

  <iframe src="https://vk.com/video_ext.php?oid=-103886687&id=456239017&hd=2&hash=cc0d6ae660baaa7c" width="560" height="315" allow="encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;" frameborder="0" allowfullscreen></iframe>
</details>

[Статья на Инфостарт](https://infostart.ru/1c/tools/2398094/)

[Блог проекта](../blog/welcome)

## Требования

Версия платформы 1С:Предприятие 8.3.21. и выше.

## Установка

### Исходники

Последняя **[версия](https://github.com/ViktorErmakov/Kanban_for_1C/releases)** библиотеки.

Начиная с версии 2.6 в релизах публикуется 3 разных расширения:

[OneKanban_BSP.cfe](./Внедрение/BSP) - расширение для любой конфигурации на основе БСП. \
Имеет собственные объекты по учету задач и ошибок.

[OneKanban_SPPR.cfe](./Внедрение/SPPR) - расширение для конфигурации СППР. \
Полностью адаптированно и готово к работе.

[OneKanban_UZ.cfe](./Внедрение/Tasks.md) - расширение для конфигурация с открытым исходным кодом Tasks [Сайт проекта](https://github.com/BlizD/Tasks)\
Полностью адаптированно и готово к работе.

### Встраивание

Устанавливаем расширение в конфигураторе, и снимаем галочки
безопасного режима и защиты от опасных действий.
