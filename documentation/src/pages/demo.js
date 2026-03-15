import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

const IFRAME_STYLE = {
  width: '100%',
  height: 'calc(100vh - 60px)',
  border: 'none',
};

export default function Demo() {
  const demoUrl = useBaseUrl('/demo-board/');

  return (
    <Layout title="Демо доска" description="Интерактивная демонстрация OneKanban">
      <iframe
        src={demoUrl}
        style={IFRAME_STYLE}
        title="OneKanban Demo"
      />
    </Layout>
  );
}
