import { axiosInstance } from "@/lib/axios";
import { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      data
    );
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      data
    );
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/refresh-token",
      {
        refreshToken,
      }
    );
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post("/auth/forgot-password", { email });
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await axiosInstance.post<{ message: string }>(
      "/auth/reset-password",
      { email }
    );
    return response.data;
  },
};
