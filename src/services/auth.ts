import { axiosInstance } from "@/lib/axios";
import {
  AuthResponse,
  BackendAuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/auth";

const validateAuthResponse = (response: any): response is AuthResponse => {
  return (
    response &&
    typeof response === "object" &&
    typeof response.accessToken === "string" &&
    typeof response.refreshToken === "string" &&
    response.user &&
    typeof response.user === "object" &&
    typeof response.user.userType === "number"
  );
};

// Helper function to get user info from token
const getUserFromToken = (token: string): User => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  const payload = JSON.parse(jsonPayload);
  return {
    id: payload.id || payload.nameid,
    email: payload.email,
    name: payload.given_name,
    surname: payload.family_name,
    phoneNumber: payload.phone_number,
    isActive: true,
    userType: parseInt(payload.userType || "0"),
  };
};

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<BackendAuthResponse>(
      "/auth/login",
      data
    );

    if (!response.data?.accessToken?.token) {
      throw new Error("Invalid response format from server");
    }

    const user = getUserFromToken(response.data.accessToken.token);

    const authResponse: AuthResponse = {
      accessToken: response.data.accessToken.token,
      refreshToken: response.data.refreshToken?.token || "",
      user,
    };

    if (!validateAuthResponse(authResponse)) {
      throw new Error("Invalid response format from server");
    }

    return authResponse;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<BackendAuthResponse>(
      "/auth/register",
      data
    );

    if (!response.data?.accessToken?.token) {
      throw new Error("Invalid response format from server");
    }

    const user = getUserFromToken(response.data.accessToken.token);

    const authResponse: AuthResponse = {
      accessToken: response.data.accessToken.token,
      refreshToken: response.data.refreshToken?.token || "",
      user,
    };

    if (!validateAuthResponse(authResponse)) {
      throw new Error("Invalid response format from server");
    }

    return authResponse;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<BackendAuthResponse>(
      "/auth/refresh-token",
      {
        refreshToken,
      }
    );

    if (!response.data?.accessToken?.token) {
      throw new Error("Invalid response format from server");
    }

    const user = getUserFromToken(response.data.accessToken.token);

    const authResponse: AuthResponse = {
      accessToken: response.data.accessToken.token,
      refreshToken: response.data.refreshToken?.token || "",
      user,
    };

    if (!validateAuthResponse(authResponse)) {
      throw new Error("Invalid response format from server");
    }

    return authResponse;
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
