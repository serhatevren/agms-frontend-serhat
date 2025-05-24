"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { AuthState } from "@/store/auth";
import { useState } from "react";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  phoneNumber: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      const response = await authService.register(data);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      setUser(response.user);

      // Redirect based on user type
      switch (response.user.userType) {
        case 0: // Student
          router.push("/student");
          break;
        case 1: // Staff
          router.push("/staff");
          break;
        case 2: // Advisor
          router.push("/advisor");
          break;
        case 3: // Admin
          router.push("/admin");
          break;
        default:
          router.push("/auth/login");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      setError(
        error.response?.data?.message ||
          "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin."
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/graduation-bg.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full">
        <div className="mx-auto w-full max-w-md bg-white/90 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center">
          <img src="/iztech-logo.png" alt="İztech Logo" className="w-24 h-24 mb-4 rounded-full bg-white p-2 shadow" />
          <h1 className="text-2xl font-bold text-center text-[#7c0a02] mb-1">Yeni Hesap Oluşturun</h1>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
              <input
                {...register("name")}
                id="name"
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="İsim"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">Soyisim</label>
              <input
                {...register("surname")}
                id="surname"
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Soyisim"
              />
              {errors.surname && (
                <p className="mt-1 text-xs text-red-600">{errors.surname.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                {...register("email")}
                id="email"
                type="email"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="E-posta"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Telefon numarası</label>
              <input
                {...register("phoneNumber")}
                id="phoneNumber"
                type="tel"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Telefon numarası (isteğe bağlı)"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                {...register("password")}
                id="password"
                type="password"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Şifre"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#7c0a02] text-white font-semibold hover:bg-[#a50d0d] transition-colors duration-200 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
            </button>
            <div className="text-center mt-2">
              <Link href="/auth/login" className="text-xs text-[#7c0a02] hover:underline">Zaten hesabınız var mı? Giriş Yapın</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
