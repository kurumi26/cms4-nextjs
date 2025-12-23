import { axiosInstance } from "./axios";

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post("/login", {
    email,
    password,
  });

  // 🔥 SAVE TOKEN
  if (response.data?.token) {
    localStorage.setItem("auth_token", response.data.token);
  }

  return response.data;
};
