# 🚀 Pre-Launch Production Checklist

**Date:** _______________  
**Prepared by:** _______________  
**Status:** ⚠️ **CRITICAL** - Review all items before launching ad campaigns

---

## ⚠️ CRITICAL: Payment Gateway Configuration

### Kashier Payment Integration

- [ ] **KASHIER_MODE** is set to `"live"` in Vercel environment variables
  - [ ] Verified in Vercel Dashboard → Settings → Environment Variables
  - [ ] Confirmed for **Production** environment (not just Preview/Development)
  - [ ] Value is exactly `live` (lowercase, no quotes, no spaces)

- [ ] **Production API Keys** are configured in Vercel:
  - [ ] `KASHIER_MERCHANT_ID` - Production merchant ID
  - [ ] `KASHIER_SECRET_KEY` - Production secret key (for webhook validation)
  - [ ] `KASHIER_DEFAULT_API_KEY` - Production API key (for hash generation)
  - [ ] All keys are **Production** keys (not test keys)
  - [ ] Keys are trimmed (no leading/trailing whitespace)

- [ ] **Test API Keys** are still configured (for test user account):
  - [ ] `KASHIER_TEST_SECRET_KEY` - Test secret key
  - [ ] `KASHIER_DEFAULT_API_TEST_KEY` - Test API key
  - [ ] Test user ID: `JgGmhphtIsVyGO2nTnQde9ZOaKD2` will still use test keys

- [ ] **Payment Mode Logic Verified:**
  - [ ] Test user (`JgGmhphtIsVyGO2nTnQde9ZOaKD2`) → Uses test keys (for testing)
  - [ ] All other users → Uses production keys (from `KASHIER_MODE=live`)
  - [ ] Logic in `payments/kashier.ts` → `getPaymentMode()` function

- [ ] **Webhook Endpoint** is accessible:
  - [ ] URL: `https://www.sera-pro.com/api/payments/kashier/webhook`
  - [ ] Tested with GET request (should return 200 OK)
  - [ ] Webhook URL is configured in Kashier Dashboard (if required)
  - [ ] Signature validation is working (webhook validates signatures)

- [ ] **Hash Generation** uses correct API keys:
  - [ ] Production hash uses `KASHIER_DEFAULT_API_KEY` (not secret key)
  - [ ] Test hash uses `KASHIER_DEFAULT_API_TEST_KEY` (not secret key)
  - [ ] Amount format is `.toFixed(2)` (e.g., "149.00")

---

## 🔐 Security & Environment Variables

### Required Environment Variables in Vercel

- [ ] **Firebase Configuration (7 variables):**
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

- [ ] **Kashier Payment Gateway (5 variables):**
  - [ ] `KASHIER_MERCHANT_ID` (production)
  - [ ] `KASHIER_SECRET_KEY` (production)
  - [ ] `KASHIER_DEFAULT_API_KEY` (production)
  - [ ] `KASHIER_TEST_SECRET_KEY` (test - for test user)
  - [ ] `KASHIER_DEFAULT_API_TEST_KEY` (test - for test user)
  - [ ] `KASHIER_MODE=live` (production mode)

- [ ] **Anthropic AI (1 variable):**
  - [ ] `ANTHROPIC_API_KEY` - For CV enhancement features

- [ ] **Analytics & Tracking (2 variables):**
  - [ ] `NEXT_PUBLIC_GA_TRACKING_ID` - Google Analytics (GA4)
  - [ ] `NEXT_PUBLIC_META_PIXEL_ID` - Meta Pixel (Facebook)

- [ ] **Verification:**
  - [ ] All variables are set for **Production** environment in Vercel
  - [ ] No test/development values in production variables
  - [ ] No sensitive keys committed to Git (check `.gitignore`)

---

## 🚫 Security: Remove Test/Development Code

