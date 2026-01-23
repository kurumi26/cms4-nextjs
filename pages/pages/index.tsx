import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { useEffect, useState, useRef } from "react";
import { getPages, getPageById, restorePage, deletePage, postDeletePage, postMethodDeletePage, postDeleteByPayload, updatePageStatus, updatePage } from "@/services/pageService";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";
import PageSizeSelector from "@/components/UI/PageSizeSelector";

interface PageRow {
  id: number;
  title: string;
  url: string;
  label: string;
  visibility: string;
  lastModified: string;
  slug?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
}

export default function ManagePages() {
  const router = useRouter();
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!;
  const [pages, setPages] = useState<PageRow[]>([]);
  const [recentlyDeletedPages, setRecentlyDeletedPages] = useState<PageRow[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<string>('modified');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreTitle, setRestoreTitle] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);

  const applySort = (next: { sortBy?: string; sortOrder?: string }) => {
    const nextSortBy = next.sortBy ?? sortBy;
    const nextSortOrder = next.sortOrder ?? sortOrder;
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
    fetchPages({ sortBy: nextSortBy, sortOrder: nextSortOrder, page: 1 });
  };

  const toggleSortField = (field: string, defaultOrder: 'asc' | 'desc') => {
    const normalizedField = field.toString();
    if (sortBy === normalizedField) {
      applySort({ sortOrder: (sortOrder === 'asc' ? 'desc' : 'asc') });
      return;
    }
    applySort({ sortBy: normalizedField, sortOrder: defaultOrder });
  };

  const SortHeader = ({ label, field, defaultOrder }: { label: string; field: string; defaultOrder: 'asc' | 'desc' }) => {
    const active = sortBy === field;
    const iconClass = !active
      ? 'fas fa-sort text-muted'
      : (sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down');

    return (
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
        style={{ color: 'inherit', fontWeight: 600 }}
        onClick={() => toggleSortField(field, defaultOrder)}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <i className={iconClass} />
      </button>
    );
  };

  const isRowDeleted = (row: PageRow) => {
    if (row.deleted_at) return true;
    if (row.is_deleted) return true;

    const visibility = (row.visibility ?? "").toString().trim().toLowerCase();
    if (visibility === "deleted") return true;

    const status = ((row as any).status ?? "").toString().trim().toLowerCase();
    if (status === "deleted") return true;

    return false;
  };

  const normalizePageStatus = (row: any) => {
    if (isRowDeleted(row)) return "deleted";
    const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
    if (!raw) return "";
    if (raw === "publish" || raw === "published" || raw === "public") return "published";
    if (raw === "private") return "private";
    if (raw === "draft") return "draft";
    if (raw === "deleted") return "deleted";
    return raw;
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "published":
        return "badge bg-success";
      case "private":
        return "badge bg-secondary";
      case "draft":
        return "badge bg-info text-dark";
      case "deleted":
        return "badge bg-danger";
      default:
        return "badge bg-light text-dark border";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "private":
        return "Private";
      case "draft":
        return "Draft";
      case "deleted":
        return "Deleted";
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
    }
  };

  const sortRowsClientSide = (rows: PageRow[], sortByValue: string, sortOrderValue: string) => {
    const order = (sortOrderValue ?? "desc").toString().toLowerCase() === "asc" ? 1 : -1;
    const by = (sortByValue ?? "modified").toString().toLowerCase();

    const getTitle = (r: any) => (r?.label ?? r?.title ?? "").toString().toLowerCase();
    const getModifiedMs = (r: any) => {
      const raw = r?.lastModified ?? r?.updated_at ?? r?.updatedAt ?? r?.modified_at ?? r?.created_at;
      const ms = raw ? new Date(raw).getTime() : NaN;
      return Number.isFinite(ms) ? ms : 0;
    };

    return rows
      .map((r, idx) => ({ r, idx }))
      .sort((a, b) => {
        let cmp = 0;
        if (by === "title") {
          cmp = getTitle(a.r).localeCompare(getTitle(b.r));
        } else {
          cmp = getModifiedMs(a.r) - getModifiedMs(b.r);
        }
        if (cmp === 0) cmp = a.idx - b.idx;
        return cmp * order;
      })
      .map((x) => x.r);
  };

  const markRowDeletedLocal = (row: PageRow): PageRow => {
    const nowIso = new Date().toISOString();
    return {
      ...row,
      deleted_at: row.deleted_at ?? nowIso,
      is_deleted: true,
      visibility: (row.visibility ?? "").toString().trim() ? (row.visibility as any) : "Deleted",
      // If backend uses visibility/status as Deleted, keep it consistent.
      ...(String((row.visibility ?? "")).toLowerCase() === "deleted" ? {} : { visibility: "Deleted" } as any),
      ...(String(((row as any).status ?? "")).toLowerCase() === "deleted" ? {} : { status: "Deleted" } as any),
    };
  };

  const rememberDeletedById = async (id: number) => {
    // Try to capture the row from current list first
    const fromList = pages.find((p) => p.id === id);
    if (fromList) {
      const deletedRow = markRowDeletedLocal(fromList);
      setRecentlyDeletedPages((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
      return;
    }

    // Fallback: try to fetch by id (may fail if hard-deleted)
    try {
      const res = await getPageById(id);
      const deletedRow = markRowDeletedLocal(res.data?.data ?? res.data);
      setRecentlyDeletedPages((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
    } catch {
      // ignore
    }
  };

  const deletePageSoftFirst = async (id: number) => {
    // Prefer soft-delete endpoints first (POST action variants), then fallback to DELETE.
    // This increases likelihood the page is soft-deleted (restorable) instead of permanently removed.
    try {
      await postDeletePage(id);
      return;
    } catch (err1: any) {
      console.warn('postDeletePage failed', err1?.response?.status, err1?.response?.data || err1?.message);
      try {
        await postMethodDeletePage(id);
        return;
      } catch (err2: any) {
        console.warn('postMethodDeletePage failed', err2?.response?.status, err2?.response?.data || err2?.message);
        try {
          await postDeleteByPayload(id);
          return;
        } catch (err3: any) {
          console.warn('postDeleteByPayload failed', err3?.response?.status, err3?.response?.data || err3?.message);
          await deletePage(id);
        }
      }
    }
  };

  const bulkUpdateStatus = async (status: "published" | "private") => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one page");
      return;
    }
    if (showDeleted) {
      toast.error("Bulk actions are disabled in Trash view");
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          try {
            await updatePage(id, { status });
          } catch {
            await updatePageStatus(id, status as any);
          }
        })
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(`Updated ${ok} page(s) to ${status}`);
      else toast.error(`Updated ${ok}, failed ${fail}`);
      setSelectedIds([]);
      setSelectAll(false);
      fetchPages();
    } finally {
      setLoading(false);
    }
  };

  const openBulkDeleteConfirm = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one page");
      return;
    }
    if (showDeleted) {
      toast.error("Bulk delete is disabled in Trash view");
      return;
    }
    setBulkDeleteIds(selectedIds);
    setBulkDeleteModalOpen(true);
  };

  const doBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled(
        bulkDeleteIds.map(async (id) => {
          await deletePageSoftFirst(id);
          await rememberDeletedById(id);
        })
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(`Deleted ${ok} page(s)`);
      else toast.error(`Deleted ${ok}, failed ${fail}`);
      setBulkDeleteModalOpen(false);
      setBulkDeleteIds([]);
      setSelectedIds([]);
      setSelectAll(false);
      fetchPages();
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (overrides?: { sortBy?: string; sortOrder?: string; perPage?: number; showDeleted?: boolean; page?: number; search?: string }) => {
    try {
      setLoading(true);

      const useSearch = overrides?.search ?? search;
      const usePage = overrides?.page ?? currentPage;
      const usePerPage = overrides?.perPage ?? perPage;
      const useSortBy = overrides?.sortBy ?? sortBy;
      const useSortOrder = overrides?.sortOrder ?? sortOrder;
      const useShowDeleted = overrides?.showDeleted ?? showDeleted;

      const deletedFlag = useShowDeleted ? 1 : 0;

      const params: any = {
        search: useSearch,
        page: usePage,
        per_page: usePerPage,
        // sorting
        sort_by: useSortBy,
        sort_order: useSortOrder,
        // Prefer numeric flags for backend query parsing (common in PHP/Laravel).
        // When toggled on, treat this as a Trash view (only deleted rows).
        show_deleted: deletedFlag,
        ...(deletedFlag
          ? {
              // common soft-delete query contracts
              with_trashed: 1,
              only_trashed: 1,
              only_deleted: 1,
            }
          : {}),
      };

      let res = await getPages(params);
      let apiRows: PageRow[] = res.data.data;
      // Be defensive: some APIs may still include deleted rows even when show_deleted=0.
      // Keep deleted rows exclusively in the Trash view.
      let rows = useShowDeleted ? apiRows.filter(isRowDeleted) : apiRows.filter((r) => !isRowDeleted(r));

      // If backend doesn't support only_trashed/only_deleted but does support include-deleted,
      // retry with a simpler contract and keep Trash-only behavior via client-side filtering.
      if (useShowDeleted && rows.length === 0) {
        const fallbackParams: any = {
          search: useSearch,
          page: usePage,
          per_page: usePerPage,
          sort_by: useSortBy,
          sort_order: useSortOrder,
          show_deleted: 1,
          with_trashed: 1,
        };

        res = await getPages(fallbackParams);
        apiRows = res.data.data;
        rows = apiRows.filter(isRowDeleted);
      }

      // Merge in any locally-cached recently deleted rows so Trash view feels immediate
      if (useShowDeleted && recentlyDeletedPages.length > 0) {
        const byId = new Map<number, PageRow>();
        for (const r of rows) byId.set(r.id, r);
        for (const r of recentlyDeletedPages) {
          if (!byId.has(r.id) && isRowDeleted(r)) byId.set(r.id, r);
        }
        rows = Array.from(byId.values());
      }

      // Client-side sort fallback (some APIs ignore sort_by/sort_order).
      rows = sortRowsClientSide(rows, useSortBy, useSortOrder);

      setPages(rows);
      setSelectedIds([]);
      setSelectAll(false);
      setCurrentPage(res.data.meta.current_page);
      setTotalPages(res.data.meta.last_page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchPages();
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchPages();
  }, [currentPage, perPage, showDeleted, sortBy, sortOrder]);

  const handleApplyFilters = (filters: { sortBy: string; sortOrder: string; showDeleted: boolean; perPage: number }) => {
    setSortBy(filters.sortBy);
    setSortOrder(filters.sortOrder);
    setPerPage(filters.perPage);
    setShowDeleted(filters.showDeleted);
    setCurrentPage(1);
    // fetch immediately using the new filter values to avoid state update race
    fetchPages({ sortBy: filters.sortBy, sortOrder: filters.sortOrder, perPage: filters.perPage, showDeleted: filters.showDeleted, page: 1 });
  };

  const openRestoreConfirm = (id: number, title?: string) => {
    setRestoreId(id);
    setRestoreTitle(title ?? null);
    setRestoreModalOpen(true);
  };

  const doRestore = async () => {
    if (!restoreId) return;
    try {
      await restorePage(restoreId);
      toast.success("Page restored");
      setRestoreModalOpen(false);
      setRecentlyDeletedPages((prev) => prev.filter((p) => p.id !== restoreId));
      // If we restored from Trash, bounce back to the main list automatically.
      if (showDeleted) {
        setShowDeleted(false);
        setCurrentPage(1);
        fetchPages({ showDeleted: false, page: 1 });
      } else {
        fetchPages();
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || "Failed to restore page");
    }
  };

  const columns: Column<PageRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={() => {
            if (!selectAll) {
              setSelectedIds(pages.map((p) => p.id));
              setSelectAll(true);
            } else {
              setSelectedIds([]);
              setSelectAll(false);
            }
          }}
        />
      ),
      render: (row: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => {
            setSelectedIds((prev) =>
              prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
            );
          }}
        />
      ),
    },
    {
      key: "title",
      header: <SortHeader label="Title" field="title" defaultOrder="asc" />,
      render: (row: any) => (
        <div>
          {showDeleted || isRowDeleted(row) ? (
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-muted" style={{ textDecoration: "line-through" }}>
                {row.label}
              </span>
            </div>
          ) : (
            <a
              href={`/public/${row.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary fw-bold"
            >
              {row.label}
            </a>
          )}

          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
            {FRONTEND_URL}/public/{row.slug}
          </div>
        </div>
      ),
    },
    { key: "label", header: "Label" },
    {
      key: "visibility",
      header: "Visibility",
      render: (row: any) => {
        const s = normalizePageStatus(row);
        return <span className={statusBadgeClass(s)}>{statusLabel(s)}</span>;
      },
    },
    { key: "lastModified", header: <SortHeader label="Last Modified" field="modified" defaultOrder="desc" /> },
    {
      key: "options",
      header: "Options",
      render: (row: any) => (
        <>
          {showDeleted ? (
            <button
              className="btn btn-link p-0 text-success"
              onClick={() => openRestoreConfirm(row.id, row.label || row.title)}
              title="Restore"
            >
              <i className="fas fa-trash-restore"></i>
            </button>
          ) : (
            <>
              {/* View */}
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                onClick={() => window.open(`/public/${row.slug}`, "_blank")}
                title="View"
              >
                <i className="fas fa-eye"></i>
              </button>

              {/* Edit */}
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                onClick={() => router.push(`/pages/edit/${row.id}`)}
                title="Edit"
              >
                <i className="fas fa-edit"></i>
              </button>

              <SettingsMenu row={row} />

              {isRowDeleted(row) && (
                <button
                  className="btn btn-link p-0 ms-2 text-success"
                  onClick={() => openRestoreConfirm(row.id, row.label || row.title)}
                  title="Restore"
                >
                  <i className="fas fa-trash-restore"></i>
                </button>
              )}
            </>
          )}
        </>
      ),
    },
  ];

  function SettingsMenu({ row }: { row: any }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    const handleClick = (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY, left: rect.left });
      setOpen((s) => !s);
    };

    const handleDelete = () => {
      setDeleteId(row.id);
      setDeleteTitle(row.label || row.title);
      setDeleteModalOpen(true);
      setOpen(false);
    };

    const handleToggleStatus = async () => {
      const current = (row.visibility || row.status || '').toString().toLowerCase();
      const newStatus = (current === 'published' ? 'private' : 'published') as "published" | "private" | "draft";
      // Try PUT first (updatePage), fallback to PATCH if necessary
      try {
        await updatePage(row.id, { status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
        setOpen(false);
        fetchPages();
        return;
      } catch (putErr: any) {
        console.warn('updatePage (PUT) failed, trying PATCH', putErr?.response?.status);
        try {
          await updatePageStatus(row.id, newStatus);
          toast.success(`Status updated to ${newStatus}`);
          setOpen(false);
          fetchPages();
          return;
        } catch (patchErr: any) {
          console.error('Both PUT and PATCH failed', { putErr, patchErr });
          const serverMsg = patchErr?.response?.data?.message || putErr?.response?.data?.message || patchErr?.message || putErr?.message;
          toast.error(serverMsg || 'Failed to update status');
        }
      }
    };

    return (
      <div style={{ display: "inline-block", position: "relative" }}>
        <button className="btn btn-link p-0 text-secondary" onClick={handleClick}>
          <i className="fas fa-cogs"></i>
        </button>

        {open && pos && (
          <div>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1055 }} onClick={() => setOpen(false)} />
            <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1060 }}>
              <div className="card shadow-sm compact-dropdown" style={{ width: 160 }}>
                <div className="list-group list-group-flush">
                  {/* Action to toggle status (show opposite action, not current status) */}
                  <button className="list-group-item list-group-item-action" onClick={handleToggleStatus}>
                    {((row.visibility || row.status || '').toString().toLowerCase() === 'published') ? 'Private' : 'Published'}
                  </button>
                  {!isRowDeleted(row) && (
                    <button className="list-group-item list-group-item-action text-danger" onClick={handleDelete}>
                      Delete
                    </button>
                  )}
                  {isRowDeleted(row) && (
                    <div className="list-group-item text-muted">Deleted</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="container">
      <h3 className="mb-3">Manage Pages</h3>

      {showDeleted && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <strong>Trash view:</strong> showing deleted pages only.
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDeleted(false)}>
            Back to list
          </button>
        </div>
      )}

      <SearchBar
        placeholder="Search by Title"
        value={search}
        onChange={(value: string) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkUpdateStatus("published")}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Publish
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkUpdateStatus("private")}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Private
            </button>
            <button
              className="list-group-item list-group-item-action text-danger"
              onClick={openBulkDeleteConfirm}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Delete
            </button>
          </>
        )}
        onApplyFilters={handleApplyFilters}
        initialShowDeleted={showDeleted}
        initialPerPage={perPage}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
      />

      <PageSizeSelector
        value={perPage}
        onChange={(value) => {
          setPerPage(value);
          setCurrentPage(1);
        }}
      />

      <DataTable<PageRow>
        columns={columns}
        data={pages}
        loading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ConfirmModal
        show={restoreModalOpen}
        title="Restore page"
        message={<>You want to restore <strong>{restoreTitle}</strong>?</>}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={doRestore}
        onCancel={() => setRestoreModalOpen(false)}
      />

      <ConfirmModal
        show={deleteModalOpen}
        title="Move page to Trash"
        message={<>Move <strong>{deleteTitle}</strong> to Trash? You can restore it later from the deleted list.</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deletePageSoftFirst(deleteId);
            await rememberDeletedById(deleteId);
            toast.success("Page deleted");
            setDeleteModalOpen(false);
            // Stay on the current view; user can switch to Trash manually.
            fetchPages();
            return;
          } catch (err: any) {
            const serverMsg = err?.response?.data?.message || err?.message;
            toast.error(serverMsg || 'Failed to delete page');
            return;
          }
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <ConfirmModal
        show={bulkDeleteModalOpen}
        title="Move pages to Trash"
        message={<>Move <strong>{bulkDeleteIds.length}</strong> selected page(s) to Trash?</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={doBulkDelete}
        onCancel={() => setBulkDeleteModalOpen(false)}
      />


    </div>
  );
}

ManagePages.Layout = AdminLayout;
