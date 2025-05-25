"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { useState, useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage(
        "Your password has been successfully changed. You can now log in."
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      console.log("Login attempt with:", data);
      const response = await authService.login(data);
      console.log("Login response:", response);

      if (
        !response ||
        !response.user ||
        typeof response.user.userType === "undefined"
      ) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      setUser(response.user);

      console.log("User state updated, redirecting...");
      router.push("/main");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response?.status === 500) {
        setError("Incorrect email or password");
      } else if (error.message === "Invalid response from server") {
        setError(
          "Invalid response from server. Please try again later."
        );
      } else {
        setError("An error occurred during login. Please try again.");
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url(/graduation-bg.jpg)" }}
    >
      <div className="absolute inset-0 bg-black/80 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full">
        <div className="mx-auto w-full max-w-md bg-white/90 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center">
          <img
            src="/iztech-logo.png"
            alt="Iztech Logo"
            className="w-24 h-24 mb-4 rounded-full bg-white p-2 shadow"
          />
          <h1 className="text-2xl font-bold text-center text-[#7c0a02] mb-6">
            Automatic Graduation
            <br />
            Management System
          </h1>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 text-green-800 text-center text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-red-800 text-center text-sm">
                {error}
              </div>
            )}
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
            <div className="flex justify-between items-center">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#7c0a02] hover:underline"
              >
                Forgot Password
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#7c0a02] text-white font-semibold hover:bg-[#a50d0d] transition-colors duration-200 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <div className="text-center mt-2">
              <Link
                href="/auth/register"
                className="text-xs text-[#7c0a02] hover:underline"
              >
                Don't have an account? Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
