import { axiosInstance } from "./axios";

export interface PageDTO {
  id: number;
  name: string;
  label: string;
}

export interface MenuPayload {
  name: string;
  items: any[];
  is_active: boolean;
}

export interface MenuRow {
  id: number;
  name: string;
  is_active: boolean;
  updated_at_formatted: string;
}

interface GetMenusParams {
  search?: string;
  page?: number;
  per_page?: number;
}

/* ================= PAGES ================= */

export const getAllPages = async (): Promise<PageDTO[]> => {
  const res = await axiosInstance.get("/pages-menu");
  return res.data.data;
};

/* ================= MENUS ================= */

export const createMenu = async (payload: MenuPayload) => {
  return axiosInstance.post("/menus", payload);
};

export const getMenus = (params: GetMenusParams) => {
  return axiosInstance.get("/menus", { params });
};

export const getMenuById = (id: number) => {
  return axiosInstance.get(`/menus/${id}`);
};

export const updateMenu = (id: number, payload: any) => {
  return axiosInstance.put(`/menus/${id}`, payload);
};

export const activateMenu = (id: number) => {
  return axiosInstance.patch(`/menus/${id}/activate`);
};
