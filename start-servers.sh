#!/bin/bash

echo "🧹 Performing comprehensive cleanup..."

# Kill any existing servers
echo "Stopping existing servers..."
pkill -f "next dev" || true
pkill -f "nodemon.*backend" || true
pkill -f "node.*backend" || true
sleep 2

# Clean Next.js build cache and artifacts
echo "Cleaning Next.js cache..."
rm -rf .next
rm -rf .swc
rm -rf out

# Clean node modules cache
echo "Cleaning npm cache..."
npm cache clean --force

# Clean backend build artifacts
echo "Cleaning backend artifacts..."
cd backend
rm -rf dist
rm -rf build
rm -rf node_modules/.cache
cd ..

# Clean Prisma generated client
echo "Cleaning Prisma client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf backend/node_modules/.prisma
rm -rf backend/node_modules/@prisma/client

# Install dependencies for root (frontend) and backend
echo "Installing root (frontend) dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Regenerate Prisma client from root (for frontend)
echo "Regenerating Prisma client for frontend..."
npx prisma generate

# Copy Prisma client to backend
echo "Copying Prisma client to backend..."
mkdir -p backend/node_modules/@prisma
mkdir -p backend/node_modules/.prisma
cp -r node_modules/@prisma/client backend/node_modules/@prisma/
cp -r node_modules/.prisma/client backend/node_modules/.prisma/

# Clear browser data instructions
echo "🌐 IMPORTANT: Clear your browser data!"
echo "   1. Open Chrome DevTools (F12)"
echo "   2. Right-click refresh button → 'Empty Cache and Hard Reload'"
echo "   3. Or go to Settings → Privacy → Clear browsing data"
echo "   4. Clear cookies for local.cloudauditpro.com:3000"
echo ""

# Start both servers
echo "🚀 Starting servers..."
npm run dev &
cd backend && npm run dev &

echo "✅ Servers starting... Check terminal output above for any errors."

# Wait for both processes
wait 