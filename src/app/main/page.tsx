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

const getWelcomeMessage = (userType: number) => {
  switch (userType) {
    case 0:
      return "Mezuniyet başvurunuzu yapmak ve durumunu kontrol etmek için sol menüyü kullanabilirsiniz.";
    case 1:
      return "Öğrenci mezuniyet başvurularını yönetmek ve işlemleri gerçekleştirmek için sol menüyü kullanabilirsiniz.";
    case 2:
      return "Danışmanı olduğunuz öğrencilerin mezuniyet başvurularını incelemek ve onaylamak için sol menüyü kullanabilirsiniz.";
    case 3:
      return "Sistem yönetimi ve kullanıcı işlemleri için sol menüyü kullanabilirsiniz.";
    default:
      return "İşlemleriniz için sol menüyü kullanabilirsiniz.";
  }
};

const getQuickActions = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return [
        {
          title: "Mezuniyet Başvurusu Yap",
          description: "Yeni bir mezuniyet başvurusu oluşturun",
        },
        {
          title: "Başvuru Durumu",
          description: "Mevcut başvurunuzun durumunu kontrol edin",
        },
        {
          title: "Transkript",
          description: "Güncel transkriptinizi görüntüleyin",
        },
      ];
    case 1:
      if (staffRole === 3) {
        // Bölüm Sekreteri
        return [
          {
            title: "Bekleyen Başvurular",
            description: "İncelenmesi gereken mezuniyet başvuruları",
          },
          {
            title: "Onaylanan Başvurular",
            description: "Onaylanmış mezuniyet başvuruları",
          },
          {
            title: "Öğrenci Listesi",
            description: "Bölümdeki öğrencilerin listesi",
          },
        ];
      }
      return [
        {
          title: "Tüm Başvurular",
          description: "Tüm mezuniyet başvurularını görüntüleyin",
        },
        {
          title: "İstatistikler",
          description: "Mezuniyet başvuru istatistikleri",
        },
        { title: "Raporlar", description: "Detaylı raporlar ve analizler" },
      ];
    case 2:
      return [
        {
          title: "Danışman Onayı Bekleyenler",
          description: "Onayınızı bekleyen mezuniyet başvuruları",
        },
        {
          title: "Öğrenci Listesi",
          description: "Danışmanı olduğunuz öğrenciler",
        },
        { title: "Onay Geçmişi", description: "Geçmiş onay işlemleriniz" },
      ];
    case 3:
      return [
        {
          title: "Kullanıcı Yönetimi",
          description: "Sistem kullanıcılarını yönetin",
        },
        { title: "Sistem Ayarları", description: "Genel sistem ayarları" },
        { title: "Log Kayıtları", description: "Sistem log kayıtları" },
      ];
    default:
      return [];
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
  const welcomeMessage = getWelcomeMessage(user.userType);
  const quickActions = getQuickActions(user.userType, user.staffRole);

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

        {/* Ana Panel */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            {userTypeText.charAt(0).toUpperCase() + userTypeText.slice(1)}{" "}
            Paneli
          </h2>
          <p className="text-blue-600 mb-6">{welcomeMessage}</p>

          {/* Hızlı Erişim Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-500 text-sm">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
