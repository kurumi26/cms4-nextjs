import { axiosInstance } from "@/services/axios";

export type LayoutPreset = {
  id: number;
  name: string;
  category?: string;
  thumbnail?: string;
  content: string;
  is_active: boolean;
};

export const layoutPresetService = {
  getAll(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    return axiosInstance.get("/layout-presets", {
      params,
    });
  },

  create(data: FormData) {
    return axiosInstance.post("/layout-presets", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id: number, data: FormData) {
    return axiosInstance.post(`/layout-presets/${id}?_method=PUT`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id: number) {
    return axiosInstance.delete(`/layout-presets/${id}`);
  },
};
