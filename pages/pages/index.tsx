import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";

interface PageRow {
  title: string;
  url: string;
  label: string;
  visibility: string;
  lastModified: string;
}

export default function ManagePages() {
  const pages: PageRow[] = [
    {
      title: "Forms",
      url: "https://healthpartnersdental.com/accreditation/forms",
      label: "Forms",
      visibility: "Published",
      lastModified: "Mar 14, 2025 3:15 PM",
    },
    {
      title: "Update Accreditation",
      url: "https://healthpartnersdental.com/accreditation/update-accreditation",
      label: "Update Accreditation",
      visibility: "Published",
      lastModified: "Mar 14, 2025 3:12 PM",
    },
    {
      title: "Requirements",
      url: "https://healthpartnersdental.com/accreditation/requirements",
      label: "Requirements",
      visibility: "Published",
      lastModified: "Mar 14, 2025 3:11 PM",
    },
  ];

  const columns: Column<PageRow>[] = [
    {
      key: "select",
      header: <input type="checkbox" />,
      render: () => <input type="checkbox" />,
    },
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <div>
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary fw-bold"
          >
            {row.title}
          </a>
          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>{row.url}</div>
        </div>
      ),
    },
    { key: "label", header: "Label" },
    { key: "visibility", header: "Visibility" },
    { key: "lastModified", header: "Last Modified" },
    {
      key: "options",
      header: "Options",
      render: () => (
        <>
          <button className="btn btn-link p-0 me-2 text-secondary">
            <i className="fas fa-eye"></i>
          </button>
          <button className="btn btn-link p-0 me-2 text-secondary">
            <i className="fas fa-edit"></i>
          </button>
          <button className="btn btn-link p-0 text-secondary">
            <i className="fas fa-cogs"></i>
          </button>
        </>
      ),
    },
  ];

  return (
    <div>
      <h3 className="mb-3">Manage Pages</h3>

      <div className="d-flex justify-content-between mb-3">
        <div>
          <button className="btn btn-outline-secondary me-2">Filters</button>
          <button className="btn btn-outline-secondary">Actions</button>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Search by Title"
          style={{ maxWidth: 260 }}
        />
      </div>

      <DataTable<PageRow> columns={columns} data={pages} itemsPerPage={10} />
    </div>
  );
}

ManagePages.Layout = AdminLayout;
