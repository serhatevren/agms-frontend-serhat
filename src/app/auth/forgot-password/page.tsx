"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { authService } from "@/services/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
          "A password reset link has been sent to your email address.",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "No account found with this email address.",
      });
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
            Forgot Password
          </h1>
          <p className="text-center text-gray-700 mb-6">
            Enter your email address and we will send your new password.
          </p>
          <form className="w-full space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {status.message && (
              <div
                className={`rounded-md ${
                  status.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                } p-4 text-center text-sm`}
              >
                {status.message}
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#7c0a02] text-white font-semibold hover:bg-[#a50d0d] transition-colors duration-200 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center mt-2">
              <Link
                href="/auth/login"
                className="text-xs text-[#7c0a02] hover:underline"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
