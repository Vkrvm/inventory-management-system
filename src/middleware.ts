import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicRoutes = ["/auth/signin"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  const userRole = session.user.role;

  // User management routes - SUPER_ADMIN only
  if (pathname.startsWith("/dashboard/users")) {
    if (userRole !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin-only routes
  const adminRoutes = ["/dashboard/warehouses", "/dashboard/reports"];
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Manager+ routes (SUPER_ADMIN, ADMIN, MANAGER)
  const managerRoutes = [
    "/dashboard/products",
    "/dashboard/materials",
    "/dashboard/stock",
    "/dashboard/customers",
  ];
  if (managerRoutes.some((route) => pathname.startsWith(route))) {
    if (
      ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(userRole)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
