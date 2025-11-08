#!/bin/bash

echo "================================"
echo "MongoDB Atlas Setup with Chrome"
echo "================================"
echo ""
echo "This will:"
echo "1. Open Chrome browser"
echo "2. Navigate to MongoDB Atlas"
echo "3. Let you log in"
echo "4. Automatically get your connection string"
echo "5. Save it to .env"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "Installing Playwright browsers..."
pnpm exec playwright install chromium

echo ""
echo "================================"
echo "Opening Chrome for authentication..."
echo "================================"
echo ""
echo "INSTRUCTIONS:"
echo "1. A Chrome window will open"
echo "2. Log in to MongoDB Atlas with your credentials"
echo "3. The script will then automatically:"
echo "   - Find your cluster"
echo "   - Get the connection string"
echo "   - Save configuration"
echo ""
echo "Please DO NOT close the terminal!"
echo ""

node automate-atlas-connection.js

echo ""
echo "================================"
echo "Setup complete!"
echo ""

