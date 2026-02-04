import Link from "next/link";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { blogPosts } from "@/data/blogPosts";
import BlogImageSlider from "@/components/blog/BlogImageSlider";

type Props = {
  posts: typeof blogPosts;
  currentPage: number;
  totalPages: number;
};

export default function BlogPage({ posts, currentPage, totalPages }: Props) {
  return (
    <div className="container">
      <div className="row">

        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-124 bo5-r h-full p-r-50 p-r-0-md bo-none-md">

            {posts.map((post) => (
              <div key={post.id} className="blo4 p-b-63">
                <div className="pic-blo4 hov-img-zoom bo-rad-10 pos-relative">

                  {/* SINGLE LINK ONLY */}
                  <Link href={`/public/blog/${post.slug}`}>
                    <BlogImageSlider
                      images={post.images}
                      alt={post.title}
                    />
                  </Link>

                  <div className="date-blo4 flex-col-c-m">
                    <span className="txt30 m-b-4">{post.day}</span>
                    <span className="txt31">{post.month}</span>
                  </div>
                </div>

                <div className="text-blo4 p-t-33">
                  <h4 className="p-b-16">
                    <Link href={`/public/blog/${post.slug}`} className="tit9">
                      {post.title}
                    </Link>
                  </h4>

                  <div className="txt32 flex-w p-b-24">
                    <span>
                      by {post.author}
                      <span className="m-r-6 m-l-4">|</span>
                    </span>
                    <span>
                      {post.fullDate}
                      <span className="m-r-6 m-l-4">|</span>
                    </span>
                    <span>
                      {post.categories}
                      <span className="m-r-6 m-l-4">|</span>
                    </span>
                    <span>{post.comments} Comments</span>
                  </div>

                  <p>{post.excerpt}</p>

                  <Link
                    href={`/public/blog/${post.slug}`}
                    className="dis-block txt4 m-t-30"
                  >
                    Continue Reading
                    <i className="fa-solid fa-arrow-right-long m-l-10" />
                  </Link>
                </div>
              </div>
            ))}

            {/* PAGINATION */}
            <div className="pagination flex-l-m flex-w m-l--6 p-t-25">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={`/public/blog?page=${page}`}
                    className={`item-pagination flex-c-m trans-0-4 ${
                      page === currentPage ? "active-pagination" : ""
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
            </div>

          </div>
        </div>

        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3">
          <BlogSidebar />
        </div>

      </div>
    </div>
  );
}

BlogPage.Layout = LandingPageLayout;

export async function getServerSideProps({ query }: any) {
  const PER_PAGE = 2;

  let filteredPosts = [...blogPosts];

  // SEARCH
  if (query.search) {
    const keyword = query.search.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
    );
  }

  // CATEGORY
  if (query.category) {
    filteredPosts = filteredPosts.filter((post) =>
      post.categories.includes(query.category)
    );
  }

  // ARCHIVE
  if (query.month) {
    filteredPosts = filteredPosts.filter((post) =>
      `${post.month} ${post.fullDate.split(" ").pop()}` === query.month
    );
  }

  // PAGINATION
  const currentPage = Number(query.page) || 1;
  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const paginatedPosts = filteredPosts.slice(start, end);
  const totalPages = Math.ceil(filteredPosts.length / PER_PAGE);

  return {
    props: {
      posts: paginatedPosts,
      currentPage,
      totalPages,
      pageData: {
        title: "Blog",
      },
    },
  };
}
