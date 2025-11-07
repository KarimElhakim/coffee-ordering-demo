# Cashier Console

Staff POS system for creating and processing in-store orders.

## Features

- Fast menu item search
- Add items with modifiers
- Quantity management
- Discount application (percentage)
- Cash and card payment options
- Instant order creation and payment marking

## Usage

1. Search for menu items
2. Click item to add with modifiers
3. Adjust quantities in cart
4. Apply discounts if needed
5. Select payment method (Cash or Card)
6. Order is created and marked as paid

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```bash
pnpm --filter @coffee-demo/cashier dev
```

## Build

```bash
pnpm --filter @coffee-demo/cashier build
```

