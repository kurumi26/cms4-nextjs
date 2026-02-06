import { ReactNode, useMemo, useState } from "react";
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

  // Optional sorting (controlled if onSortChange provided, else internal)
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  sortBy,
  sortOrder,
  onSortChange,
  wrapperClassName,
  wrapperStyle,
  tableClassName,
  tableStyle,
  fixedLayout = false,
  stickyHeader = false,
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

  const effectiveCurrentPage = isServerPaginated ? (currentPage || 1) : clientPage;
  const effectiveTotalPages = isServerPaginated
    ? (totalPages || 1)
    : Math.max(1, Math.ceil(sortedData.length / itemsPerPage));

  const clampPage = (p: number) => Math.min(Math.max(1, p), effectiveTotalPages);

  const handlePageChange = (p: number) => {
    const next = clampPage(p);
    if (isServerPaginated) onPageChange?.(next);
    else setClientPage(next);
  };

  const pageData = isServerPaginated
    ? data
    : sortedData.slice(
        (effectiveCurrentPage - 1) * itemsPerPage,
        effectiveCurrentPage * itemsPerPage
      );

  const pageButtons = useMemo(() => {
    const safeTotal = Math.max(1, effectiveTotalPages);
    const safeCurrent = Math.min(Math.max(1, effectiveCurrentPage), safeTotal);

    // show all if small
    if (safeTotal <= 7) {
      return {
        safeTotal,
        safeCurrent,
        showFirst: false,
        showLast: false,
        leftEllipsis: false,
        rightEllipsis: false,
        middle: Array.from({ length: safeTotal }, (_, i) => i + 1).slice(1, -1),
      };
    }

    const maxMiddle = 5; // buttons between first/last
    let start = Math.max(2, safeCurrent - Math.floor(maxMiddle / 2));
    let end = Math.min(safeTotal - 1, start + maxMiddle - 1);
    start = Math.max(2, end - maxMiddle + 1);

    const middle: number[] = [];
    for (let p = start; p <= end; p++) middle.push(p);

    return {
      safeTotal,
      safeCurrent,
      showFirst: true,
      showLast: true,
      leftEllipsis: start > 2,
      rightEllipsis: end < safeTotal - 1,
      middle,
    };
  }, [effectiveCurrentPage, effectiveTotalPages]);

  return (
    <div>
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

      {/* PAGINATION */}
      {effectiveTotalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-end mb-0">
            <li className={`page-item ${pageButtons.safeCurrent <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => handlePageChange(1)} disabled={pageButtons.safeCurrent <= 1}>
                «
              </button>
            </li>

            <li className={`page-item ${pageButtons.safeCurrent <= 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(pageButtons.safeCurrent - 1)}
                disabled={pageButtons.safeCurrent <= 1}
              >
                Prev
              </button>
            </li>

            {pageButtons.showFirst && (
              <li className={`page-item ${pageButtons.safeCurrent === 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(1)}>
                  1
                </button>
              </li>
            )}

            {pageButtons.leftEllipsis && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}

            {pageButtons.middle.map((p) => (
              <li key={p} className={`page-item ${pageButtons.safeCurrent === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(p)}>
                  {p}
                </button>
              </li>
            ))}

            {pageButtons.rightEllipsis && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}

            {pageButtons.showLast && (
              <li className={`page-item ${pageButtons.safeCurrent === pageButtons.safeTotal ? "active" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(pageButtons.safeTotal)}>
                  {pageButtons.safeTotal}
                </button>
              </li>
            )}

            <li className={`page-item ${pageButtons.safeCurrent >= pageButtons.safeTotal ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(pageButtons.safeCurrent + 1)}
                disabled={pageButtons.safeCurrent >= pageButtons.safeTotal}
              >
                Next
              </button>
            </li>

            <li className={`page-item ${pageButtons.safeCurrent >= pageButtons.safeTotal ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(pageButtons.safeTotal)}
                disabled={pageButtons.safeCurrent >= pageButtons.safeTotal}
              >
                »
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
