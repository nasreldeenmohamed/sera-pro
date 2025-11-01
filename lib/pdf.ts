"use client";
import { pdf, type DocumentProps } from "@react-pdf/renderer";

// Renders a React-PDF <Document /> into a Blob and triggers download
export async function downloadPdf(doc: React.ReactElement<DocumentProps>, filename: string) {
  const blob = await pdf(doc as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


