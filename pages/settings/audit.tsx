import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import AuditChangesModal from "@/components/UI/AuditChangesModal";
import { getAuditTrails, AuditRow } from "@/services/auditService";

function AuditTrailsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [changesOpen, setChangesOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditRow | null>(null);

  /* ======================
   * Fetch Audit Trails
   * ====================== */
  const fetchAudits = async () => {
    try {
      setLoading(true);

      const res = await getAuditTrails({
        search,
        page: currentPage,
        per_page: perPage,
      });

      const payload: any = res?.data;

      const items: AuditRow[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];

      const nextTotalPages =
        Number(payload?.last_page ?? payload?.meta?.last_page ?? payload?.data?.last_page ?? payload?.data?.meta?.last_page) || 1;
      const nextCurrentPage =
        Number(payload?.current_page ?? payload?.meta?.current_page ?? payload?.data?.current_page ?? payload?.data?.meta?.current_page) ||
        currentPage;

      setAudits(items);
      setTotalPages(nextTotalPages);
      setCurrentPage(Math.min(Math.max(1, nextCurrentPage), nextTotalPages));
    } catch (err) {
      console.error("Failed to load audit trails", err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchAudits, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  const shorten = (value: unknown, max = 80) => {
    const text = String(value ?? "");
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  };

  const renderPreview = (values?: Record<string, any>) => {
    if (!values || Object.keys(values).length === 0) return "—";
    const entries = Object.entries(values);
    return entries
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${shorten(v, 40)}`)
      .join(" • ");
  };

  const openChanges = (row: AuditRow) => {
    setSelectedAudit(row);
    setChangesOpen(true);
  };

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<AuditRow>[] = [
    {
        key: "event",
        header: "Action",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-nowrap text-center",
        width: 110,
        render: (row) => (
        <span
          className={`badge text-uppercase ${
            row.event?.toLowerCase() === "created"
              ? "bg-success"
              : row.event?.toLowerCase() === "deleted"
                ? "bg-danger"
                : row.event?.toLowerCase() === "updated"
                  ? "bg-primary"
                  : "bg-secondary"
          }`}
        >
          {row.event}
        </span>
        ),
    },
    {
        key: "user",
        header: "Performed By",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
        width: 160,
        render: (row) =>
        row.user
            ? `${row.user.fname ?? ""} ${row.user.lname ?? ""}` ||
            row.user.email
            : "System",
    },
    {
        key: "auditable_type",
        header: "Model",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-nowrap text-center",
        width: 120,
        render: (row) => row.auditable_type.split("\\").pop(),
    },

    // 🔹 OLD VALUES
    {
        key: "old_values",
        header: "Old Value",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
        render: (row) => (
          <div className="small text-muted text-break text-center">{renderPreview(row.old_values)}</div>
        ),
    },

    // 🔹 NEW VALUES
    {
        key: "new_values",
        header: "New Value",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
        render: (row) => (
          <div className="small text-muted text-break text-center">{renderPreview(row.new_values)}</div>
        ),
    },

    {
      key: "changes",
      header: "Changes",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
      width: 90,
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => openChanges(row)}
          aria-label="View changes"
          title="View changes"
        >
          <i className="fas fa-eye" />
        </button>
      ),
    },

    {
        key: "created_at",
        header: "Date",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
        render: (row) =>
        new Date(row.created_at).toLocaleString(),
    },
    ];

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container">
      <h3 className="mb-3">Audit Trail</h3>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-md-auto">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Show</span>
            <select
              className="form-select form-select-sm w-auto"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-muted">entries</span>
          </div>
        </div>

        <div className="col-12 col-md d-flex justify-content-md-end">
          <div className="input-group input-group-sm w-100" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <i className="fas fa-magnifying-glass" />
            </span>
            <input
              className="form-control"
              placeholder="Search audit logs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <DataTable<AuditRow>
        columns={columns}
        data={audits}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        wrapperClassName="rounded border bg-white"
        tableClassName="table-sm table-striped table-hover align-middle"
        stickyHeader
        wrapperStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
      />

      <AuditChangesModal
        show={changesOpen}
        title="Audit changes"
        subtitle={
          selectedAudit
            ? `${selectedAudit.event?.toUpperCase?.() ?? selectedAudit.event} • ${
                selectedAudit.auditable_type?.split("\\").pop?.() ?? selectedAudit.auditable_type
              } #${selectedAudit.auditable_id} • ${new Date(selectedAudit.created_at).toLocaleString()}`
            : undefined
        }
        oldValues={selectedAudit?.old_values}
        newValues={selectedAudit?.new_values}
        onClose={() => {
          setChangesOpen(false);
          setSelectedAudit(null);
        }}
      />
    </div>
  );
}

AuditTrailsPage.Layout = AdminLayout;
export default AuditTrailsPage;
