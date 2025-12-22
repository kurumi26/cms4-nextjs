import { axiosInstance } from "./axios";

export interface DashboardStats {
  pages_count: number;
  albums_count: number;
}

export const getDashboardStats = async () => {
  return axiosInstance.get<{ data: DashboardStats }>("/dashboard/stats");
};
