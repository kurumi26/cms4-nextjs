import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import {
  layoutPresetService,
  LayoutPreset,
} from "@/services/layoutPresetService";
import { toast } from "@/lib/toast";

export default function FileManagerPage() {

  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<{
    name: string;
    category: string;
    thumbnail: File | null;
    content: string;
    is_active: boolean;
  }>({
    name: "",
    category: "",
    thumbnail: null,
    content: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const getModal = async () => {
    if (typeof window === "undefined") return null;

    const bootstrap = await import("bootstrap");
    return bootstrap.Modal;
  };

  const loadPresets = async () => {
    setLoading(true);
    const res = await layoutPresetService.getAll();
    setPresets(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

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

      setForm({
        name: "",
        category: "",
        thumbnail: null,
        content: "",
        is_active: true,
      });

      setEditingId(null);
      setIsEditMode(false);
      setThumbnailPreview(null);
      loadPresets();

      const Modal = await getModal();
      Modal?.getInstance(
        document.getElementById("addPresetModal")!
      )?.hide();
    } catch (e) {
      toast.error("Something went wrong.");
    }
  };

  const openDeleteModal = async (preset: LayoutPreset) => {
    setDeleteId(preset.id);
    setDeleteName(preset.name);

    const el = document.getElementById("deletePresetModal");
    if (!el) return;

    const Modal = await getModal();
    if (!Modal) return;

    const modal = new Modal(el);
    modal.show();
  };

  const confirmDeletePreset = async () => {
    if (!deleteId) return;

    try {
      await layoutPresetService.delete(deleteId);
      toast.success("Layout preset deleted");

      setDeleteId(null);
      setDeleteName("");
      loadPresets();

      (window as any).bootstrap.Modal.getInstance(
        document.getElementById("deletePresetModal")
      )?.hide();
    } catch {
      toast.error("Failed to delete preset");
    }
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

    const el = document.getElementById("addPresetModal");
    if (!el) return;

    const Modal = await getModal();
    if (!Modal) return;

    const modal = new Modal(el);
    modal.show();
  };

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

    const el = document.getElementById("addPresetModal");
    if (!el) return;

    const Modal = await getModal();
    if (!Modal) return;

    const modal = new Modal(el);
    modal.show();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Layout Presets</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Preset
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && (
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Thumbnail</th>
              <th>Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {presets.map((preset) => (
              <tr key={preset.id}>
                <td>{preset.name}</td>
                <td>{preset.category || "-"}</td>
                <td>
                  {preset.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${preset.thumbnail}`}
                      alt={preset.name}
                      className="img-thumbnail"
                      style={{ maxWidth: "80px" }}
                    />
                  ) : (
                    <span className="text-muted">No image</span>
                  )}
                </td>

                <td>
                  <span
                    className={`badge ${
                      preset.is_active ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {preset.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => openEditModal(preset)}
                  >
                    <i className="fa fa-edit"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => openDeleteModal(preset)}
                  >
                    <i className="fa fa-trash"></i>
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* BOOTSTRAP MODAL */}
      <div
        className="modal fade"
        id="addPresetModal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditMode ? "Edit Layout Preset" : "Add Layout Preset"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Category</label>
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
                    const file = e.target.files ? e.target.files[0] : null;

                    setForm({ ...form, thumbnail: file });

                    if (file) {
                      setThumbnailPreview(URL.createObjectURL(file));
                    } else {
                      setThumbnailPreview(null);
                    }
                  }}
                />
              </div>

              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="mb-3">
                  <label className="form-label">Thumbnail Preview</label>
                  <img
                    src={thumbnailPreview}
                    className="img-fluid rounded border"
                    alt="Thumbnail Preview"
                  />
                </div>
              )}

              {isEditMode && !form.thumbnail && (
                <div className="mb-3">
                  <label className="form-label">Current Thumbnail</label>
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${
                      presets.find(p => p.id === editingId)?.thumbnail
                    }`}
                    className="img-fluid rounded border"
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Content (HTML)</label>
                <textarea
                  className="form-control"
                  rows={8}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label className="form-check-label">Active</label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitForm}>
                {isEditMode ? "Update Preset" : "Save Preset"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      <div
        className="modal fade"
        id="deletePresetModal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-danger">
                <i className="fa fa-exclamation-triangle me-2"></i>
                Delete Layout Preset
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>

            <div className="modal-body">
              <p className="mb-2">
                Are you sure you want to delete this layout preset?
              </p>

              <div className="alert alert-warning mb-0">
                <strong>{deleteName}</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeletePreset}
              >
                <i className="fa fa-trash me-1"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

FileManagerPage.Layout = AdminLayout;
