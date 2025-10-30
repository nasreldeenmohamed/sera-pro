"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocale } from "@/lib/locale-context";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-600" />
            {t("Payment Cancelled", "تم إلغاء الدفع")}
          </CardTitle>
          <CardDescription>
            {t("Your payment was cancelled. No charges were made.", "تم إلغاء الدفع. لم يتم خصم أي مبالغ.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {t(
                "If you need assistance or want to complete your purchase, please contact support or try again.",
                "إذا كنت تحتاج إلى مساعدة أو ترغب في إكمال عملية الشراء، يرجى الاتصال بالدعم أو المحاولة مرة أخرى."
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => router.push("/pricing")} className="w-full sm:w-auto">
              {t("View Plans", "عرض الخطط")}
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full sm:w-auto">
              {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

