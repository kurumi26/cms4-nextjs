import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { loading } from "@/plugins/loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Cache-Control": "no-cache",
  },
});

/**
 * 🔐 Attach Bearer token to every request
 */
axiosInstance.interceptors.request.use((config) => {
  if (!config.headers?.["X-No-Loading"]) {
    loading.start();
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    loading.finish();
    return response;
  },
  (error: AxiosError) => {
    loading.finish();

    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export { axiosInstance };
