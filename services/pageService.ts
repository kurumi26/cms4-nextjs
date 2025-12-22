import { axiosInstance, setCsrfCookie } from "./axios";

export interface CreatePagePayload {
  name: string;
  label?: string;
  parent_page_id?: number | null;
  album_id?: number | null;
  contents?: string;
  status: "public" | "private" | "draft";
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  template?: string;
}

export const createPage = async (payload: CreatePagePayload) => {
  await setCsrfCookie(); // Sanctum CSRF

  return axiosInstance.post("/pages", payload);
};

export const getPages = (params?: { search?: string; page?: number }) => {
  return axiosInstance.get("/pages", { params });
};

export const getPageById = (id: number) => {
  return axiosInstance.get(`/pages/${id}`);
};

export const updatePage = (id: number, payload: any) => {
  return axiosInstance.put(`/pages/${id}`, payload);
};
