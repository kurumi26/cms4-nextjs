import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { getCustomers, toggleCustomerActive, CustomerRow } from "@/services/customerService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import Link from "next/link";

type AdvancedSearchValues = Record<string, string>;

function ManageCustomers() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showInactiveOnly, setShowInactiveOnly] = useState<boolean>(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const getRequestedStatus = () => {
    if (showInactiveOnly) return "inactive";
    return advancedSearchValues.status || "active";
  };

  const sortRowsClientSide = (rows: CustomerRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getName = (r: CustomerRow) => (r?.name ?? "").toString().toLowerCase();
    const getEmail = (r: CustomerRow) => (r?.email ?? "").toString().toLowerCase();
    const getType = (r: CustomerRow) => (r?.type ?? r?.role ?? "").toString().toLowerCase();
    const getDateRegisteredMs = (r: CustomerRow) => {
      const raw = r?.created_at ?? r?.date_registered;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };
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
      if (sortByKey === "type") {
        const av = getType(a);
        const bv = getType(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      if (sortByKey === "created_at") {
        return (getDateRegisteredMs(a) - getDateRegisteredMs(b)) * direction;
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

  const fetchCustomers = async (opts?: { silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const res = await getCustomers({
        search,
        name: advancedSearchValues.name || undefined,
        email: advancedSearchValues.email || undefined,
        status: getRequestedStatus(),
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      }, { silent });

      const apiRows: CustomerRow[] = Array.isArray(res?.data?.data) ? res.data.data : [];
      const requestedStatus = getRequestedStatus();

      const filteredRows = requestedStatus
        ? apiRows.filter((u) => String(u.status ?? "").toLowerCase() === requestedStatus)
        : apiRows;

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);

      setCustomers(sortedRows);
      setTotalPages(res?.meta?.last_page ?? 1);
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  const isActiveCustomer = (row: CustomerRow) => String(row.status ?? "").toLowerCase() === "active";

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(customers.map((u) => u.id));
    else setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const bulkSetActive = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => toggleCustomerActive(id, active)));
      toast.success(`${active ? "Activated" : "Deactivated"} ${selectedIds.length} customer(s)`);
      setSelectedIds([]);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update selected customers");
    }
  };

  const handleToggleActive = async (row: CustomerRow) => {
    try {
      await toggleCustomerActive(row.id, !isActiveCustomer(row));
      toast.success(`Customer ${!isActiveCustomer(row) ? "activated" : "deactivated"}`);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update customer status");
    }
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const timeout = setTimeout(() => fetchCustomers({ silent }), 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly]);

  const columns: Column<CustomerRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={customers.length > 0 && customers.every((u) => selectedIds.includes(u.id))}
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
      key: "type",
      header: "Type",
      sortable: true,
      sortField: "type",
      render: (row) => row.type ?? row.role ?? "Customer",
    },
    {
      key: "date_registered",
      header: "Date Registered",
      sortable: true,
      sortField: "created_at",
      defaultSortOrder: "desc",
      render: (row) => row.date_registered ?? (row.created_at ? new Date(row.created_at).toLocaleDateString() : ""),
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
            onClick={() => router.push(`/customers/view/${row.id}`)}
            type="button"
          >
            <i className="fas fa-eye" />
          </button>

          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onClick={() => router.push(`/customers/edit/${row.id}`)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0"
            title={isActiveCustomer(row) ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(row)}
            style={{
              color: isActiveCustomer(row) ? "#198754" : "#6c757d",
            }}
            type="button"
          >
            <i className={`fas ${isActiveCustomer(row) ? "fa-toggle-on" : "fa-toggle-off"}`} />
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Customers</h3>

      <SearchBar
        placeholder="Search customers"
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
        rightExtras={(
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-success d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              onClick={() => setShowAdvancedModal(true)}
            >
              <span style={{ lineHeight: 1, textAlign: "center", display: "inline-block" }}>
                Advanced Search
              </span>
            </button>

            <Link
              href="/customers/create"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              Create Customer
            </Link>
          </div>
        )}
        filtersOpen={showAdvancedModal}
        onFiltersOpenChange={(open) => {
          if (!open) setShowAdvancedModal(false);
        }}
        externalOpenAsModal={true}
        advancedSearchUpdatesInput={false}
        onAdvancedSearch={(values) => setAdvancedSearchValues(values)}
        advancedFields={[
          { name: "name", label: "Name" },
          { name: "email", label: "Email" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sInactiveOnly, perPage: sPerPage, advancedValues }) => {
          setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
          setSortOrder(sOrder);
          setShowInactiveOnly(sInactiveOnly);
          setPerPage(sPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy === "updated_at" ? "modified" : sortBy === "name" ? "title" : sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
        initialShowDeleted={showInactiveOnly}
        showDeletedLabel="Show inactive only"
      />

      <DataTable<CustomerRow>
        columns={columns}
        data={customers}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
        sortBy={sortBy}
        sortOrder={(String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc") as any}
        onSortChange={(nextBy, nextOrder) => {
          silentSortFetchRef.current = true;
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

ManageCustomers.Layout = AdminLayout;
export default ManageCustomers;
