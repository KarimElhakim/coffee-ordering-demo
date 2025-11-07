# Local Development Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Apps Locally

Each app runs on a different port. Run them in separate terminals:

#### Customer App
```bash
pnpm --filter @coffee-demo/customer dev
```
**URL**: http://localhost:5173

#### Cashier Console
```bash
pnpm --filter @coffee-demo/cashier dev
```
**URL**: http://localhost:5174

#### KDS (Kitchen Display System)
```bash
pnpm --filter @coffee-demo/kds dev
```
**URL**: http://localhost:5175

#### Dashboard
```bash
pnpm --filter @coffee-demo/dashboard dev
```
**URL**: http://localhost:5176

### 3. Access the Apps

Once running, open these URLs in your browser:

- **Customer App**: http://localhost:5173
  - Try with table: http://localhost:5173/#/?table=12
  
- **Cashier Console**: http://localhost:5174
  
- **KDS**: http://localhost:5175
  
- **Dashboard**: http://localhost:5176

## 🧪 Testing the Flow

### Complete Demo Flow

1. **Open Customer App**: http://localhost:5173/#/?table=12
2. **Browse Menu**: Click on items to customize
3. **Add to Cart**: Customize size, milk, syrups, etc.
4. **Checkout**: Go to checkout and proceed to payment
5. **Payment**: Fill in demo payment form (any card number works)
6. **View Order**: See order status after payment
7. **Open KDS**: http://localhost:5175 - See order appear in "New" column
8. **Update Status**: Click "Start Prep" → "Ready"
9. **View Dashboard**: http://localhost:5176 - See analytics and live orders

### Cashier Flow

1. **Open Cashier**: http://localhost:5174
2. **Search Items**: Type to search menu
3. **Add Items**: Click items to add with modifiers
4. **Apply Discount**: Set discount percentage if needed
5. **Checkout**: Select Cash or Card payment
6. **Order Created**: Order is marked as paid and appears in KDS

## 📝 Notes

- **Demo Mode**: All apps work in demo mode - no API keys needed!
- **Data Storage**: Uses localStorage - data persists in browser
- **Real-time Updates**: Polling every 2-3 seconds for live updates
- **No Backend Required**: Everything works offline

## 🔧 Troubleshooting

### Port Already in Use

If a port is already in use, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### Clear Browser Data

If you want to reset demo data:
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Clear all data

### Build Locally

To build for production locally:

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @coffee-demo/customer build
pnpm --filter @coffee-demo/cashier build
pnpm --filter @coffee-demo/kds build
pnpm --filter @coffee-demo/dashboard build
```

Build output will be in `apps/<app-name>/dist/`

## 🎯 Quick Commands

```bash
# Install dependencies
pnpm install

# Run all apps (in separate terminals)
pnpm --filter @coffee-demo/customer dev
pnpm --filter @coffee-demo/cashier dev
pnpm --filter @coffee-demo/kds dev
pnpm --filter @coffee-demo/dashboard dev

# Build all apps
pnpm build

# Build specific app
pnpm --filter @coffee-demo/customer build

# Lint all apps
pnpm lint
```

## 🌐 Local URLs Summary

| App | URL | Description |
|-----|-----|-------------|
| Customer | http://localhost:5173 | Customer ordering interface |
| Cashier | http://localhost:5174 | Staff POS console |
| KDS | http://localhost:5175 | Kitchen Display System |
| Dashboard | http://localhost:5176 | Operations dashboard |

## 💡 Tips

- Use different browser tabs for each app
- Customer app works with `?table=12` parameter
- All apps update in real-time (polling every 2-3 seconds)
- Demo payment accepts any card number
- Data persists in browser localStorage

