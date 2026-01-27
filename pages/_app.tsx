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
import "@/styles/public-css.css";

import "@/public/css/custom.css";

import type { AppProps } from "next/app";
import React from "react";
import Head from "next/head";
import Script from "next/script";
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

        {process.env.NODE_ENV === "production" && (
          <Script
            id="cf-beacon"
            src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015"
            strategy="afterInteractive"
            integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ=="
            data-cf-beacon='{"version":"2024.11.0","token":"cd0b4b3a733644fc843ef0b185f98241","server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}'
            crossOrigin="anonymous"
          />
        )}

        <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/js/flatpickr.min.js" strategy="afterInteractive" />
        <Script src="/js/glightbox.min.js" strategy="afterInteractive" />
        <Script src="/js/swiper-bundle.min.js" strategy="afterInteractive" />
        <Script src="/js/swiper-custom.js" strategy="afterInteractive" />
        <Script src="/js/main.js" strategy="afterInteractive" />
      </Layout>
    </LoadingProvider>
  );
}
