# Operations Dashboard

Live order tracking and analytics dashboard.

## Features

- Real-time order list with filters
- KPIs: Orders today, Revenue, Avg prep time, Active orders
- Charts: Orders by hour, Orders by channel
- Status and channel filtering
- Order details view

## Usage

1. View KPIs at the top
2. Review charts for trends
3. Filter orders by status or channel
4. Monitor order flow in real-time

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```bash
pnpm --filter @coffee-demo/dashboard dev
```

## Build

```bash
pnpm --filter @coffee-demo/dashboard build
```

