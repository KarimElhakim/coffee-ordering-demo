# Coffee Ordering Demo - FULLY WORKING DEMO MODE! 🎉

A **complete demo** coffee shop ordering system that works **WITHOUT any API keys**! No Supabase, no Stripe setup needed - just deploy and it works!

> **🔧 Deployment Issues?** If your deployed app isn't connecting properly, see [`DEPLOYMENT_FIX.md`](./DEPLOYMENT_FIX.md) for the solution!

## ✨ Features

- **🎯 Demo Mode by Default** - Works completely offline with localStorage
- **💳 Mock Payment System** - Beautiful payment UI that simulates Stripe checkout
- **📱 Four Complete Apps**:
  - **Customer App** - Browse menu, customize items, checkout with demo payment
  - **Cashier Console** - Staff POS for in-store orders
  - **Kitchen Display System (KDS)** - Real-time order preparation display
  - **Operations Dashboard** - Live analytics and order tracking

## 🚀 Quick Start - NO SETUP NEEDED!

### Option 1: Use GitHub Pages (Recommended)

1. **Repository is already set up**: https://github.com/KarimElhakim/coffee-ordering-demo
2. **Enable GitHub Pages**:
   - Go to: https://github.com/KarimElhakim/coffee-ordering-demo/settings/pages
   - Source: **GitHub Actions**
   - Save

3. **Wait for deployment** (~5 minutes)
4. **Access your apps**:
   - Customer: https://KarimElhakim.github.io/coffee-ordering-demo/customer/
   - Cashier: https://KarimElhakim.github.io/coffee-ordering-demo/cashier/
   - KDS: https://KarimElhakim.github.io/coffee-ordering-demo/kds/
   - Dashboard: https://KarimElhakim.github.io/coffee-ordering-demo/dashboard/

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/KarimElhakim/coffee-ordering-demo.git
cd coffee-ordering-demo

# Install dependencies
pnpm install

# Run any app
pnpm --filter @coffee-demo/customer dev
pnpm --filter @coffee-demo/cashier dev
pnpm --filter @coffee-demo/kds dev
pnpm --filter @coffee-demo/dashboard dev
```

## 🎮 How to Use

### Customer App Flow

1. Open Customer App: `/#/?table=12`
2. Browse menu items
3. Click "Add to Cart" → Customize (size, milk, syrups, etc.)
4. Go to Checkout
5. Click "Proceed to Payment"
6. Fill in demo payment form (any card number works!)
7. Complete payment → Order appears in KDS
8. View order status

### Cashier Console

1. Open Cashier App
2. Search for menu items
3. Add items with modifiers
4. Apply discounts if needed
5. Select payment method (Cash or Card)
6. Order is created and marked as paid

### KDS (Kitchen Display)

1. Open KDS App
2. Filter by station (Bar, Hot, Cold) or view all
3. New orders appear in "New" column
4. Click "Start Prep" → Moves to "In Prep"
5. Click "Ready" → Moves to "Ready"
6. Use "Recall" to move tickets back

### Dashboard

1. Open Dashboard
2. View KPIs: Orders today, Revenue, Avg prep time
3. See charts: Orders by hour, Orders by channel
4. Filter orders by status or channel
5. Monitor live order flow

## 💡 Demo Mode Features

- **No API Keys Required** - Works completely offline
- **localStorage Backend** - All data stored in browser
- **Mock Payment System** - Beautiful payment UI, no real charges
- **Real-time Updates** - Polling system for live updates
- **Full Functionality** - All features work in demo mode

## 🔄 Switching to Real Mode (Optional)

If you want to use real Supabase and Stripe later:

1. Set environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. The app will automatically switch to real mode when keys are detected
3. Demo mode is the default - works without any setup!

## 📦 Project Structure

```
coffee-ordering-demo/
├── apps/
│   ├── customer/      # Customer ordering app
│   ├── cashier/       # Staff POS console
│   ├── kds/           # Kitchen Display System
│   └── dashboard/      # Operations dashboard
├── packages/
│   ├── ui/            # Shared UI components
│   ├── api-client/    # API client (demo + real mode)
│   └── config/        # Shared configs
└── .github/workflows/ # Auto-deployment
```

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand (localStorage persistence)
- **Backend**: localStorage (demo) or Supabase (optional)
- **Payments**: Mock payment UI (demo) or Stripe (optional)
- **Package Manager**: pnpm workspaces

## 📝 Notes

- **Demo Mode**: Default mode, works without any API keys
- **Data Persistence**: Uses localStorage (clears on browser clear)
- **Real-time**: Uses polling (2-3 second intervals) in demo mode
- **Payments**: Mock payment form - accepts any card number
- **Deployment**: GitHub Actions automatically deploy on push

## 🎯 What Works

✅ Full menu browsing and customization  
✅ Shopping cart with modifiers  
✅ Demo payment system (no real charges)  
✅ Order creation and tracking  
✅ KDS ticket management  
✅ Real-time order updates (polling)  
✅ Dashboard analytics  
✅ Cashier POS system  
✅ All features work offline!

## 🚀 Deployment Status

- ✅ Repository: https://github.com/KarimElhakim/coffee-ordering-demo
- ✅ Code pushed and ready
- ⏳ GitHub Pages: Enable in settings (Settings → Pages → GitHub Actions)
- ⏳ Apps will auto-deploy after Pages is enabled

## 📚 Documentation

- See individual app READMEs in `apps/*/README.md`
- All apps work in demo mode by default!

## 🎉 Enjoy!

Everything works out of the box - no setup, no API keys, just deploy and use!
