import LandingPageLayout from "@/components/Layout/LandingPageLayout";
import { getPublicPageBySlug, PublicPage } from "@/services/publicPageService";

interface PublicPageViewProps {
  pageData: PublicPage;
}

export default function PublicPageView({ pageData }: PublicPageViewProps) {
  if (!pageData) {
    return <div>Page not found</div>;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: pageData.content }}
    />
  );
}

export async function getServerSideProps(context: any) {
  const { page } = context.params;
  try {
    const res = await getPublicPageBySlug(page);
    return {
      props: {
        pageData: res.data,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}

PublicPageView.Layout = LandingPageLayout;
