"use client";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Linkedin,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
} from "lucide-react";

/**
 * Data Import Step Component
 * 
 * Allows users to import CV data before manual entry:
 * 1. LinkedIn profile URL (may be blocked - shows instructions)
 * 2. LinkedIn JSON export (recommended method)
 * 3. CV file upload (PDF, DOCX) - extracts text and attempts to map fields
 * 
 * After successful import, data is pre-filled in the form.
 * Users can skip this step and enter data manually.
 * 
 * Future extensibility:
 * - OCR for scanned PDF CVs
 * - Multiple file format support (TXT, RTF, etc.)
 * - AI-powered CV parsing with entity extraction
 * - Cloud storage integration (Google Drive, Dropbox)
 */
type DataImportStepProps = {
  onImport: (data: any) => void;
  onNext: () => void;
  onSkip: () => void;
};

export function DataImportStep({ onImport, onNext, onSkip }: DataImportStepProps) {
  const { isAr, t } = useLocale();

  // LinkedIn import state
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [linkedInSuccess, setLinkedInSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // File upload state
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState(false);

  // LinkedIn export instructions (localized)
  const exportInstructions = {
    en: [
      "Go to LinkedIn Settings & Privacy",
      "Click 'Get a copy of your data'",
      "Select 'Want something in particular? Select the data files you're most interested in.'",
      "Check 'Profile' and 'Positions', then request archive",
      "Download and extract the ZIP file when LinkedIn emails it",
      "Upload the Profile.json file here"
    ],
    ar: [
      "انتقل إلى إعدادات LinkedIn والخصوصية",
      "انقر على 'احصل على نسخة من بياناتك'",
      "اختر 'هل تريد شيئًا معينًا؟ اختر ملفات البيانات التي تهتم بها أكثر.'",
      "حدد 'الملف الشخصي' و'المناصب'، ثم اطلب الأرشيف",
      "قم بتنزيل واستخراج ملف ZIP عندما ترسله LinkedIn عبر البريد الإلكتروني",
      "قم بتحميل ملف Profile.json هنا"
    ]
  };

  // Handle LinkedIn JSON file upload
  async function handleLinkedInFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setLinkedInError(
        t("Please upload a valid JSON file from LinkedIn Data Export.", "يرجى تحميل ملف JSON صالح من تصدير بيانات LinkedIn.")
      );
      return;
    }

    setLinkedInLoading(true);
    setLinkedInError(null);
    setLinkedInSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/linkedin/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t("Failed to import LinkedIn data.", "فشل استيراد بيانات LinkedIn."));
      }

      if (json.success && json.data) {
        onImport(json.data);
        setLinkedInSuccess(true);
      }
    } catch (error: any) {
      console.error("LinkedIn import error:", error);
      setLinkedInError(error.message || t("Failed to import LinkedIn data.", "فشل استيراد بيانات LinkedIn."));
    } finally {
      setLinkedInLoading(false);
    }
  }

  // Handle CV file upload (PDF, DOCX)
  async function handleCvFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/msword", // DOC
    ];
    const allowedExtensions = [".pdf", ".docx", ".doc"];

    const isValidType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValidType && !isValidExtension) {
      setFileError(
        t("Please upload a PDF or DOCX file.", "يرجى تحميل ملف PDF أو DOCX.")
      );
      return;
    }

    setFileLoading(true);
    setFileError(null);
    setFileSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cv_file");

      // TODO: Create API endpoint for CV file parsing
      const res = await fetch("/api/cv/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || t("Failed to import CV file.", "فشل استيراد ملف السيرة الذاتية."));
      }

      const json = await res.json();
      if (json.success && json.data) {
        onImport(json.data);
        setFileSuccess(true);
      }
    } catch (error: any) {
      console.error("CV file import error:", error);
      setFileError(
        error.message ||
          t(
            "Failed to parse CV file. Please try manual entry or use LinkedIn import.",
            "فشل تحليل ملف السيرة الذاتية. يرجى المحاولة يدويًا أو استخدام استيراد LinkedIn."
          )
      );
    } finally {
      setFileLoading(false);
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          {t("Import Your CV Data", "استيراد بيانات سيرتك الذاتية")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t(
            "Save time by importing your existing CV or LinkedIn profile. You can skip this step and enter data manually.",
            "وفر الوقت عن طريق استيراد سيرتك الذاتية الحالية أو ملف LinkedIn. يمكنك تخطي هذه الخطوة وإدخال البيانات يدويًا."
          )}
        </p>
      </div>

      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="linkedin" className={isAr ? "flex-row-reverse" : ""}>
            <Linkedin className={`h-4 w-4 ${isAr ? "ml-2" : "mr-2"}`} />
            {t("LinkedIn", "LinkedIn")}
          </TabsTrigger>
          <TabsTrigger value="file" className={isAr ? "flex-row-reverse" : ""}>
            <FileText className={`h-4 w-4 ${isAr ? "ml-2" : "mr-2"}`} />
            {t("CV File", "ملف السيرة")}
          </TabsTrigger>
        </TabsList>

        {/* LinkedIn Import Tab */}
        <TabsContent value="linkedin" className="space-y-4 mt-6">
          {/* LinkedIn JSON File Upload */}
          <div className="space-y-2">
            <Label>{t("Upload LinkedIn Data Export (JSON)", "تحميل تصدير بيانات LinkedIn (JSON)")}</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {t(
                  "Download your LinkedIn data export and upload the Profile.json file",
                  "قم بتنزيل تصدير بيانات LinkedIn وقم بتحميل ملف Profile.json"
                )}
              </p>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={handleLinkedInFile}
                disabled={linkedInLoading || linkedInSuccess}
                className="max-w-xs mx-auto"
              />
              <Button
                variant="link"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs mt-2"
              >
                {showInstructions 
                  ? t("Hide instructions", "إخفاء التعليمات")
                  : t("How to export LinkedIn data?", "كيفية تصدير بيانات LinkedIn؟")
                }
                <ExternalLink className={`h-3 w-3 ${isAr ? "mr-1" : "ml-1"}`} />
              </Button>
            </div>

            {/* Export Instructions */}
            {showInstructions && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-semibold">{t("How to export LinkedIn data:", "كيفية تصدير بيانات LinkedIn:")}</p>
                    <ol className={cn("space-y-2 text-sm", isAr ? "list-decimal list-inside mr-4" : "list-decimal list-inside ml-4")}>
                      {exportInstructions[isAr ? "ar" : "en"].map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                    <Button
                      variant="link"
                      asChild
                      className="text-xs p-0 h-auto"
                    >
                      <a
                        href="https://www.linkedin.com/help/linkedin/answer/a554590/download-your-linkedin-data"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        {t("Read more on LinkedIn Help", "اقرأ المزيد في مساعدة LinkedIn")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* LinkedIn Import Status */}
          {linkedInLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {t("Importing LinkedIn data...", "جارٍ استيراد بيانات LinkedIn...")}
              </AlertDescription>
            </Alert>
          )}

          {linkedInSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {t(
                  "LinkedIn data imported successfully! Click Continue to review and edit.",
                  "تم استيراد بيانات LinkedIn بنجاح! انقر على متابعة للمراجعة والتعديل."
                )}
              </AlertDescription>
            </Alert>
          )}

          {linkedInError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{linkedInError}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* CV File Upload Tab */}
        <TabsContent value="file" className="space-y-4 mt-6">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <h3 className="font-semibold mb-2">
              {t("Upload Your CV", "تحميل سيرتك الذاتية")}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {t(
                "Upload a PDF or DOCX file. We'll extract and map the information automatically.",
                "قم بتحميل ملف PDF أو DOCX. سنقوم باستخراج المعلومات وتحديدها تلقائيًا."
              )}
            </p>
            <Input
              type="file"
              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleCvFileUpload}
              disabled={fileLoading || fileSuccess}
              className="max-w-xs mx-auto"
            />
            <p className="text-xs text-zinc-500 mt-2">
              {t("Supported formats: PDF, DOCX, DOC", "الصيغ المدعومة: PDF، DOCX، DOC")}
            </p>
          </div>

          {/* File Import Status */}
          {fileLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {t("Processing CV file...", "جارٍ معالجة ملف السيرة الذاتية...")}
              </AlertDescription>
            </Alert>
          )}

          {fileSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {t(
                  "CV data extracted successfully! Click Continue to review and edit.",
                  "تم استخراج بيانات السيرة الذاتية بنجاح! انقر على متابعة للمراجعة والتعديل."
                )}
              </AlertDescription>
            </Alert>
          )}

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t(
                "Note: File parsing works best with well-structured CVs. Some information may need manual review.",
                "ملاحظة: يعمل تحليل الملف بشكل أفضل مع السير الذاتية منظمة جيدًا. قد تحتاج بعض المعلومات إلى مراجعة يدوية."
              )}
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className={`flex justify-between items-center pt-4 ${isAr ? "flex-row-reverse" : ""}`}>
        <Button variant="ghost" onClick={onSkip}>
          {t("Skip Import", "تخطي الاستيراد")}
        </Button>
        <Button
          onClick={onNext}
          className={`text-white ${isAr ? "mr-auto flex-row-reverse" : "ml-auto"}`}
          style={{ backgroundColor: "#0d47a1" }}
        >
          {isAr ? (
            <>← {t("Continue", "متابعة")}</>
          ) : (
            <>{t("Continue", "متابعة")} →</>
          )}
        </Button>
      </div>
    </div>
  );
}

