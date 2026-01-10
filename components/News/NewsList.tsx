import NewsItem from "@/components/News/NewsItem";

type Props = {
  articles: any[];
};

export default function NewsList({ articles }: Props) {
  return (
    <div>
      {articles.map((article) => (
        <NewsItem key={article.id} article={article} />
      ))}
    </div>
  );
}
