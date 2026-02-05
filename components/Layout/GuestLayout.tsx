import LandingTopbar from "./_Topbar";
import LandingFooter from "./_Footer";
import Banner from "./_Banner";
import { PublicAlbum } from "@/services/publicPageService";
import ToastHost from "@/components/UI/ToastHost";
import Head from "next/head";

interface LandingPageLayoutProps {
  children: React.ReactNode;
  pageData?: {
    title?: string;
    album?: PublicAlbum | null;
  };
  layout?: {
    fullWidth?: boolean;
  };
}

export default function LandingPageLayout({
  children,
  pageData,
  layout,
}: LandingPageLayoutProps) {
  const contentWrapperClassName = layout?.fullWidth
    ? "container-fluid px-0"
    : "container";

  return (
    <div className="d-flex flex-column min-vh-100">
      <Head>
        {/* Public/front-end template styles only (kept out of admin pages) */}
        <link rel="stylesheet" href="/css/public-css.css" />
        <link rel="stylesheet" href="/css/custom.css" />
        <link rel="stylesheet" href="/css/product.css" />
        <link rel="stylesheet" href="/css/banner.css" />
        <link rel="stylesheet" href="/css/navigation.css" />
        <link rel="stylesheet" href="/css/public-overrides.css" />
      </Head>

      <LandingTopbar />

      <Banner
        title={pageData?.title}
        album={pageData?.album}
      />

      <main className="flex-grow-1 py-5">
        <div className={contentWrapperClassName}>{children}</div>
      </main>

      <LandingFooter />

      <ToastHost />
    </div>
  );
}
