"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";

export default function DepartmentSecretaryStaffPage() {
  const { user } = useAuthStore();

  if (!user || user.userType !== 1 || user.staffRole !== 3) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Hoşgeldiniz, {user.name} {user.surname}!
        </h1>
        <p className="text-gray-600 mb-4">
          AGMS sistemine Bölüm Sekreterliği Personeli olarak giriş yaptınız.
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

        <div className="mt-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Bölüm Sekreterliği İşlemleri
            </h2>
            <p className="text-green-600">
              Bölüm öğrencilerinin mezuniyet başvurularını incelemek, onaylamak
              ve bölüm mezuniyet işlemlerini yönetmek için sol menüyü
              kullanabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
