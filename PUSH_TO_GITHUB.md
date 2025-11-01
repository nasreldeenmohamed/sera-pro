# Push Code to GitHub - Authentication Required

## Option 1: Use GitHub Personal Access Token (Recommended)

### Step 1: Create Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `sera-pro-push`
4. Select scopes: ✅ **repo** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Push with Token

Run this command (replace `YOUR_TOKEN` with the token you just copied):

```bash
cd /Volumes/External/Companies/OptimizeWare/cv-builder

# Use token in URL (will prompt for password - paste the token)
git push https://YOUR_TOKEN@github.com/nasreldeenmohamed/sera-pro.git main

# OR set up credential helper (one-time setup)
git remote set-url github https://YOUR_TOKEN@github.com/nasreldeenmohamed/sera-pro.git
git push github main
```

### Step 3: Alternative - Use Git Credential Helper

For easier future pushes, configure credential helper:

```bash
# Store credentials (use your GitHub username and token as password)
git config --global credential.helper store

# Then push (will prompt once)
git push github main
# Username: nasreldeenmohamed
# Password: [paste your token]
```

## Option 2: Use GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
# Authenticate
gh auth login

# Push code
git push github main
```

## Verify Repository is Public

After pushing, verify:
1. Go to https://github.com/nasreldeenmohamed/sera-pro
2. Check the visibility badge - should say **"Public"**
3. If it says "Private", go to:
   - Settings → Scroll to bottom → "Change visibility" → Make public

