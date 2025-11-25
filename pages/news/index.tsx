// pages/dashboard/news.tsx
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";

interface NewsRow {
  title: string;
  category: string;
  type: string;
  visibility: string;
  updated: string;
}

const newsData: NewsRow[] = [
  {
    title: "HMO Card Release Advisory",
    category: "Announcements",
    type: "Article",
    visibility: "Published",
    updated: "Mar 10, 2025 3:02 PM",
  },
  {
    title: "Dental Mission - Cebu",
    category: "Events",
    type: "Article",
    visibility: "Published",
    updated: "Feb 25, 2025 11:10 AM",
  },
  {
    title: "System Maintenance Update",
    category: "Announcements",
    type: "Advisory",
    visibility: "Published",
    updated: "Jan 14, 2025 9:42 AM",
  },
  {
    title: "New Clinic Partners 2025",
    category: "Updates",
    type: "Article",
    visibility: "Published",
    updated: "Dec 5, 2024 4:20 PM",
  },
];

const columns: Column<NewsRow>[] = [
  {
    key: "select",
    header: <input type="checkbox" aria-label="Select all rows" />,
    render: () => <input type="checkbox" aria-label="Select row" />,
  },
  {
    key: "title",
    header: "Title",
    render: (row) => <span className="fw-bold text-primary">{row.title}</span>,
  },
  {
    key: "category",
    header: "Category",
  },
  {
    key: "type",
    header: "Type",
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
    render: () => (
      <>
        <button className="btn btn-link p-0 me-2 text-secondary" title="View">
          <i className="fas fa-eye" />
        </button>
        <button className="btn btn-link p-0 me-2 text-secondary" title="Edit">
          <i className="fas fa-edit" />
        </button>
        <button className="btn btn-link p-0 text-secondary" title="Settings">
          <i className="fas fa-cogs" />
        </button>
      </>
    ),
  },
];

function ManageNews() {
  return (
    <div>
      <h3 className="mb-3">Manage News</h3>

      <div className="d-flex justify-content-between mb-3">
        <div>
          <button className="btn btn-outline-secondary me-2">Filters</button>
          <button className="btn btn-outline-secondary">Actions</button>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Search News"
          style={{ maxWidth: 260 }}
        />
      </div>

      <DataTable<NewsRow> columns={columns} data={newsData} itemsPerPage={10} />
    </div>
  );
}

ManageNews.Layout = AdminLayout;

export default ManageNews;
