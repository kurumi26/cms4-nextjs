import Link from "next/link";

export default function NewsItem({ article }: any) {
  return (
    <div className="d-flex gap-4 mb-5 pb-4 border-bottom">
      {/* IMAGE */}
      <div style={{ width: 240 }}>
        <img
          src={article.thumbnail_url? `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.thumbnail_url}` : article.image_url}

          className="img-fluid rounded"
          alt={article.name}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-grow-1">
        <Link href={`/public/news/${article.slug}`} className="text-decoration-none">
          <h5 className="text-primary fw-bold">{article.name}</h5>
        </Link>

        <div className="text-muted small mb-2">
          Posted on {article.date} &nbsp;|&nbsp; {article.category?.name}
        </div>

        <p className="text-muted">
          {article.teaser}
        </p> 

        <a href={`/public/news/${article.slug}`} className="btn btn-primary btn-sm">
        Read More →
        </a>
      </div>
    </div>
  );
}
