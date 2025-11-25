// pages/dashboard/menus.tsx
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";

interface MenuRow {
  name: string;
  status: string;
  dateModified: string;
}

const menus: MenuRow[] = [
  {
    name: "Main Navigation",
    status: "Active",
    dateModified: "Mar 14, 2025 3:20 PM",
  },
  {
    name: "Footer Menu",
    status: "Active",
    dateModified: "Mar 10, 2025 11:05 AM",
  },
  {
    name: "Member Menu",
    status: "Active",
    dateModified: "Feb 22, 2025 4:31 PM",
  },
  {
    name: "Provider Menu",
    status: "Inactive",
    dateModified: "Jan 15, 2025 9:17 AM",
  },
  {
    name: "Legacy Menu",
    status: "Inactive",
    dateModified: "Dec 2, 2024 2:05 PM",
  },
];

const columns: Column<MenuRow>[] = [
  {
    key: "select",
    header: <input type="checkbox" aria-label="Select all rows" />,
    render: () => <input type="checkbox" aria-label="Select row" />,
  },
  {
    key: "name",
    header: "Menu Name",
    render: (row) => <span className="fw-bold text-primary">{row.name}</span>,
  },
  {
    key: "status",
    header: "Menu Status",
  },
  {
    key: "dateModified",
    header: "Date Modified",
  },
  {
    key: "options",
    header: "Options",
    render: () => (
      <>
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

function ManageMenus() {
  return (
    <div>
      <h3 className="mb-3">Manage Menus</h3>

      <div className="d-flex justify-content-between mb-3">
        <div>
          <button className="btn btn-outline-secondary me-2">Filters</button>
          <button className="btn btn-outline-secondary">Actions</button>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Search Menus"
          style={{ maxWidth: 260 }}
        />
      </div>

      <DataTable<MenuRow> columns={columns} data={menus} itemsPerPage={10} />
    </div>
  );
}

ManageMenus.Layout = AdminLayout;

export default ManageMenus;
