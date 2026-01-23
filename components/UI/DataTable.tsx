import { ReactNode, useMemo, useState } from "react";

type SortOrder = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;

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

  // Client-side fallback
  const localCurrentPage = currentPage || 1;
  const localTotalPages = isServerPaginated
    ? totalPages
    : Math.ceil(sortedData.length / itemsPerPage);

  const pageData = isServerPaginated
    ? data
    : sortedData.slice(
        (localCurrentPage - 1) * itemsPerPage,
        localCurrentPage * itemsPerPage
      );

  return (
    <div>
      {/* TABLE */}
      <table className="table table-bordered table-hover mb-3">
        <thead style={{ backgroundColor: "#f5f7fb" }}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ fontWeight: 600 }}>
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
                  <td key={col.key}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      {localTotalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-end mb-0">
            <li
              className={`page-item ${
                localCurrentPage === 1 ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() =>
                  onPageChange?.(localCurrentPage - 1)
                }
              >
                &laquo;
              </button>
            </li>

            {Array.from({ length: localTotalPages }).map((_, index) => (
              <li
                key={index}
                className={`page-item ${
                  localCurrentPage === index + 1 ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange?.(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}

            <li
              className={`page-item ${
                localCurrentPage === localTotalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() =>
                  onPageChange?.(localCurrentPage + 1)
                }
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
