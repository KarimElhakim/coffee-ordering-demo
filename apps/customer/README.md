# Customer App

The customer-facing ordering interface for table/kiosk ordering.

## Features

- Browse menu by category
- Customize items with modifiers (size, milk, syrups, etc.)
- Shopping cart with real-time price calculation
- Table identification via URL parameter (`?table=12`)
- Stripe Checkout integration
- Order status tracking with real-time updates

## Usage

1. Open the app with a table number: `?table=12`
2. Browse menu items
3. Click "Add to Cart" to customize and add items
4. Review cart and proceed to checkout
5. Complete payment via Stripe Checkout
6. View order status

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Development

```bash
pnpm --filter @coffee-demo/customer dev
```

## Build

```bash
pnpm --filter @coffee-demo/customer build
```

