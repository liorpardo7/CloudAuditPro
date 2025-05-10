#!/bin/bash

# Install dependencies for both frontend and backend
echo "Installing frontend dependencies..."
cd frontend && npm install

echo "Installing backend dependencies..."
cd ../backend && npm install

# Start both servers
echo "Starting servers..."
cd ../frontend && npm start & 
cd ../backend && npm run dev &

# Wait for both processes
wait 