# Debugging Payment Checkout Issue

## Problem
When clicking the Flex Pack plan button, the browser shows:
```
https://www.sera-pro.com/api/payments/kashier/checkout?product=flex_pack&userId=JgGmhphtIsVyGO2nTnQde9ZOaKD2
```

This is the API endpoint URL, not the Kashier payment page URL. The user should be redirected to:
```
https://checkouts.kashier.io/en/paymentpage?ppLink=PP-4039083603,test
```

## Root Cause
The API endpoint is returning a 503 error, which means the environment variable is either:
1. Missing
2. Still has the wrong format (includes `,test` suffix)
3. Not deployed yet (needs redeploy after updating)

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Click the Flex Pack button
4. Look for error messages - you should see:
   - `[PlanActionButton] Payment configuration error:` or
   - `[PurchaseButton] Payment configuration error:`
5. The error message will show the exact issue

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Click the Flex Pack button
4. Find the request to `/api/payments/kashier/checkout`
5. Click on it and check:
   - **Status**: Should be 200 (if working) or 503 (if error)
   - **Response**: Click "Response" tab to see the error message
   - Look for `details` field which will show the exact error

### Step 3: Verify Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** → **Environment Variables**

2. **Find the Variable**
   - Search for: `KASHIER_PPLINK_FLEXPACK_TEST`

3. **Verify the Value**
   - Should be: `PP-4039083603` (NO comma, NO ",test" suffix)
   - Should NOT be: `PP-4039083603,test` ❌

4. **Check All Environments**
   - Make sure the variable is set for:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

### Step 4: Redeploy After Fixing

**IMPORTANT**: After updating environment variables in Vercel, you MUST redeploy:

1. **Option A: Manual Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on the latest deployment
   - Click **Redeploy**

2. **Option B: Trigger New Deployment**
   - Make a small code change (add a comment)
   - Commit and push to trigger automatic deployment

### Step 5: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Functions** tab
5. Find `/api/payments/kashier/checkout`
6. Check the logs for error messages

You should see logs like:
```
[Checkout API] Failed to create Kashier checkout: Error: Invalid format for KASHIER_PPLINK_FLEXPACK_TEST...
```

## Expected Error Messages

With the improved error handling, you'll see one of these:

### Error 1: Missing Variable
```
Kashier test Payment Page Link for plan "flex_pack" is not configured. 
Add KASHIER_PPLINK_FLEXPACK_TEST to environment variables.
```

**Fix**: Add the variable in Vercel with value `PP-4039083603`

### Error 2: Wrong Format (includes comma)
```
Invalid format for KASHIER_PPLINK_FLEXPACK_TEST. 
Value should be just the Payment Page ID (e.g., "PP-4039083603"), not "PP-4039083603,test". 
The ",test" suffix is added automatically by the code.
```

**Fix**: Remove `,test` from the environment variable value

### Error 3: Invalid Format (doesn't start with PP-)
```
Invalid Payment Page Link format for KASHIER_PPLINK_FLEXPACK_TEST. 
Expected format: PP-XXXXX, but got "4039083603".
```

**Fix**: Make sure the value starts with `PP-`

## Quick Fix Checklist

- [ ] Environment variable `KASHIER_PPLINK_FLEXPACK_TEST` exists in Vercel
- [ ] Value is exactly `PP-4039083603` (no spaces, no comma, no suffix)
- [ ] Variable is enabled for Production, Preview, and Development
- [ ] Project has been redeployed after updating the variable
- [ ] Checked browser console for detailed error message
- [ ] Checked Vercel function logs for server-side errors

## Testing After Fix

1. Clear browser cache
2. Log in with test account: `nasreldeenmohamed@gmail.com`
3. Go to pricing page
4. Click "Get Flex Pack" button
5. Should redirect to: `https://checkouts.kashier.io/en/paymentpage?ppLink=PP-4039083603,test`

If it still doesn't work, check the browser console and Vercel logs for the exact error message.

