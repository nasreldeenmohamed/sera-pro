# Environment Variables for Vercel Deployment

## Quick Copy List

Copy these variable names and their **VALUES from your `.env.local` file** to Vercel:

---

## 1. Firebase Configuration (7 variables)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

**Source:** Firebase Console → Project Settings → General → Your apps → Web app config

---

## 2. Kashier Payment Gateway (3 variables)

```
KASHIER_MERCHANT_ID=
KASHIER_SECRET_KEY=
KASHIER_MODE=test
```

**Source:** Kashier Dashboard → Settings → API Keys

---

## 3. Anthropic AI / Claude (1 variable)

```
ANTHROPIC_API_KEY=
```

**Source:** Anthropic Console → API Keys → https://console.anthropic.com/

---

## Total: 11 Environment Variables

---

## Steps to Add in Vercel:

1. Open your project in Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. For each variable above:
   - Click **Add New**
   - **Key**: Variable name (e.g., `KASHIER_MERCHANT_ID`)
   - **Value**: Copy the VALUE from your `.env.local` file (the part after the `=`)
   - **Environment**: Select all three (Production, Preview, Development)
   - Click **Save**
4. After adding all variables, **Redeploy** your project

---

## Quick Reference Format

When copying from `.env.local`, the format is:
```
VARIABLE_NAME=actual_value_here
```

In Vercel:
- **Key**: `VARIABLE_NAME`
- **Value**: `actual_value_here` (everything after the `=`)

---

## Need Help Finding Values?

- Check your local `.env.local` file
- Or see `ENV_EXAMPLE.txt` for the template
- Or see `VERCEL_ENV_VARS.md` for detailed instructions

