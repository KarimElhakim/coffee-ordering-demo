# Quick Start Guide - MongoDB Version

Get the coffee shop app running with MongoDB in 5 minutes!

## Prerequisites

Make sure you have installed:
- ✅ **Node.js** (v18+): https://nodejs.org
- ✅ **pnpm**: `npm install -g pnpm`
- ✅ **MongoDB**: See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for installation

## Quick Setup (5 Minutes)

### Step 1: Check MongoDB is Running

```bash
# Test MongoDB connection
mongosh

# You should see: "Current Mongosh Log ID: ..."
# Type "exit" to quit
```

If MongoDB is not running:
- **Windows**: `net start MongoDB`
- **macOS**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### Step 2: Setup Project

**Windows:**
```bash
setup-mongodb.bat
```

**macOS/Linux:**
```bash
chmod +x setup-mongodb.sh
./setup-mongodb.sh
```

### Step 3: Seed Database

```bash
pnpm seed
```

This creates sample data: menu items, stations, modifiers.

### Step 4: Start Everything

```bash
pnpm dev:all
```

This starts:
- 🔧 API Server: http://localhost:3001
- 🛒 Customer App: http://localhost:5173
- 💰 Cashier App: http://localhost:5174
- 🍳 KDS App: http://localhost:5175
- 📊 Dashboard: http://localhost:5176

## Test the System

1. **Customer App** (http://localhost:5173)
   - Browse menu
   - Add items to cart
   - Checkout (use test payment)

2. **Cashier App** (http://localhost:5174)
   - View all orders
   - Process payments (cash/card)

3. **KDS App** (http://localhost:5175)
   - View kitchen tickets
   - Update order status (prep → ready)

4. **Dashboard** (http://localhost:5176)
   - View order statistics
   - Monitor real-time activity

## How to Verify It's Working

### Check API Server
Visit: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "message": "Coffee Shop API is running"
}
```

### Check Database
```bash
mongosh

use coffee-shop
db.menuitems.find().count()
# Should return 17 (menu items)

db.orders.find().pretty()
# Shows all orders
```

### Real-time Updates
1. Open Customer app in one browser tab
2. Open KDS app in another tab
3. Create an order in Customer app
4. Watch it appear instantly in KDS app! ⚡

## Switching to Demo Mode (No MongoDB)

If you want to run without MongoDB (uses localStorage):

Edit `.env`:
```env
VITE_USE_DEMO_MODE=true
```

Then just run:
```bash
pnpm dev
```

No API server or MongoDB needed!

## Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
mongosh

# If it fails, start MongoDB:
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### "Port 3001 already in use"
```bash
# Kill the process using port 3001
# Windows: 
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3001 | xargs kill -9
```

### "API not responding"
1. Check API server is running: http://localhost:3001/health
2. Check MongoDB is running: `mongosh`
3. Restart API server: `pnpm dev:api`

### Frontend shows "Loading..."
1. Check browser console for errors
2. Verify `.env` has `VITE_USE_DEMO_MODE=false`
3. Restart frontend: `pnpm dev`

## What's Different from Supabase Version?

| Feature | Supabase | MongoDB |
|---------|----------|---------|
| Database | PostgreSQL (cloud) | MongoDB (local/cloud) |
| API | Supabase SDK | Express REST API |
| Real-time | Supabase Realtime | Socket.io |
| Auth | Required API keys | No keys needed |
| Data Storage | Always persistent | Persistent + demo mode |
| Cost | Free tier limits | Free for local |

## Next Steps

- 📖 Read [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed docs
- 🔧 Explore API endpoints at http://localhost:3001/api/*
- 🗄️ Browse data with MongoDB Compass
- 🚀 Deploy to production (see MONGODB_SETUP.md)

## Need Help?

1. Review [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup
2. Check MongoDB logs for connection issues
3. Verify all environment variables are set correctly

---

**Enjoy your MongoDB-powered coffee shop! ☕🍃**

