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
  staffRole?: number; // 0: Rectorate, 1: StudentAffairs, 2: FacultyDeansOffice, 3: DepartmentSecretary
  facultyId?: string; // Fakülteye özel eklenen alan
  departmentId?: string; // Departman sekreteri için eklenen alan
}

export interface AccessToken {
  token: string;
  expiration: Date;
}

export interface BackendAuthResponse {
  token: string;
  refreshToken?: string;
  userTypeValue?: number;
  userType?: number;
  staffRoleValue?: number;
  staffRole?: number;
  expirationDate?: string;
}

// This is what we use in our frontend
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Current user endpoint response
export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  isActive: boolean;
  userType: number;
  staffRole?: number;
}
