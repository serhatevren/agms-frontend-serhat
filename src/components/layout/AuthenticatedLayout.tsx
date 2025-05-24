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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
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
          router.push("/dashboard");
          break;
        case 1: // Staff
          router.push("/staff");
          break;
        case 2: // Advisor
          router.push("/advisor");
          break;
        case 3: // Admin
          router.push("/admin");
          break;
        default:
          router.push("/auth/login");
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
      <Navbar onSidebarToggle={() => setSidebarOpen((open) => !open)} />
      <div className="flex">
        {sidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-30 w-64">
            <Sidebar />
          </div>
        )}
        <main
          className={`flex-1 transition-all duration-200 ${
            sidebarOpen ? "ml-64" : "ml-0"
          } max-w-7xl mx-auto py-6 sm:px-6 lg:px-8`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
