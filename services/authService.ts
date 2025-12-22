import { axiosInstance, setCsrfCookie } from "./axios";

export const login = async (email: string, password: string) => {
  try {
    await setCsrfCookie(); // MUST succeed

    const response = await axiosInstance.post("/login", {
      email,
      password,
    });

    return response.data; // user info
  } catch (error: any) {
    if (error.response) {
      const message =
        error.response.data?.message || "Login failed";
      throw new Error(message);
    }

    throw new Error("Something went wrong. Please try again.");
  }
};
