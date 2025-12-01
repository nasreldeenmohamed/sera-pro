# 🚨 CRITICAL: Pre-Launch Items (Do Before Ads)

## ⚠️ MUST DO BEFORE LAUNCHING ADS

### 1. Payment Mode Configuration ⚡ CRITICAL

**Action Required:**
- [ ] Verify `KASHIER_MODE=live` in Vercel Production environment
- [ ] Location: Vercel Dashboard → Settings → Environment Variables → Production
- [ ] Value must be exactly: `live` (lowercase, no quotes)

**How to Verify:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Filter by "Production" environment
5. Find `KASHIER_MODE` - should be `live`
6. If not set or wrong, update and **REDEPLOY**

---

### 2. Production API Keys ⚡ CRITICAL

**Required Variables in Vercel (Production):**
- [ ] `KASHIER_MERCHANT_ID` - Production merchant ID
- [ ] `KASHIER_SECRET_KEY` - Production secret key (for webhooks)
- [ ] `KASHIER_DEFAULT_API_KEY` - Production API key (for hash generation)

**How to Verify:**
1. Vercel Dashboard → Settings → Environment Variables
2. Filter by "Production"
3. Verify all 3 keys are present
4. Verify they are PRODUCTION keys (not test keys)
5. Keys should be long strings (100+ characters for secret/API keys)

**⚠️ IMPORTANT:** After updating keys, you MUST redeploy!

---

### 3. Test One Real Payment ⚡ CRITICAL

**Before launching ads, test with a REAL user account:**

1. **Create a NEW user account** (not the test user)
2. **Complete payment for smallest plan** (One-Time: 49 EGP)
3. **Verify:**
   - [ ] Payment is processed (check Kashier Dashboard)
   - [ ] Real money is charged (verify in bank/Kashier)
   - [ ] Transaction appears in Firestore
   - [ ] Subscription is activated
   - [ ] User can access paid features

**Test User Account (Uses Test Keys - No Real Charges):**
- User ID: `JgGmhphtIsVyGO2nTnQde9ZOaKD2`
- This account ALWAYS uses test keys (even in production)
- Safe for testing - no real charges

---

### 4. Analytics Tracking ⚡ CRITICAL

**Verify conversion tracking BEFORE launching ads:**

- [ ] **Google Analytics (GA4):**
  - Tracking ID: `G-CH35BN07M5` (or your custom ID)
  - Test: Complete a payment and check GA4 Real-Time reports
  - Verify "Purchase" event fires with correct value

- [ ] **Meta Pixel (Facebook):**
  - Pixel ID: `847265357880267` (or your custom ID)
  - Test: Use Facebook Pixel Helper Chrome extension
  - Complete a payment and verify "Purchase" event fires
  - Verify event includes value and currency

**Why Critical:** If tracking doesn't work, you won't be able to:
- Measure ad campaign ROI
- Optimize ad performance
- Track conversions
- Retarget customers

---

### 5. Webhook Endpoint ⚡ CRITICAL

**Verify webhook is accessible:**

- [ ] URL: `https://www.sera-pro.com/api/payments/kashier/webhook`
- [ ] Test: Open in browser (GET request) - should return 200 OK
- [ ] Verify signature validation is working
- [ ] Check Vercel function logs for webhook calls

**Why Critical:** Webhooks activate subscriptions after payment. If broken:
- Payments succeed but subscriptions don't activate
- Users pay but can't access features
- Manual intervention required

---

## ✅ Quick Verification Checklist

Run through these in order:

1. [ ] **Environment Variables:**
   - [ ] `KASHIER_MODE=live` in Vercel Production
   - [ ] All production keys are set
   - [ ] Redeployed after any changes

2. [ ] **Payment Flow:**
   - [ ] Test user account works (uses test keys)
   - [ ] Real user account works (uses production keys)
   - [ ] Payment processes successfully
   - [ ] Subscription activates after payment

3. [ ] **Analytics:**
   - [ ] GA4 events fire correctly
   - [ ] Meta Pixel events fire correctly
   - [ ] Conversion events include value/currency

4. [ ] **Webhook:**
   - [ ] Endpoint is accessible
   - [ ] Processes payments correctly
   - [ ] Activates subscriptions

5. [ ] **Error Handling:**
   - [ ] Payment failures handled gracefully
   - [ ] Error messages are user-friendly
   - [ ] Failed transactions are logged

---

## 🚨 Emergency Rollback

**If something goes wrong:**

1. **Stop Ads Immediately:**
   - Pause all ad campaigns
   - Prevent new users from signing up

2. **Revert Payment Mode:**
   - Set `KASHIER_MODE=test` in Vercel
   - Redeploy immediately
   - This prevents new payments (but existing ones still process)

3. **Check Transactions:**
   - Review Firestore transactions
   - Identify any failed activations
   - Manually activate subscriptions if needed

4. **Contact Support:**
   - Kashier support (for payment issues)
   - Vercel support (for deployment issues)
   - Firebase support (for database issues)

---

## 📞 Important Contacts

- **Kashier Support:** [Add contact info]
- **Vercel Support:** [Add contact info]
- **Firebase Support:** [Add contact info]

---

## 📝 Notes

**Test User Behavior:**
- The user with ID `JgGmhphtIsVyGO2nTnQde9ZOaKD2` will ALWAYS use test keys
- This is intentional - allows testing in production without real charges
- All other users use production keys when `KASHIER_MODE=live`

**Environment Variable Updates:**
- After updating environment variables in Vercel, you MUST redeploy
- Changes don't take effect until redeployment
- Always test after redeployment

**Payment Testing:**
- Always test with test user first
- Then test with real user account
- Verify real payment is processed before launching ads

---

**Last Updated:** 2025-01-XX  
**Status:** ⚠️ Review before launching ads

