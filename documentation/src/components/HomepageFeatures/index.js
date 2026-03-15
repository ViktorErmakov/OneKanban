import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Легко начать использовать',
    Svg: require('@site/static/img/picture_1.svg').default,
    description: (
      <>
        Библиотека для платформы 1С — установите расширение, настройте статусы
        и проекты, и доска готова к работе
      </>
    ),
  },
  {
    title: 'Гибкая настройка',
    Svg: require('@site/static/img/picture_2.svg').default,
    description: (
      <>
        Настраивайте проекты с цветовыми метками, уровни срочности с иконками,
        тёмную и светлую тему — всё прямо из интерфейса доски
      </>
    ),
  },
  {
    title: "Фильтры и группировка",
    Svg: require('@site/static/img/picture_5.svg').default,
    description: (
      <>
        Фильтрация по исполнителю, проекту, срочности и типу карточки.
        Группировка по исполнителям или проектам — всё без перезагрузки страницы
      </>
    ),
  },
  {
    title: "Drag & Drop",
    Svg: require('@site/static/img/picture_3.svg').default,
    description: (
      <>
        Перетаскивайте карточки между колонками для смены статуса.
        При группировке по исполнителям перенос в другую группу автоматически меняет ответственного
      </>
    ),
  },
  {
    title: "Интерактивные карточки",
    Svg: require('@site/static/img/picture_4.svg').default,
    description: (
      <>
        Фото исполнителя, цветная метка проекта и иконка срочности на каждой
        карточке — нажмите на любой элемент для мгновенной фильтрации
      </>
    ),
  },
  {
    title: "Без зависимостей",
    Svg: require('@site/static/img/picture_6.svg').default,
    description: (
      <>
        Написан на чистом HTML, CSS и JavaScript без фреймворков —
        легко встраивается в любую конфигурацию 1С
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
