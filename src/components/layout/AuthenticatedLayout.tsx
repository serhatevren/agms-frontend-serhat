"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Navbar from "./Navbar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    // Eğer login sayfasında veya root path'te ise main'e yönlendir
    if (pathname === "/" || pathname.startsWith("/auth/")) {
      router.push("/main");
      return;
    }

    // Eğer eski sayfalara erişmeye çalışıyorsa main'e yönlendir
    if (
      pathname.startsWith("/student") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/advisor") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard")
    ) {
      router.push("/main");
      return;
    }

    setIsLoading(false);
  }, [isAuthenticated, user, router, pathname]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
