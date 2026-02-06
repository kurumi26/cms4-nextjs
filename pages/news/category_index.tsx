"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { useRouter } from "next/router";
import {
  getArticleCategories,
  NewsCategoryRow,
} from "@/services/articleService";

function ManageNews() {
  const router = useRouter();

  const [categories, setCategories] = useState<NewsCategoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortRowsClientSide = (rows: NewsCategoryRow[], by: string, order: "asc" | "desc") => {
    const direction = order === "asc" ? 1 : -1;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const av = (a as any)?.[by];
      const bv = (b as any)?.[by];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();
      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
    return copy;
  };

  /* ======================
   * Fetch Categories
   * ====================== */
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await getArticleCategories({
        search,
        page: currentPage,
        per_page: perPage,
      });

      const apiRows: NewsCategoryRow[] = Array.isArray(res?.data) ? res.data : [];
      setCategories(apiRows);
      setTotalPages(res?.last_page ?? 1); // ✅ FIX
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchCategories, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  const sortedCategories = useMemo(
    () => sortRowsClientSide(categories, sortBy, sortOrder),
    [categories, sortBy, sortOrder]
  );

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<NewsCategoryRow>[] = [
    {
      key: "select",
      header: <input type="checkbox" />,
      render: () => <input type="checkbox" />,
    },
    {
      key: "name",
      header: "Category Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className="fw-bold text-primary">{row.name}</span>
      ),
    },
    {
      key: "slug",
      header: "URL",
      sortable: true,
      sortField: "slug",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className="text-muted small">
          /news/{row.slug}
        </span>
      ),
    },
    {
      key: "articles_count",
      header: "Total News",
      sortable: true,
      sortField: "articles_count",
      defaultSortOrder: "desc",
      render: (row) => row.articles_count ?? 0,
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onClick={() =>
              router.push(`/news/edit_category/${row.id}`)
            }
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0 text-danger"
            title="Delete"
          >
            <i className="fas fa-trash" />
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
      <h3 className="mb-3">Manage News Categories</h3>

      <SearchBar
        placeholder="Search by Category"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        leftExtras={(
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Show</span>
            <select
              className="form-select form-select-sm w-auto"
              value={perPage}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPerPage(value);
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-muted small">entries</span>
          </div>
        )}
      />

      <DataTable<NewsCategoryRow>
        columns={columns}
        data={sortedCategories}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextBy, nextOrder) => {
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

ManageNews.Layout = AdminLayout;
export default ManageNews;
