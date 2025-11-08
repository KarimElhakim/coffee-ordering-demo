# MongoDB Atlas Cloud Setup Guide

This guide shows you how to set up MongoDB Atlas (cloud database) for your coffee shop system with automated deployment.

## 🌐 What is MongoDB Atlas?

[MongoDB Atlas](https://cloud.mongodb.com/) is MongoDB's fully managed cloud database service. It provides:
- ✅ **Free tier** - 512MB storage forever
- ✅ **Auto-scaling** and backup
- ✅ **Global deployment** in 125+ regions
- ✅ **Built-in security** with encryption
- ✅ **No server management** needed

## 📋 Setup Steps

### Step 1: Create MongoDB Atlas Account

1. Go to [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with:
   - Email address
   - Google account
   - GitHub account

### Step 2: Create a Free Cluster

Once logged in:

1. Click **"Build a Database"**
2. Choose **"Shared"** (Free tier)
3. Select **Cloud Provider**: AWS, Google Cloud, or Azure
4. Choose **Region**: Pick one closest to you
5. Cluster Name: `coffee-shop` (or any name)
6. Click **"Create"**

Wait 1-3 minutes for cluster creation.

### Step 3: Create Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `coffee-admin` (or your choice)
5. **Password**: Click "Autogenerate Secure Password" and **SAVE IT**
6. Database User Privileges: **"Atlas admin"**
7. Click **"Add User"**

**⚠️ IMPORTANT**: Save the password somewhere secure!

### Step 4: Allow Network Access

1. Click **"Network Access"** in Security section
2. Click **"Add IP Address"**
3. For development, choose **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to specific IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** in the left menu
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. **Copy the connection string**

It looks like:
```
mongodb+srv://coffee-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. **Replace `<password>`** with your database user password

## 🔧 Configure Your Application

### Update Environment Variables

Edit `packages/api-server/.env`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://coffee-admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/coffee-shop?retryWrites=true&w=majority
NODE_ENV=production
```

**Replace**:
- `YOUR_PASSWORD_HERE` with your actual password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL

### Test Connection

```bash
cd packages/api-server
pnpm test:connection
```

Expected output:
```
🧪 Testing MongoDB connection...
✅ Successfully connected to MongoDB
```

### Seed Cloud Database

```bash
cd ../..
pnpm seed
```

This will populate your MongoDB Atlas cluster with:
- 1 store
- 12 tables
- 3 stations
- 17 menu items
- 5 modifiers

### Start Application

```bash
pnpm dev:all
```

Your app now uses MongoDB Atlas in the cloud! 🎉

## 🔒 Security Best Practices

### 1. Use Environment Variables

**NEVER** commit credentials to Git!

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
packages/api-server/.env
```

### 2. Create Production User

For production, create a separate user with limited permissions:

1. Database Access → Add New User
2. Username: `coffee-prod`
3. Built-in Role: **"Read and write to any database"**
4. Restrict to specific database: `coffee-shop`

### 3. Restrict Network Access

For production:

1. Network Access → Edit
2. Add only your server IP addresses
3. Remove "Allow from Anywhere" (0.0.0.0/0)

### 4. Enable Monitoring

MongoDB Atlas provides free monitoring:

1. Click **"Metrics"** in your cluster
2. View real-time performance
3. Set up alerts for issues

## 🤖 Automated Setup Script

I've created a script to help you configure Atlas automatically.

**Create**: `packages/api-server/setup-atlas.js`

```javascript
#!/usr/bin/env node

import { createInterface } from 'readline';
import { writeFileSync } from 'fs';
import { join } from 'path';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function setup() {
  console.log('🌐 MongoDB Atlas Configuration Setup\n');
  console.log('Please have your MongoDB Atlas connection string ready.');
  console.log('Get it from: https://cloud.mongodb.com/ → Clusters → Connect\n');
  
  const connectionString = await ask('Enter your MongoDB Atlas connection string: ');
  
  if (!connectionString.includes('mongodb+srv://')) {
    console.error('❌ Invalid connection string. Should start with mongodb+srv://');
    process.exit(1);
  }
  
  // Ensure database name is included
  let finalString = connectionString.trim();
  if (!finalString.includes('?')) {
    finalString = finalString.replace(/\/$/, '') + '/coffee-shop?retryWrites=true&w=majority';
  } else if (!finalString.includes('/coffee-shop')) {
    finalString = finalString.replace(/\/\?/, '/coffee-shop?');
  }
  
  // Create .env file
  const envContent = `PORT=3001
MONGODB_URI=${finalString}
NODE_ENV=development
`;
  
  const envPath = join(process.cwd(), '.env');
  writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration saved to .env');
  console.log('\n📋 Next steps:');
  console.log('1. Test connection: pnpm test:connection');
  console.log('2. Seed database: cd ../.. && pnpm seed');
  console.log('3. Start app: pnpm dev:all');
  console.log('\n🎉 Setup complete!\n');
  
  rl.close();
}

setup().catch(console.error);
```

**Run it**:
```bash
cd packages/api-server
node setup-atlas.js
```

## 📊 Monitoring Your Atlas Database

### View Data with MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Use your connection string to connect
3. Browse collections visually

### Atlas Dashboard

Visit [cloud.mongodb.com](https://cloud.mongodb.com):

- **Metrics**: Real-time performance graphs
- **Collections**: Browse data directly in browser
- **Monitoring**: Set up alerts
- **Backup**: Automatic daily backups (free tier)

### View Collections in Browser

1. Go to your cluster in Atlas
2. Click **"Browse Collections"**
3. Database: `coffee-shop`
4. Collections: `menuitems`, `orders`, `kdstickets`, etc.

## 💰 Cost Information

### Free Tier (Forever)
- **Storage**: 512 MB
- **RAM**: Shared
- **Backup**: Included
- **Cost**: $0/month

Perfect for:
- Development
- Testing
- Small applications
- Personal projects

### Paid Tiers (If Needed)
- **M10**: ~$57/month (2GB RAM, 10GB storage)
- **M20**: ~$140/month (4GB RAM, 20GB storage)

The free tier is usually enough for small to medium applications.

## 🚀 Deployment with Atlas

### Environment Variables for Production

When deploying your app:

**API Server (Railway, Render, Heroku):**
```env
MONGODB_URI=mongodb+srv://coffee-prod:PASSWORD@cluster0.xxxxx.mongodb.net/coffee-shop
NODE_ENV=production
PORT=3001
```

**Frontend Apps (Vercel, Netlify):**
```env
VITE_API_URL=https://your-api-server.railway.app
VITE_USE_DEMO_MODE=false
```

## 🔄 Switching Between Local and Cloud

### Local MongoDB
```env
# packages/api-server/.env
MONGODB_URI=mongodb://localhost:27017/coffee-shop
```

### MongoDB Atlas (Cloud)
```env
# packages/api-server/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/coffee-shop
```

Just change the `MONGODB_URI` and restart your API server!

## 🛠️ Advanced: Atlas CLI Automation

For full automation, use the [Atlas CLI](https://www.mongodb.com/docs/atlas/cli/stable/):

### Install Atlas CLI

```bash
# macOS
brew install mongodb-atlas-cli

# Windows
choco install mongodb-atlas-cli

# Linux
curl https://fastdl.mongodb.org/mongocli/mongodb-atlas-cli_latest_linux_x86_64.tar.gz | tar xzv
```

### Login
```bash
atlas auth login
```

### Create Cluster (Automated)
```bash
atlas clusters create coffee-shop-cluster \
  --provider AWS \
  --region US_EAST_1 \
  --tier M0 \
  --diskSizeGB 0.5
```

### Create User (Automated)
```bash
atlas dbusers create \
  --username coffee-admin \
  --password YourSecurePassword123 \
  --role atlasAdmin
```

### Get Connection String
```bash
atlas clusters connectionStrings describe coffee-shop-cluster
```

## 🆘 Troubleshooting Atlas

### "Authentication failed"
- Check your username and password
- Ensure password is URL-encoded (replace special chars)
- Example: `p@ssw0rd` → `p%40ssw0rd`

### "IP not whitelisted"
- Go to Network Access
- Add your current IP
- Or allow 0.0.0.0/0 for development

### "Connection timeout"
- Check your internet connection
- Verify cluster is active
- Check if your IP is allowed

### "Database not found"
- Ensure connection string includes `/coffee-shop`
- Run seed script: `pnpm seed`

## 📞 Support

- **Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Community**: [community.mongodb.com](https://community.mongodb.com)
- **Free Training**: [university.mongodb.com](https://university.mongodb.com)

## ✅ Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created free cluster
- [ ] Created database user with password
- [ ] Allowed network access
- [ ] Copied connection string
- [ ] Updated `.env` file
- [ ] Tested connection (`pnpm test:connection`)
- [ ] Seeded database (`pnpm seed`)
- [ ] Started application (`pnpm dev:all`)
- [ ] Verified data in Atlas dashboard

---

**🎉 Your app is now running on MongoDB Atlas in the cloud!**

No local MongoDB installation needed - your data is stored securely in the cloud with automatic backups! ☁️🍃

