"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

const getUserTypeText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "student";
    case 1:
      if (typeof staffRole === "number") {
        switch (staffRole) {
          case 0:
            return "rectorate staff";
          case 1:
            return "student affairs staff";
          case 2:
            return "faculty dean office staff";
          case 3:
            return "department secretary";
          default:
            return "staff";
        }
      }
      return "staff";
    case 2:
      return "advisor";
    case 3:
      return "administrator";
    default:
      return "user";
  }
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  const userTypeText = getUserTypeText(user.userType, user.staffRole);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Hoşgeldiniz Kartı */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user.name} {user.surname}!
          </h1>
          <p className="text-gray-600 mb-4">
            You have logged into the AGMS system as a {userTypeText}.
          </p>
          <div className="border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.phoneNumber || "Not specified"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Kullanıcı tipine göre özel içerik */}
        <div className="mt-8 grid gap-6">
          {user.userType === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-blue-800 mb-3">
                Student Panel
              </h2>
              <p className="text-blue-600">
                You can use the left menu to check your graduation status.
              </p>
            </div>
          )}

          {user.userType === 1 && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-green-800 mb-3">
                Academic Staff Panel
              </h2>
              <p className="text-green-600">
                You can use the left menu to review and manage student graduation statuses.
              </p>
            </div>
          )}

          {user.userType === 2 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-purple-800 mb-3">
                Advisor Panel
              </h2>
              <p className="text-purple-600">
                You can use the left menu to review applications of students you advise.
              </p>
            </div>
          )}

          {user.userType === 3 && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-red-800 mb-3">
                Administrator Panel
              </h2>
              <p className="text-red-600">
                You can use the left menu to configure system settings and manage all applications.
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
