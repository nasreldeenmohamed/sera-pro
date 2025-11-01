# GitHub Repository Setup for Vercel Deployment

## Step 1: Create GitHub Repository

1. Go to **https://github.com** and log in to your account
2. Click the **"+" icon** in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `sera-pro` (or your preferred name)
   - **Description**: "AI-powered Arabic-English CV builder with RTL support"
   - **Visibility**: Select **"Public"** ⚠️ (Required for free Vercel deployments)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Make sure you're in the project directory
cd /Volumes/External/Companies/OptimizeWare/cv-builder

# Add GitHub as a remote (replace YOUR_USERNAME with your GitHub username)
git remote add github https://github.com/YOUR_USERNAME/sera-pro.git

# Verify remotes (you should see both 'origin' for Bitbucket and 'github' for GitHub)
git remote -v

# Push to GitHub main branch
git push github main
```

## Step 3: Verify Repository is Public

1. Go to your GitHub repository page
2. Check the visibility badge - it should say **"Public"**
3. If it says "Private", go to Settings → Change visibility → Make public

## Step 4: Deploy to Vercel

Once your code is on GitHub:

1. Go to **https://vercel.com**
2. Sign in with your **GitHub account**
3. Click **"Add New Project"**
4. Select your `sera-pro` repository
5. Vercel will auto-detect Next.js
6. Add **Environment Variables** (from your `.env.local`):
   - `ANTHROPIC_API_KEY`
   - `KASHIER_MERCHANT_ID`
   - `KASHIER_SECRET_KEY`
   - `KASHIER_MODE=test`
   - All `NEXT_PUBLIC_FIREBASE_*` variables
7. Click **"Deploy"**

## Important Notes

- ✅ Repository **MUST** be **Public** for free Vercel plan
- ✅ All API routes are now restored and will work on Vercel
- ✅ Middleware is enabled and functional
- ✅ All features are ready for production

## Troubleshooting

If you get authentication errors:
```bash
# Use GitHub CLI or personal access token
git remote set-url github https://YOUR_TOKEN@github.com/YOUR_USERNAME/sera-pro.git
```

