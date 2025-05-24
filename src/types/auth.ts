export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  surname: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber?: string;
    isActive: boolean;
    userType: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  isActive: boolean;
  userType: number;
}
