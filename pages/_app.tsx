// pages/_app.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@/styles/globals.css";
import "@/public/css/custom.css";
import type { AppProps } from "next/app";
import React from "react";
import Script from "next/script";
import LoadingProvider from "@/plugins/loading/LoadingProvider";

type AppPropsWithLayout = AppProps & {
  Component: AppProps["Component"] & {
    Layout?: React.ComponentType<{ children: React.ReactNode }>;
  };
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const Layout = Component.Layout || React.Fragment;

  return (
    <LoadingProvider>
      <Layout {...pageProps}>
        <Component {...pageProps} />

        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />

         {/* ✅ YOUR CAROUSEL JS */}
        <Script
          src="/js/custom.js"
          strategy="afterInteractive"
        />
      </Layout>
    </LoadingProvider>
  );
}
