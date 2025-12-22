import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { loading } from "@/plugins/loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL+'/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (!config.headers?.["X-No-Loading"]) {
    loading.start();
    //alert("loading")
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
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * ⚠️ CSRF COOKIE
 * Must NOT use axiosInstance
 */
const setCsrfCookie = async () => {
  try {
    await axios.get(
      API_URL+"/sanctum/csrf-cookie",
      {
        withCredentials: true,
        headers: {
          "X-No-Loading": "true", // 👈 prevent flicker
        },
      }
    );
  } catch (error) {
    console.error("CSRF error:", error);
    throw new Error("Failed to set CSRF cookie");
  }
};

export { axiosInstance, setCsrfCookie };
