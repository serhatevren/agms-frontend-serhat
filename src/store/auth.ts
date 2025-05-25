import { create } from "zustand";
import { User } from "@/types/auth";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Initialize state from localStorage if available
const getInitialState = () => {
  if (typeof window === "undefined")
    return { user: null, isAuthenticated: false };

  try {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { user, isAuthenticated: true };
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }

  return { user: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({ user, isAuthenticated: !!user });
  },
  logout: () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
    set({ user: null, isAuthenticated: false });
  },
}));
