# Kitchen Display System (KDS)

Display system for kitchen stations to manage order preparation.

## Features

- Station filtering (Bar, Hot, Cold)
- Three-column Kanban view (New → Prep → Ready)
- Real-time ticket updates
- Visual pulse on new tickets
- Status management (Start Prep, Ready, Recall)
- Large, touch-friendly tiles

## Usage

1. Select station filter (or view all)
2. New tickets appear in "New" column
3. Click "Start Prep" to move to "In Prep"
4. Click "Ready" when order is complete
5. Use "Recall" to move ticket back

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```bash
pnpm --filter @coffee-demo/kds dev
```

## Build

```bash
pnpm --filter @coffee-demo/kds build
```

