# QA Payment Bypass Feature

## Overview

This feature allows QA and manual testing to bypass the payment step when users click "Subscribe" for any paid plan. When enabled, clicking a purchase/subscribe button will directly update the user's subscription in Firestore as if payment was successful, without going through Kashier payment gateway.

## ⚠️ IMPORTANT: Production Safety

**This feature MUST be disabled or removed before production deployment.** It is only for development and QA testing purposes.

## How to Enable

1. Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS=true
```

2. Restart your Next.js development server if it's running.

## How It Works

When `NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS=true`:

1. **PurchaseButton Component** (`components/payments/PurchaseButtons.tsx`):
   - Detects QA mode on subscribe click
   - Directly calls `setUserPlanFromProduct()` to update subscription in Firestore
   - Sets plan, status: 'active', startDate, and expirationDate
   - Shows success message and refreshes page

2. **Pricing Page** (`app/pricing/page.tsx`):
   - Purchase buttons use `handlePurchase()` function
   - Same behavior: bypasses payment and directly activates plan

## Subscription Updates

When a plan is activated in QA mode:

- **one_time**: 
  - Plan: `one_time`
  - Status: `active`
  - Expiration: 7 days from now
  - No watermark on downloads

- **flex_pack**:
  - Plan: `flex_pack`
  - Status: `active`
  - Expiration: 6 months from now
  - Credits: 5 CV credits
  - No watermark on downloads

- **annual_pass**:
  - Plan: `annual_pass`
  - Status: `active`
  - Expiration: 1 year from now
  - No watermark on downloads
  - Unlimited CVs

## Testing Checklist

- [ ] Enable QA mode with environment variable
- [ ] Test one_time plan activation
- [ ] Test flex_pack plan activation
- [ ] Test annual_pass plan activation
- [ ] Verify subscription appears in Firestore `/userProfiles/{userId}/subscription`
- [ ] Verify expiration dates are set correctly
- [ ] Verify dashboard shows updated plan
- [ ] Verify no watermark on downloads for paid plans
- [ ] Verify AI enhancement is enabled for paid plans
- [ ] Verify multiple CVs allowed for higher-tier plans
- [ ] Disable QA mode and verify normal payment flow works

## Where This Feature Is Implemented

1. `components/payments/PurchaseButtons.tsx` - PurchaseButton component
2. `app/pricing/page.tsx` - Pricing page purchase handlers

## Removing for Production

To disable this feature:

1. Remove or set `NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS=false` in `.env.local`
2. Or remove the environment variable entirely
3. The code will automatically fall back to normal payment flow

## Code References

The QA bypass logic checks for:
```typescript
const ENABLE_QA_PAYMENT_BYPASS = process.env.NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS === "true";
```

If `true`, it bypasses payment and directly calls:
```typescript
await setUserPlanFromProduct(userId, product);
```

This function is in `firebase/firestore.ts` and handles:
- Setting plan type
- Setting status to 'active'
- Setting startDate to now
- Calculating and setting expirationDate based on plan type
- Setting creditsRemaining for flex_pack plans

