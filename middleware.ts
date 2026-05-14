import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth endpoints and login page through
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated requests to /login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Restrict /admin routes to allowlisted emails
  if (pathname.startsWith("/admin")) {
    const email = req.auth.user?.email?.toLowerCase() ?? "";
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