- [ ] **QA Payment Bypass is DISABLED:**
  - [ ] `NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS` is **NOT** set in Vercel
  - [ ] Code in `components/payments/PurchaseButtons.tsx` shows bypass is commented out
  - [ ] Code in `components/payments/PlanActionButton.tsx` shows bypass is commented out

- [ ] **Development-Only Endpoints:**
  - [ ] `/api/payments/kashier/verify-hash` - Only available in development (has `NODE_ENV === "production"` check)
  - [ ] Verify it returns 403 in production

- [ ] **Console Logging:**
  - [ ] Review: Excessive `console.log` statements should be removed or minimized in production
  - [ ] Sensitive data (keys, tokens) are NOT logged
  - [ ] Logging is appropriate for production debugging

- [ ] **No Hardcoded Test Values:**
  - [ ] No hardcoded test user IDs (except `TEST_USER_ID` constant which is intentional)
  - [ ] No hardcoded test amounts or prices
  - [ ] All configuration comes from environment variables

---

## 💳 Payment Flow Testing

### End-to-End Payment Testing

- [ ] **Test User Account (Uses Test Keys):**
  - [ ] User ID: `JgGmhphtIsVyGO2nTnQde9ZOaKD2`
  - [ ] Can complete payment flow with test keys
  - [ ] Transaction is created in Firestore
  - [ ] Subscription is activated after successful payment
  - [ ] Test payment does NOT charge real money

- [ ] **Production User Account (Uses Live Keys):**
  - [ ] Create a NEW user account (not test user)
  - [ ] Complete payment flow for **One-Time Plan** (49 EGP)
  - [ ] Complete payment flow for **Flex Pack** (149 EGP)
  - [ ] Complete payment flow for **Annual Pass** (299 EGP)
  - [ ] Verify real payment is processed (check Kashier Dashboard)
  - [ ] Verify transaction appears in Firestore
  - [ ] Verify subscription is activated correctly
  - [ ] Verify user can access paid features

- [ ] **Payment Failure Scenarios:**
  - [ ] User cancels payment → Redirects to failure page
  - [ ] Payment fails → Transaction status updated to "3" (failed)
  - [ ] Error messages are user-friendly (Arabic/English)

- [ ] **Payment Success Scenarios:**
  - [ ] Payment success → Redirects to success page
  - [ ] Transaction status updated to "2" (success)
  - [ ] Subscription activated immediately
  - [ ] User receives confirmation

- [ ] **Webhook Testing:**
  - [ ] Webhook receives payment notifications from Kashier
  - [ ] Webhook validates signatures correctly
  - [ ] Webhook updates transaction status
  - [ ] Webhook activates subscription
  - [ ] Webhook handles duplicate notifications (idempotency)

---

## 🗄️ Database & Firestore

### Firestore Configuration

- [ ] **Collections Structure:**
  - [ ] `/userProfiles/{userId}` - User profiles exist
  - [ ] `/transactions/{transactionId}` - Transaction records
  - [ ] `/cvs/{cvId}` - CV documents (if applicable)

- [ ] **Firestore Security Rules:**
  - [ ] Rules are configured and tested
  - [ ] Users can only access their own data
  - [ ] Payment transactions are protected
  - [ ] No public read/write access to sensitive collections

- [ ] **Firestore Indexes:**
  - [ ] Composite indexes created if needed (for queries)
  - [ ] Check Firestore Console for any missing index warnings

- [ ] **Transaction Tracking:**
  - [ ] Transactions are created with correct status ("1" = pending)
  - [ ] Transactions are updated after payment ("2" = success, "3" = failed)
  - [ ] Transaction history is maintained in user profile

- [ ] **Subscription Activation:**
  - [ ] `activateSubscriptionFromTransaction()` function works correctly
  - [ ] Subscription history is updated
  - [ ] Credits are added for flex_pack plan
  - [ ] Expiration dates are set correctly

---

## 📊 Analytics & Tracking

### Marketing Campaign Tracking

