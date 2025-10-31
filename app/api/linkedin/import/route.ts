import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInExport, mapLinkedInToCvData } from "@/lib/linkedin/parser";

/**
 * LinkedIn Import API Route
 * 
 * Handles LinkedIn data import via two methods:
 * 1. JSON file upload (from LinkedIn Data Export)
 * 2. URL parsing (attempts to extract public profile data - may be blocked by LinkedIn)
 * 
 * Since LinkedIn has strict anti-scraping measures, the primary method is JSON file import.
 * TODO(future): Integrate with official LinkedIn API if access is granted (requires OAuth)
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const linkedInUrl = formData.get("url") as string | null;
    const jsonFile = formData.get("file") as File | null;

    // Method 1: Process JSON file (LinkedIn Data Export)
    if (jsonFile) {
      const fileText = await jsonFile.text();
      let jsonData: any;
      
      try {
        jsonData = JSON.parse(fileText);
      } catch (parseError) {
        return NextResponse.json(
          { error: "Invalid JSON file. Please ensure you uploaded a valid LinkedIn export file." },
          { status: 400 }
        );
      }

      // Parse LinkedIn export data
      const linkedInData = parseLinkedInExport(jsonData);
      
      // Map to CV format
      const cvData = mapLinkedInToCvData(linkedInData);
      
      return NextResponse.json({
        success: true,
        data: cvData,
        source: "json_file",
        message: "LinkedIn data imported successfully from JSON file.",
      });
    }

    // Method 2: Attempt URL parsing (fallback - often blocked by LinkedIn)
    if (linkedInUrl) {
      // Validate LinkedIn URL format
      const linkedInUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedInUrlPattern.test(linkedInUrl)) {
        return NextResponse.json(
          { error: "Invalid LinkedIn profile URL. Please provide a valid LinkedIn profile link (e.g., https://www.linkedin.com/in/username)" },
          { status: 400 }
        );
      }

      // TODO(scraping): Implement server-side scraping if needed
      // Note: LinkedIn blocks most scraping attempts. For production, use:
      // - Official LinkedIn API (requires OAuth and approval)
      // - LinkedIn Data Export (JSON file upload - recommended and most reliable)
      // - Third-party services (if available and compliant)
      
      // For now, return helpful error with instructions
      return NextResponse.json(
        {
          error: "Direct URL import is not currently available due to LinkedIn's restrictions. Please use the JSON file upload method.",
          fallback: {
            instructions: "To import from LinkedIn using JSON export:",
            steps: [
              "1. Go to LinkedIn Settings & Privacy",
              "2. Click 'Get a copy of your data'",
              "3. Select 'Want something in particular? Select the data files you're most interested in.'",
              "4. Check 'Profile' and 'Positions', then request archive",
              "5. Download and extract the ZIP file when LinkedIn emails it",
              "6. Upload the Profile.json file here",
            ],
          },
        },
        { status: 501 } // Not Implemented
      );
    }

    return NextResponse.json(
      { error: "Please provide either a LinkedIn profile URL or upload a JSON file." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("LinkedIn import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import LinkedIn data" },
      { status: 500 }
    );
  }
}

