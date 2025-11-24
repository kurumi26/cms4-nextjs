
import 'bootstrap/dist/css/bootstrap.min.css';
import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';

type AppPropsWithLayout = AppProps & {
  Component: AppProps['Component'] & {
    Layout?: React.ComponentType<{ children: React.ReactNode }>;
  };
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
useEffect(() => {
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  const Layout = Component.Layout || React.Fragment;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
