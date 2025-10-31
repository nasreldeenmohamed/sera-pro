"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithEmailPassword, signInWithGoogle, getGoogleRedirectResult } from "@/firebase/auth";
import { saveUserProfile } from "@/firebase/firestore";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";

/**
 * Login Page - Supports Redirect Flow
 * 
 * Handles authentication redirects from protected actions (e.g., CV builder).
 * After successful login, redirects back to the intended page and executes
 * the pending action (via sessionStorage callback mechanism).
 */
export default function LoginPage() {
  const router = useRouter();
  const { isAr, t } = useLocale();
  const { user, loading: authLoading } = useAuth();

  // Get redirect URL and action from query params
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params for redirect info
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    const actionParam = params.get("action");
    if (redirect) setRedirectUrl(redirect);
    if (actionParam) setAction(actionParam);
  }, []);

  const schema = z.object({
    email: z.string().email({ message: t("Enter a valid email.", "يرجى إدخال بريد إلكتروني صالح.") }),
    password: z.string().min(1, { message: t("Password is required.", "كلمة المرور مطلوبة.") }),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapFirebaseError(code: string): string {
    const map: Record<string, [string, string]> = {
      "auth/invalid-credential": ["Incorrect email or password.", "البريد الإلكتروني أو كلمة المرور غير صحيحة."],
      "auth/wrong-password": ["Incorrect password.", "كلمة المرور غير صحيحة."],
      "auth/user-not-found": ["No account found.", "لم يتم العثور على حساب."],
      "auth/popup-closed-by-user": ["Sign-in popup was closed.", "تم إغلاق نافذة تسجيل الدخول."],
      "auth/popup-blocked": ["Popup was blocked by browser.", "تم حظر النافذة المنبثقة من المتصفح."],
      "auth/cancelled-popup-request": ["Only one popup request is allowed at a time.", "يُسمح بطلب نافذة واحدة فقط في كل مرة."],
      "auth/redirect-cancelled-by-user": ["Sign-in was cancelled.", "تم إلغاء تسجيل الدخول."],
      "auth/redirect-operation-pending": ["A sign-in operation is already in progress.", "عملية تسجيل دخول قيد التنفيذ بالفعل."],
      "auth/account-exists-with-different-credential": ["An account already exists with this email.", "يوجد حساب بالفعل بهذا البريد الإلكتروني."],
      default: ["Something went wrong.", "حدث خطأ ما."],
    };
    const [en, ar] = map[code] || map.default;
    return isAr ? ar : en;
  }

  // Redirect after authentication
  useEffect(() => {
    if (!authLoading && user) {
      // Store callback info for post-auth action execution
      if (action) {
        sessionStorage.setItem("authCallback", JSON.stringify({ action, callback: "pending" }));
      }

      // Redirect to intended page or dashboard
      const targetUrl = redirectUrl || "/dashboard";
      console.log("[Login] User authenticated, redirecting to:", targetUrl);
      router.replace(targetUrl);
    }
  }, [user, authLoading, router, redirectUrl, action]);

  // Check for Google redirect result when page loads (fallback if AuthProvider doesn't handle it)
  // This handles the redirect callback after user signs in with Google
  // Important: getRedirectResult can only be called once per redirect, and only when there's actually a redirect result
  // NOTE: AuthProvider also handles redirect results globally, so this is a fallback
  useEffect(() => {
    let mounted = true;
    
    async function handleRedirectResult() {
      // Small delay to ensure Firebase is fully initialized
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!mounted) return;
      
      setLoading(true);
      console.log("[Login] Checking for Google redirect result...");
      console.log("[Login] Current URL:", window.location.href);
      console.log("[Login] URL search params:", window.location.search);
      
      try {
        const result = await getGoogleRedirectResult();
        
        if (!mounted) return;
        
        if (result && result.user) {
          console.log("[Login] ✅ Google sign-in successful!", {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
          });
          
          // User signed in via Google redirect
          const user = result.user;
          
          // Create or update user profile in Firestore
          try {
            console.log("[Login] Saving user profile to Firestore...");
            await saveUserProfile(user.uid, {
              name: user.displayName || user.email?.split("@")[0] || "User",
              phone: undefined, // Google doesn't provide phone number
              email: user.email || "",
            });
            console.log("[Login] ✅ Profile saved successfully");
            
            // Store callback info if action was specified
            if (action) {
              sessionStorage.setItem("authCallback", JSON.stringify({ action, callback: "pending" }));
            }
            
            // Redirect to intended page or dashboard
            const targetUrl = redirectUrl || "/dashboard";
            console.log("[Login] Redirecting to:", targetUrl);
            router.replace(targetUrl);
          } catch (profileError: any) {
            console.error("[Login] ❌ Failed to save profile:", profileError);
            console.error("[Login] Profile error details:", {
              code: profileError?.code,
              message: profileError?.message,
              stack: profileError?.stack,
            });
            setError(t("Failed to save profile. Please try again.", "فشل حفظ الملف الشخصي. يرجى المحاولة مرة أخرى."));
            setLoading(false);
            return;
          }
        } else {
          console.log("[Login] ℹ️ No redirect result (normal if not returning from Google sign-in)");
          setLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("[Login] ❌ Google redirect error:", err);
        console.error("[Login] Error details:", {
          code: err?.code,
          message: err?.message,
          stack: err?.stack,
        });
        setError(mapFirebaseError(err?.code || ""));
        setLoading(false);
      }
    }
    
    handleRedirectResult();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await form.trigger();
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      const { email, password } = form.getValues();
      await signInWithEmailPassword(email, password);
      
      // Store callback info if action was specified
      if (action) {
        sessionStorage.setItem("authCallback", JSON.stringify({ action, callback: "pending" }));
      }
      
      // Redirect to intended page or dashboard
      const targetUrl = redirectUrl || "/dashboard";
      router.replace(targetUrl);
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(e?: React.MouseEvent) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    console.log("[Login] 🔵 handleGoogle called");
    console.log("[Login] Current loading state:", loading);
    
    setError(null);
    setLoading(true);
    
    try {
      console.log("[Login] 🚀 Starting Google sign-in redirect...");
      console.log("[Login] Current page URL:", window.location.href);
      console.log("[Login] Firebase configured:", typeof window !== "undefined" ? "yes (browser)" : "no (server)");
      
      // Sign in with Google redirect (redirects to Google, then back to this page)
      // After redirect, useEffect will handle the result via getGoogleRedirectResult()
      await signInWithGoogle();
      // Note: signInWithRedirect doesn't return immediately - the page will redirect
      // The useEffect hook will handle the redirect result when the page loads again
      console.log("[Login] ✅ Redirect initiated (page will redirect to Google)");
      // Note: After signInWithRedirect completes, the browser will navigate away
      // so we won't see logs after this point until the redirect returns
    } catch (err: any) {
      console.error("[Login] ❌ Failed to initiate Google redirect:", err);
      console.error("[Login] Error type:", typeof err);
      console.error("[Login] Error details:", {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      });
      // Handle Firebase auth errors
      setError(mapFirebaseError(err?.code || ""));
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-md p-6 sm:p-8 md:p-12">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{t("Sign in", "تسجيل الدخول")}</h1>
        </header>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Email", "البريد الإلكتروني")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("you@example.com", "you@example.com")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Password", "كلمة المرور")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t("••••••••", "••••••••")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={loading} className="w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
              {loading ? t("Please wait...", "يرجى الانتظار...") : t("Sign in", "تسجيل الدخول")}
            </Button>
          </form>
        </Form>
        <div className="mt-4 flex flex-col gap-3">
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={(e) => {
              console.log("[Login] 🔘 Google button clicked!");
              handleGoogle(e);
            }}
            disabled={loading}
            type="button"
          >
            {loading ? t("Please wait...", "يرجى الانتظار...") : t("Continue with Google", "المتابعة مع جوجل")}
          </Button>
          <Link href="/auth/reset" className="text-sm underline text-zinc-700 dark:text-zinc-300">{t("Forgot your password?", "هل نسيت كلمة المرور؟")}</Link>
        </div>
      </section>
    </SiteLayout>
  );
}


