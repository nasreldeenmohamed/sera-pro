"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signUpWithEmailPassword, signInWithGoogle } from "@/firebase/auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";

// Registration page using Firebase Auth (email/password + Google)
// - Uses shared SiteLayout for consistent header/footer
// - Bilingual UI with RTL support via global locale
// - Client-side validation shows realtime errors
/**
 * Register Page - Supports Redirect Flow
 * 
 * Handles authentication redirects from protected actions (e.g., CV builder).
 * After successful registration, redirects back to the intended page and executes
 * the pending action (via sessionStorage callback mechanism).
 */
export default function RegisterPage() {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // zod schema for realtime validation via react-hook-form
  const schema = z.object({
    name: z.string().min(2, { message: t("Name is required.", "الاسم مطلوب.") }),
    phone: z.string().optional(),
    email: z.string().email({ message: t("Enter a valid email.", "يرجى إدخال بريد إلكتروني صالح.") }),
    password: z.string().min(6, { message: t("Min 6 characters.", "على الأقل 6 أحرف.") }),
    confirm: z.string(),
  }).refine((data) => data.password === data.confirm, {
    message: t("Passwords do not match.", "كلمتا المرور غير متطابقتين."),
    path: ["confirm"],
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", phone: "", email: "", password: "", confirm: "" },
  });

  function mapFirebaseError(code: string): string {
    const map: Record<string, [string, string]> = {
      "auth/email-already-in-use": ["Email already in use.", "البريد الإلكتروني مستخدم بالفعل."],
      "auth/invalid-email": ["Invalid email.", "بريد إلكتروني غير صالح."],
      "auth/weak-password": ["Weak password.", "كلمة المرور ضعيفة."],
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
      // For Google sign-in, restore redirect URL from sessionStorage (query params are lost during redirect)
      const storedRedirect = sessionStorage.getItem("googleAuthRedirect");
      const storedAction = sessionStorage.getItem("googleAuthAction");
      
      // Use stored values if available, otherwise use current query params
      const finalRedirectUrl = storedRedirect || redirectUrl;
      const finalAction = storedAction || action;
      
      // Clean up sessionStorage
      if (storedRedirect) {
        sessionStorage.removeItem("googleAuthRedirect");
      }
      if (storedAction) {
        sessionStorage.removeItem("googleAuthAction");
      }
      
      // Store callback info for post-auth action execution
      if (finalAction) {
        sessionStorage.setItem("authCallback", JSON.stringify({ action: finalAction, callback: "pending" }));
      }

      // Redirect to intended page or dashboard
      const targetUrl = finalRedirectUrl || "/dashboard";
      console.log("[Register] User authenticated, redirecting to:", targetUrl);
      router.replace(targetUrl);
    }
  }, [user, authLoading, router, redirectUrl, action]);

  // Note: Google redirect results are handled centrally by AuthProvider in auth-context.tsx
  // The useAuth hook will update the user state once the redirect is processed
  // We just need to wait for auth state and redirect accordingly
  // IMPORTANT: getRedirectResult() can only be called ONCE per redirect, so we let AuthProvider handle it
  // This prevents race conditions and duplicate profile saves

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await form.trigger();
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      const { name, phone, email, password } = form.getValues();
      // Create auth account
      const userCredential = await signUpWithEmailPassword(email, password);
      const userId = userCredential.user.uid;
      
      // Save profile data to Firestore
      await saveUserProfile(userId, {
        name,
        phone: phone || undefined,
        email,
      });
      
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
    
    console.log("[Register] 🔵 handleGoogle called");
    console.log("[Register] Current loading state:", loading);
    
    setError(null);
    setLoading(true);
    
    try {
      // Store redirect URL and action in sessionStorage BEFORE redirect
      // Firebase's signInWithRedirect doesn't preserve query parameters, so we need to store them
      if (redirectUrl) {
        sessionStorage.setItem("googleAuthRedirect", redirectUrl);
        console.log("[Register] Stored redirect URL in sessionStorage:", redirectUrl);
      }
      if (action) {
        sessionStorage.setItem("googleAuthAction", action);
        console.log("[Register] Stored action in sessionStorage:", action);
      }
      
      console.log("[Register] 🚀 Starting Google sign-in redirect...");
      console.log("[Register] Current page URL:", window.location.href);
      console.log("[Register] Firebase configured:", typeof window !== "undefined" ? "yes (browser)" : "no (server)");
      
      // Sign in with Google redirect (redirects to Google, then back to this page)
      // After redirect, useEffect will handle the result via getGoogleRedirectResult()
      await signInWithGoogle();
      // Note: signInWithRedirect doesn't return immediately - the page will redirect
      // The useEffect hook will handle the redirect result when the page loads again
      console.log("[Register] ✅ Redirect initiated (page will redirect to Google)");
      // Note: After signInWithRedirect completes, the browser will navigate away
      // so we won't see logs after this point until the redirect returns
    } catch (err: any) {
      console.error("[Register] ❌ Failed to initiate Google redirect:", err);
      console.error("[Register] Error type:", typeof err);
      console.error("[Register] Error details:", {
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
          <h1 className="text-2xl font-semibold">{t("Create account", "إنشاء حساب")}</h1>
        </header>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Full Name", "الاسم الكامل")}</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder={t("John Doe", "أحمد محمد")} {...field} dir={isAr ? "rtl" : "ltr"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Phone (Optional)", "الهاتف (اختياري)")}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder={t("+20 1234567890", "+20 1234567890")} {...field} dir={isAr ? "rtl" : "ltr"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Email", "البريد الإلكتروني")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("you@example.com", "you@example.com")} {...field} dir={isAr ? "rtl" : "ltr"} />
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
                    <Input type="password" placeholder={t("••••••••", "••••••••")} {...field} dir={isAr ? "rtl" : "ltr"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Confirm password", "تأكيد كلمة المرور")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t("••••••••", "••••••••")} {...field} dir={isAr ? "rtl" : "ltr"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={loading} className="w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
              {loading ? t("Please wait...", "يرجى الانتظار...") : t("Create account", "إنشاء حساب")}
            </Button>
          </form>
        </Form>
        <div className="mt-4">
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={(e) => {
              console.log("[Register] 🔘 Google button clicked!");
              handleGoogle(e);
            }}
            disabled={loading}
            type="button"
          >
            {loading ? t("Please wait...", "يرجى الانتظار...") : t("Continue with Google", "المتابعة مع جوجل")}
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}


