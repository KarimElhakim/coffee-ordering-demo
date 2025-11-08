# 🎉 Welcome to Your MongoDB-Powered Coffee Shop!

Your coffee shop ordering system has been **successfully migrated from Supabase to MongoDB**!

## 🚀 Quick Start (Choose One Path)

### Path 1: Automated Setup (Easiest) ⭐

**Windows:**
```bash
setup-mongodb.bat
pnpm seed
pnpm dev:all
```

**macOS/Linux:**
```bash
chmod +x setup-mongodb.sh
./setup-mongodb.sh
pnpm seed
pnpm dev:all
```

### Path 2: Manual Setup

See: **[INSTALLATION.md](./INSTALLATION.md)** for complete step-by-step instructions.

### Path 3: Quick Demo (No MongoDB)

Want to try it without installing MongoDB?

1. Edit `.env`: Set `VITE_USE_DEMO_MODE=true`
2. Run: `pnpm dev`
3. Open: http://localhost:5173

(Data stored in browser localStorage)

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[INSTALLATION.md](./INSTALLATION.md)** | Complete installation guide with troubleshooting |
| **[QUICK_START_MONGODB.md](./QUICK_START_MONGODB.md)** | Get running in 5 minutes |
| **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** | Detailed MongoDB setup and features |
| **[README_MONGODB.md](./README_MONGODB.md)** | Full technical documentation |
| **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** | What changed from Supabase |

## 🏗️ What You Got

### New Backend API Server
Location: `packages/api-server/`

- ✅ Express.js server with RESTful API
- ✅ MongoDB via Mongoose ODM
- ✅ Socket.io for real-time updates
- ✅ 10 database models
- ✅ 7 API route handlers
- ✅ Automatic inventory management
- ✅ Sequential order numbering
- ✅ Full payment processing

### Updated API Client
Location: `packages/api-client/`

- ✅ MongoDB API client (`mongo-client.ts`)
- ✅ Dual mode support (MongoDB + Demo)
- ✅ Socket.io integration
- ✅ Compatible with all existing apps
- ✅ No breaking changes to frontend

### Database Features

**Collections:**
- `stores` - Coffee shop info
- `stations` - Kitchen stations (Bar, Hot, Cold)
- `menuitems` - Menu with inventory tracking
- `modifiers` - Size, milk, shots, syrups
- `orders` - Customer orders
- `orderitems` - Order line items
- `orderitemoptions` - Selected modifiers
- `kdstickets` - Kitchen display tickets
- `payments` - Payment records
- `tables` - Restaurant tables

**Automatic Features:**
- 🔢 Order numbers (ORD-000001, ORD-000002, ...)
- 📦 Inventory deduction on order
- ⏰ Timestamp tracking (created, updated, paid, etc.)
- 💰 Tax calculation (14% VAT)
- 🧾 Receipt number generation

### Real-time Events

Via Socket.io WebSockets:
- `order:created` - New order placed
- `order:updated` - Status changed
- `payment:created` - Payment processed
- `kds_ticket:created` - New kitchen ticket
- `kds_ticket:updated` - Ticket status changed

## 🔧 Prerequisites

Before you start, install:

