# ☕ Coffee Shop Management System

Complete coffee shop ordering system with Customer, Cashier, KDS, and Dashboard apps.

## 🌐 Live Demo (GitHub Pages)

- 📱 **Customer App**: https://karimelhakim.github.io/coffee-ordering-demo/customer/
- 💼 **Cashier POS**: https://karimelhakim.github.io/coffee-ordering-demo/cashier/
- 🍳 **Kitchen Display**: https://karimelhakim.github.io/coffee-ordering-demo/kds/
- 📊 **Dashboard**: https://karimelhakim.github.io/coffee-ordering-demo/dashboard/

## ✨ Features

- **Customer Ordering**: Browse menu, customize items, checkout
- **Cashier POS**: Process orders, handle payments (cash/card)
- **Kitchen Display System**: Real-time order tickets by station
- **Analytics Dashboard**: Live order monitoring and statistics

## 🏗️ Architecture

### Frontend Apps
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** for state management

### Backend
- **MongoDB Atlas** (cloud database)
- **Express.js** API server
- **Socket.io** for real-time updates
- **Demo mode** fallback (localStorage)

### Deployment
- **GitHub Actions** for CI/CD
- **GitHub Pages** for static hosting
- Auto-deploy on push to main

## 📦 Project Structure

```
coffee-ordering-demo/
├── apps/
│   ├── customer/      # Customer ordering app
│   ├── cashier/       # Staff POS system
│   ├── kds/           # Kitchen display
│   └── dashboard/     # Analytics dashboard
├── packages/
│   ├── api-client/    # API client library
│   ├── api-server/    # MongoDB backend
│   ├── ui/            # Shared components
│   └── config/        # Shared configs
└── .github/workflows/ # CI/CD automation
```

## 🚀 Deployment

Automatically deploys to GitHub Pages on every push to `main` branch.

**URLs after deployment:**
- Customer: `https://USERNAME.github.io/coffee-ordering-demo/customer/`
- Cashier: `https://USERNAME.github.io/coffee-ordering-demo/cashier/`
- KDS: `https://USERNAME.github.io/coffee-ordering-demo/kds/`
- Dashboard: `https://USERNAME.github.io/coffee-ordering-demo/dashboard/`

## 🛠️ Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- MongoDB Atlas
- Express.js
- Socket.io
- pnpm workspaces

## 📄 License

MIT

---

**Built with ❤️ for coffee shops everywhere** ☕
