import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import PageSizeSelector from "@/components/UI/PageSizeSelector";
import { toast } from "@/lib/toast";
import {
  getRoles,
  RoleRow,
  createRole,
  updateRole,
} from "@/services/roleService";

function ManageRoles() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  /* ======================
   * Fetch Roles
   * ====================== */
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await getRoles({
        search,
        page: currentPage,
        per_page: perPage,
      });

      setRoles(res.data.data);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error("Failed to load roles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchRoles, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  /* ======================
   * Save Role
   * ====================== */
  const handleSaveRole = async () => {
    // 🔎 Client-side validation
    if (!name.trim()) {
      return toast.error("Role name is required");
    }

    if (!description.trim()) {
      return toast.error("Role description is required");
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Role updated successfully.");
      } else {
        await createRole({
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Role created successfully.");
      }

      // Reset form
      setEditingRole(null);
      setName("");
      setDescription("");

      // Refresh list
      fetchRoles();
    } catch (err: any) {
      console.error("Failed to save role", err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to save role. Please try again."
      );
    }
  };

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<RoleRow>[] = [
    {
      key: "name",
      header: "Role Name",
      render: (row) => (
        <span className="fw-bold text-primary">{row.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => row.description || "—",
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (row) =>
        new Date(row.updated_at).toLocaleString(),
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <button
          className="btn btn-link p-0 text-secondary"
          title="Edit"
          onClick={() => {
            setEditingRole(row);
            setName(row.name);
            setDescription(row.description || "");
          }}
        >
          <i className="fas fa-edit" />
        </button>
      ),
    },
  ];

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container">
      <h3 className="mb-3">Manage Roles</h3>

      <SearchBar
        placeholder="Search roles"
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

      {/* Create / Edit Form */}
      <div className={`card mb-3 ${editingRole ? "border border-primary shadow-sm" : ""}`}>
        <div className="card-body">
          <h6 className="mb-3">
            {editingRole ? "Edit Role" : "Create Role"}
          </h6>

          <div className="mb-2">
            <input
              className="form-control"
              placeholder="Role name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <textarea
              className="form-control"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={handleSaveRole}>
            {editingRole ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>

      <DataTable<RoleRow>
        columns={columns}
        data={roles}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

ManageRoles.Layout = AdminLayout;
export default ManageRoles;
