# Firebase Hosting Deployment Guide

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Ensure you're in the correct project:
   ```bash
   firebase use sera-pro
   ```

## Deployment Steps

### 1. Build the Next.js Application

```bash
npm run build
```

This will create the optimized production build in the `.next` directory.

### 2. Install Firebase Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### 3. Deploy to Firebase

Deploy everything (hosting + functions):
```bash
npm run deploy
```

Or deploy separately:
```bash
# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions
```

### 4. Verify Deployment

After deployment, Firebase will provide you with the hosting URL. You can also check:
- Firebase Console: https://console.firebase.google.com/project/sera-pro/hosting
- Your site URL should be: `https://sera-pro.web.app` or `https://sera-pro.firebaseapp.com`

## Environment Variables

Make sure to set environment variables in Firebase Functions:

```bash
firebase functions:config:set anthropic.api_key="YOUR_KEY"
firebase functions:config:set kashier.merchant_id="YOUR_ID"
firebase functions:config:set kashier.secret_key="YOUR_SECRET"
```

Or use `.env.production` and ensure it's loaded properly in your functions.

## Troubleshooting

1. **Function timeout**: If requests are timing out, increase the timeout in `functions/index.js`
2. **Memory issues**: Increase memory allocation in `functions/index.js` (currently 1GiB)
3. **Build errors**: Ensure all dependencies are properly installed and Next.js is configured correctly

## Notes

- The Next.js app runs as a Firebase Cloud Function
- Static assets are served from Firebase Hosting
- All routes are proxied through the Next.js server function
- Make sure your Firebase project has billing enabled if using Cloud Functions (Blaze plan)

