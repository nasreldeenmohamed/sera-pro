# Vercel Environment Variables Setup

## Required Environment Variables

Copy these variables from your `.env.local` file to Vercel:

### Firebase Configuration

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Where to find:** Firebase Console → Project Settings → General → Your apps → Web app config

---

### Kashier Payment Gateway

```
KASHIER_MERCHANT_ID=your_merchant_id
KASHIER_SECRET_KEY=your_secret_key
KASHIER_MODE=test
```

**Where to find:** 
- Kashier Dashboard → Settings → API Keys
- For testing: Use test credentials from Kashier dashboard
- For production: Use production credentials (after approval)

---

### Anthropic AI (Claude)

```
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

**Where to find:**
- Anthropic Console: https://console.anthropic.com/
- API Keys section
- Create a new key if needed

---

### Google Analytics (GA4)

```
NEXT_PUBLIC_GA_TRACKING_ID=G-CH35BN07M5
```

**Where to find:**
- Google Analytics Dashboard: https://analytics.google.com/
- Admin → Property Settings → Property ID
- Format: G-XXXXXXXXXX

---

### Meta Pixel (Facebook Pixel)

```
NEXT_PUBLIC_META_PIXEL_ID=847265357880267
```

**Where to find:**
- Meta Events Manager: https://business.facebook.com/events_manager/
- Select your Pixel → Settings → Pixel ID
- Format: 15-digit number (e.g., 847265357880267)

---

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `KASHIER_MERCHANT_ID`)
   - **Value**: The actual value from your `.env.local`
   - **Environment**: Select **Production**, **Preview**, and **Development** (or all three)
4. Click **Save**
5. **Redeploy** your project for changes to take effect

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git (already in `.gitignore`)
- These values are sensitive - keep them secure
- Vercel encrypts environment variables
- Use different keys for production vs testing
- Rotate keys if exposed

## Verification

After adding variables, verify in Vercel:
- Go to project → Settings → Environment Variables
- Confirm all variables are listed
- Check that production/preview/development are selected as needed

