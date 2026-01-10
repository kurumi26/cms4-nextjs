import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { getPublicArticles, getCategories, getArchive } from "@/services/articleService";
import LeftSidebar from "@/components/News/LeftSidebar";
import NewsList from "@/components/News/NewsList";

type Props = {
  pageData: any;
  articles: any[];
  categories: any[];
  archives: Record<string, { month: number; total: number }[]>;
};

export default function NewsPage({ articles, categories, archives }: Props) {
  return (
    <div className="container">
      <div className="row">
        
        <div className="col-lg-4 mb-4">
          <LeftSidebar categories={categories} archive={archives} />
        </div>

        <div className="col-lg-8">
          <NewsList articles={articles} />
        </div>
        
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const [pageRes, articlesRes, categoriesRes, archiveRes] = await Promise.all([
      getPublicPageBySlug("news"),
      getPublicArticles(),
      getCategories(),
      getArchive(),
    ]);

    return {
      props: {
        pageData: pageRes.data,
        articles: articlesRes.data.data ?? [],
        categories: categoriesRes.data ?? [],
        archives: archiveRes.data,
      },
    };
  } catch (error: any) {
    console.error("NEWS SSR ERROR:", error?.response?.data || error);
    return {
      props: {
        pageData: null,
        articles: [],
        categories: [],
        archive: []
      },
    };
  }
}


NewsPage.Layout = LandingPageLayout;
