"use client";

import { useEffect, useState } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";

const getUserTypeText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "öğrenci";
    case 1:
      if (typeof staffRole === "number") {
        switch (staffRole) {
          case 0:
            return "rektörlük personeli";
          case 1:
            return "öğrenci işleri personeli";
          case 2:
            return "fakülte dekan ofisi personeli";
          case 3:
            return "bölüm sekreteri";
          default:
            return "personel";
        }
      }
      return "personel";
    case 2:
      return "danışman";
    case 3:
      return "yönetici";
    default:
      return "kullanıcı";
  }
};

export default function MainPage() {
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
            Hoşgeldiniz, {user.name} {user.surname}!
          </h1>
          <p className="text-gray-600 mb-4">
            AGMS sistemine {userTypeText} olarak giriş yaptınız.
          </p>
          <p className="text-gray-600 mb-4">
            İşlemleriniz için sol menüyü kullanabilirsiniz.
          </p>
          <div className="border-t border-gray-200 pt-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.phoneNumber || "Belirtilmemiş"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
