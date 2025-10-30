"use client";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/firebase/auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { useState } from "react";

export default function ResetPage() {
  const { isAr, t } = useLocale();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email({ message: t("Enter a valid email.", "يرجى إدخال بريد إلكتروني صالح.") }),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await form.trigger();
    if (!ok) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { email } = form.getValues();
      await requestPasswordReset(email);
      setMessage(t("Reset link sent. Check your email.", "تم إرسال رابط إعادة التعيين. تحقق من بريدك."));
    } catch (err: any) {
      setError(t("Could not send reset email.", "تعذر إرسال بريد إعادة التعيين."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-md p-6 sm:p-8 md:p-12">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{t("Reset password", "إعادة تعيين كلمة المرور")}</h1>
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
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            <Button disabled={loading} className="w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
              {loading ? t("Please wait...", "يرجى الانتظار...") : t("Send reset link", "إرسال رابط إعادة التعيين")}
            </Button>
          </form>
        </Form>
      </section>
    </SiteLayout>
  );
}