- [ ] **Google Analytics (GA4):**
  - [ ] Tracking ID: `G-CH35BN07M5` (or custom value)
  - [ ] GA4 script loads on all pages
  - [ ] PageView events are tracked
  - [ ] Conversion events are configured:
    - [ ] Purchase/Subscription events
    - [ ] Payment completion events
    - [ ] Plan selection events

- [ ] **Meta Pixel (Facebook Pixel):**
  - [ ] Pixel ID: `847265357880267` (or custom value)
  - [ ] Pixel script loads on all pages
  - [ ] PageView events are tracked
  - [ ] Conversion events are configured:
    - [ ] Purchase events (with value and currency)
    - [ ] Lead events (sign-ups)
    - [ ] AddToCart events (plan selection)

- [ ] **Event Tracking:**
  - [ ] Payment completion events fire correctly
  - [ ] Event parameters include:
    - [ ] Transaction value
    - [ ] Currency (EGP)
    - [ ] Plan type
    - [ ] User ID (hashed/anonymized if required)

- [ ] **Testing:**
  - [ ] Use Facebook Pixel Helper Chrome extension
  - [ ] Use Google Tag Assistant
  - [ ] Verify events appear in GA4 Real-Time reports
  - [ ] Verify events appear in Meta Events Manager

---

## 🧪 Functionality Testing

### Core Features

- [ ] **User Authentication:**
  - [ ] Sign up with email/password
  - [ ] Sign in with email/password
  - [ ] Sign in with Google
  - [ ] Password reset flow
  - [ ] Session persistence

- [ ] **CV Builder:**
  - [ ] Create new CV
  - [ ] Edit CV content
  - [ ] Save CV
  - [ ] Download CV as PDF
  - [ ] Template selection
  - [ ] Language switching (Arabic/English)

- [ ] **Subscription Plans:**
  - [ ] Free plan features work
  - [ ] One-Time plan (49 EGP) - 1 CV, 7 days
  - [ ] Flex Pack (149 EGP) - 5 CVs, 6 months
  - [ ] Annual Pass (299 EGP) - Unlimited CVs, 1 year
  - [ ] Plan features are correctly restricted/enabled

- [ ] **Payment Integration:**
  - [ ] Payment buttons work on pricing page
  - [ ] Payment buttons work on dashboard
  - [ ] Payment iframe loads correctly
  - [ ] Payment redirects work (success/failure)
  - [ ] Payment webhooks process correctly

- [ ] **Error Handling:**
  - [ ] Network errors are handled gracefully
  - [ ] Payment errors show user-friendly messages
  - [ ] 404 pages work correctly
  - [ ] 500 errors are logged and handled

---

## 🌐 SEO & Performance

### SEO Configuration

- [ ] **Meta Tags:**
  - [ ] Title tags are set for all pages
  - [ ] Meta descriptions are set
  - [ ] Open Graph tags (for social sharing)
  - [ ] Twitter Card tags
  - [ ] Canonical URLs

- [ ] **RTL Support:**
  - [ ] Arabic pages use `dir="rtl"`
  - [ ] English pages use `dir="ltr"`
  - [ ] Language switching works correctly
  - [ ] Text alignment is correct for both languages

- [ ] **Performance:**
  - [ ] Page load times are acceptable (< 3 seconds)
  - [ ] Images are optimized
  - [ ] Scripts are loaded efficiently
  - [ ] No console errors in production

- [ ] **Mobile Responsiveness:**
  - [ ] Site works on mobile devices
  - [ ] Payment flow works on mobile
  - [ ] CV builder is usable on mobile

---

## 📄 Legal & Compliance

### Required Pages

- [ ] **Privacy Policy:**
  - [ ] Page exists: `/legal/privacy`
  - [ ] Content is complete and accurate
  - [ ] Mentions data collection (analytics, payments)
  - [ ] Mentions third-party services (Kashier, Firebase, etc.)

