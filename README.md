# Coffee Ordering Demo

A full-stack coffee shop ordering system (Starbucks-style demo) built with React, TypeScript, Supabase, and Stripe.

## 🏗️ Architecture

This is a monorepo containing:

- **Customer App** (`apps/customer`) - Table/kiosk ordering interface with QR-based table identification
- **Cashier Console** (`apps/cashier`) - Staff POS system for in-store orders
- **Kitchen Display System** (`apps/kds`) - Bar/hot/cold station displays for order preparation
- **Operations Dashboard** (`apps/dashboard`) - Live order tracking and analytics

### Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Payments**: Stripe Test Mode
- **State Management**: Zustand
- **Charts**: Recharts
- **Package Manager**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI (for local development)
- Stripe account (test mode)
- GitHub account

### Setup

1. **Push to GitHub** (if not already done)

```bash
# Run setup script
./setup-github.sh <your-github-username>

# Or on Windows:
setup-github.bat <your-github-username>

# Create repo on GitHub, then push:
git push -u origin main
```

2. **Clone the repository** (if working from another machine)

```bash
git clone https://github.com/<your-username>/coffee-ordering-demo.git
cd coffee-ordering-demo
```

3. **Install dependencies**

```bash
pnpm install
```

3. **Set up Supabase**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Run migrations:

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Or run migrations manually via SQL Editor
# Copy contents of supabase/migrations/20240101000000_initial_schema.sql
```

4. **Seed the database**

```bash
# Set environment variables
export VITE_SUPABASE_URL=your_supabase_url
export VITE_SUPABASE_ANON_KEY=your_anon_key
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run seed script
pnpm --filter @coffee-demo/api-client seed
```

5. **Set up Stripe**

   - Create a Stripe account and get test API keys
   - Set up webhook endpoint (see Deployment section)

6. **Configure environment variables**

Create `.env` files in each app directory or set them globally:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

7. **Run locally**

```bash
# Run all apps in development mode
pnpm dev

# Or run individual apps
pnpm --filter @coffee-demo/customer dev
pnpm --filter @coffee-demo/cashier dev
pnpm --filter @coffee-demo/kds dev
pnpm --filter @coffee-demo/dashboard dev
```

## 📦 Project Structure

```
coffee-ordering-demo/
├── apps/
│   ├── customer/          # Customer ordering app
│   ├── cashier/           # Cashier POS console
│   ├── kds/               # Kitchen Display System
│   └── dashboard/          # Operations dashboard
├── packages/
│   ├── ui/                # Shared UI components (shadcn/ui)
│   ├── api-client/        # Supabase client and queries
│   └── config/            # Shared TypeScript/Tailwind configs
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/        # Edge Functions (Stripe)
└── .github/
    └── workflows/         # GitHub Actions for deployment
```

## 🗄️ Database Schema

The system uses the following main tables:

- `stores` - Store information
- `tables` - Table identifiers
- `stations` - Kitchen stations (Bar, Hot, Cold)
- `menu_items` - Menu items with base prices
- `modifiers` - Item modifiers (Size, Milk, etc.)
- `orders` - Customer orders
- `order_items` - Items in each order
- `order_item_options` - Modifier selections
- `kds_tickets` - Kitchen display tickets
- `payments` - Payment records

See `supabase/migrations/20240101000000_initial_schema.sql` for full schema.

## 🔐 Row Level Security (RLS)

RLS policies are configured to allow:

- **Public**: Read menu items, create orders, read own orders
- **Staff**: Read/update all orders and KDS tickets
- **Admin**: Full access (configured via Supabase dashboard)

## 💳 Stripe Integration

### Edge Functions

1. **create-checkout-session**: Creates a Stripe Checkout session for an order
2. **stripe-webhook**: Handles Stripe webhook events (payment completion)

### Deployment

```bash
# Set environment variables in Supabase dashboard
# Settings > Edge Functions > Secrets

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### Webhook Setup

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## 🚢 Deployment

### GitHub Pages

Each app has its own GitHub Actions workflow that:

1. Builds the app
2. Uploads to GitHub Pages
3. Deploys to `https://<username>.github.io/coffee-ordering-demo/<app-name>/`

**Required GitHub Secrets:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` (for customer app only)

**Note**: Enable GitHub Pages in repository settings for each app.

### Supabase

Deploy Edge Functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

Set environment variables in Supabase dashboard:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL` (for redirect URLs)

## 🧪 Testing

### Test Stripe Cards

Use these test cards in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Use any future expiry date and any CVC

### Test Flow

1. Open Customer App with `?table=12`
2. Add items to cart with modifiers
3. Checkout → Stripe Checkout
4. Complete payment with test card
5. Verify order appears in KDS
6. Update ticket status in KDS
7. View analytics in Dashboard

## 📱 App URLs

After deployment:

- **Customer**: `https://<username>.github.io/coffee-ordering-demo/customer/`
- **Cashier**: `https://<username>.github.io/coffee-ordering-demo/cashier/`
- **KDS**: `https://<username>.github.io/coffee-ordering-demo/kds/`
- **Dashboard**: `https://<username>.github.io/coffee-ordering-demo/dashboard/`

## 📚 Documentation

- [Customer App README](apps/customer/README.md)
- [Cashier Console README](apps/cashier/README.md)
- [KDS README](apps/kds/README.md)
- [Dashboard README](apps/dashboard/README.md)

## 🛠️ Development

### Adding a new app

1. Create directory in `apps/`
2. Copy structure from existing app
3. Update `pnpm-workspace.yaml` if needed
4. Add GitHub Actions workflow

### Adding shared components

Add to `packages/ui/src/` and export from `packages/ui/src/index.ts`

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com)
- [Stripe](https://stripe.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Vite](https://vitejs.dev)
- [React](https://react.dev)

