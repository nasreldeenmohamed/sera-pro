"use client";
import { pdf } from "@react-pdf/renderer";

// Renders a React-PDF <Document /> into a Blob and triggers download
export async function downloadPdf(doc: React.ReactElement, filename: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


