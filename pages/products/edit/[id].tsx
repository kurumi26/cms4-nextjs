"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { axiosInstance } from "@/services/axios";

const normalizeUrl = (u?: string | null) => {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  if (s.startsWith("http:") || s.startsWith("https:") || s.startsWith("data:") || s.startsWith("//")) return s;
  if (s.startsWith("/")) return s;
  return `/${s.replace(/^\/+/, "")}`;
};

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("active");

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const svc = await import("@/services/productService");
        const res = await svc.getProduct(id as string);
        const data = res?.data ?? res ?? {};
        if (!mounted) return;
        setName(data.name ?? data.title ?? "");
        setPrice(String(data.price ?? data.amount ?? ""));
        setDescription(data.description ?? "");
        setStatus(data.status ?? ((data.is_active || data.isActive) ? "active" : (data.is_active === 0 || data.isActive === 0 ? "inactive" : (data.status ?? "active"))));
        setSelectedCategory(String(data.category_id ?? data.category?.id ?? data.category_id ?? ""));
        const img = data.image_url ?? data.image;
        if (img) setImagePreview(normalizeUrl(img));

        // load categories
        try {
          const catRes = await axiosInstance.get("/fetch-product-categories", { headers: { "X-No-Loading": true } });
          const catData = catRes.data?.data ?? catRes.data ?? [];
          if (Array.isArray(catData) && catData.length) setCategories(catData.map((c: any) => ({ id: c.id ?? c.slug ?? c.name, name: c.name ?? c.title ?? String(c) })));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.error("Failed to load product", e);
        toast.error("Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleSubmit = async () => {
    if (!name) return toast.error("Please provide product name");

    let categoryId: string | number | null = null;
    try {
      if (newCategory?.trim()) {
        const endpoints = ["/product-categories", "/create-product-category", "/categories"];
        for (const ep of endpoints) {
          try {
            const body = { name: newCategory.trim(), title: newCategory.trim() };
            const res = await axiosInstance.post(ep, body, { headers: { "X-No-Loading": true } });
            const d = res.data?.data ?? res.data ?? {};
            const cid = d?.id ?? d?.category_id ?? d?.data?.id;
            if (cid) { categoryId = cid; break; }
          } catch (e) { }
        }
          // If no id returned, try looking up the category by name
          if (!categoryId) {
            const lookupEndpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
            for (const lep of lookupEndpoints) {
              try {
                const r = await axiosInstance.get(lep, { headers: { "X-No-Loading": true } });
                const list = r.data?.data ?? r.data ?? [];
                if (Array.isArray(list) && list.length) {
                  const found = list.find((c: any) => String(c.name ?? c.title ?? c.slug ?? c).toLowerCase() === newCategory.trim().toLowerCase());
                  if (found) { categoryId = found.id ?? found.slug ?? found.name; break; }
                }
              } catch (e) { }
            }
          }
      }
      if (!categoryId && selectedCategory) categoryId = selectedCategory;

      // if we created a new category, reflect it in the UI select
      if (categoryId) setSelectedCategory(String(categoryId));

      // If there's an image file, send multipart FormData; otherwise send JSON payload
      let resp: any = null;
      const svc = await import("@/services/productService");
      if (image) {
        const form = new FormData();
        form.append("name", name);
        form.append("price", price);
        form.append("description", description);
        if (categoryId) {
          form.append("category_id", String(categoryId));
          form.append("category", String(categoryId));
          form.append("categoryId", String(categoryId));
        }
        if (status) {
          form.append("status", String(status));
          form.append("is_active", status === "active" ? "1" : "0");
          form.append("isActive", status === "active" ? "1" : "0");
        }
        form.append("image", image);

        // Debug: print FormData entries before sending update
        try {
          const dbg: any = {};
          try { (form as any).forEach((v: any, k: string) => { dbg[k] = v instanceof File ? `FILE:${v.name}` : v; }); } catch { if ((form as any).entries) { for (const p of (form as any).entries()) dbg[p[0]] = p[1] instanceof File ? `FILE:${p[1].name}` : p[1]; } }
          console.info("Update Product FormData:", dbg);
        } catch (e) { console.warn("Failed to dump update FormData", e); }

        resp = await svc.updateProduct(id as string, form);
      } else {
        const payload: any = { name, price, description };
        if (categoryId) {
          payload.category_id = categoryId;
          payload.category = categoryId;
          payload.categoryId = categoryId;
        }
        if (status) {
          payload.status = status;
          payload.is_active = status === "active" ? 1 : 0;
          payload.isActive = status === "active" ? 1 : 0;
        }
        console.info("Update Product JSON:", payload);
        resp = await svc.updateProduct(id as string, payload);
      }
      toast.success(resp?.message ?? "Product updated");
      router.push("/products");
    } catch (e: any) {
      console.error("Update product error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to update product");
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      const svc = await import("@/services/productService");
      await svc.deleteProduct(id as string);
      toast.success("Product deleted");
      router.push("/products");
    } catch (e: any) {
      console.error("Delete error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete product");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Edit Product</h3>
        <div>
          <Link href="/products" className="btn btn-outline-secondary">Back to Manage</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && <div>Loading…</div>}

          {!loading && (
            <>
              <div className="mb-3">
                <label className="form-label">Product Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Price</label>
                <input className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">-- Select category --</option>
                  {categories.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <small className="form-text text-muted">Or enter a new category below</small>
              </div>

              <div className="mb-3">
                <label className="form-label">New Category (optional)</label>
                <input className="form-control" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Enter category name" />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImage(f);
                    if (f) setImagePreview(URL.createObjectURL(f));
                  }}
                />

                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Product preview" className="img-fluid rounded" style={{ maxWidth: 300 }} />
                  </div>
                )}
              </div>

              <div>
                <button className="btn btn-primary me-2" onClick={handleSubmit}>Update Product</button>
                <button className="btn btn-outline-danger" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        show={showDeleteConfirm}
        title="Delete product"
        message={<span>Are you sure you want to delete this product? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

EditProduct.Layout = AdminLayout;
