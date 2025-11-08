# Coffee Shop Ordering System - MongoDB Edition

A complete point-of-sale and ordering system powered by **MongoDB**, **Express.js**, and **Socket.io** for real-time updates.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 🌟 Features

### Customer Ordering
- Browse menu with categories
- Customize items with modifiers (size, milk, shots, etc.)
- Real-time inventory status
- Online payment integration
- Order tracking

### Cashier POS
- Quick order entry
- Cash and card payment processing
- Receipt generation with order numbers
- Order history
- Customer information capture

### Kitchen Display System (KDS)
- Real-time order tickets
- Station-based filtering (Bar, Hot, Cold)
- Order status management (new → prep → ready)
- Auto-refresh on new orders

### Dashboard
- Live order monitoring
- Sales analytics
- Order statistics
- Real-time updates

### Technical Features
- ✅ **Persistent Data**: All data stored in MongoDB
- ✅ **Real-time Updates**: Socket.io for instant synchronization
- ✅ **Inventory Management**: Automatic stock tracking
- ✅ **Order Numbering**: Sequential order numbers (ORD-000001, etc.)
- ✅ **Financial Tracking**: Tax, discounts, subtotals
- ✅ **Dual Mode**: MongoDB or Demo (localStorage) mode
- ✅ **RESTful API**: Clean, documented endpoints

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
cd coffee-ordering-demo
setup-mongodb.bat
pnpm seed
pnpm dev:all
```

**macOS/Linux:**
```bash
cd coffee-ordering-demo
chmod +x setup-mongodb.sh
./setup-mongodb.sh
pnpm seed
pnpm dev:all
```

### Option 2: Manual Setup

1. **Install MongoDB**
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: See [MONGODB_SETUP.md](./MONGODB_SETUP.md)

2. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Setup Environment Variables**

   Create `.env` in root:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_USE_DEMO_MODE=false
   ```

   Create `packages/api-server/.env`:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/coffee-shop
   NODE_ENV=development
   ```

4. **Install & Run**
   ```bash
   pnpm install
   pnpm seed
   pnpm dev:all
   ```

## 📚 Documentation

- **[QUICK_START_MONGODB.md](./QUICK_START_MONGODB.md)** - Get running in 5 minutes
- **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - Complete setup guide with troubleshooting
- **API Documentation** - http://localhost:3001/api/*

## 🏗️ Architecture

```
coffee-ordering-demo/
├── apps/                          # Frontend applications
│   ├── customer/                  # Customer ordering app (port 5173)
│   ├── cashier/                   # Cashier POS app (port 5174)
│   ├── kds/                       # Kitchen display system (port 5175)
│   └── dashboard/                 # Analytics dashboard (port 5176)
│
├── packages/
│   ├── api-server/                # Express + MongoDB backend
│   │   ├── src/
│   │   │   ├── models/           # Mongoose schemas
│   │   │   ├── routes/           # API endpoints
│   │   │   ├── db.ts             # MongoDB connection
│   │   │   ├── server.ts         # Express + Socket.io server
│   │   │   └── seed.ts           # Database seeding
│   │   └── package.json
│   │
│   ├── api-client/                # API client library
│   │   ├── src/
│   │   │   ├── mongo-client.ts   # MongoDB API client
│   │   │   ├── demo.ts           # Demo mode (localStorage)
│   │   │   └── index.ts          # Main exports
│   │   └── package.json
│   │
│   ├── ui/                        # Shared UI components
│   └── config/                    # Shared configuration
│
└── package.json                   # Monorepo scripts
```

## 🔌 API Endpoints

### Stores
- `GET /api/stores/:id` - Get store information

### Menu
- `GET /api/menu-items?store_id=1` - Get all menu items
- `GET /api/stations?store_id=1` - Get stations
- `GET /api/modifiers?store_id=1` - Get modifiers

### Orders
- `GET /api/orders?status=paid&channel=cashier` - Get orders with filters
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status

### KDS
- `GET /api/kds-tickets?station_id=station-bar&status=new` - Get KDS tickets
- `PATCH /api/kds-tickets/:id` - Update ticket status

### Payments
- `POST /api/payments` - Process payment

## 🔄 Real-time Events (Socket.io)

Connect to `ws://localhost:3001`:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Listen for new orders
socket.on('order:created', (order) => {
  console.log('New order:', order);
});

// Listen for order updates
socket.on('order:updated', (order) => {
  console.log('Order updated:', order);
});

