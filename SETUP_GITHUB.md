# GitHub Repository Setup Guide

Follow these steps to deploy the coffee ordering demo to GitHub.

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `coffee-ordering-demo`
4. Description: "Full-stack coffee shop ordering system demo"
5. Visibility: **Public** (required for free GitHub Pages)
6. **DO NOT** initialize with README, .gitignore, or license
7. Click "Create repository"

## Step 2: Initialize and Push Local Repository

Run these commands in the project root:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Coffee ordering demo"

# Add your GitHub repository as remote
# Replace <your-username> with your GitHub username
git remote add origin https://github.com/<your-username>/coffee-ordering-demo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key

   - **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: Your Stripe publishable test key (starts with `pk_test_`)

## Step 4: Enable GitHub Pages

For each app, you'll need to enable GitHub Pages:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

**Note**: GitHub Pages for Actions requires the repository to be public (free tier).

## Step 5: Set Up Supabase

Before the apps work, you need to:

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to finish setting up

2. **Run Migrations**:
   ```bash
   # Install Supabase CLI if needed
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link to your project
   supabase link --project-ref <your-project-ref>
   
   # Push migrations
   supabase db push
   ```

3. **Seed Database**:
   ```bash
   # Set environment variables
   export VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   export VITE_SUPABASE_ANON_KEY=<your-anon-key>
   export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   
   # Run seed
   pnpm install
   pnpm --filter @coffee-demo/api-client seed
   ```

4. **Deploy Edge Functions**:
   ```bash
   # Set secrets in Supabase Dashboard
   # Settings > Edge Functions > Secrets:
   # - STRIPE_SECRET_KEY
   # - STRIPE_WEBHOOK_SECRET
   # - SUPABASE_URL
   # - SUPABASE_SERVICE_ROLE_KEY
   # - APP_URL (e.g., https://<username>.github.io/coffee-ordering-demo)
   
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

## Step 6: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Endpoint URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
5. Select event: `checkout.session.completed`
6. Copy the **Signing secret**
7. Add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 7: Access Your Apps

After deployment (workflows complete), your apps will be available at:

- **Customer App**: `https://<your-username>.github.io/coffee-ordering-demo/customer/`
- **Cashier Console**: `https://<your-username>.github.io/coffee-ordering-demo/cashier/`
- **KDS**: `https://<your-username>.github.io/coffee-ordering-demo/kds/`
- **Dashboard**: `https://<your-username>.github.io/coffee-ordering-demo/dashboard/`

## Troubleshooting

### Workflows Not Running

- Check that you've pushed to the `main` branch
- Verify GitHub Actions are enabled in repository settings
- Check the Actions tab for any errors

### Pages Not Deploying

- Ensure repository is public (free tier requirement)
- Check that Pages source is set to "GitHub Actions"
- Wait a few minutes for initial deployment

### Apps Not Loading

- Verify Supabase secrets are set correctly
- Check browser console for errors
- Ensure Supabase project is set up and migrations are run

## Quick Start Script

You can also use the provided script:

```bash
# Make script executable (Linux/Mac)
chmod +x setup-github.sh

# Run script
./setup-github.sh <your-github-username>
```

