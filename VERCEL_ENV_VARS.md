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

The payment system automatically selects test or production keys based on the authenticated user ID:
- **Test user** (JgGmhphtIsVyGO2nTnQde9ZOaKD2): Uses test/sandbox keys
- **All other users**: Uses production/live keys

#### Production Keys (Required)

```
KASHIER_MERCHANT_ID=your_production_merchant_id
KASHIER_SECRET_KEY=your_production_secret_key
KASHIER_MODE=live
```

**Where to find:** 
- Kashier Dashboard → Settings → API Keys → Production Keys
- Use production credentials for live transactions

#### Test/Sandbox Keys (Required for Testing)

```
KASHIER_TEST_MERCHANT_ID=your_test_merchant_id
KASHIER_TEST_SECRET_KEY=your_test_secret_key
```

**Where to find:**
- Kashier Dashboard → Settings → API Keys → Test/Sandbox Keys
- Use test credentials for sandbox testing (only used by test user account)

**Note:** The test user ID is hardcoded in `payments/kashier.ts` as `TEST_USER_ID`. To change it, update the constant in that file.

#### Payment Page Links (ppLink) - Required

Payment Page Links are used to generate secure payment URLs. Each subscription plan has its own ppLink for both production and test modes.

**Production Payment Page Links:**

```
KASHIER_PPLINK_ONETIME=PP-XXXXX
KASHIER_PPLINK_FLEXPACK=PP-XXXXX
KASHIER_PPLINK_ANNUALPASS=PP-XXXXX
```

**Test/Sandbox Payment Page Links:**

```
KASHIER_PPLINK_ONETIME_TEST=PP-XXXXX
KASHIER_PPLINK_FLEXPACK_TEST=PP-XXXXX
KASHIER_PPLINK_ANNUALPASS_TEST=PP-XXXXX
```

**Where to find:**
- Kashier Dashboard → Payment Pages → Create/View Payment Pages
- Each Payment Page has a unique ID (format: PP-XXXXX)
- Create separate Payment Pages for each subscription plan (one_time, flex_pack, annual_pass)
- Create separate test Payment Pages for each plan in sandbox/testing environment

**Payment Page Link Mapping:**
- `one_time` plan → Uses `KASHIER_PPLINK_ONETIME` (live) or `KASHIER_PPLINK_ONETIME_TEST` (test)
- `flex_pack` plan → Uses `KASHIER_PPLINK_FLEXPACK` (live) or `KASHIER_PPLINK_FLEXPACK_TEST` (test)
- `annual_pass` plan → Uses `KASHIER_PPLINK_ANNUALPASS` (live) or `KASHIER_PPLINK_ANNUALPASS_TEST` (test)

**Security Note:** These values are stored as environment variables and never exposed to the client/browser. Payment URLs are generated server-side only.

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

