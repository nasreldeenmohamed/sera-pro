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

The GitHub remote is already configured. You need to authenticate first.

### Authentication Options:

**Option A: Personal Access Token (Recommended)**

1. Create a token at https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `sera-pro-push`
   - Select scope: ✅ **repo**
   - Click "Generate token" and **copy it immediately**

2. Push with token:
   ```bash
   cd /Volumes/External/Companies/OptimizeWare/cv-builder
   
   # Push using token in URL
   git push https://YOUR_TOKEN@github.com/nasreldeenmohamed/sera-pro.git main
   ```

**Option B: Interactive Authentication**

```bash
cd /Volumes/External/Companies/OptimizeWare/cv-builder

# This will prompt for credentials
git push github main
# Username: nasreldeenmohamed
# Password: [paste your Personal Access Token, NOT your GitHub password]
```

**Option C: GitHub CLI (if installed)**

```bash
gh auth login
git push github main
```

**Note:** If you get authentication errors, see `PUSH_TO_GITHUB.md` for detailed instructions.

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

