import React, { useRef, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  // optional actions menu to render when Actions is clicked
  actionsMenu?: React.ReactNode;
  // optional callback when filters are applied
  onApplyFilters?: (filters: { sortBy: string; sortOrder: string; showDeleted: boolean; perPage: number }) => void;
  // initial filter values (kept in sync)
  initialSortBy?: string;
  initialSortOrder?: string;
  initialShowDeleted?: boolean;
  initialPerPage?: number;
  // optional show-deleted toggle control
  showDeletedToggle?: boolean;
  showDeletedLabel?: string;
}

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  actionsMenu,
  onApplyFilters,
  initialSortBy,
  initialSortOrder,
  initialShowDeleted,
  initialPerPage,
  showDeletedToggle = true,
  showDeletedLabel = "Show deleted only (Trash)",
}: SearchBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filtersPos, setFiltersPos] = useState<{ top: number; left: number } | null>(null);

  // filter state
  const [sortBy, setSortBy] = useState<string>(initialSortBy ?? "modified");
  const [sortOrder, setSortOrder] = useState<string>(initialSortOrder ?? "desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(initialShowDeleted ?? false);
  const [perPage, setPerPage] = useState<number>(initialPerPage ?? 10);

  // keep internal filter state in sync when parent changes initial props
  React.useEffect(() => {
    if (initialSortBy !== undefined) setSortBy(initialSortBy);
  }, [initialSortBy]);
  React.useEffect(() => {
    if (initialSortOrder !== undefined) setSortOrder(initialSortOrder);
  }, [initialSortOrder]);
  React.useEffect(() => {
    if (initialShowDeleted !== undefined) setShowDeleted(initialShowDeleted);
  }, [initialShowDeleted]);
  React.useEffect(() => {
    if (initialPerPage !== undefined) setPerPage(initialPerPage);
  }, [initialPerPage]);

  // when `showDeleted` is toggled we want to auto-apply filters
  // but avoid doing this on the initial mount
  const mountedRef = useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage });
    // only trigger when `showDeleted` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  const handleActionsClick = (e: React.MouseEvent) => {
    if (!actionsMenu) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY, left: rect.left });
    setShowMenu((s) => !s);
  };

  const handleFiltersClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFiltersPos({ top: rect.bottom + window.scrollY, left: rect.left });
    setShowFilters((s) => !s);
  };

  const applyFilters = () => {
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage });
    setShowFilters(false);
  };

  const resetFilters = () => {
    const next = { sortBy: "modified", sortOrder: "desc", showDeleted: false, perPage: 10 };
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
    setShowDeleted(next.showDeleted);
    setPerPage(next.perPage);
    onApplyFilters?.(next);
    setShowFilters(false);
  };

  return (
    <div className="d-flex justify-content-between mb-3">
      <div style={{ position: "relative" }}>
        <button
          className={`btn btn-outline-secondary me-2 dropdown-toggle${showFilters ? " show" : ""}`}
          onClick={handleFiltersClick}
          aria-expanded={showFilters}
          aria-haspopup="true"
          type="button"
        >
          Filters
        </button>
        <button
          ref={btnRef}
          className={`btn btn-outline-secondary dropdown-toggle${showMenu ? " show" : ""}`}
          onClick={handleActionsClick}
          aria-expanded={showMenu}
          aria-haspopup="true"
          type="button"
          disabled={!actionsMenu}
        >
          Actions
        </button>

        {showFilters && filtersPos && (
          <div>
            <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={() => setShowFilters(false)} />
            <div
              className="dropdown-menu show p-3 shadow"
              style={{ position: "fixed", top: filtersPos.top, left: filtersPos.left, zIndex: 1060, width: 320 }}
            >
              <h6 className="mb-2">Filters</h6>

              <div className="mb-2">
                <small className="text-muted">Sort by</small>
                <div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="sortBy" id="sortModified" checked={sortBy === "modified"} onChange={() => setSortBy("modified")} />
                    <label className="form-check-label" htmlFor="sortModified">Date modified</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="sortBy" id="sortTitle" checked={sortBy === "title"} onChange={() => setSortBy("title")} />
                    <label className="form-check-label" htmlFor="sortTitle">Title</label>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <small className="text-muted">Sort order</small>
                <div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="sortOrder" id="orderAsc" checked={sortOrder === "asc"} onChange={() => setSortOrder("asc")} />
                    <label className="form-check-label" htmlFor="orderAsc">Ascending</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="sortOrder" id="orderDesc" checked={sortOrder === "desc"} onChange={() => setSortOrder("desc")} />
                    <label className="form-check-label" htmlFor="orderDesc">Descending</label>
                  </div>
                </div>
              </div>

              {showDeletedToggle && (
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="showDeleted" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                  <label className="form-check-label" htmlFor="showDeleted">{showDeletedLabel}</label>
                </div>
              )}

              <div className="mb-3">
                <small className="text-muted">Items displayed</small>
                <div className="d-flex align-items-center gap-2">
                  <input type="range" className="form-range" min={5} max={100} step={1} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ flex: 1 }} />
                  <span className="badge bg-primary">{perPage}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-light" onClick={resetFilters}>Reset</button>
                <button type="button" className="btn btn-primary" onClick={applyFilters}>Apply filters</button>
              </div>
            </div>
          </div>
        )}

        {showMenu && actionsMenu && menuPos && (
          <div>
            <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={() => setShowMenu(false)} />
            <div
              className="dropdown-menu show p-0 shadow"
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 1060, width: 180 }}
            >
              <div className="list-group list-group-flush">
                {actionsMenu}
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ maxWidth: 260 }}
      />
    </div>
  );
}
