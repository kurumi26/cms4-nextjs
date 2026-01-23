import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import "@/styles/globals.css";
import "@/styles/navigation.css";
import "@/styles/topbar.css";
import "@/styles/banner.css";
import "@/styles/animations.css";
import "@/styles/dashboard.css";
import "@/styles/admin-sidebar.css";
import "@/styles/admin-banners.css";

import "@/public/css/custom.css";

import type { AppProps } from "next/app";
import React from "react";
import Head from "next/head";
import LoadingProvider from "@/plugins/loading/LoadingProvider";

type AppPropsWithLayout = AppProps & {
  Component: AppProps["Component"] & {
    Layout?: React.ComponentType<{ children: React.ReactNode }>;
  };
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const Layout = Component.Layout || React.Fragment;

  React.useEffect(() => {
    // Load Bootstrap JS locally (no CDN) to avoid browser tracking-prevention warnings.
    import("bootstrap");
  }, []);

  return (
    <LoadingProvider>
      <Layout {...pageProps}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <Component {...pageProps} />
      </Layout>
    </LoadingProvider>
  );
}
