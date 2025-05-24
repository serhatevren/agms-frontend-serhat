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

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  isActive: boolean;
  userType: number; // 0: Student, 1: Staff, 2: Advisor, 3: Admin
}

export interface AccessToken {
  token: string;
  expiration: Date;
}

export interface BackendAuthResponse {
  accessToken: {
    token: string;
    expiration: Date;
  };
  refreshToken?: {
    token: string;
    expiration: Date;
    userId: string;
  };
}

// This is what we use in our frontend
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
