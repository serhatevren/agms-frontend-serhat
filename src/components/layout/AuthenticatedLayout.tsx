import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Navbar from "./Navbar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredUserType?: number;
}

export default function AuthenticatedLayout({
  children,
  requiredUserType,
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (requiredUserType !== undefined && user?.userType !== requiredUserType) {
      // Redirect to appropriate page based on user type
      switch (user?.userType) {
        case 0: // Student
          router.push("/student");
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
    }
  }, [isAuthenticated, user, router, requiredUserType]);

  if (
    !isAuthenticated ||
    (requiredUserType !== undefined && user?.userType !== requiredUserType)
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
