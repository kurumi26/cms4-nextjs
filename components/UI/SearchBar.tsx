import React, { useRef, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  // optional extra controls to render inline on the left (e.g., page size selector)
  leftExtras?: React.ReactNode;
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
  showSearchInput?: boolean;
  // hide the Filters button when false
  showFiltersButton?: boolean;
  // hide the Actions button when false
  showActionsButton?: boolean;
  // optional extra elements to render to the right of the search input
  rightExtras?: React.ReactNode;
  // externally control filters visibility
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  // render filters as centered modal when true
  filtersAsModal?: boolean;
  // when externally opening filters, force modal rendering for that open action
  externalOpenAsModal?: boolean;
}

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  leftExtras,
  actionsMenu,
  onApplyFilters,
  initialSortBy,
  initialSortOrder,
  initialShowDeleted,
  initialPerPage,
  showDeletedToggle = true,
  showDeletedLabel = "Show deleted only (Trash)",
  showSearchInput = true,
  showFiltersButton = true,
  showActionsButton = true,
  rightExtras,
  filtersOpen,
  onFiltersOpenChange,
  filtersAsModal = false,
  externalOpenAsModal = false,
}: SearchBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const filtersBtnRef = useRef<HTMLButtonElement | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filtersPos, setFiltersPos] = useState<{ top: number; left: number } | null>(null);
  const [renderFiltersAsModal, setRenderFiltersAsModal] = useState<boolean>(filtersAsModal);

  // filter state
  const [sortBy, setSortBy] = useState<string>(initialSortBy ?? "modified");
  const [sortOrder, setSortOrder] = useState<string>(initialSortOrder ?? "desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(initialShowDeleted ?? false);
  const [perPage, setPerPage] = useState<number>(initialPerPage ?? 10);
  const [advancedTitle, setAdvancedTitle] = useState("");
  const [advancedLabel, setAdvancedLabel] = useState("");
  const [advancedContent, setAdvancedContent] = useState("");
  const [advancedAlbum, setAdvancedAlbum] = useState("");
  const [advancedLastModifiedBy, setAdvancedLastModifiedBy] = useState("");
  const [advancedVisibility, setAdvancedVisibility] = useState("");
  const [advancedSeoTitle, setAdvancedSeoTitle] = useState("");
  const [advancedSeoDescription, setAdvancedSeoDescription] = useState("");
  const [advancedSeoKeyword, setAdvancedSeoKeyword] = useState("");
  const [advancedDateFrom, setAdvancedDateFrom] = useState("");
  const [advancedDateTo, setAdvancedDateTo] = useState("");

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

  React.useEffect(() => {
    if (filtersOpen !== undefined) setShowFilters(filtersOpen);
    if (filtersOpen) {
      setRenderFiltersAsModal(externalOpenAsModal || filtersAsModal);
    }
  }, [filtersOpen]);

  React.useEffect(() => {
    setRenderFiltersAsModal(filtersAsModal);
  }, [filtersAsModal]);

  React.useEffect(() => {
    if (!showFilters || renderFiltersAsModal || filtersPos) return;
    if (!filtersBtnRef.current) return;
    const rect = filtersBtnRef.current.getBoundingClientRect();
    setFiltersPos({ top: rect.bottom + window.scrollY, left: rect.left });
  }, [showFilters, renderFiltersAsModal, filtersPos]);

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
    setRenderFiltersAsModal(filtersAsModal);
    const next = !showFilters;
    setShowFilters(next);
    onFiltersOpenChange?.(next);
  };

  const applyFilters = () => {
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage });
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  const closeFilters = () => {
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  const resetAdvancedForm = () => {
    setAdvancedTitle("");
    setAdvancedLabel("");
    setAdvancedContent("");
    setAdvancedAlbum("");
    setAdvancedLastModifiedBy("");
    setAdvancedVisibility("");
    setAdvancedSeoTitle("");
    setAdvancedSeoDescription("");
    setAdvancedSeoKeyword("");
    setAdvancedDateFrom("");
    setAdvancedDateTo("");
    onChange?.("");
  };

  const handleAdvancedSearch = () => {
    onChange?.(advancedTitle);
    applyFilters();
  };

  const resetFilters = () => {
    const next = { sortBy: "modified", sortOrder: "desc", showDeleted: false, perPage: 10 };
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
    setShowDeleted(next.showDeleted);
    setPerPage(next.perPage);
    onApplyFilters?.(next);
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div className="d-flex align-items-center flex-wrap gap-2" style={{ position: "relative" }}>
          <div>
            {showFiltersButton && (
              <button
                ref={filtersBtnRef}
                className={`btn btn-outline-secondary me-2 dropdown-toggle${showFilters ? " show" : ""}`}
                onClick={handleFiltersClick}
                aria-expanded={showFilters}
                aria-haspopup="true"
                type="button"
              >
                Filters
              </button>
            )}

            {showActionsButton && (
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
            )}
          </div>

        {leftExtras}

        {showFilters && (
          <div>
            <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={closeFilters} />
            {renderFiltersAsModal ? (
              <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Advanced Search</h5>
                    </div>

                    <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input type="text" className="form-control" value={advancedTitle} onChange={(e) => setAdvancedTitle(e.target.value)} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Label</label>
                        <input type="text" className="form-control" value={advancedLabel} onChange={(e) => setAdvancedLabel(e.target.value)} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Content</label>
                        <input type="text" className="form-control" value={advancedContent} onChange={(e) => setAdvancedContent(e.target.value)} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Album</label>
                        <select className="form-select" value={advancedAlbum} onChange={(e) => setAdvancedAlbum(e.target.value)}>
                          <option value="">- All Albums -</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Last Modified by</label>
                        <select className="form-select" value={advancedLastModifiedBy} onChange={(e) => setAdvancedLastModifiedBy(e.target.value)}>
                          <option value="">- All Users -</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Visibility</label>
                        <select className="form-select" value={advancedVisibility} onChange={(e) => setAdvancedVisibility(e.target.value)}>
                          <option value="">- Published &amp; Private -</option>
                          <option value="published">Published</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">SEO Title</label>
                        <input type="text" className="form-control" value={advancedSeoTitle} onChange={(e) => setAdvancedSeoTitle(e.target.value)} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">SEO Description</label>
                        <input type="text" className="form-control" value={advancedSeoDescription} onChange={(e) => setAdvancedSeoDescription(e.target.value)} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">SEO Keyword</label>
                        <input type="text" className="form-control" value={advancedSeoKeyword} onChange={(e) => setAdvancedSeoKeyword(e.target.value)} />
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Date Modified (From)</label>
                          <input type="date" className="form-control" value={advancedDateFrom} onChange={(e) => setAdvancedDateFrom(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Date Modified (To)</label>
                          <input type="date" className="form-control" value={advancedDateTo} onChange={(e) => setAdvancedDateTo(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer justify-content-between">
                      <button type="button" className="btn btn-info text-white" onClick={resetAdvancedForm}>Reset</button>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-secondary" onClick={closeFilters}>Close</button>
                        <button type="button" className="btn btn-success" onClick={handleAdvancedSearch}>Search</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="dropdown-menu show p-3 shadow"
                style={{ position: "fixed", top: filtersPos?.top ?? 0, left: filtersPos?.left ?? 0, zIndex: 1060, width: 320 }}
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
            )}
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

      {showSearchInput && (
        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          {rightExtras}
        </div>
      )}
    </div>
  );
}
