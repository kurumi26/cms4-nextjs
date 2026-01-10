import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import PageSizeSelector from "@/components/UI/PageSizeSelector";
import { getArticles, ArticleRow } from "@/services/articleService";
import { useRouter } from "next/router";

function ManageNews() {
  const router = useRouter();

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* ======================
   * Fetch Articles
   * ====================== */
  const fetchArticles = async () => {
    try {
      setLoading(true);

      const res = await getArticles({
        search,
        page: currentPage,
        per_page: perPage,
      });

      setArticles(res.data);
      setTotalPages(res.last_page);
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchArticles, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  /* ======================
   * Map API → Table Rows
   * ====================== */
  const tableData: ArticleRow[] = useMemo(
    () =>
      articles.map((item) => ({
        id: item.id,
        title: item.name,
        category: item.category?.name ?? "-",
        is_featured: !!item.is_featured,
        visibility:
          item.status === "published" ? "Published" : "Private",
        updated: item.updated_at_formatted,
      })),
    [articles]
  );


  /* ======================
   * Columns
   * ====================== */
  const columns: Column<ArticleRow>[] = [
    {
      key: "select",
      header: <input type="checkbox" />,
      render: () => <input type="checkbox" />,
    },
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <span className="fw-bold text-primary">{row.title}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "is_featured",
      header: "Type",
      render: (row) =>
        row.is_featured ? (
          <span className="badge bg-success text-white">
            Featured
          </span>
        ) : null,
    },
    {
      key: "visibility",
      header: "Visibility",
    },
    {
      key: "updated",
      header: "Updated",
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="View"
          >
            <i className="fas fa-eye" />
          </button>

          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onClick={() =>
              router.push(`/news/edit/${row.id}`)
            }
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0 text-secondary"
            title="Settings"
          >
            <i className="fas fa-cogs" />
          </button>
        </>
      ),
    },
  ];

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container">
      <h3 className="mb-3">Manage News</h3>

      <SearchBar
        placeholder="Search News"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
      />

      <PageSizeSelector
        value={perPage}
        onChange={(value) => {
          setPerPage(value);
          setCurrentPage(1);
        }}
      />

      <DataTable<ArticleRow>
        columns={columns}
        data={tableData}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

ManageNews.Layout = AdminLayout;
export default ManageNews;
