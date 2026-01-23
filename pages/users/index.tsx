import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import PageSizeSelector from "@/components/UI/PageSizeSelector";
import { getUsers, toggleUserActive, UserRow } from "@/services/userService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";

function ManageUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showInactiveOnly, setShowInactiveOnly] = useState<boolean>(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const sortRowsClientSide = (rows: UserRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getName = (r: UserRow) => (r?.name ?? "").toString().toLowerCase();
    const getEmail = (r: UserRow) => (r?.email ?? "").toString().toLowerCase();
    const getModifiedMs = (r: any) => {
      const raw = r?.updated_at ?? r?.updated_at_formatted ?? r?.updated;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    copy.sort((a: any, b: any) => {
      if (sortByKey === "email") {
        const av = getEmail(a);
        const bv = getEmail(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      if (sortByKey === "updated_at") {
        return (getModifiedMs(a) - getModifiedMs(b)) * direction;
      }

      const av = getName(a);
      const bv = getName(b);
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });

    return copy;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await getUsers({
        search,
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        // backend may support this; UI also enforces client-side below
        status: showInactiveOnly ? "Inactive" : undefined,
      });

      const apiRows: UserRow[] = Array.isArray(res?.data?.data) ? res.data.data : [];

      const filteredRows = showInactiveOnly
        ? apiRows.filter((u) => String(u.status ?? "").toLowerCase() !== "active")
        : apiRows;

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);

      setUsers(sortedRows);
      setTotalPages(res?.meta?.last_page ?? 1);
    } finally {
      setLoading(false);
    }
  };

  const isActiveUser = (row: UserRow) => String(row.status ?? "").toLowerCase() === "active";

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(users.map((u) => u.id));
    else setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const bulkSetActive = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => toggleUserActive(id, active)));
      toast.success(`${active ? "Activated" : "Deactivated"} ${selectedIds.length} user(s)`);
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update selected users");
    }
  };

  const handleToggleActive = async (row: UserRow) => {
    try {
      await toggleUserActive(row.id, !isActiveUser(row));
      toast.success(`User ${!isActiveUser(row) ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user status");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly]);

  useEffect(() => {
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly]);

  const columns: Column<UserRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={users.length > 0 && users.every((u) => selectedIds.includes(u.id))}
          onChange={(e) => toggleSelectAll(e.target.checked)}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => toggleRow(row.id, e.target.checked)}
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => <span className="fw-bold">{row.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortField: "email",
      defaultSortOrder: "asc",
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
      sortable: true,
      sortField: "status",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className={`badge ${row.status === "Active" ? "bg-success" : "bg-secondary"}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="View"
            onClick={() => router.push(`/users/view/${row.id}`)}
            type="button"
          >
            <i className="fas fa-eye" />
          </button>

          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onClick={() => router.push(`/users/edit/${row.id}`)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0"
            title={isActiveUser(row) ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(row)}
            style={{
              color: isActiveUser(row) ? "#198754" : "#6c757d",
            }}
            type="button"
          >
            <i className={`fas ${isActiveUser(row) ? "fa-toggle-on" : "fa-toggle-off"}`} />
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="container">
      <h3 className="mb-3">Manage Users</h3>

      <SearchBar
        placeholder="Search users"
        value={search}
        onChange={(v) => {
          setSearch(v);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(true)}
              type="button"
              disabled={selectedIds.length === 0 || loading}
            >
              Activate
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(false)}
              type="button"
              disabled={selectedIds.length === 0 || loading}
            >
              Deactivate
            </button>
          </>
        )}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sInactiveOnly, perPage: sPerPage }) => {
          setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
          setSortOrder(sOrder);
          setShowInactiveOnly(sInactiveOnly);
          setPerPage(sPerPage);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy === "updated_at" ? "modified" : sortBy === "name" ? "title" : sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
        initialShowDeleted={showInactiveOnly}
        showDeletedLabel="Show inactive only"
      />

      <PageSizeSelector
        value={perPage}
        onChange={(v) => {
          setPerPage(v);
          setCurrentPage(1);
        }}
      />

      <DataTable<UserRow>
        columns={columns}
        data={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortBy={sortBy}
        sortOrder={(String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc") as any}
        onSortChange={(nextBy, nextOrder) => {
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

ManageUsers.Layout = AdminLayout;
export default ManageUsers;
