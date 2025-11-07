# Deployment Guide

## Prerequisites

1. **Supabase Account**
   - Create a project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key
   - Get your service role key (Settings > API)

2. **Stripe Account**
   - Create an account at [stripe.com](https://stripe.com)
   - Get test API keys (Dashboard > Developers > API keys)
   - Set up webhook endpoint

3. **GitHub Repository**
   - Create a new repository
   - Push this codebase
   - Enable GitHub Pages in repository settings

## Step-by-Step Deployment

### 1. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Or manually run the migration SQL in Supabase SQL Editor
# File: supabase/migrations/20240101000000_initial_schema.sql
```

### 2. Seed Database

```bash
# Set environment variables
export VITE_SUPABASE_URL=https://<project-ref>.supabase.co
export VITE_SUPABASE_ANON_KEY=<your-anon-key>
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Run seed script
pnpm --filter @coffee-demo/api-client seed
```

### 3. Deploy Supabase Edge Functions

```bash
# Set secrets in Supabase Dashboard
# Settings > Edge Functions > Secrets:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - APP_URL (e.g., https://username.github.io/coffee-ordering-demo)

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`
5. Copy the webhook signing secret
6. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### 5. Configure GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (test mode)

### 6. Enable GitHub Pages

For each app, you need to enable GitHub Pages:

1. Go to repository Settings > Pages
2. Source: GitHub Actions
3. The workflows will automatically deploy when you push to main

### 7. Update App URLs

After deployment, update the `APP_URL` in Supabase secrets to match your GitHub Pages URLs:

```
https://<username>.github.io/coffee-ordering-demo
```

## Testing

### Test Stripe Payment

1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Any ZIP code

### Test Flow

1. Open Customer App: `https://<username>.github.io/coffee-ordering-demo/customer/?table=12`
2. Add items to cart
3. Checkout → Stripe Checkout
4. Complete payment
5. Verify order appears in KDS
6. Update ticket status
7. Check Dashboard for analytics

## Troubleshooting

### Functions not deploying

- Check Supabase CLI is logged in: `supabase login`
- Verify project is linked: `supabase projects list`
- Check secrets are set in Supabase dashboard

### Webhook not working

- Verify webhook URL is correct
- Check webhook secret matches in Supabase
- View webhook logs in Stripe Dashboard

### GitHub Pages not updating

- Check workflow runs in Actions tab
- Verify secrets are set correctly
- Check build logs for errors

## Environment Variables Reference

### Frontend Apps

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (customer app only)
```

### Supabase Edge Functions

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
APP_URL=https://<username>.github.io/coffee-ordering-demo
```

## Public URLs

After successful deployment:

- **Customer**: `https://<username>.github.io/coffee-ordering-demo/customer/`
- **Cashier**: `https://<username>.github.io/coffee-ordering-demo/cashier/`
- **KDS**: `https://<username>.github.io/coffee-ordering-demo/kds/`
- **Dashboard**: `https://<username>.github.io/coffee-ordering-demo/dashboard/`

