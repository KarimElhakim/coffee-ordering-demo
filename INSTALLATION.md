# Complete Installation Guide

Follow these steps to get the Coffee Shop system running with MongoDB.

## ✅ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js** v18 or higher ([Download](https://nodejs.org))
- [ ] **pnpm** package manager
- [ ] **MongoDB** Community Server ([Download](https://www.mongodb.com/try/download/community))
- [ ] **Git** (optional, for cloning)

### Installing pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version
# Should show: 8.x.x or higher
```

## 📥 Step 1: Get the Code

```bash
# If you already have the code, skip to Step 2
cd coffee-ordering-demo
```

## 🗄️ Step 2: Install MongoDB

### Windows

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (MongoDB-x.x.x-win-x64.msi)
3. Choose **Complete** installation
4. Check "Install MongoDB as a Service" ✅
5. Check "Install MongoDB Compass" ✅ (optional GUI tool)
6. Complete installation

**Verify MongoDB is running:**
```bash
mongosh
# You should see: "Connecting to: mongodb://127.0.0.1:27017"
# Type "exit" to quit
```

If MongoDB is not running:
```bash
net start MongoDB
```

### macOS

```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB as a service
brew services start mongodb-community

# Verify
mongosh
# Type "exit" to quit
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
# Type "exit" to quit
```

## ⚙️ Step 3: Configure Environment

### Option A: Automated Setup (Recommended)

**Windows:**
```bash
setup-mongodb.bat
```

**macOS/Linux:**
```bash
chmod +x setup-mongodb.sh
./setup-mongodb.sh
```

This will:
- Create `.env` files
- Install all dependencies
- Set up the project

### Option B: Manual Setup

1. **Create root `.env` file:**
   ```bash
   # Copy the example file
   # Windows:
   copy .env.example .env
   
   # macOS/Linux:
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_USE_DEMO_MODE=false
   ```

2. **Create API server `.env` file:**
   ```bash
   # Create the file manually or use echo
   # Windows:
   echo PORT=3001> packages\api-server\.env
   echo MONGODB_URI=mongodb://localhost:27017/coffee-shop>> packages\api-server\.env
   echo NODE_ENV=development>> packages\api-server\.env
   
   # macOS/Linux:
   cat > packages/api-server/.env << EOF
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/coffee-shop
   NODE_ENV=development
   EOF
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

## 🧪 Step 4: Test MongoDB Connection

```bash
cd packages/api-server
pnpm test:connection
```

**Expected output:**
```
🧪 Testing MongoDB connection...

✅ Successfully connected to MongoDB

🔍 Testing database queries...

   Stores: 0
   Menu Items: 0
   Stations: 0

⚠️  Database is empty. Run: pnpm seed

✨ All tests passed!
```

If you see errors, MongoDB is not running or not accessible. See troubleshooting below.

## 🌱 Step 5: Seed the Database

Populate the database with sample data:

```bash
cd ../..  # Back to root
pnpm seed
```

**Expected output:**
```
🌱 Starting database seed...

✅ Connected to MongoDB
🧹 Clearing existing data...
🏪 Creating store...
🪑 Creating tables...
🏭 Creating stations...
☕ Creating menu items...
🔧 Creating modifiers...

✅ Database seeded successfully!
   - Created 1 store
   - Created 12 tables
   - Created 3 stations
   - Created 17 menu items
   - Created 5 modifiers
```

Verify the data:
```bash
mongosh

use coffee-shop
db.menuitems.find().count()
# Should show: 17

exit
```

## 🚀 Step 6: Start the Application

### Start Everything (Recommended)

```bash
pnpm dev:all
```

This starts:
- ✅ API Server on http://localhost:3001
- ✅ Customer App on http://localhost:5173
- ✅ Cashier App on http://localhost:5174
- ✅ KDS App on http://localhost:5175
- ✅ Dashboard on http://localhost:5176

### Or Start Services Separately

**Terminal 1 - API Server:**
```bash
pnpm dev:api
```

Wait for:
```
✅ Connected to MongoDB
🚀 Coffee Shop API Server running on port 3001
📡 Socket.io server ready for real-time updates
```

**Terminal 2 - Frontend Apps:**
```bash
pnpm dev
```

## ✅ Step 7: Verify Everything Works

### Test 1: API Health Check

Open browser: http://localhost:3001/health

Should see:
```json
{
  "status": "ok",
  "message": "Coffee Shop API is running"
}
```

### Test 2: View Menu Items

Open browser: http://localhost:3001/api/menu-items?store_id=1

Should see JSON array with 17 menu items.

### Test 3: Customer App

1. Open: http://localhost:5173
2. Should see menu with coffee items
3. Add items to cart
4. Checkout
5. Use test payment

### Test 4: Cashier App

1. Open: http://localhost:5174
2. Should see the order you just created
3. Click "Mark as Paid"

### Test 5: KDS App

1. Open: http://localhost:5175
2. Should see kitchen ticket for your order
3. Click "Start Prep" → "Ready"

### Test 6: Real-time Updates

1. Open Customer app in one browser tab
2. Open KDS app in another tab
3. Create an order in Customer app
4. Watch it appear instantly in KDS app! ⚡

## 🎯 You're Done!

The system is now fully operational with MongoDB!

## 📚 What's Next?

- **Explore the API**: http://localhost:3001/api/*
- **View the database**: Use MongoDB Compass (GUI)
- **Read documentation**: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- **Deploy to production**: See deployment section in README_MONGODB.md

## 🐛 Troubleshooting

### Problem: MongoDB won't connect

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# If it fails to connect, start MongoDB:
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### Problem: Port 3001 already in use

**Solution:**
```bash
# Find and kill the process
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3001 | xargs kill -9
```

### Problem: "Cannot find module" errors

**Solution:**
```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

### Problem: Frontend shows "Loading..." forever

**Solutions:**
1. Check API server is running: http://localhost:3001/health
2. Verify `.env` has `VITE_USE_DEMO_MODE=false`
3. Check browser console for errors
4. Clear browser cache and restart

### Problem: No data in database

**Solution:**
```bash
# Re-run seed script
pnpm seed

# Verify
mongosh
use coffee-shop
db.menuitems.find().count()
exit
```

### Problem: API server crashes on startup

**Solutions:**
1. Check MongoDB is running: `mongosh`
2. Verify `packages/api-server/.env` exists and has correct `MONGODB_URI`
3. Check API server logs for specific error
4. Try: `cd packages/api-server && pnpm test:connection`

## 🔄 Switching to Demo Mode

If you want to run without MongoDB (for testing):

Edit `.env`:
```env
VITE_USE_DEMO_MODE=true
```

Then just run:
```bash
pnpm dev
```

No API server or MongoDB needed! Data stored in browser localStorage.

## 📞 Need More Help?

- **Quick Start Guide**: [QUICK_START_MONGODB.md](./QUICK_START_MONGODB.md)
- **Detailed Setup**: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- **Full Documentation**: [README_MONGODB.md](./README_MONGODB.md)

## 🎉 Success!

You now have a fully functional coffee shop ordering system with:
- ✅ Persistent MongoDB database
- ✅ Real-time Socket.io updates
- ✅ RESTful API
- ✅ Multiple client apps
- ✅ Inventory management
- ✅ Order tracking
- ✅ Payment processing

**Enjoy your MongoDB-powered coffee shop! ☕🍃**

