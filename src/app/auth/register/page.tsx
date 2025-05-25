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
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine(
      (email) => email.endsWith("@std.iyte.edu.tr") || email.endsWith("@iyte.edu.tr"),
      "Email must end with @std.iyte.edu.tr or @iyte.edu.tr"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .refine((val) => val.trim().length > 0, "Name field cannot be empty"),
  surname: z
    .string()
    .min(2, "Surname must be at least 2 characters")
    .refine((val) => val.trim().length > 0, "Surname field cannot be empty"),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits (Example: 5551234567)")
    .optional()
    .or(z.literal("")),
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
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Register error:", error);
      setError(
        error.response?.data?.message ||
          "An error occurred during registration. Please try again."
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url(/graduation-bg.jpg)" }}
    >
      <div className="absolute inset-0 bg-black/80 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full">
        <div className="mx-auto w-full max-w-md bg-white/90 rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center">
          <img
            src="/iztech-logo.png"
            alt="İztech Logo"
            className="w-24 h-24 mb-4 rounded-full bg-white p-2 shadow"
          />
          <h1 className="text-2xl font-bold text-center text-[#7c0a02] mb-6 ">
            Create New Account
          </h1>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <input
                {...register("name")}
                id="name"
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("surname")}
                id="surname"
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Surname"
              />
              {errors.surname && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.surname.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("email")}
                id="email"
                type="email"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("phoneNumber")}
                id="phoneNumber"
                type="tel"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Phone number"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("password")}
                id="password"
                type="password"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] text-gray-900"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#7c0a02] text-white font-semibold hover:bg-[#a50d0d] transition-colors duration-200 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
            <div className="text-center mt-2">
              <Link
                href="/auth/login"
                className="text-xs text-[#7c0a02] hover:underline"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
