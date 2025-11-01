import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware sets a 'locale' cookie based on /ar or /en path prefix.
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 * - For root path or other paths, defaults to 'ar' (even if old cookie exists)
 * - Only preserves existing 'en' cookie if path explicitly starts with /en
 * - This ensures Egyptian users get Arabic-first experience by default
 * - Users can switch to English via language toggle, which saves their preference
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  
  // Get existing locale cookie
  const existingLocale = req.cookies.get("locale")?.value;

  if (pathname.startsWith("/ar")) {
    // Explicit Arabic path - set Arabic
    res.cookies.set("locale", "ar", { path: "/" });
  } else if (pathname.startsWith("/en")) {
    // Explicit English path - set English
    res.cookies.set("locale", "en", { path: "/" });
  } else {
    // DEFAULT: For all other paths (root, /dashboard, /create-cv, etc.)
    // Force Arabic as default - this overrides any old cookies from previous visits
    // This ensures all new sessions default to Arabic/RTL
    res.cookies.set("locale", "ar", { path: "/" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"],
};


