import { axiosInstance } from "@/lib/axios";
import {
  AuthResponse,
  BackendAuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  CurrentUserResponse,
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
const getUserFromToken = (
  token: string,
  userType: number,
  staffRole?: number
): User => {
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
  console.log("Full JWT Payload:", payload);
  console.log("UserType from backend response:", userType);
  console.log("StaffRole from backend response:", staffRole);

  const user: User = {
    id:
      payload.Id ||
      payload.nameid ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ],
    email:
      payload.Email ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ],
    name:
      payload.Name ||
      payload.given_name ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
      ] ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      "",
    surname:
      payload.Surname ||
      payload.family_name ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
      ] ||
      "",
    phoneNumber:
      payload.PhoneNumber ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone"
      ],
    isActive: true,
    userType: userType, // Backend'den gelen userType'ı kullan
    staffRole: staffRole, // Backend'den gelen staffRole'ü kullan
  };

  console.log("Final User Object:", user);
  return user;
};

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<BackendAuthResponse>(
      "/auth/login",
      data
    );

    console.log("Backend Response:", response.data);

    // NArchitecture formatında accessToken objesi geliyor
    if (!response.data?.accessToken?.token) {
      throw new Error("Invalid response format from server");
    }

    // Backend'den gelen userType'ı kullan
    const userType = response.data.userTypeValue || response.data.userType || 0;
    const staffRole = response.data.staffRoleValue || response.data.staffRole;
    console.log("Using UserType from response:", userType);
    console.log("Using StaffRole from response:", staffRole);

    const user = getUserFromToken(
      response.data.accessToken.token,
      userType,
      staffRole
    );

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
    try {
      const response = await axiosInstance.post<BackendAuthResponse>(
        "/auth/register",
        data
      );

      console.log("Register Response:", response.data);

      // Backend'den gelen token'ı direkt olarak kullan
      const token = response.data?.token;

      if (!token) {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response format from server");
      }

      // Backend'den gelen userType ve staffRole değerlerini al
      const userType =
        response.data.userTypeValue || response.data.userType || 0;
      const staffRole = response.data.staffRoleValue || response.data.staffRole;

      console.log("Token:", token);
      console.log("UserType:", userType);
      console.log("StaffRole:", staffRole);

      const user = getUserFromToken(token, userType, staffRole);

      const authResponse: AuthResponse = {
        accessToken: token,
        refreshToken:
          typeof response.data?.refreshToken === "string"
            ? response.data.refreshToken
            : response.data?.refreshToken?.token || "",
        user,
      };

      console.log("Auth Response:", authResponse);

      if (!validateAuthResponse(authResponse)) {
        console.error("Invalid auth response:", authResponse);
        throw new Error("Invalid response format from server");
      }

      return authResponse;
    } catch (error) {
      console.error("Register error details:", error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<BackendAuthResponse>(
      "/auth/refresh-token",
      {
        refreshToken,
      }
    );

    if (!response.data?.token) {
      throw new Error("Invalid response format from server");
    }

    const userType = response.data.userTypeValue || response.data.userType || 0;
    const staffRole = response.data.staffRoleValue || response.data.staffRole;
    console.log("Using UserType from response:", userType);
    console.log("Using StaffRole from response:", staffRole);

    const user = getUserFromToken(response.data.token, userType, staffRole);

    const authResponse: AuthResponse = {
      accessToken: response.data.token,
      refreshToken:
        typeof response.data.refreshToken === "string"
          ? response.data.refreshToken
          : response.data?.refreshToken?.token || "",
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

  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<CurrentUserResponse>(
      "/users/GetFromAuth"
    );

    const user: User = {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
      surname: response.data.surname,
      phoneNumber: response.data.phoneNumber,
      isActive: response.data.isActive,
      userType: response.data.userType,
      staffRole: response.data.staffRole,
    };

    return user;
  },
};