- [ ] **Terms of Service:**
  - [ ] Page exists: `/legal/terms`
  - [ ] Content is complete and accurate
  - [ ] Mentions refund policy
  - [ ] Mentions subscription terms

- [ ] **Payment Terms:**
  - [ ] Clear pricing information
  - [ ] Refund policy (if applicable)
  - [ ] Currency (EGP)
  - [ ] Payment method (Kashier)

- [ ] **GDPR/Privacy Compliance:**
  - [ ] Cookie consent (if required)
  - [ ] Data processing consent
  - [ ] User data deletion process

---

## 🔍 Monitoring & Logging

### Production Monitoring

- [ ] **Error Logging:**
  - [ ] Vercel function logs are accessible
  - [ ] Errors are logged with context
  - [ ] Critical errors trigger alerts (if configured)

- [ ] **Transaction Monitoring:**
  - [ ] Firestore transactions can be queried
  - [ ] Failed transactions are identifiable
  - [ ] Payment status can be checked

- [ ] **Performance Monitoring:**
  - [ ] Vercel Analytics enabled (if available)
  - [ ] Page load times monitored
  - [ ] API response times monitored

- [ ] **Uptime Monitoring:**
  - [ ] Site uptime monitoring configured (optional)
  - [ ] Payment endpoint health checks

---

## 🚨 Rollback Plan

### Emergency Procedures

- [ ] **Rollback Strategy:**
  - [ ] Previous deployment can be restored in Vercel
  - [ ] Database backup process (if applicable)
  - [ ] Environment variables can be reverted

- [ ] **Payment Gateway Rollback:**
  - [ ] Can switch `KASHIER_MODE` back to `"test"` if needed
  - [ ] Test user account can still test payments
  - [ ] Production payments can be paused if needed

- [ ] **Emergency Contacts:**
  - [ ] Kashier support contact
  - [ ] Vercel support contact
  - [ ] Firebase support contact

---

## ✅ Final Verification

### Pre-Launch Sign-Off

- [ ] **All Critical Items Checked:**
  - [ ] Payment gateway is in "live" mode
  - [ ] All environment variables are set
  - [ ] Payment flow tested end-to-end
  - [ ] Analytics tracking verified
  - [ ] Security checks passed
  - [ ] Legal pages are complete

- [ ] **Test Transaction:**
  - [ ] Complete ONE real payment transaction (smallest plan)
  - [ ] Verify payment is processed correctly
  - [ ] Verify subscription is activated
  - [ ] Verify analytics events fire
  - [ ] Verify transaction appears in Firestore

- [ ] **Documentation:**
  - [ ] All team members know how to check payment status
  - [ ] All team members know how to access logs
  - [ ] All team members know emergency procedures

---

## 📝 Notes & Issues

**Issues Found:**
- 

**Actions Taken:**
- 

**Additional Notes:**
- 

---

## ✍️ Sign-Off

**Reviewed by:** _______________  
**Date:** _______________  
**Status:** ☐ Ready for Launch  ☐ Needs Review  ☐ Blocked

---

## 🎯 Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor payment transactions hourly
- [ ] Check for error logs every 2 hours
- [ ] Verify analytics events are firing
- [ ] Monitor user sign-ups and conversions
- [ ] Check payment success rate
- [ ] Monitor webhook processing
- [ ] Check subscription activations

---

**⚠️ IMPORTANT REMINDERS:**

1. **Test User Account:** The user with ID `JgGmhphtIsVyGO2nTnQde9ZOaKD2` will ALWAYS use test keys, even in production. This is intentional for testing purposes.

2. **KASHIER_MODE:** Must be set to `"live"` (lowercase, no quotes) for production. All users except the test user will use production keys.

3. **Environment Variables:** After updating environment variables in Vercel, you MUST redeploy for changes to take effect.

4. **Payment Testing:** Always test with the test user account first, then test with a real production account before launching ads.

5. **Analytics:** Verify conversion tracking is working BEFORE launching ad campaigns to ensure proper attribution.

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0

