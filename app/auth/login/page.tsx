"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signInWithEmailPassword, signInWithGoogle } from "@/firebase/auth";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";

export default function LoginPage() {
  const router = useRouter();
  const { isAr, t } = useLocale();

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
      const { email, password } = form.getValues();
      await signInWithEmailPassword(email, password);
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
      await signInWithGoogle();
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
          <Button variant="secondary" className="w-full" onClick={handleGoogle}>{t("Continue with Google", "المتابعة مع جوجل")}</Button>
          <Link href="/auth/reset" className="text-sm underline text-zinc-700 dark:text-zinc-300">{t("Forgot your password?", "هل نسيت كلمة المرور؟")}</Link>
        </div>
      </section>
    </SiteLayout>
  );
}


