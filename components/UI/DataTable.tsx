import { ReactNode, useMemo, useState, useEffect } from "react";
import type { CSSProperties } from "react";

type SortOrder = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;

  // Optional per-column styling
  thClassName?: string;
  tdClassName?: string;

  // Optional per-column sizing/styling
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  thStyle?: CSSProperties;
  tdStyle?: CSSProperties;

  // Optional: enable click-to-sort header UI
  sortable?: boolean;
  sortField?: string; // defaults to `key`
  sortLabel?: string; // used for aria-label/tooltip when header isn't plain text
  defaultSortOrder?: SortOrder; // defaults to 'asc'
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;

  // Optional styling hooks
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  tableClassName?: string;
  tableStyle?: CSSProperties;

  // Layout helpers
  fixedLayout?: boolean;
  stickyHeader?: boolean;

  // Server-side pagination (optional)
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  // Client-side pagination fallback
  itemsPerPage?: number;
  // Optional callback when items per page changes (useful for server pagination)
  onItemsPerPageChange?: (n: number) => void;

  // Optional sorting (controlled if onSortChange provided, else internal)
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;
  // Optional actions area to render above the table (e.g. buttons/dropdowns)
  actions?: ReactNode;

  // Where to render the entries-per-page control. Defaults to 'bottom'.
  entriesPlacement?: "bottom" | "top" | "none";
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  wrapperClassName,
  wrapperStyle,
  tableClassName,
  tableStyle,
  fixedLayout = false,
  stickyHeader = false,
  actions,
  entriesPlacement = "bottom",
}: DataTableProps<T>) {
  const isServerPaginated =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function";

  const sortableColumns = useMemo(
    () => columns.filter((c) => c.sortable),
    [columns]
  );

  const firstSortableField = sortableColumns[0]?.sortField ?? sortableColumns[0]?.key;
  const [localSortBy, setLocalSortBy] = useState<string | undefined>(firstSortableField);
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>("asc");

  const effectiveSortBy = onSortChange ? sortBy : (sortBy ?? localSortBy);
  const effectiveSortOrder: SortOrder = onSortChange ? (sortOrder ?? "asc") : (sortOrder ?? localSortOrder);

  const applySortChange = (nextBy: string, nextOrder: SortOrder) => {
    if (onSortChange) {
      onSortChange(nextBy, nextOrder);
      return;
    }
    setLocalSortBy(nextBy);
    setLocalSortOrder(nextOrder);
  };

  const getHeaderLabel = (col: Column<T>) => {
    if (col.sortLabel) return col.sortLabel;
    if (typeof col.header === "string") return col.header;
    return col.key;
  };

  const renderSortableHeader = (col: Column<T>) => {
    const field = col.sortField ?? col.key;
    const label = getHeaderLabel(col);
    const active = (effectiveSortBy ?? "") === field;
    const order = active ? effectiveSortOrder : undefined;
    const iconClass = !active
      ? "fas fa-sort text-muted"
      : order === "asc"
        ? "fas fa-sort-up"
        : "fas fa-sort-down";

    const defaultOrder: SortOrder = col.defaultSortOrder ?? "asc";

    return (
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
        style={{ color: "inherit", fontWeight: 600 }}
        onClick={() => {
          if (active) {
            applySortChange(field, effectiveSortOrder === "asc" ? "desc" : "asc");
            return;
          }
          applySortChange(field, defaultOrder);
        }}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        <span>{col.header}</span>
        <i className={iconClass} />
      </button>
    );
  };

  const sortedData = useMemo(() => {
    // If parent is handling sort (server-side or pre-sorted), don't re-sort.
    if (onSortChange) return data;

    if (!effectiveSortBy) return data;
    const col = columns.find((c) => (c.sortField ?? c.key) === effectiveSortBy);
    if (!col || !col.sortable) return data;

    const direction = effectiveSortOrder === "asc" ? 1 : -1;
    const field = effectiveSortBy;

    const valueOf = (row: any) => row?.[field];

    const toComparable = (v: any) => {
      if (v == null) return "";
      if (typeof v === "number") return v;
      if (typeof v === "boolean") return v ? 1 : 0;
      const asString = String(v);
      const ms = Date.parse(asString);
      if (Number.isFinite(ms)) return ms;
      return asString.toLowerCase();
    };

    return data
      .map((row, idx) => ({ row, idx }))
      .sort((a, b) => {
        const av = toComparable(valueOf(a.row));
        const bv = toComparable(valueOf(b.row));

        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));

        if (cmp === 0) cmp = a.idx - b.idx;
        return cmp * direction;
      })
      .map((x) => x.row);
  }, [columns, data, effectiveSortBy, effectiveSortOrder, onSortChange]);

  // Client-side pagination state (when not server-paginated)
  const [clientPage, setClientPage] = useState(1);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState(itemsPerPage);

  // keep selectedItemsPerPage in sync when prop changes
  useEffect(() => {
    setSelectedItemsPerPage(itemsPerPage);
  }, [itemsPerPage]);

  const effectiveCurrentPage = isServerPaginated ? (currentPage || 1) : clientPage;
  const effectiveTotalPages = isServerPaginated
    ? (totalPages || 1)
    : Math.max(1, Math.ceil(sortedData.length / selectedItemsPerPage));

  const clampPage = (p: number) => Math.min(Math.max(1, p), effectiveTotalPages);

  const handlePageChange = (p: number) => {
    const next = clampPage(p);
    if (isServerPaginated) onPageChange?.(next);
    else setClientPage(next);
  };

  const pageData = isServerPaginated
    ? data
    : sortedData.slice(
        (effectiveCurrentPage - 1) * selectedItemsPerPage,
        effectiveCurrentPage * selectedItemsPerPage
      );

  const safeTotal = Math.max(1, effectiveTotalPages);
  const safeCurrent = Math.min(Math.max(1, effectiveCurrentPage), safeTotal);

  const entriesOptions = [5, 10, 25, 50, 100];

  const renderEntriesControl = (
    <div className="d-flex align-items-center gap-2">
      <label className="small mb-0">Show</label>
      <select
        className="form-select form-select-sm"
        style={{ width: 96 }}
        value={selectedItemsPerPage}
        onChange={(e) => {
          const v = Number(e.target.value) || 10;
          setSelectedItemsPerPage(v);
          if (!isServerPaginated) setClientPage(1);
          if (isServerPaginated && typeof onItemsPerPageChange === "function") {
            onItemsPerPageChange(v);
          }
        }}
      >
        {entriesOptions.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <span className="small text-muted">entries</span>
    </div>
  );

  const showBottomEntries = entriesPlacement === "bottom" && (!isServerPaginated || typeof onItemsPerPageChange === "function");

  const shouldRenderPaginationBlock = showBottomEntries || effectiveTotalPages > 1;

  return (
    <div>
      {(entriesPlacement === "top" || actions) && (
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>{actions}</div>
          <div>{entriesPlacement === "top" ? renderEntriesControl : null}</div>
        </div>
      )}
      {/* TABLE */}
      <div
        className={wrapperClassName ?? "table-responsive"}
        style={wrapperStyle}
      >
        <table
          className={`table table-bordered table-hover mb-3 ${tableClassName ?? ""}`.trim()}
          style={{
            ...(fixedLayout ? { tableLayout: "fixed" } : null),
            ...tableStyle,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.thClassName}
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#f5f7fb",
                    ...(stickyHeader
                      ? { position: "sticky", top: 0, zIndex: 2 }
                      : null),
                    ...(col.width != null ? { width: col.width } : null),
                    ...(col.minWidth != null ? { minWidth: col.minWidth } : null),
                    ...(col.maxWidth != null ? { maxWidth: col.maxWidth } : null),
                    ...col.thStyle,
                  }}
                >
                  {col.sortable ? renderSortableHeader(col) : col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  No records found.
                </td>
              </tr>
            )}

            {!loading &&
              pageData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={col.tdClassName}
                      style={{
                        ...(col.width != null ? { width: col.width } : null),
                        ...(col.minWidth != null ? { minWidth: col.minWidth } : null),
                        ...(col.maxWidth != null ? { maxWidth: col.maxWidth } : null),
                        ...col.tdStyle,
                      }}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION & ENTRIES */}
      {shouldRenderPaginationBlock && (
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {showBottomEntries && renderEntriesControl}
          </div>

          <nav>
            <ul className="pagination justify-content-end mb-0">
            <li className={`page-item ${safeCurrent <= 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(safeCurrent - 1)}
                disabled={safeCurrent <= 1}
              >
                Prev
              </button>
            </li>

            <li className="page-item disabled">
              <span className="page-link">
                {safeCurrent} / {safeTotal}
              </span>
            </li>

            <li className={`page-item ${safeCurrent >= safeTotal ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(safeCurrent + 1)}
                disabled={safeCurrent >= safeTotal}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
        </div>
      )}
    </div>
  );
}
