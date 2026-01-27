import LandingTopbar from "./_Topbar";
import LandingFooter from "./_Footer";
import Banner from "./_Banner";
import { PublicAlbum } from "@/services/publicPageService";

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
      <LandingTopbar />

      <Banner
        title={pageData?.title}
        album={pageData?.album}
      />

      <main className="flex-grow-1 py-5">
        <div className={contentWrapperClassName}>{children}</div>
      </main>

      <LandingFooter />
    </div>
  );
}
