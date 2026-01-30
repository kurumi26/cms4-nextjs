"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useState, useEffect } from "react";
import { axiosInstance } from "@/services/axios";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryRow = {
  id: string | number;
  name: string;
  created_at?: any;
  order?: number;
  position?: number;
  sort_order?: number;
};

function normalizeNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function getCategorySortKey(c: any): number | undefined {
  return (
    normalizeNumber(c?.order) ??
    normalizeNumber(c?.sort_order) ??
    normalizeNumber(c?.position) ??
    normalizeNumber(c?.display_order) ??
    normalizeNumber(c?.rank) ??
    undefined
  );
}

function getCategoryApiId(c: any): string | number {
  return (
    c?.id ??
    c?.category_id ??
    c?.product_category_id ??
    c?.productCategoryId ??
    c?.slug ??
    c?.name ??
    ""
  );
}

function SortableCategoryItem({
  category,
  children,
  disabled,
}: {
  category: CategoryRow;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: String(category.id),
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="list-group-item d-flex justify-content-between align-items-center">
      <div className="me-2" {...attributes} {...listeners} style={{ cursor: disabled ? "not-allowed" : "grab" }}>
        ☰
      </div>
      {children}
    </li>
  );
}

export default function CreateProductCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | number | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
      let list: any[] = [];
      for (const ep of endpoints) {
        try {
          const res = await (await import('@/services/axios')).axiosInstance.get(ep, { headers: { 'X-No-Loading': true } });
          const data = res.data?.data ?? res.data ?? [];
          if (Array.isArray(data) && data.length) { list = data; break; }
        } catch (e) {
          // try next
        }
      }
      const mapped: CategoryRow[] = list.map((c: any) => ({
        id: getCategoryApiId(c),
        name: c.name ?? c.title ?? String(c),
        created_at: c.created_at ?? c.createdAt ?? c.created_at_formatted ?? c.created,
        order: getCategorySortKey(c),
        sort_order: normalizeNumber(c?.sort_order),
        position: normalizeNumber(c?.position),
      }));

      // Sort by explicit order if present; otherwise keep current order from API.
      const hasAnyOrder = mapped.some((c) => typeof c.order === "number");
      setCategories(
        hasAnyOrder
          ? [...mapped].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : mapped
      );
    } catch (e: any) {
      console.error('Failed to load categories', e);
      setError(e?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const persistCategoryOrder = async (next: CategoryRow[]) => {
    setSavingOrder(true);
    const failures: string[] = [];

    const headers = { headers: { "X-No-Loading": true } };

    const tryUpdateOrder = async (category: CategoryRow, order: number) => {
      const id = category.id;
      const endpoints = [`/product-categories/${id}`, `/categories/${id}`];
      // Some backends validate strictly; try one key at a time.
      const bodies: any[] = [
        // strict backends might require name/title on update
        { name: category.name, title: category.name, order },
        { name: category.name, title: category.name, sort_order: order },
        { name: category.name, title: category.name, position: order },
        { order },
        { sort_order: order },
        { position: order },
        { display_order: order },
        { rank: order },
        { sequence: order },
      ];

      for (const ep of endpoints) {
        for (const body of bodies) {
          try {
            await axiosInstance.patch(ep, body, headers);
            return true;
          } catch {
            // ignore
          }

          try {
            await axiosInstance.put(ep, body, headers);
            return true;
          } catch {
            // ignore
          }

          try {
            await axiosInstance.post(ep, { ...body, _method: "PUT" }, headers);
            return true;
          } catch {
            // ignore
          }
        }
      }

      return false;
    };

    try {
      // Persist as 1-based ordering
      for (let index = 0; index < next.length; index++) {
        const c = next[index];
        const order = index + 1;
        const ok = await tryUpdateOrder(c, order);
        if (!ok) failures.push(String(c.name ?? c.id));
      }

      if (failures.length) {
        toast.error(`Failed to save order for: ${failures.join(", ")}`);
        // Reload from server so UI stays consistent with what backend supports
        await loadCategories();
        return;
      }

      toast.success("Category order saved");
    } catch (e: any) {
      console.error("Save category order error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to save category order");
      await loadCategories();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => String(c.id) === String(active.id));
    const newIndex = categories.findIndex((c) => String(c.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(categories, oldIndex, newIndex).map((c, idx) => ({
      ...c,
      order: idx + 1,
      sort_order: idx + 1,
      position: idx + 1,
    }));
    setCategories(next);
    try {
      await persistCategoryOrder(next);
    } catch (e) {
      // Never crash the page on reorder failures
      console.error("Reorder error", e);
    }
  };

  const handleSubmit = async () => {
    if (!name) return toast.error("Please provide category name");

    const endpoints = ["/product-categories", "/create-product-category", "/categories"];
    let created: any = null;
    try {
      for (const ep of endpoints) {
        try {
          const res = await (await import('@/services/axios')).axiosInstance.post(ep, { name: name.trim(), title: name.trim() });
          const data = res.data?.data ?? res.data ?? {};
          created = data;
          break;
        } catch (e) {
          // try next endpoint
        }
      }

      if (!created) {
        toast.error("Failed to create category: no endpoint succeeded");
        return;
      }

      toast.success("Category created");
      router.push("/products");
    } catch (e: any) {
      console.error("Create category error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to create category");
    }
  };

  return (
    <div className="container">
      <h3 className="mb-4">Create Product Category</h3>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Category</button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h5>Existing Categories</h5>
        <div className="card">
          <div className="card-body">
            {loading && <div>Loading categories…</div>}
            {error && <div className="text-danger">{error}</div>}
            {!loading && categories.length === 0 && <div className="text-muted">No categories found.</div>}
            {!loading && categories.length > 0 && (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => String(c.id))}
                  strategy={verticalListSortingStrategy}
                >
                <ul className="list-group">
                {categories.map((c: any) => (
                  <SortableCategoryItem key={String(c.id)} category={c} disabled={savingOrder || !!editingId}>
                    <div style={{ flex: 1 }}>
                      {editingId === c.id ? (
                        <div className="d-flex gap-2">
                          <input className="form-control form-control-sm" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                          <button className="btn btn-sm btn-primary" onClick={async () => {
                            if (!editingName.trim()) return toast.error('Name required');
                            try {
                              // try update endpoints
                              const endpoints = [`/product-categories/${c.id}`, `/categories/${c.id}`];
                              let ok = false;
                              for (const ep of endpoints) {
                                try {
                                  const res = await axiosInstance.put(ep, { name: editingName.trim(), title: editingName.trim() });
                                  ok = true;
                                  break;
                                } catch (e) {
                                  // try post override
                                  try {
                                    const body = { name: editingName.trim(), title: editingName.trim(), _method: 'PUT' } as any;
                                    await axiosInstance.post(ep, body);
                                    ok = true; break;
                                  } catch (ee) { }
                                }
                              }
                              if (!ok) throw new Error('Update failed');
                              toast.success('Category updated');
                              setEditingId(null); setEditingName('');
                              await loadCategories();
                            } catch (err: any) {
                              console.error('Update category error', err);
                              toast.error(err?.response?.data?.message || err?.message || 'Failed to update category');
                            }
                          }}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditingId(null); setEditingName(''); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="fw-bold">{c.name}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{(c.created_at && new Date(c.created_at).toLocaleString()) ?? '-'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ms-3 d-flex gap-2">
                      {editingId !== c.id && (
                        <>
                          <button className="btn btn-sm btn-outline-secondary" title="Edit" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}><i className="fas fa-edit" /></button>
                          <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setShowDeleteConfirmId(c.id)}><i className="fas fa-trash" /></button>
                        </>
                      )}
                    </div>
                  </SortableCategoryItem>
                ))}
              </ul>
              </SortableContext>
              </DndContext>
            )}
            {!loading && categories.length > 0 && (
              <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                Drag ☰ to reorder. Order saves automatically.
                {savingOrder ? " Saving…" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        show={!!showDeleteConfirmId}
        title="Delete category"
        message={<span>Are you sure you want to delete this category? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={async () => {
          if (!showDeleteConfirmId) return;
          try {
            const endpoints = [`/product-categories/${showDeleteConfirmId}`, `/categories/${showDeleteConfirmId}`];
            let ok = false;
            for (const ep of endpoints) {
              try { await axiosInstance.delete(ep); ok = true; break; } catch (e) {
                try { await axiosInstance.post(ep, { _method: 'DELETE' }); ok = true; break; } catch (ee) { }
              }
            }
            if (!ok) throw new Error('Delete failed');
            toast.success('Category deleted');
            setShowDeleteConfirmId(null);
            await loadCategories();
          } catch (e: any) {
            console.error('Delete category error', e);
            toast.error(e?.response?.data?.message || e?.message || 'Failed to delete category');
            setShowDeleteConfirmId(null);
          }
        }}
        onCancel={() => setShowDeleteConfirmId(null)}
      />
    </div>
  );
}

CreateProductCategory.Layout = AdminLayout;
