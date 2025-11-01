"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Locale = "en" | "ar";

type LocaleContextValue = {
  locale: Locale;
  isAr: boolean;
  t: <T extends string>(en: T, ar: T) => T;
  setLocale: (loc: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

/**
 * Locale Provider - Manages app-wide language and RTL/LTR direction
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 * - Provides app-wide locale with cookie + localStorage persistence
 * - When locale changes, sets cookie 'locale' and refreshes to let server layout set dir/lang
 * - initialLocale should come from server-side (layout.tsx) which defaults to 'ar'
 * - User preference is saved when they toggle language, allowing them to override the default
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Hydrate from localStorage if present (respects user's explicit preference)
    // DEFAULT BEHAVIOR: If localStorage exists, use it (user explicitly chose a language)
    // If localStorage doesn't exist, the server default (Arabic) will be used
    // This ensures:
    // - New visitors get Arabic default (no localStorage)
    // - Returning users who chose English keep their preference (localStorage="en")
    // - Returning users who chose Arabic keep their preference (localStorage="ar")
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && saved !== locale) {
        // User has an explicit preference saved - respect it
        setLocaleState(saved);
        document.cookie = `locale=${saved}; path=/; max-age=${60 * 60 * 24 * 365}`;
        router.refresh();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    if (typeof document !== "undefined") {
      document.cookie = `locale=${loc}; path=/; max-age=${60 * 60 * 24 * 365}`;
      localStorage.setItem("locale", loc);
    }
    router.refresh();
  }, [router]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    isAr: locale === "ar",
    t: (en, ar) => (locale === "ar" ? ar : en),
    setLocale,
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}


