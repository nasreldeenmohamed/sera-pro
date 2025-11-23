# Kashier Iframe Payment UI Implementation

## Overview

This implementation uses Kashier's **Iframe Payment UI** method, which displays a payment popup/iframe on your website without redirecting users away.

## Implementation Details

### 1. Payment Flow

1. **User clicks "Buy"** → `PlanActionButton` or `PurchaseButtons`
2. **Checkout API** → Creates transaction → Generates hash → Returns iframe config
3. **Iframe Page** → Loads Kashier script with config → Displays payment iframe
4. **User completes payment** → Kashier processes payment
5. **Redirect** → Kashier redirects to success/failure URL
6. **Success Page** → Validates signature → Updates transaction → Activates subscription

### 2. Key Components

#### `payments/kashier.ts`
- Hash generation (HMAC SHA256)
- Signature validation
- Payment credentials management (test/live)
- Iframe configuration builder

#### `app/api/payments/kashier/checkout/route.ts`
- Creates pending transaction in Firestore
- Generates order hash
- Returns iframe configuration

#### `app/payments/iframe/page.tsx`
- Displays Kashier iframe using script tag
- Script automatically creates iframe when loaded

#### `app/payment-approved/[trxReferenceNumber]/page.tsx`
- Handles payment success redirect
- Validates signature
- Updates transaction
- Activates subscription

#### `app/api/payments/kashier/webhook/route.ts`
- Server-to-server payment notifications
- Validates signature
- Updates transaction
- Activates subscription

### 3. Hash Generation

According to Kashier documentation, the hash is generated using:
```
Path: /?payment={mid}.{orderId}.{amount}.{currency}{customerReference?}
Hash: HMAC SHA256(path, secretKey)
```

### 4. Signature Validation

After payment, Kashier redirects with a signature. Validate it using:
```
Query String: All params except signature and mode, joined as &key=value
Signature: HMAC SHA256(queryString, secretKey)
```

### 5. Environment Variables Required

```env
# Production
KASHIER_MERCHANT_ID=MID-XXX-XXX
KASHIER_SECRET_KEY=your-secret-key
KASHIER_MODE=live

# Test (for test user)
KASHIER_TEST_MERCHANT_ID=MID-XXX-XXX
KASHIER_TEST_SECRET_KEY=test-secret-key
```

### 6. Testing

1. Set test credentials in `.env.local`
2. Use test user ID: `JgGmhphtIsVyGO2nTnQde9ZOaKD2`
3. Click "Buy" on any plan
4. Complete test payment
5. Verify transaction is updated and subscription is activated

## Documentation Reference

- [Kashier Iframe Payment UI](https://developers.kashier.io/payment/payment-ui#i-frame)
- Hash format: `/?payment={mid}.{orderId}.{amount}.{currency}{customerReference?}`
- Script tag: `<script id="kashier-iFrame" src="https://payments.kashier.io/kashier-checkout.js" data-amount="..." ...>`

