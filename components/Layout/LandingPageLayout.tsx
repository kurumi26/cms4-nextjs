import React from "react";
import LandingTopbar from './LandingTopbar';
import LandingFooter from './LandingFooter';
import Banner from "./Banner";

interface LandingPageLayoutProps {
  children: React.ReactNode;
  pageData?: {
    title?: string;
    banner_image?: string;
  };
}

export default function LandingPageLayout({
  children,
  pageData,
}: LandingPageLayoutProps) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <LandingTopbar />

      <Banner title={pageData?.title} />

      <main className="flex-grow-1 py-5">
        <div className="container">{children}</div>
      </main>

      <LandingFooter />
    </div>
  );
}
