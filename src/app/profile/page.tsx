"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";
import { axiosInstance } from "@/lib/axios";
import { User } from "@/types/auth";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(6, "Şifre onayı gereklidir"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const getUserTypeText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "Öğrenci";
    case 1:
      if (typeof staffRole === "number") {
        switch (staffRole) {
          case 0:
            return "Rektörlük Personeli";
          case 1:
            return "Öğrenci İşleri Personeli";
          case 2:
            return "Fakülte Dekan Ofisi Personeli";
          case 3:
            return "Bölüm Sekreteri";
          default:
            return "Personel";
        }
      }
      return "Personel";
    case 2:
      return "Danışman";
    case 3:
      return "Yönetici";
    default:
      return "Kullanıcı";
  }
};

const getDepartmentText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "Bilgisayar Mühendisliği"; // Bu backend'den gelecek
    case 1:
      if (staffRole === 1) return "Öğrenci İşleri";
      if (staffRole === 3) return "Bilgisayar Mühendisliği Bölümü";
      return "Yönetim";
    case 2:
      return "Bilgisayar Mühendisliği"; // Bu backend'den gelecek
    case 3:
      return "Sistem Yönetimi";
    default:
      return "Bilinmiyor";
  }
};

export default function ProfilePage() {
  const { user: storeUser, setUser } = useAuthStore();
  const [currentUser, setCurrentUser] = useState<User | null>(storeUser);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    setMounted(true);

    // Fetch current user data from backend
    const fetchCurrentUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData);
        setUser(userData); // Update store as well
        console.log("Fetched current user:", userData);
      } catch (error) {
        console.error("Error fetching current user:", error);
        // Fallback to store user if API call fails
        setCurrentUser(storeUser);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [setUser, storeUser]);

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await axiosInstance.put("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Şifreniz başarıyla değiştirildi!");
      reset();
    } catch (error: any) {
      console.error("Password change error:", error);
      if (error.response?.status === 400) {
        setErrorMessage("Mevcut şifre yanlış!");
      } else {
        setErrorMessage(
          "Şifre değiştirirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!currentUser) {
    return null;
  }

  const userTypeText = getUserTypeText(
    currentUser.userType,
    currentUser.staffRole
  );
  const departmentText = getDepartmentText(
    currentUser.userType,
    currentUser.staffRole
  );

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-400 mr-3">👤</span>
                <span className="text-gray-900">
                  {currentUser.name && currentUser.surname
                    ? `${currentUser.name} ${currentUser.surname}`.trim()
                    : currentUser.name ||
                      currentUser.surname ||
                      "Bilgi bulunamadı"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-400 mr-3">📧</span>
                <span className="text-gray-900">{currentUser.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentUser.userType === 0
                  ? "Department"
                  : currentUser.userType === 1
                  ? "Role"
                  : "Department"}
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-400 mr-3">🏢</span>
                <span className="text-gray-900">{departmentText}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-400 mr-3">🎭</span>
                <span className="text-gray-900">{userTypeText}</span>
              </div>
            </div>

            {currentUser.phoneNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-400 mr-3">📱</span>
                  <span className="text-gray-900">
                    {currentUser.phoneNumber}
                  </span>
                </div>
              </div>
            )}

            {currentUser.userType === 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Status
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-400 mr-3">📚</span>
                  <span className="text-green-600 font-medium">Aktif</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Change Password
          </h2>

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 text-green-800 text-sm">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    🔒
                  </span>
                  <input
                    {...register("currentPassword")}
                    type="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02]"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    🔑
                  </span>
                  <input
                    {...register("newPassword")}
                    type="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02]"
                    placeholder="Yeni şifrenizi girin"
                  />
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    🔑
                  </span>
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02]"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 bg-[#7c0a02] text-white font-semibold rounded-md hover:bg-[#a50d0d] transition-colors duration-200 disabled:opacity-60"
              >
                {passwordLoading ? "Şifre Değiştiriliyor..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
