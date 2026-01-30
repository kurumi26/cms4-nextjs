import axios from "axios";
import { axiosInstance } from "@/services/axios";

export const createProduct = async (form: FormData) => {
  // Let the browser/axios set the Content-Type including boundary
  try {
    const res = await axiosInstance.post("/products", form);
    return res.data;
  } catch (err: any) {
    // If validation error, attempt a few compatibility retries with alternate keys/endpoints
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (status === 422) {
      const tryEndpoints = ["/products", "/product", "/products/create"];
      const altKeys = ["category_id", "category", "categoryId", "product_category_id", "product_category"];

      const copyForm = (src: FormData) => {
        const fd = new FormData();
        try {
          (src as any).forEach((v: any, k: string) => fd.append(k, v));
        } catch {
          if ((src as any).entries) {
            for (const pair of (src as any).entries()) fd.append(pair[0], pair[1]);
          }
        }
        return fd;
      };

      for (const ep of tryEndpoints) {
        for (const key of altKeys) {
          try {
            const fd = copyForm(form);
            // if key already present keep original; otherwise append a guess
            if (!fd.has || typeof fd.has !== "function" || !fd.has(key)) {
              // try to read an existing category value from common keys
              const candidates = ["category_id", "category", "categoryId", "product_category_id", "product_category"];
              let val: any = null;
              try {
                (form as any).forEach((v: any, k: string) => { if (candidates.includes(k) && !val) val = v; });
              } catch {
                if ((form as any).entries) {
                  for (const pair of (form as any).entries()) { if (candidates.includes(pair[0]) && !val) val = pair[1]; }
                }
              }
              if (val) fd.append(key, val);
            }

            const r = await axiosInstance.post(ep, fd);
            return r.data;
          } catch (e: any) {
            // try next combination
            continue;
          }
        }
      }
    }

    // Return structured error info for the caller to inspect (avoid uncaught runtime overlay)
    return { success: false, status: err?.response?.status ?? 500, error: err?.response?.data ?? err?.message };
  }
};

export const getProducts = async (params?: any) => {
  const res = await axiosInstance.get("/products", { params });
  return res.data;
};

export const getProduct = async (id: string | number) => {
  const endpoints = [
    `/products/${id}`,
    `/product/${id}`,
    `/products/show/${id}`,
    `/get-product/${id}`,
    `/products/${id}/show`,
  ];

  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await axiosInstance.get(ep);
      return res.data;
    } catch (e: any) {
      lastErr = e;
      // try next
      if (!e?.response || e.response.status !== 404) break; // non-404 should bubble up
    }
  }
  // If all direct endpoints returned 404, try fetching the products list and match by id/slug
  try {
    const listRes = await getProducts({ per_page: 1000 });
    const list = listRes?.data ?? listRes ?? [];
    const items: any[] = Array.isArray(list) ? list : (list?.items ?? list?.rows ?? []);
    const idStr = String(id);
    const found = items.find((p) => String(p.id ?? p.product_id) === idStr || String(p.slug) === idStr || String(p.name) === idStr);
    if (found) return found;
  } catch (e) {
    // ignore and fall through to throw last error
  }

  // As a last resort, try absolute URLs built from NEXT_PUBLIC_API_URL (with/without /api or /v1)
  try {
    const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const candidates = [
      `${rawBase}/products/${id}`,
      `${rawBase}/api/products/${id}`,
      `${rawBase}/api/v1/products/${id}`,
      `${rawBase}/v1/products/${id}`,
      `${rawBase}/product/${id}`,
      `${rawBase}/api/product/${id}`,
    ];

    for (const url of candidates) {
      try {
        if (!url) continue;
        const res = await axios.get(url);
        return res.data;
      } catch (e: any) {
        // try next
        if (!e?.response || e.response.status !== 404) break;
      }
    }
  } catch (e) {
    // ignore
  }

  // If we reach here, throw the last error so caller can handle it
  throw lastErr || new Error("Product not found");
};

