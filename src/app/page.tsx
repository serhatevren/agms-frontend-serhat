"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Redirect based on user type
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
  }, [router, isAuthenticated, user]);

  return null;
}
