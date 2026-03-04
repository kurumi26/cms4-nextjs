"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import {
  layoutPresetService,
  LayoutPreset,
} from "@/services/layoutPresetService";
import { toast } from "@/lib/toast";

function PresetPage() {
  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* =========================
   Fetch Presets
  ========================== */
  const fetchPresets = async () => {
    try {
      setLoading(true);

      const res = await layoutPresetService.getAll({
        search,
        page: currentPage,
        per_page: perPage,
      });

      const rows: LayoutPreset[] = Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

      setPresets(rows);
      setTotalPages(res?.data?.last_page ?? 1);
    } catch (err) {
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    category: "",
    thumbnail: null as File | null,
    content: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const openAddModal = async () => {
    setEditingId(null);
    setIsEditMode(false);
    setThumbnailPreview(null);

    setForm({
      name: "",
      category: "",
      thumbnail: null,
      content: "",
      is_active: true,
    });

    const bootstrap = await import("bootstrap");
    const modal = new bootstrap.Modal(
      document.getElementById("presetModal")!
    );
    modal.show();
  };

  const openEditModal = async (preset: LayoutPreset) => {
    setEditingId(preset.id);
    setIsEditMode(true);
    setThumbnailPreview(null);

    setForm({
      name: preset.name,
      category: preset.category || "",
      thumbnail: null,
      content: preset.content,
      is_active: preset.is_active,
    });

    const bootstrap = await import("bootstrap");
    const modal = new bootstrap.Modal(
      document.getElementById("presetModal")!
    );
    modal.show();
  };

  const submitForm = async () => {
    if (!form.name || !form.content) {
      toast.error("Name and content are required.");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category", form.category);
    fd.append("content", form.content);
    fd.append("is_active", form.is_active ? "1" : "0");

    if (form.thumbnail) {
      fd.append("thumbnail", form.thumbnail);
    }

    try {
      if (isEditMode && editingId) {
        await layoutPresetService.update(editingId, fd);
        toast.success("Preset updated successfully");
      } else {
        await layoutPresetService.create(fd);
        toast.success("Preset created successfully");
      }

      // Reset form
      setForm({
        name: "",
        category: "",
        thumbnail: null,
        content: "",
        is_active: true,
      });

      setEditingId(null);
      setIsEditMode(false);

      // Reload table
      fetchPresets();

      // Close modal
      const bootstrap = await import("bootstrap");
      const modalEl = document.getElementById("presetModal");
      if (modalEl) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchPresets, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder]);

  /* =========================
   Sorting (Client Side)
  ========================== */
  const sortRowsClientSide = (
    rows: LayoutPreset[],
    by: string,
    order: "asc" | "desc"
  ) => {
    const direction = order === "asc" ? 1 : -1;
    return [...rows].sort((a: any, b: any) => {
      const av = a?.[by];
      const bv = b?.[by];

      if (typeof av === "boolean") {
        return (Number(av) - Number(bv)) * direction;
      }

      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();

      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
  };

  const sortedPresets = useMemo(
    () => sortRowsClientSide(presets, sortBy, sortOrder),
    [presets, sortBy, sortOrder]
  );

  const displayRows = useMemo(() => {
    return sortedPresets.map((r, idx) => ({
      ...r,
      seq: (currentPage - 1) * perPage + idx + 1,
    }));
  }, [sortedPresets, currentPage, perPage]);

  /* =========================
   Delete
  ========================== */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this preset?")) return;

    try {
      await layoutPresetService.delete(id);
      toast.success("Preset deleted");
      fetchPresets();
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayRows.map((r) => r.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  /* =========================
   Columns
  ========================== */
  const columns: Column<LayoutPreset>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={displayRows.length > 0 && displayRows.every((r) => selectedIds.includes(r.id))}
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
      key: "seq",
      header: "#",
      width: 60,
      render: (row) => (row as any).seq,
    },
    {
      key: "name",
      header: "Preset Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className="fw-bold text-primary">{row.name}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortField: "category",
      render: (row) => row.category || "-",
    },
    {
      key: "thumbnail",
      header: "Thumbnail",
      render: (row) =>
        row.thumbnail ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${row.thumbnail}`}
            className="rounded border"
            style={{ width: "60px" }}
          />
        ) : (
          <span className="text-muted small">No Image</span>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      sortField: "is_active",
      render: (row) => (
        <span
          className={`badge ${
            row.is_active ? "bg-success" : "bg-secondary"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
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
            title="Edit"
            onClick={() => openEditModal(row)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0 text-danger"
            title="Delete"
            onClick={() => handleDelete(row.id)}
            type="button"
          >
            <i className="fas fa-trash" />
          </button>
        </>
      ),
    },
  ];

  /* =========================
   UI
  ========================== */
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Layout Presets</h3>
      </div>
      <SearchBar
        placeholder="Search presets..."
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        rightExtras={(
          <div className="d-flex align-items-center gap-2 flex-nowrap">
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

            <button
              type="button"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              onClick={openAddModal}
            >
              + Add Preset
            </button>
          </div>
        )}
        filtersOpen={showAdvancedModal}
        onFiltersOpenChange={(open) => {
          if (!open) setShowAdvancedModal(false);
        }}
        externalOpenAsModal={true}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, perPage: sPerPage }) => {
          setSortBy(sBy === "modified" ? "name" : sBy);
          setSortOrder((String(sOrder).toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc");
          setPerPage(sPerPage);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
      />

      <DataTable<LayoutPreset>
        columns={columns}
        data={displayRows as any}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => {
          setPerPage(n);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextBy, nextOrder) => {
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />

      <div className="modal fade" id="presetModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditMode ? "Edit Preset" : "Add Preset"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label>Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label>Category</label>
                <input
                  className="form-control"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Thumbnail Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;

                    setForm({ ...form, thumbnail: file });

                    if (file) {
                      setThumbnailPreview(URL.createObjectURL(file));
                    } else {
                      setThumbnailPreview(null);
                    }
                  }}
                />
                {/* New Upload Preview */}
                {thumbnailPreview && (
                  <div className="mb-3">
                    <label className="form-label">Preview</label>
                    <img
                      src={thumbnailPreview}
                      className="img-fluid rounded border"
                      alt="Thumbnail Preview"
                    />
                  </div>
                )}
                {/* Current Thumbnail (Edit Mode) */}
                  {isEditMode && !form.thumbnail && (
                    <div className="mb-3">
                      <label className="form-label">Current Thumbnail</label>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${
                          presets.find(p => p.id === editingId)?.thumbnail
                        }`}
                        className="img-fluid rounded border"
                        alt="Current Thumbnail"
                      />
                    </div>
                  )}
              </div>

              <div className="mb-3">
                <label>Content</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label className="form-check-label">
                  Active
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={submitForm}
              >
                {isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PresetPage.Layout = AdminLayout;
export default PresetPage;
