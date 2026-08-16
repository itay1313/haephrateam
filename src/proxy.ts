import { NextRequest, NextResponse } from "next/server";

// Everything behind the family password, except the login screen itself and the
// single image it uses as a background.
const PUBLIC = ["/login", "/api/auth/login", "/family/hills-memory.jpg"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("haephrati_session")?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.svg$).*)"],
};
