# Vercel Deployment Guide

## Quick Start

1. **Create GitHub Repository** (if not already done):
   - Go to https://github.com and log in
   - Click "New Repository"
   - Name: `sera-pro` (or your preferred name)
   - Select **"Public"** (required for free Vercel deployments)
   - Add description: "AI-powered Arabic-English CV builder with RTL support"
   - Click "Create Repository"

2. **Push Code to GitHub**:
   ```bash
   # Add GitHub remote (replace YourUsername with your GitHub username)
   git remote add github https://github.com/YourUsername/sera-pro.git
   
   # Push to GitHub
   git push github main
   ```

3. **Deploy on Vercel**:
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your `sera-pro` repository
   - Vercel will auto-detect Next.js
   - Add environment variables:
     - `ANTHROPIC_API_KEY` (for AI features)
     - `KASHIER_MERCHANT_ID` (for payments)
     - `KASHIER_SECRET_KEY` (for payments)
     - `KASHIER_MODE=test` (or `production`)
     - Firebase config variables (NEXT_PUBLIC_FIREBASE_*)
   - Click "Deploy"

## Environment Variables

Copy your `.env.local` variables to Vercel:
- Go to Project Settings → Environment Variables
- Add each variable from `ENV_EXAMPLE.txt`

## Features Enabled

With Vercel deployment:
- ✅ API routes work (`/api/*`)
- ✅ Middleware works (locale detection)
- ✅ Server Components work
- ✅ Image optimization enabled
- ✅ All features fully functional

## Custom Domain

After deployment, you can add a custom domain in Vercel:
- Project Settings → Domains
- Add `sera-pro.web.app` or your custom domain

