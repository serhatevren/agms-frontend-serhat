import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if we're on the client side
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

    if (!token && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (token && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
