import Head from "next/head";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getArticleBySlug } from "@/services/articleService";
import { articleToAlbum } from "@/schemas/articleToAlbum";

type Props = {
  pageData: any;
  article: any;
};

export default function NewsDetailPage({ article }: Props) {
  return (
    <>
      <Head>
        <title>{article.meta_title || article.name}</title>
        <meta
          name="description"
          content={article.meta_description || article.teaser}
        />
      </Head>

      <div className="container">
        {/* TITLE */}
        <h1 className="fw-bold text-primary mb-2">
          {article.name}
        </h1>

        {/* META */}
        <div className="text-muted small mb-4">
          Posted on {article.date}
          {article.user?.name && <> &nbsp;|&nbsp; By {article.user.name}</>}
          {article.category?.name && <> &nbsp;|&nbsp; {article.category.name}</>}
        </div>

        {/* FEATURED IMAGE */}
        {(article.thumbnail_url || article.image_url) && (
            <div className="mb-5 text-center">
                <img
                src={
                    article.thumbnail_url
                    ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.thumbnail_url}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.image_url}`
                }
                alt={article.name}
                className="img-fluid rounded"
                style={{ maxWidth: "500px" }}
                />
            </div>
        )}


        {/* CONTENT */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.contents }}
        />
      </div>
    </>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const res = await getArticleBySlug(params.slug);

    return {
      props: {
        pageData: {
          title: res.data.name,
          album: articleToAlbum(res.data),
        },
        article: res.data,
      },
    };
  } catch {
    return { notFound: true };
  }
}

NewsDetailPage.Layout = LandingPageLayout;
