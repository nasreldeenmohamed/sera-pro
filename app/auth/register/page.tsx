"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signUpWithEmailPassword, signInWithGoogle } from "@/firebase/auth";
import { saveUserProfile } from "@/firebase/firestore";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";

// Registration page using Firebase Auth (email/password + Google)
// - Uses shared SiteLayout for consistent header/footer
// - Bilingual UI with RTL support via global locale
// - Client-side validation shows realtime errors
export default function RegisterPage() {
  const router = useRouter();
  const { isAr, t } = useLocale();

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
      default: ["Something went wrong.", "حدث خطأ ما."],
    };
    const [en, ar] = map[code] || map.default;
    return isAr ? ar : en;
  }

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
      
      router.replace("/dashboard");
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Save profile data from Google account (create if doesn't exist)
      await saveUserProfile(user.uid, {
        name: user.displayName || user.email?.split("@")[0] || "User",
        phone: undefined,
        email: user.email || "",
      });
      
      router.replace("/dashboard");
    } catch (err: any) {
      setError(mapFirebaseError(err?.code || ""));
    } finally {
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
                    <Input type="text" placeholder={t("John Doe", "أحمد محمد")} {...field} />
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
                    <Input type="tel" placeholder={t("+20 1234567890", "+20 1234567890")} {...field} />
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
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("Confirm password", "تأكيد كلمة المرور")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t("••••••••", "••••••••")} {...field} />
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
          <Button variant="secondary" className="w-full" onClick={handleGoogle}>{t("Continue with Google", "المتابعة مع جوجل")}</Button>
        </div>
      </section>
    </SiteLayout>
  );
}


