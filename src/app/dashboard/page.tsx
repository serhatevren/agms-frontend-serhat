"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Hoş geldiniz, {user?.name} {user?.surname}
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Çıkış Yap
            </button>
          </div>
          <div className="mt-6">
            <p className="text-gray-600">Email: {user?.email}</p>
            {user?.phoneNumber && (
              <p className="text-gray-600">Telefon: {user?.phoneNumber}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
