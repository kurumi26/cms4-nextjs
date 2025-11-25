// pages/dashboard/users.tsx
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";

interface UserRow {
  name: string;
  email: string;
  role: string;
  status: string;
}

const users: UserRow[] = [
  {
    name: "Adminz Istratorz",
    email: "admin@healthpartnersdental.com",
    role: "Administrator",
    status: "Active",
  },
  {
    name: "John Doe",
    email: "john.doe@healthpartnersdental.com",
    role: "Editor",
    status: "Active",
  },
  {
    name: "Maria Santos",
    email: "maria.santos@healthpartnersdental.com",
    role: "Content Manager",
    status: "Inactive",
  },
  {
    name: "James Rivera",
    email: "james.rivera@healthpartnersdental.com",
    role: "Author",
    status: "Active",
  },
];

const columns: Column<UserRow>[] = [
  {
    key: "select",
    header: <input type="checkbox" aria-label="Select all rows" />,
    render: () => <input type="checkbox" aria-label="Select row" />,
  },
  {
    key: "name",
    header: "Name",
    render: (row) => <span className="fw-bold">{row.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (row) => (
      <span style={{ fontFamily: "monospace" }}>{row.email}</span>
    ),
  },
  {
    key: "role",
    header: "Role",
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <span
        className={`badge ${
          row.status === "Active" ? "bg-success" : "bg-secondary"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: "options",
    header: "Options",
    render: () => (
      <>
        <button className="btn btn-link p-0 me-2 text-secondary" title="Edit">
          <i className="fas fa-edit" />
        </button>
        <button className="btn btn-link p-0 text-danger" title="Delete">
          <i className="fas fa-trash" />
        </button>
      </>
    ),
  },
];

function ManageUsers() {
  return (
    <div>
      <h3 className="mb-3">Manage Users</h3>

      <div className="d-flex justify-content-between mb-3">
        <div>
          <button className="btn btn-outline-secondary me-2">Filters</button>
          <button className="btn btn-outline-secondary">Actions</button>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Search Users"
          style={{ maxWidth: 260 }}
        />
      </div>

      <DataTable<UserRow> columns={columns} data={users} itemsPerPage={10} />
    </div>
  );
}

ManageUsers.Layout = AdminLayout;

export default ManageUsers;