// Listen for KDS ticket updates
socket.on('kds_ticket:created', (ticket) => {
  console.log('New KDS ticket:', ticket);
});

socket.on('kds_ticket:updated', (ticket) => {
  console.log('KDS ticket updated:', ticket);
});
```

## 📦 Database Schema

### Collections

#### stores
```javascript
{
  _id: "1",
  name: "Demo Coffee Shop",
  created_at: Date
}
```

#### menuitems
```javascript
{
  _id: "item-espresso",
  store_id: "1",
  name: "Espresso",
  base_price: 25,
  station_id: "station-bar",
  is_active: true,
  stock_quantity: 50,
  out_of_stock: false,
  track_inventory: true
}
```

#### orders
```javascript
{
  _id: "order-123...",
  order_number: "ORD-000001",
  store_id: "1",
  channel: "cashier",
  status: "paid",
  total_amount: 42.00,
  subtotal: 35.00,
  tax_amount: 4.90,
  customer_name: "John Doe",
  created_at: Date,
  paid_at: Date
}
```

#### orderitems
```javascript
{
  _id: "item-123...",
  order_id: "order-123...",
  menu_item_id: "item-espresso",
  qty: 2,
  price_each: 25,
  product_name: "Espresso"
}
```

#### kdstickets
```javascript
{
  _id: "ticket-123...",
  order_id: "order-123...",
  station_id: "station-bar",
  status: "new",
  created_at: Date
}
```

## 🛠️ Development Commands

```bash
# Start API server only
pnpm dev:api

# Start frontend apps only
pnpm dev

# Start everything together
pnpm dev:all

# Seed database
pnpm seed

# Build for production
pnpm build
pnpm build:api

# Install dependencies
pnpm install
```

## 🔀 Demo Mode vs MongoDB Mode

### MongoDB Mode (Default)
```env
VITE_USE_DEMO_MODE=false
```
- ✅ Data persists across restarts
- ✅ Real-time updates via Socket.io
- ✅ Multiple users can access simultaneously
- ✅ Production-ready
- ❌ Requires MongoDB and API server

### Demo Mode (No Database)
```env
VITE_USE_DEMO_MODE=true
```
- ✅ No installation required
- ✅ Runs in browser only
- ✅ Perfect for demos and testing
- ❌ Data cleared on refresh
- ❌ No cross-device sync

## 🌐 Production Deployment

### Backend (API Server)

Deploy to Railway, Render, or Heroku:

```bash
# Example: Railway
railway login
railway init
railway up
```

Environment variables:
```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/coffee-shop
NODE_ENV=production
```

### Frontend (Apps)

Deploy to Vercel, Netlify, or Cloudflare Pages:

```bash
# Build all apps
pnpm build

# Deploy each app separately or as monorepo
```

Environment variables:
```env
VITE_API_URL=https://your-api.railway.app
VITE_USE_DEMO_MODE=false
```

### Database (MongoDB)

Use **MongoDB Atlas** (free tier available):
1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in API server environment

## 🔧 Troubleshooting

### MongoDB won't start
```bash
# Check if MongoDB is installed
mongosh --version

# Try starting manually
mongod --dbpath /data/db
```

### API server connection errors
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/coffee-shop

# Check if port 3001 is available
lsof -ti:3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

### Frontend can't connect to API
1. Verify API server is running: http://localhost:3001/health
2. Check `.env` file has correct `VITE_API_URL`
3. Clear browser cache and restart dev server

### "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

## 📊 Sample Data

After running `pnpm seed`, you'll have:
- **1 store**: Demo Coffee Shop
- **12 tables**: Table 1-12
- **3 stations**: Bar, Hot, Cold
- **17 menu items**: Various coffee drinks
- **5 modifiers**: Size, Milk, Extra Shots, Syrups, Toppings

## 🤝 Contributing

This is a demo/reference project showing how to build a complete ordering system with MongoDB.

## 📄 License

MIT License - Feel free to use this as a reference or starting point for your own projects!

## 🆘 Support

- **Quick Start**: [QUICK_START_MONGODB.md](./QUICK_START_MONGODB.md)
- **Detailed Setup**: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- **MongoDB Docs**: [docs.mongodb.com](https://docs.mongodb.com)
- **Express Docs**: [expressjs.com](https://expressjs.com)
- **Socket.io Docs**: [socket.io/docs](https://socket.io/docs)

---

**Built with ❤️ using MongoDB, Express, React, and Socket.io**

