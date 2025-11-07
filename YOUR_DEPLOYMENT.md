# Your Deployment Guide - KarimElhakim

## 🎯 Your App URLs

Once deployed, your apps will be available at:

- **Customer App**: https://KarimElhakim.github.io/coffee-ordering-demo/customer/
- **Cashier Console**: https://KarimElhakim.github.io/coffee-ordering-demo/cashier/
- **KDS**: https://KarimElhakim.github.io/coffee-ordering-demo/kds/
- **Dashboard**: https://KarimElhakim.github.io/coffee-ordering-demo/dashboard/

## 📋 Step-by-Step Deployment

### Step 1: Create GitHub Repository (2 minutes)

1. Go to: https://github.com/new
2. Repository name: `coffee-ordering-demo`
3. Description: "Full-stack coffee shop ordering system demo"
4. Visibility: **Public** (required for free GitHub Pages)
5. **IMPORTANT**: Do NOT check any boxes (no README, .gitignore, or license)
6. Click "Create repository"

### Step 2: Push to GitHub (1 minute)

Run this command:

```powershell
git push -u origin main
```

### Step 3: Configure GitHub Secrets (5 minutes)

1. Go to: https://github.com/KarimElhakim/coffee-ordering-demo/settings/secrets/actions
2. Click "New repository secret" and add:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: (You'll get this from Supabase - see Step 4)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (You'll get this from Supabase - see Step 4)

   **Secret 3:**
   - Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: (You'll get this from Stripe - see Step 5)

### Step 4: Enable GitHub Pages (1 minute)

1. Go to: https://github.com/KarimElhakim/coffee-ordering-demo/settings/pages
2. Under "Source", select: **GitHub Actions**
3. Save

### Step 5: Set Up Supabase (15 minutes)

1. **Create Project:**
   - Go to: https://supabase.com
   - Click "New Project"
   - Fill in details and create
   - Wait ~2 minutes for setup

2. **Get Credentials:**
   - Go to: Settings → API
   - Copy **Project URL** → Use as `VITE_SUPABASE_URL`
   - Copy **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`
   - Copy **service_role** key → Save for later

3. **Run Migrations:**
   ```powershell
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. **Seed Database:**
   ```powershell
   $env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
   $env:VITE_SUPABASE_ANON_KEY="<your-anon-key>"
   $env:SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
   
   pnpm install
   pnpm --filter @coffee-demo/api-client seed
   ```

5. **Deploy Edge Functions:**
   - Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add these secrets:
     - `STRIPE_SECRET_KEY` (from Stripe)
     - `STRIPE_WEBHOOK_SECRET` (you'll get this after webhook setup)
     - `SUPABASE_URL` (same as VITE_SUPABASE_URL)
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `APP_URL`: `https://KarimElhakim.github.io/coffee-ordering-demo`
   
   ```powershell
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

6. **Update GitHub Secrets:**
   - Go back to GitHub and update the secrets with your actual Supabase values

### Step 6: Set Up Stripe (10 minutes)

1. **Create Account:**
   - Go to: https://stripe.com
   - Sign up (use test mode)

2. **Get API Keys:**
   - Go to: Developers → API keys
   - Copy **Publishable key** → Use as `VITE_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → Use in Supabase secrets as `STRIPE_SECRET_KEY`

3. **Set Up Webhook:**
   - Go to: Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Select event: `checkout.session.completed`
   - Copy **Signing secret** → Use in Supabase secrets as `STRIPE_WEBHOOK_SECRET`

4. **Update GitHub Secret:**
   - Go back to GitHub and update `VITE_STRIPE_PUBLISHABLE_KEY` with your actual Stripe key

### Step 7: Wait for Deployment (5-10 minutes)

1. Go to: https://github.com/KarimElhakim/coffee-ordering-demo/actions
2. Wait for all 4 workflows to complete:
   - Deploy Customer App
   - Deploy Cashier App
   - Deploy KDS App
   - Deploy Dashboard App

### Step 8: Access Your Apps! 🎉

Once workflows complete, your apps will be live at:

- Customer: https://KarimElhakim.github.io/coffee-ordering-demo/customer/
- Cashier: https://KarimElhakim.github.io/coffee-ordering-demo/cashier/
- KDS: https://KarimElhakim.github.io/coffee-ordering-demo/kds/
- Dashboard: https://KarimElhakim.github.io/coffee-ordering-demo/dashboard/

## 🧪 Test Your Apps

1. **Customer App:**
   - Open: https://KarimElhakim.github.io/coffee-ordering-demo/customer/?table=12
   - Add items to cart
   - Checkout → Use test card: `4242 4242 4242 4242`

2. **KDS:**
   - Open: https://KarimElhakim.github.io/coffee-ordering-demo/kds/
   - See order appear after payment
   - Update ticket status

3. **Dashboard:**
   - Open: https://KarimElhakim.github.io/coffee-ordering-demo/dashboard/
   - View live orders and analytics

## ⚠️ Important Notes

- Repository must be **Public** for free GitHub Pages
- All services use **free tiers** (Supabase free, Stripe test mode)
- Test cards only work in Stripe test mode
- First deployment may take 5-10 minutes

## 🆘 Troubleshooting

- **Workflows not running?** Check that you pushed to `main` branch
- **Pages not deploying?** Ensure repository is public and Pages source is "GitHub Actions"
- **Apps not loading?** Check browser console for errors, verify secrets are set correctly

