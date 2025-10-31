import { NextResponse, type NextRequest } from "next/server";

// Middleware sets a 'locale' cookie based on /ar or /en path prefix.
// For root path or other paths, defaults to 'en' if no cookie exists.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  
  // Get existing locale cookie
  const existingLocale = req.cookies.get("locale")?.value;

  if (pathname.startsWith("/ar")) {
    res.cookies.set("locale", "ar", { path: "/" });
  } else if (pathname.startsWith("/en")) {
    res.cookies.set("locale", "en", { path: "/" });
  } else if (!existingLocale) {
    // Set default locale for root path and other paths if no cookie exists
    res.cookies.set("locale", "en", { path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
};