1. **Node.js** v18+ ([nodejs.org](https://nodejs.org))
2. **pnpm**: `npm install -g pnpm`
3. **MongoDB** ([Installation Guide](./MONGODB_SETUP.md))

## ✅ Verify Installation

### 1. Check MongoDB
```bash
mongosh
# Should connect successfully
# Type "exit" to quit
```

### 2. Test API Connection
```bash
cd packages/api-server
pnpm test:connection
```

### 3. Seed Database
```bash
cd ../..
pnpm seed
```

Expected: 1 store, 17 menu items, 3 stations, 5 modifiers

### 4. Start Everything
```bash
pnpm dev:all
```

### 5. Test It!

- **API Health**: http://localhost:3001/health
- **Customer App**: http://localhost:5173
- **Cashier App**: http://localhost:5174
- **KDS App**: http://localhost:5175
- **Dashboard**: http://localhost:5176

## 🎯 Development Commands

```bash
# Start API server only
pnpm dev:api

# Start frontend apps only
pnpm dev

# Start everything together
pnpm dev:all

# Seed database with sample data
pnpm seed

# Test MongoDB connection
cd packages/api-server
pnpm test:connection
```

## 🌐 Application URLs

Once running:

| App | URL | Purpose |
|-----|-----|---------|
| **API Server** | http://localhost:3001 | Backend API |
| **Customer** | http://localhost:5173 | Browse & order |
| **Cashier** | http://localhost:5174 | POS system |
| **KDS** | http://localhost:5175 | Kitchen display |
| **Dashboard** | http://localhost:5176 | Analytics |

## 🔄 Two Modes Available

### MongoDB Mode (Default)
```env
# .env
VITE_USE_DEMO_MODE=false
```

- ✅ Persistent data
- ✅ Real-time sync
- ✅ Production ready
- ✅ Multi-user support
- ❌ Requires MongoDB + API server

### Demo Mode (No Database)
```env
# .env
VITE_USE_DEMO_MODE=true
```

- ✅ No installation needed
- ✅ Runs in browser
- ✅ Perfect for demos
- ✅ Fast development
- ❌ Data cleared on refresh

## 📊 Sample Data (After Seeding)

You'll have:
- **1 Store**: Demo Coffee Shop
- **12 Tables**: Table 1 through Table 12
- **3 Stations**: Bar, Hot, Cold
- **17 Menu Items**:
  - **Bar**: Espresso, Cappuccino, Latte, Americano, Macchiato, Flat White, Mocha
  - **Hot**: Hot Chocolate, Chai Latte, Matcha Latte, Turkish Coffee
  - **Cold**: Iced Latte, Iced Americano, Cold Brew, Frappuccino, Iced Mocha, Smoothie
- **5 Modifiers**: Size, Milk, Extra Shots, Syrups, Toppings

## 🐛 Troubleshooting

### MongoDB won't connect
```bash
# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port already in use
```bash
# Kill process on port 3001
# Windows: taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:3001 | xargs kill -9
```

### Frontend not connecting
1. Check API: http://localhost:3001/health
2. Verify `.env`: `VITE_USE_DEMO_MODE=false`
3. Restart: `pnpm dev:all`

### Need more help?
See **[INSTALLATION.md](./INSTALLATION.md)** for detailed troubleshooting.

## 🎓 Learn More

### MongoDB Management

**Using MongoDB Compass (GUI):**
1. Open MongoDB Compass
2. Connect: `mongodb://localhost:27017`
3. Database: `coffee-shop`
4. Browse collections

**Using MongoDB Shell:**
```bash
mongosh
use coffee-shop

# View menu items
db.menuitems.find().pretty()

# View orders
db.orders.find().pretty()

# Count documents
db.menuitems.countDocuments()
db.orders.countDocuments()
```

### API Endpoints

All endpoints at `http://localhost:3001/api/`:

- `GET /stores/:id` - Store info
- `GET /menu-items?store_id=1` - Menu
- `GET /orders?status=paid` - Orders
- `POST /orders` - Create order
- `PATCH /orders/:id` - Update status
- `GET /kds-tickets?station_id=station-bar` - KDS
- `PATCH /kds-tickets/:id` - Update ticket
- `POST /payments` - Process payment

## 🚀 Production Deployment

### Backend
- Railway, Render, Heroku
- Set `MONGODB_URI` to MongoDB Atlas

### Frontend
- Vercel, Netlify, Cloudflare Pages
- Set `VITE_API_URL` to your API URL

### Database
- MongoDB Atlas (free tier available)
- [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## 🎉 What's Working

✅ All Features Migrated:
- [x] Menu browsing with categories
- [x] Order creation (customer, cashier, kiosk)
- [x] Inventory tracking
- [x] Payment processing (cash, card)
- [x] KDS kitchen tickets
- [x] Order status tracking
- [x] Real-time updates
- [x] Order history
- [x] Customer information
- [x] Financial tracking (tax, discounts)
- [x] Sequential order numbers
- [x] Multi-app synchronization
- [x] Demo mode (localStorage)

## 📞 Support

If you need help:

1. ✅ Read [INSTALLATION.md](./INSTALLATION.md) - Complete setup guide
2. ✅ Check [MONGODB_SETUP.md](./MONGODB_SETUP.md) - Detailed features
3. ✅ Review [QUICK_START_MONGODB.md](./QUICK_START_MONGODB.md) - 5-min guide
4. ✅ See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - What changed

## 🌟 Key Benefits

**Why MongoDB?**
- ✅ Full data ownership
- ✅ No API key dependencies
- ✅ Flexible deployment
- ✅ Unlimited scalability
- ✅ Free for local development
- ✅ Complete customization
- ✅ Real-time control

**What's Better?**
- 🚀 Faster development (local DB)
- 💰 No cost for development
- 🔧 Full control over features
- 📚 Better for learning
- 🌐 Deploy anywhere
- 🔒 Your data, your rules

## 🎊 You're All Set!

You now have a complete, production-ready coffee shop system powered by MongoDB!

**Start building amazing features! ☕🍃**

---

**Need to get started quickly?**
→ Run: `setup-mongodb.bat` (Windows) or `./setup-mongodb.sh` (macOS/Linux)
→ Then: `pnpm seed && pnpm dev:all`

**Questions?**
→ See [INSTALLATION.md](./INSTALLATION.md) for step-by-step help

