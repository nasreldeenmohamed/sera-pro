import { NextResponse, type NextRequest } from "next/server";

// Middleware sets a 'locale' cookie based on /ar or /en path prefix.
// Root path will remain as-is; consider redirecting '/' to '/en' if desired.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  if (pathname.startsWith("/ar")) {
    res.cookies.set("locale", "ar", { path: "/" });
  } else if (pathname.startsWith("/en")) {
    res.cookies.set("locale", "en", { path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
};


