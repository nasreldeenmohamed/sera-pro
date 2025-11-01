#!/bin/bash

echo "🔨 Building Next.js application..."
npm run build

echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
