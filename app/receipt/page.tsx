"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Mail, 
  Download,
  Printer,
  FileText,
  Zap,
  Crown,
  User
} from "lucide-react";
import { 
  getTransaction, 
  getTransactionByReference, 
  getUserProfile,
  type Transaction,
  type UserProfile 
} from "@/firebase/firestore";

/**
 * Receipt Page - Displays payment receipt and subscription confirmation
 * 
 * Route: /receipt?transactionId={id} OR /receipt?trxReferenceNumber={ref}
 * 
 * This page displays a detailed receipt for successful transactions, including:
 * - Plan details (name, features, price, purchase date)
 * - Transaction details (masked card, reference number, status)
 * - Subscription validity period and limits
 * - User contact information
 * - Confirmation of active subscription limits
 * 
 * Features:
 * - Accepts transactionId or trxReferenceNumber as query parameter
 * - Fetches Transaction and User documents from Firestore
 * - Displays comprehensive receipt information
 * - Print/Download receipt functionality
 * - Support contact information
 * - Bilingual support (Arabic/English)
 * 
 * Security:
 * - Validates transaction belongs to authenticated user
 * - Handles missing transactions gracefully
 * - Shows error messages for unauthorized access
 */
function ReceiptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadReceiptData() {
      try {
        // Step 1: Extract transaction identifier from query parameters
        // Supports both transactionId (internal) and trxReferenceNumber (Kashier reference)
        const transactionId = searchParams.get("transactionId");
        const trxReferenceNumber = searchParams.get("trxReferenceNumber");

        if (!transactionId && !trxReferenceNumber) {
          setStatus("error");
          setErrorMessage(
            t(
              "Transaction ID or reference number is required. Please provide transactionId or trxReferenceNumber in the URL.",
              "رقم المعاملة أو المرجع مطلوب. يرجى توفير transactionId أو trxReferenceNumber في الرابط."
            )
          );
          return;
        }

        // Step 2: Fetch transaction from Firestore
        // Try transactionId first, then fallback to trxReferenceNumber
        let fetchedTransaction: Transaction | null = null;
        
        if (transactionId) {
          try {
            fetchedTransaction = await getTransaction(transactionId);
          } catch (error) {
            console.error("[Receipt] Error fetching transaction by ID:", error);
          }
        }

        if (!fetchedTransaction && trxReferenceNumber) {
          try {
            fetchedTransaction = await getTransactionByReference(trxReferenceNumber);
          } catch (error) {
            console.error("[Receipt] Error fetching transaction by reference:", error);
          }
        }

        // Step 3: Validate transaction exists
        if (!fetchedTransaction) {
          setStatus("error");
          setErrorMessage(
            t(
              "Transaction not found. Please verify the transaction ID or reference number.",
              "المعاملة غير موجودة. يرجى التحقق من رقم المعاملة أو المرجع."
            )
          );
          return;
        }

        // Step 4: Security check - Verify transaction belongs to authenticated user
        // Edge Case: User not authenticated or transaction belongs to different user
        if (user && fetchedTransaction.userId !== user.uid) {
          setStatus("error");
          setErrorMessage(
            t(
              "You do not have permission to view this receipt. This transaction belongs to a different account.",
              "ليس لديك إذن لعرض هذا الإيصال. هذه المعاملة تنتمي إلى حساب آخر."
            )
          );
          return;
        }

        // If user is not authenticated, still show receipt (for email links, etc.)
        // But log a warning
        if (!user) {
          console.warn("[Receipt] Receipt accessed without authentication");
        }

        // Step 5: Fetch user profile to get latest subscription information
        const userId = fetchedTransaction.userId;
        let fetchedProfile: UserProfile | null = null;
        
        try {
          fetchedProfile = await getUserProfile(userId);
        } catch (error) {
          console.warn("[Receipt] Could not fetch user profile:", error);
          // Continue without profile - not critical for receipt display
        }

        // Step 6: Validate payment status indicates success
        // Only show receipt for successful payments
        if (fetchedTransaction.paymentStatus !== "2") {
          setStatus("error");
          setErrorMessage(
            t(
              "This transaction was not successful. Receipts are only available for completed payments.",
              "لم تنجح هذه المعاملة. الإيصالات متاحة فقط للمدفوعات المكتملة."
            )
          );
          return;
        }

        // Step 7: Store transaction and user data for display
        setTransaction(fetchedTransaction);
        setUserProfile(fetchedProfile);
        setStatus("success");

      } catch (error: any) {
        console.error("[Receipt] Error loading receipt data:", error);
        setStatus("error");
        setErrorMessage(
          error.message || 
          t(
            "An error occurred while loading the receipt. Please try again or contact support.",
            "حدث خطأ أثناء تحميل الإيصال. يرجى المحاولة مرة أخرى أو التواصل مع الدعم."
          )
        );
      }
    }

    // Load receipt data when component mounts
    loadReceiptData();
  }, [searchParams, user, t]);

  // Step 8: Print receipt functionality
  const handlePrint = () => {
    window.print();
  };

  // Step 9: Download receipt as PDF (client-side)
  // Note: For production, consider server-side PDF generation for better formatting
  const handleDownload = () => {
    // Create a printable version of the receipt
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const receiptContent = document.getElementById("receipt-content");
    if (!receiptContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${locale}">
        <head>
          <title>${t("Payment Receipt", "إيصال الدفع")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt-header { text-align: center; margin-bottom: 30px; }
            .receipt-section { margin-bottom: 20px; }
            .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .receipt-label { font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Plan features mapping based on plan type
  const getPlanFeatures = (planId: string) => {
    const features: Record<string, { en: string[]; ar: string[] }> = {
      one_time: {
        en: [
          "1 CV",
          "3 Templates",
          "Unlimited edits for 7 days",
          "No watermark",
        ],
        ar: [
          "سيرة واحدة",
          "3 قوالب",
          "تعديلات غير محدودة لمدة 7 أيام",
          "بدون علامة مائية",
        ],
      },
      flex_pack: {
        en: [
          "5 CV credits",
          "All templates",
          "6 months validity",
          "No watermark",
        ],
        ar: [
          "رصيد 5 سير",
          "جميع القوالب",
          "صالح لمدة 6 أشهر",
          "بدون علامة مائية",
        ],
      },
      annual_pass: {
        en: [
          "Unlimited CVs",
          "All templates",
          "Cover letter tools",
          "Future features",
          "1 year validity",
        ],
        ar: [
          "سير غير محدودة",
          "جميع القوالب",
          "أدوات خطاب التغطية",
          "الميزات المستقبلية",
          "صالح لمدة سنة واحدة",
        ],
      },
    };

    return features[planId] || { en: [], ar: [] };
  };

  // Get plan icon
  const getPlanIcon = (planId: string) => {
    const icons: Record<string, React.ReactNode> = {
      one_time: <FileText className="h-5 w-5" />,
      flex_pack: <Zap className="h-5 w-5" />,
      annual_pass: <Crown className="h-5 w-5" />,
    };
    return icons[planId] || <FileText className="h-5 w-5" />;
  };

  // Format date based on locale
  const formatDate = (timestamp: any) => {
    if (!timestamp) return t("N/A", "غير متاح");
    
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return t("N/A", "غير متاح");
    }

    return date.toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  // Format subscription expiration date
  const formatExpirationDate = () => {
    if (!userProfile?.subscription?.validUntil) return t("N/A", "غير متاح");
    
    const validUntil = userProfile.subscription.validUntil;
    let date: Date;
    
    if (validUntil.toDate && typeof validUntil.toDate === "function") {
      date = validUntil.toDate();
    } else if (validUntil.seconds) {
      date = new Date(validUntil.seconds * 1000);
    } else {
      return t("N/A", "غير متاح");
    }

    return date.toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  if (status === "loading") {
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Loading receipt...", "جارٍ تحميل الإيصال...")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  if (status === "error") {
    return (
      <SiteLayout>
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                {t("Receipt Not Available", "الإيصال غير متاح")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || t("Unknown error occurred.", "حدث خطأ غير معروف.")}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/dashboard")}>
                  {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
                </Button>
                <Button onClick={() => router.push("/pricing")} variant="outline">
                  {t("View Pricing", "عرض الأسعار")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  if (!transaction) {
    return null;
  }

  const planFeatures = getPlanFeatures(transaction.subscriptionPlanId);
  const planIcon = getPlanIcon(transaction.subscriptionPlanId);
  const subscriptionStatus = userProfile?.subscription?.status || "active";
  const isActive = subscriptionStatus === "active";

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Print/Download Actions - Hidden when printing */}
        <div className="mb-6 flex justify-end gap-2 no-print">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            {t("Print Receipt", "طباعة الإيصال")}
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("Download Receipt", "تنزيل الإيصال")}
          </Button>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content">
          <Card className="border-2">
            <CardHeader className="text-center border-b pb-6">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Receipt className="h-8 w-8 text-green-600" />
                {t("Payment Receipt", "إيصال الدفع")}
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {t("Thank you for your purchase!", "شكراً لك على الشراء!")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Subscription Status Confirmation */}
              {isActive && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <p className="font-semibold">
                      {t("Your subscription is active!", "اشتراكك نشط الآن!")}
                    </p>
                    <p className="text-sm mt-1">
                      {t(
                        "All premium features and limits are now available. You can start creating CVs immediately.",
                        "جميع الميزات المميزة والحدود متاحة الآن. يمكنك البدء في إنشاء السير الذاتية على الفور."
                      )}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Plan Details Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {planIcon}
                  {t("Plan Details", "تفاصيل الخطة")}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Plan Name", "اسم الخطة")}
                    </p>
                    <p className="text-lg font-semibold">
                      {transaction.subscriptionPlanName}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Purchase Date", "تاريخ الشراء")}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                    {t("Plan Features", "ميزات الخطة")}
                  </p>
                  <ul className="space-y-2">
                    {(locale === "ar" ? planFeatures.ar : planFeatures.en).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscription Validity */}
                {userProfile?.subscription?.validUntil && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {t("Subscription Valid Until", "الاشتراك صالح حتى")}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                      {formatExpirationDate()}
                    </p>
                    {transaction.subscriptionPlanId === "flex_pack" && userProfile.subscription.creditsRemaining !== undefined && (
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                        {t("Credits Remaining:", "الرصيد المتبقي:")} {userProfile.subscription.creditsRemaining}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Transaction Details Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t("Transaction Details", "تفاصيل المعاملة")}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Amount Paid", "المبلغ المدفوع")}
                    </p>
                    <p className="text-2xl font-bold">
                      {transaction.transactionAmount} {transaction.transactionCurrency}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Payment Status", "حالة الدفع")}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {t("Completed", "مكتمل")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Transaction ID:", "رقم المعاملة:")}
                    </span>
                    <code className="text-sm font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      {transaction.transactionId}
                    </code>
                  </div>
                  
                  {transaction.trxReferenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t("Payment Reference:", "مرجع الدفع:")}
                      </span>
                      <code className="text-sm font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded">
                        {transaction.trxReferenceNumber}
                      </code>
                    </div>
                  )}
                  
                  {transaction.maskedCard && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t("Payment Method:", "طريقة الدفع:")}
                      </span>
                      <span className="text-sm">
                        {transaction.maskedCard}
                        {transaction.cardBrand && ` (${transaction.cardBrand})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information Section */}
              {userProfile && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("Account Information", "معلومات الحساب")}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("Name", "الاسم")}
                      </p>
                      <p className="text-lg font-semibold">
                        {userProfile.name}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("Email", "البريد الإلكتروني")}
                      </p>
                      <p className="text-lg font-semibold">
                        {userProfile.email}
                      </p>
                    </div>
                  </div>
                  
                  {userProfile.phone && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("Phone", "الهاتف")}
                      </p>
                      <p className="text-lg font-semibold">
                        {userProfile.phone}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Support Information */}
              <div className="border-t pt-6">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2">
                      {t("Need Help?", "تحتاج مساعدة؟")}
                    </p>
                    <p className="text-sm mb-2">
                      {t(
                        "If you have any questions about your subscription or billing, please contact our support team.",
                        "إذا كان لديك أي أسئلة حول اشتراكك أو الفوترة، يرجى التواصل مع فريق الدعم."
                      )}
                    </p>
                    <a
                      href="mailto:support@serapro.com"
                      className="text-sm hover:underline flex items-center gap-1 mt-2"
                    >
                      <Mail className="h-3 w-3" />
                      support@serapro.com
                    </a>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 no-print">
          <Button onClick={() => router.push("/dashboard")} className="flex-1">
            {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
          </Button>
          <Button
            onClick={() => router.push("/cv-builder")}
            variant="outline"
            className="flex-1"
          >
            {t("Create CV Now", "إنشاء السيرة الذاتية الآن")}
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .container {
            max-width: 100%;
            padding: 0;
          }
        }
      `}</style>
    </SiteLayout>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <SiteLayout>
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    }>
      <ReceiptContent />
    </Suspense>
  );
}

