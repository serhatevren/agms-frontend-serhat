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
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const getUserTypeText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "Student";
    case 1:
      if (typeof staffRole === "number") {
        switch (staffRole) {
          case 0:
            return "Rectorate Staff";
          case 1:
            return "Student Affairs Staff";
          case 2:
            return "Faculty Dean's Office Staff";
          case 3:
            return "Department Secretary";
          default:
            return "Staff";
        }
      }
      return "Staff";
    case 2:
      return "Advisor";
    case 3:
      return "Administrator";
    default:
      return "User";
  }
};

const getDepartmentText = (userType: number, staffRole?: number) => {
  switch (userType) {
    case 0:
      return "Computer Engineering"; // This should come from backend
    case 1:
      if (staffRole === 1) return "Student Affairs";
      if (staffRole === 3) return "Computer Engineering Department";
      return "Management";
    case 2:
      return "Computer Engineering"; // This should come from backend
    case 3:
      return "System Administration";
    default:
      return "Unknown";
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

      setSuccessMessage("Your password has been changed successfully!");
      reset();
    } catch (error: any) {
      console.error("Password change error:", error);
      if (error.response?.status === 400) {
        setErrorMessage("Current password is incorrect!");
      } else {
        setErrorMessage(
          "An error occurred while changing the password. Please try again."
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-900">
                  {currentUser.name && currentUser.surname
                    ? `${currentUser.name} ${currentUser.surname}`.trim()
                    : currentUser.name ||
                      currentUser.surname ||
                      "No information found"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-900">{currentUser.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {currentUser.userType === 0
                  ? "Department"
                  : currentUser.userType === 1
                  ? "Role"
                  : "Department"}
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-900">{departmentText}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                User Type
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <span className="text-gray-900">{userTypeText}</span>
              </div>
            </div>

            {currentUser.phoneNumber && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-900">
                    {currentUser.phoneNumber}
                  </span>
                </div>
              </div>
            )}

            {currentUser.userType === 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Student Status
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-green-600 font-medium">Active</span>
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
                Your password has been changed successfully!
              </div>
            )}
            {errorMessage && (
              <div className="rounded-md bg-red-50 p-4 text-red-800 text-sm">
                {errorMessage === "Current password is incorrect!"
                  ? "Current password is incorrect!"
                  : errorMessage ===
                    "An error occurred while changing the password. Please try again."
                  ? "An error occurred while changing the password. Please try again."
                  : errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    {...register("currentPassword")}
                    type="password"
                    className="block w-full pl-4 pr-3 py-3 border border-gray-400 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] placeholder-gray-500 text-black"
                    placeholder="Enter your current password"
                  />
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register("newPassword")}
                    type="password"
                    className="block w-full pl-4 pr-3 py-3 border border-gray-600 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] placeholder-gray-600 text-black"
                    placeholder="Enter your new password"
                  />
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className="block w-full pl-4 pr-3 py-3 border border-gray-400 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] placeholder-gray-500 text-black"
                    placeholder="Re-enter your new password"
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
                {passwordLoading ? "Changing Password..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
