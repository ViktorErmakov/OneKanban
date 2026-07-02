# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

После сборки проекта, нужно изменить ветку на gh-pages, там скопировать содержимое build в корень ветки, сделать коммит.

Собрать на main: npx docusaurus build
Скопировать build во временную папку (вне репозитория)
Переключиться на gh-pages
Скопировать из временной папки обратно в корень gh-pages
Закоммитить и запушить