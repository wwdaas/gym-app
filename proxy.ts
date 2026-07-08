import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isMemberArea = pathname.startsWith("/member");
  const isAdminArea = pathname.startsWith("/admin");

  if (!isMemberArea && !isAdminArea) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminArea && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/member", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/member/:path*", "/admin/:path*"],
};
