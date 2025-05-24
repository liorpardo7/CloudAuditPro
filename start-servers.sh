#!/bin/bash

# Clean Next.js build cache
rm -rf .next

# Install dependencies for root (frontend) and backend

echo "Installing root (frontend) dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Start both servers
echo "Starting servers..."
npm run dev &
cd backend && npm run dev &

# Wait for both processes
wait 