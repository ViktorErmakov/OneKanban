// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OneKanban',
  tagline: 'Канбан доска для платформы 1С на HTML/CSS/JS, написанная в стиле библиотеки для возможности внедрения в любые конфигурации',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://viktorermakov.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/OneKanban',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ViktorErmakov', // Usually your GitHub org/user name.
  projectName: 'OneKanban', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },
  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/ViktorErmakov/Kanban_for_1C/tree/main/documentation/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/ViktorErmakov/Kanban_for_1C/tree/main/documentation/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card

      navbar: {
        title: 'OneKanban',
        logo: {
          alt: 'OneKanban Logo',
          src: 'img/OneKanban_1.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Описание',
          },
          { to: '/blog', label: 'Блог', position: 'left' },
        ],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Документация',
            items: [
              {
                label: 'Описание',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Контакты',
            items: [
              {
                label: 'Telegram',
                href: 'https://t.me/VErmakov',
              }
            ],
          },
          {
            title: 'Дополнительно',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/ViktorErmakov/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} OneKanban, Viktor Ermakov`,
      },
      prism: {
        theme: prismThemes.vsLight,
        darkTheme: prismThemes.vsDark,
        additionalLanguages: ['bsl', 'json'],
      },
    }),
};

export default config;
