import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { useEffect, useState } from "react";
import { getPages } from "@/services/pageService";
import { useRouter } from "next/router";
import { loading } from "@/plugins/loading";

interface PageRow {
  id: number;
  title: string;
  url: string;
  label: string;
  visibility: string;
  lastModified: string;
}

export default function ManagePages() {
  const router = useRouter();
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!;
  const [pages, setPages] = useState<PageRow[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await getPages({ search });
      setPages(res.data.data);
    } catch (error) {
      console.error("Failed to load pages", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [search]);

  const columns: Column<PageRow>[] = [
    {
      key: "select",
      header: <input type="checkbox" />,
      render: () => <input type="checkbox" />,
    },
    {
      key: "title",
      header: "Title",
      render: (row: any) => (
        <div>
          <a
            href={`/public/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary fw-bold"
          >
            {row.label}
          </a>

          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
            {FRONTEND_URL}/public/{row.slug}
          </div>
        </div>

      ),
    },
    { key: "label", header: "Label" },
    { key: "visibility", header: "Visibility" },
    { key: "lastModified", header: "Last Modified" },
    {
      key: "options",
      header: "Options",
      render: (row: any) => (
        <>
          {/* View */}
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            onClick={() => window.open(`/public/${row.slug}`, "_blank")}
          >
            <i className="fas fa-eye"></i>
          </button>

          {/* Edit */}
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            onClick={() => router.push(`/pages/edit/${row.id}`)}
          >
            <i className="fas fa-edit"></i>
          </button>

          {/* Settings (future) */}
          <button className="btn btn-link p-0 text-secondary">
            <i className="fas fa-cogs"></i>
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="container">
      <h3 className="mb-3">Manage Pages</h3>

      <SearchBar
        placeholder="Search by Title"
        onChange={(value: string) => setSearch(value)}
      />

      <DataTable<PageRow>
        columns={columns}
        data={pages}
        loading={isLoading}
        itemsPerPage={10}
      />
    </div>
  );
}

ManagePages.Layout = AdminLayout;
