import type { NextConfig } from "next";

/**
 * Next.js Configuration for Sera Pro - سيرة برو
 * 
 * DEPLOYMENT OPTIONS:
 * - Vercel (RECOMMENDED): Full Next.js support with API routes, server components, middleware
 *   - No "output: export" needed
 *   - API routes work automatically
 *   - Middleware works
 *   - Image optimization enabled
 * 
 * - Firebase Hosting (Free Tier): Static export only
 *   - Requires "output: export"
 *   - API routes won't work (need Cloud Functions)
 *   - No middleware support
 * 
 * CURRENT SETUP: Configured for Vercel deployment
 * - API routes are enabled
 * - Middleware is enabled
 * - Images can be optimized (set unoptimized: false for production)
 */
const nextConfig: NextConfig = {
  // Note: Vercel supports full Next.js features, no static export needed
  // Remove the line below if deploying to Firebase Hosting (free tier)
  // output: "export", // Only needed for Firebase Hosting static export
  
  // Image optimization
  images: {
    unoptimized: false, // Enable Next.js image optimization for Vercel
  },
};

export default nextConfig;
