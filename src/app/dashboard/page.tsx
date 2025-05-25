"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

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

        {/* Kullanıcı tipine göre özel içerik */}
        <div className="mt-6">
          {user.userType === 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Öğrenci Paneli
              </h2>
              <p className="text-blue-600">
                Mezuniyet başvurunuzu yapmak ve durumunu kontrol etmek için sol
                menüyü kullanabilirsiniz.
              </p>
            </div>
          )}

          {user.userType === 1 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Personel Paneli
              </h2>
              <p className="text-green-600">
                Öğrenci başvurularını incelemek ve yönetmek için sol menüyü
                kullanabilirsiniz.
              </p>
            </div>
          )}

          {user.userType === 2 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">
                Danışman Paneli
              </h2>
              <p className="text-purple-600">
                Danışmanı olduğunuz öğrencilerin başvurularını incelemek için
                sol menüyü kullanabilirsiniz.
              </p>
            </div>
          )}

          {user.userType === 3 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Yönetici Paneli
              </h2>
              <p className="text-red-600">
                Sistem ayarlarını yapılandırmak ve tüm başvuruları yönetmek için
                sol menüyü kullanabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
