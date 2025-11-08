#!/bin/bash

echo "================================"
echo "Coffee Shop MongoDB Setup"
echo "================================"
echo ""

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo "Creating root .env file..."
    cp .env.example .env
fi

if [ ! -f packages/api-server/.env ]; then
    echo "Creating API server .env file..."
    cat > packages/api-server/.env << EOF
PORT=3001
MONGODB_URI=mongodb://localhost:27017/coffee-shop
NODE_ENV=development
EOF
fi

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Run: pnpm seed"
echo "3. Run: pnpm dev:all"
echo ""
echo "For MongoDB installation, see MONGODB_SETUP.md"
echo ""

