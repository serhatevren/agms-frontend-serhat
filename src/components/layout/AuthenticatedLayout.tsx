"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredUserType?: number;
}

export default function AuthenticatedLayout({
  children,
  requiredUserType,
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    // Check both authentication state and token existence
    const token = localStorage.getItem("accessToken");

    if (!isAuthenticated || !token) {
      // Use window.location for more reliable navigation
      window.location.href = "/auth/login";
      return;
    }

    // Fetch complete user data if not already loaded
    const fetchUserData = async () => {
      try {
        // Only fetch if user data is incomplete (missing name or surname)
        if (user && (!user.name || !user.surname)) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          console.log("AuthenticatedLayout: Updated user data", userData);
        }
      } catch (error) {
        console.error("AuthenticatedLayout: Error fetching user data", error);
      }
    };

    if (requiredUserType !== undefined && user?.userType !== requiredUserType) {
      // Redirect to appropriate page based on user type
      switch (user?.userType) {
        case 0: // Student
          router.replace("/dashboard");
          break;
        case 1: // Staff
          router.replace("/staff");
          break;
        case 2: // Advisor
          router.replace("/advisor");
          break;
        case 3: // Admin
          router.replace("/admin");
          break;
        default:
          router.replace("/auth/login");
      }
    } else {
      fetchUserData();
    }
  }, [isAuthenticated, user, router, requiredUserType, setUser]);

  if (
    !isAuthenticated ||
    (requiredUserType !== undefined && user?.userType !== requiredUserType)
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <div className="fixed inset-y-0 left-0 z-30 w-64">
          <Sidebar />
        </div>
        <main className="flex-1 transition-all duration-200 ml-64 py-6 pl-10 pr-10">
          {feedback && (
            <div
              className={`mb-4 px-4 py-2 rounded ${
                feedback.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {feedback.message}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
