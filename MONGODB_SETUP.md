# MongoDB Setup Guide for Coffee Shop Demo

This application has been migrated from Supabase to MongoDB with a full-featured Express API backend and Socket.io for real-time updates.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** (v8 or higher)
3. **MongoDB** (v6 or higher)

## Installing MongoDB

### Windows

1. Download MongoDB Community Server from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer and choose "Complete" installation
3. Install MongoDB as a service (recommended)
4. MongoDB Compass (GUI) will be installed automatically

### macOS

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
# Import public key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Project Setup

### 1. Install Dependencies

```bash
cd coffee-ordering-demo
pnpm install
```

### 2. Configure Environment Variables

The `.env` file in the root directory controls the application mode:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Set to 'true' for demo mode (localStorage), 'false' for MongoDB
VITE_USE_DEMO_MODE=false
```

The API server configuration is in `packages/api-server/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/coffee-shop
NODE_ENV=development
```

### 3. Seed the Database

Populate MongoDB with initial data (menu items, stations, modifiers):

```bash
pnpm seed
```

This will create:
- 1 store
- 12 tables
- 3 stations (Bar, Hot, Cold)
- 17 menu items
- 5 modifiers (Size, Milk, Extra Shots, Syrups, Toppings)

### 4. Start the Application

#### Option A: Start Everything Together

```bash
pnpm dev:all
```

This starts:
- API server on http://localhost:3001
- Customer app on http://localhost:5173
- Cashier app on http://localhost:5174
- KDS app on http://localhost:5175
- Dashboard app on http://localhost:5176

#### Option B: Start Services Separately

```bash
# Terminal 1: Start API server
pnpm dev:api

# Terminal 2: Start frontend apps
pnpm dev
```

## Architecture Overview

### Backend (MongoDB + Express + Socket.io)

**Location**: `packages/api-server/`

#### Models
- `Store` - Coffee shop information
- `Station` - Kitchen stations (Bar, Hot, Cold)
- `MenuItem` - Menu items with inventory tracking
- `Modifier` - Item modifiers (size, milk, shots, etc.)
- `Order` - Customer orders
- `OrderItem` - Individual items in an order
- `OrderItemOption` - Selected modifiers for order items
- `KdsTicket` - Kitchen Display System tickets
- `Payment` - Payment records
- `Table` - Restaurant tables

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stores/:id` | GET | Get store information |
| `/api/menu-items` | GET | Get all menu items |
| `/api/stations` | GET | Get all stations |
| `/api/modifiers` | GET | Get all modifiers |
| `/api/orders` | GET, POST | Get orders or create new order |
| `/api/orders/:id` | PATCH | Update order status |
| `/api/payments` | POST | Create payment and mark order as paid |
| `/api/kds-tickets` | GET | Get KDS tickets |
| `/api/kds-tickets/:id` | PATCH | Update KDS ticket status |

#### Real-time Events (Socket.io)

- `order:created` - New order created
- `order:updated` - Order status changed
- `payment:created` - Payment processed
- `kds_ticket:created` - New KDS ticket
- `kds_ticket:updated` - KDS ticket status changed

### Frontend (React + Vite)

**Location**: `apps/`

#### API Client
Location: `packages/api-client/`

The client supports two modes:
1. **MongoDB Mode** (default) - Connects to Express API with Socket.io
2. **Demo Mode** - Uses localStorage for offline development

Switch modes via `VITE_USE_DEMO_MODE` environment variable.

## Features

### ✅ Fully Implemented

- **Menu Management**: Browse menu items with real-time availability
- **Order Creation**: Create orders from customer, cashier, or kiosk channels
- **Inventory Tracking**: Automatic stock deduction on order placement
- **Payment Processing**: Support for cash and card payments
- **Kitchen Display System (KDS)**: Real-time order tickets for kitchen stations
- **Order Status Tracking**: Track orders through all stages (new → paid → in_prep → ready → served)
- **Real-time Updates**: Socket.io for instant updates across all apps
- **Financial Tracking**: Order subtotals, tax calculation (14% VAT), discounts
- **Customer Information**: Store customer details with orders

### 📊 Data Persistence

All data is stored in MongoDB with proper relationships:
- Orders are linked to menu items, payments, and KDS tickets
- Inventory is automatically updated on order creation
- Order history is fully preserved
- Real-time synchronization across all clients

## Development Commands

```bash
# Install dependencies
pnpm install

# Start API server only
pnpm dev:api

# Start frontend apps only
pnpm dev

# Start everything together
pnpm dev:all

# Seed database with initial data
pnpm seed

# Build for production
pnpm build
pnpm build:api

# Run linters
pnpm lint
```

## MongoDB Management

### Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Navigate to `coffee-shop` database
4. Browse collections: `stores`, `menuitems`, `orders`, `kdstickets`, etc.

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh

# Switch to coffee-shop database
use coffee-shop

# View all collections
show collections

# Query orders
db.orders.find().pretty()

# Query menu items
db.menuitems.find().pretty()

# Query KDS tickets
db.kdstickets.find().pretty()

# Clear all orders (for testing)
db.orders.deleteMany({})
db.orderitems.deleteMany({})
db.kdstickets.deleteMany({})
db.payments.deleteMany({})
```

## Troubleshooting

### MongoDB Connection Issues

**Problem**: "MongoServerError: connect ECONNREFUSED"

**Solution**:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use

**Problem**: "Error: listen EADDRINUSE: address already in use :::3001"

**Solution**:
```bash
# Find and kill the process using port 3001
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### API Server Not Starting

1. Check MongoDB is running: `mongosh` should connect successfully
2. Verify `.env` file exists in `packages/api-server/`
3. Check for port conflicts (default: 3001)
4. Review server logs for specific errors

### Frontend Not Connecting to API

1. Verify API server is running on http://localhost:3001
2. Check `.env` in root directory has `VITE_USE_DEMO_MODE=false`
3. Clear browser cache and restart dev servers
4. Check browser console for connection errors

## Switching Between MongoDB and Demo Mode

### Use MongoDB (Persistent Database)
```env
# .env
VITE_USE_DEMO_MODE=false
```
- Data persists across restarts
- Real-time updates via Socket.io
- Requires API server running

### Use Demo Mode (LocalStorage)
```env
# .env
VITE_USE_DEMO_MODE=true
```
- No MongoDB or API server needed
- Data stored in browser localStorage
- Perfect for offline development
- No cross-tab synchronization

## Production Deployment

### MongoDB Atlas (Cloud Database)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coffee-shop
   ```

### Deploy API Server

The API server can be deployed to:
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- AWS, Azure, or Google Cloud

Example for Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Environment Variables for Production

Set these in your hosting platform:
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

For frontend apps:
```env
VITE_API_URL=https://your-api-server.com
VITE_USE_DEMO_MODE=false
```

## Benefits of MongoDB Migration

✅ **Persistent Data**: Orders and data survive restarts
✅ **Real-time Updates**: Socket.io provides instant synchronization
✅ **Scalable**: MongoDB handles thousands of orders efficiently
✅ **Flexible Schema**: Easy to add new fields without migrations
✅ **Full Control**: Complete ownership of your data
✅ **No External Dependencies**: No Supabase API keys needed
✅ **Offline Development**: Demo mode works without internet

## Support

For issues or questions:
1. Check this guide first
2. Review MongoDB documentation: [docs.mongodb.com](https://docs.mongodb.com)
3. Check Express.js docs: [expressjs.com](https://expressjs.com)
4. Review Socket.io docs: [socket.io/docs](https://socket.io/docs)

---

**Happy coding! ☕🍃**

