"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { XCircle } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const transactionId = searchParams.get("transactionId");

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {t(
                "Payment failed or was cancelled. Please try again.",
                "فشل الدفع أو تم إلغاؤه. يرجى المحاولة مرة أخرى."
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-x-2">
            <Button
              onClick={() => router.push("/pricing")}
              variant="outline"
            >
              {t("Back to Pricing", "العودة إلى الأسعار")}
            </Button>
            {transactionId && (
              <Button
                onClick={() => router.push(`/payments/retry?transactionId=${transactionId}`)}
                variant="outline"
              >
                {t("Retry Payment", "إعادة محاولة الدفع")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <SiteLayout>
          <div className="container mx-auto px-4 py-16 text-center">
            <p>Loading...</p>
          </div>
        </SiteLayout>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

