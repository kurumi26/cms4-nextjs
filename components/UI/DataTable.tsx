import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
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
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const isServerPaginated =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function";

  // Client-side fallback
  const localCurrentPage = currentPage ?? 1;
  const localTotalPages = isServerPaginated
    ? totalPages
    : Math.ceil(data.length / itemsPerPage);

  const pageData = isServerPaginated
    ? data
    : data.slice(
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
                {col.header}
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
