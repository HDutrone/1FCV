import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/api";

// Optimistic check only: redirects anonymous visitors away from /admin before
// any rendering happens. The real authorization (token validity, user status)
// is enforced server-side in app/admin/layout.tsx via getSession().
export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
