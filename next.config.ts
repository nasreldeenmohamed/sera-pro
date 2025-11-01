import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Firebase Hosting (free tier)
  // Note: API routes (/app/api/*) are not included in static export
  // They will need to be handled via Cloud Functions or external services
  output: "export",
  // Ensure images and assets are properly handled
  images: {
    unoptimized: true, // Firebase Hosting doesn't support Next.js image optimization
  },
  // Skip dynamic routes that can't be statically exported
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
