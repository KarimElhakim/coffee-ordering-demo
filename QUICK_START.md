# Quick Start Guide

Get your coffee ordering demo up and running in minutes!

## 🚀 Fast Track Setup

### 1. Push to GitHub (5 minutes)

```bash
# Run the setup script (replace with your GitHub username)
./setup-github.sh your-username

# Or on Windows:
setup-github.bat your-username

# Then create the repo on GitHub and push:
git push -u origin main
```

### 2. Configure GitHub (2 minutes)

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `VITE_SUPABASE_URL` (you'll get this from Supabase)
   - `VITE_SUPABASE_ANON_KEY` (you'll get this from Supabase)
   - `VITE_STRIPE_PUBLISHABLE_KEY` (you'll get this from Stripe)

3. Go to **Settings** → **Pages**
4. Set source to **GitHub Actions**

### 3. Set Up Supabase (10 minutes)

1. **Create Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in details and create
   - Wait ~2 minutes for setup

2. **Get Credentials**:
   - Go to **Settings** → **API**
   - Copy **Project URL** → use as `VITE_SUPABASE_URL`
   - Copy **anon public** key → use as `VITE_SUPABASE_ANON_KEY`
   - Copy **service_role** key → save for later

3. **Run Migrations**:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. **Seed Database**:
   ```bash
   export VITE_SUPABASE_URL=<your-url>
   export VITE_SUPABASE_ANON_KEY=<your-anon-key>
   export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   
   pnpm install
   pnpm --filter @coffee-demo/api-client seed
   ```

5. **Deploy Functions**:
   - Go to **Settings** → **Edge Functions** → **Secrets**
   - Add secrets:
     - `STRIPE_SECRET_KEY` (from Stripe)
     - `STRIPE_WEBHOOK_SECRET` (you'll get this after webhook setup)
     - `SUPABASE_URL` (same as VITE_SUPABASE_URL)
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `APP_URL` (e.g., `https://your-username.github.io/coffee-ordering-demo`)
   
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

### 4. Set Up Stripe (5 minutes)

1. **Create Account**:
   - Go to [stripe.com](https://stripe.com)
   - Sign up (use test mode)

2. **Get API Keys**:
   - Go to **Developers** → **API keys**
   - Copy **Publishable key** → use as `VITE_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → use in Supabase secrets as `STRIPE_SECRET_KEY`

3. **Set Up Webhook**:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Select event: `checkout.session.completed`
   - Copy **Signing secret** → use in Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### 5. Update GitHub Secrets

Go back to GitHub and update the secrets with your actual values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 6. Wait for Deployment

- Go to **Actions** tab in your GitHub repo
- Wait for workflows to complete (~5 minutes)
- Check for any errors

### 7. Access Your Apps! 🎉

Your apps will be live at:
- Customer: `https://<your-username>.github.io/coffee-ordering-demo/customer/`
- Cashier: `https://<your-username>.github.io/coffee-ordering-demo/cashier/`
- KDS: `https://<your-username>.github.io/coffee-ordering-demo/kds/`
- Dashboard: `https://<your-username>.github.io/coffee-ordering-demo/dashboard/`

## 🧪 Test It Out

1. Open Customer App with `?table=12`
2. Add items to cart
3. Checkout → Use test card: `4242 4242 4242 4242`
4. See order appear in KDS
5. Update status in KDS
6. View analytics in Dashboard

## ⚠️ Important Notes

- Repository must be **Public** for free GitHub Pages
- All services use **free tiers** (Supabase free, Stripe test mode)
- Test cards only work in Stripe test mode
- First deployment may take 5-10 minutes

## 🆘 Need Help?

- Check [SETUP_GITHUB.md](./SETUP_GITHUB.md) for detailed instructions
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting
- Check GitHub Actions logs if deployment fails