export const updateProduct = async (id: string | number, data: any) => {
  // If data is a FormData (file upload present), use multipart strategies
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;

  if (isForm) {
    const endpoints: Array<{ method: "put" | "post"; url: string; useOverride?: boolean }> = [
      { method: "put", url: `/products/${id}` },
      { method: "post", url: `/products/${id}`, useOverride: true },
      { method: "post", url: `/product/${id}`, useOverride: true },
    ];

    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        if (ep.method === "put") {
          const res = await axiosInstance.put(ep.url, data);
          return res.data;
        }

        if (ep.useOverride) {
          const fd = new FormData();
          try {
            (data as any).forEach((v: any, k: string) => fd.append(k, v));
          } catch {
            for (const pair of (data as any).entries ? (data as any).entries() : []) {
              fd.append(pair[0], pair[1]);
            }
          }
          fd.append("_method", "PUT");
          const res = await axiosInstance.post(ep.url, fd);
          return res.data;
        }

        const res = await axiosInstance.post(ep.url, data);
        return res.data;
      } catch (e: any) {
        lastErr = e;
        if (!e?.response || (e.response.status && e.response.status >= 500)) break;
      }
    }

    throw lastErr || new Error("Failed to update product");
  }

  // If data is plain JSON (no file), send JSON payloads which some backends expect
  const jsonEndpoints = [`/products/${id}`, `/product/${id}`, `/products/${id}/update`];
  let lastErrJson: any = null;
  for (const url of jsonEndpoints) {
    try {
      const res = await axiosInstance.put(url, data);
      return res.data;
    } catch (e: any) {
      lastErrJson = e;
      // try post with _method override as fallback
      try {
        const body = { ...data, _method: "PUT" };
        const res2 = await axiosInstance.post(url, body);
        return res2.data;
      } catch (e2: any) {
        lastErrJson = e2;
      }
    }
  }

  throw lastErrJson || new Error("Failed to update product");
};

export const deleteProduct = async (id: string | number) => {
  const endpoints = [`/products/${id}`, `/product/${id}`];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await axiosInstance.delete(ep);
      return res.data;
    } catch (e: any) {
      lastErr = e;
      // try POST with _method=DELETE for servers that don't accept DELETE
      try {
        const body = { _method: "DELETE" } as any;
        const res2 = await axiosInstance.post(ep, body);
        return res2.data;
      } catch (e2: any) {
        lastErr = e2;
        // try next
      }
    }
  }
  throw lastErr || new Error("Failed to delete product");
};

export const restoreProduct = async (id: string | number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/products/${id}/restore`),
    () => axiosInstance.post(`/products/restore/${id}`),
    () => axiosInstance.patch(`/products/${id}/restore`),
    () => axiosInstance.put(`/products/${id}/restore`),
    () => axiosInstance.post(`/products/${id}/restore`, { _method: "PATCH" }),
    () => axiosInstance.post(`/products/restore`, { id }),
    () => axiosInstance.post(`/product/${id}/restore`),
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 422) throw err;
    }
  }

  throw lastError;
};

export const bulkDeleteProducts = async (ids: Array<string | number>) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/products/bulk-delete`, { ids }),
    () => axiosInstance.post(`/products/delete-multiple`, { ids }),
    () => axiosInstance.post(`/products/batch`, { ids, action: "delete" }),
    () => axiosInstance.post(`/products/bulk`, { ids, action: "delete" }),
    () => axiosInstance.post(`/product/bulk`, { ids, action: "delete" }),
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data ?? res;
    } catch (err: any) {
      lastErr = err;
      // continue trying alternates unless unrecoverable
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 422) break;
    }
  }

  // fallback: delete items one by one
  try {
    for (const id of ids) {
      try {
        await deleteProduct(id);
      } catch (e) {
        // continue deleting others
      }
    }
    return { success: true };
  } catch (e) {
    throw lastErr || e;
  }
};

export const bulkUpdateStatus = async (ids: Array<string | number>, status: string) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/products/bulk-status`, { ids, status }),
    () => axiosInstance.post(`/products/bulk`, { ids, status }),
    () => axiosInstance.post(`/products/batch`, { ids, status }),
    () => axiosInstance.post(`/product/bulk`, { ids, status }),
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data ?? res;
    } catch (err: any) {
      lastErr = err;
      const statusCode = err?.response?.status;
      if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 422) break;
    }
  }

  // fallback: update each item individually
  try {
    for (const id of ids) {
      try {
        await updateProduct(id, { status, is_active: status === "active" ? 1 : 0 });
      } catch (e) {
        // continue
      }
    }
    return { success: true };
  } catch (e) {
    throw lastErr || e;
  }
};

export default { createProduct, getProducts, getProduct, updateProduct, deleteProduct, restoreProduct, bulkDeleteProducts, bulkUpdateStatus };
