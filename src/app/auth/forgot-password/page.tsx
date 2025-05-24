"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { authService } from "@/services/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setStatus({ type: null, message: null });
      const response = await authService.resetPassword(data.email);
      setStatus({
        type: "success",
        message:
          response.message ||
          "Şifre sıfırlama bağlantısı email adresinize gönderildi.",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Şifre sıfırlama işlemi sırasında bir hata oluştu.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Şifremi Unuttum
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Email adresinizi girin, size yeni şifrenizi göndereceğiz.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {status.message && (
            <div
              className={`rounded-md ${
                status.type === "success" ? "bg-green-50" : "bg-red-50"
              } p-4`}
            >
              <div className="flex">
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      status.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {status.message}
                  </h3>
                </div>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email adresi
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email adresi"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? "Gönderiliyor..." : "Yeni şifre gönder"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
