# Fully Automated MongoDB Atlas Setup

This guide shows you how to **automatically create and configure** a MongoDB Atlas cluster with **ZERO manual steps** (except getting API keys).

## 🚀 One-Command Setup

### Windows
```bash
cd coffee-ordering-demo\packages\api-server
setup-atlas-complete.bat
```

### macOS / Linux
```bash
cd coffee-ordering-demo/packages/api-server
chmod +x setup-atlas-complete.sh
./setup-atlas-complete.sh
```

### Or using pnpm
```bash
cd coffee-ordering-demo/packages/api-server
pnpm setup:atlas:complete
```

## 🎯 What Gets Automated

### Everything is Automatic:
- ✅ **Creates FREE cluster** (M0 tier, forever free!)
- ✅ **Creates database user** with secure password
- ✅ **Configures network access** (whitelists all IPs)
- ✅ **Gets connection string** automatically
- ✅ **Saves to `.env`** file
- ✅ **Tests connection** to verify
- ✅ **Seeds database** with sample data
- ✅ **Saves credentials** for reference

### You Only Need:
1. MongoDB Atlas API keys (one-time setup)
2. Your Project ID
3. 5 minutes of time!

## 📋 Step-by-Step Process

### Step 1: Get Atlas API Keys (One Time!)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in (or create free account)
3. Click your **profile icon** (top right)
4. Click **"Account"**
5. Go to **"API Keys"** tab
6. Click **"Create API Key"**

**Settings for new API key:**
- **Description**: Coffee Shop App
- **Project Permissions**: **Project Owner**
- Click **"Next"**
- **Save the Public and Private keys!** (You'll need these)

### Step 2: Get Project ID

While in Atlas:
1. Go to your project
2. Look at the URL: `https://cloud.mongodb.com/v2/PROJECT_ID_HERE#/...`
3. Copy the `PROJECT_ID_HERE` part

**Or:**
1. Click **"Project Settings"** (left sidebar)
2. Find **"Project ID"**
3. Copy it

### Step 3: Run the Script

```bash
cd coffee-ordering-demo\packages\api-server
setup-atlas-complete.bat
```

### Step 4: Enter Your Details

The script will ask:

```
Enter your Public API Key: pk-xxxxxxxxxxxxx
Enter your Private API Key: xxxxxxxxxxxxxxxxxxxx
Enter your Project ID: 507f1f77bcf86cd799439011
```

### Step 5: Watch the Magic! ✨

The script automatically:

```
🔧 Initializing Atlas API...
✅ Atlas API connected

📊 Checking existing clusters...
(no clusters found)

🏗️  Creating FREE cluster...
Cluster name: coffee-shop-cluster
Tier: M0 (FREE forever!)
✅ Cluster creation started!
⏱️  This takes 1-3 minutes...

⏳ Waiting for cluster to be ready...
   Status: CREATING
   Status: CREATING
   Status: IDLE
✅ Cluster is ready!

👤 Creating database user...
Username: coffee-admin
Password: CoffeeXy8d3a123!
✅ Database user created!

🌐 Configuring network access...
✅ Network access configured (0.0.0.0/0)

🔗 Getting connection string...
✅ Connection string obtained!

💾 Saving configuration...
✅ Configuration saved to .env
📄 Credentials saved to: atlas-credentials.txt

🧪 Testing connection...
✅ Successfully connected to MongoDB Atlas!

🌱 Seed database now? (yes/no): yes
✅ Database seeded successfully!

🎉 SETUP COMPLETE!
```

### Step 6: Start Your App!

```bash
cd ../..
pnpm dev:all
```

All done! Your app now uses MongoDB Atlas in the cloud! ☁️

## 📊 What Gets Created

### In MongoDB Atlas:

**Cluster:**
- Name: `coffee-shop-cluster`
- Tier: M0 (Free)
- Provider: AWS
- Region: US_EAST_1
- Storage: 512 MB

**Database User:**
- Username: `coffee-admin`
- Password: Auto-generated (saved in `atlas-credentials.txt`)
- Role: Atlas Admin

**Network Access:**
- IP: `0.0.0.0/0` (Allow all - change in production!)

**Database:**
- Name: `coffee-shop`
- Collections: stores, menuitems, stations, modifiers, etc.

### On Your Computer:

**File: `packages/api-server/.env`**
```env
PORT=3001
MONGODB_URI=mongodb+srv://coffee-admin:PASSWORD@coffee-shop-cluster.xxxxx.mongodb.net/coffee-shop?retryWrites=true&w=majority
NODE_ENV=development
```

**File: `packages/api-server/atlas-credentials.txt`**
```
MongoDB Atlas Credentials
========================

Cluster Name: coffee-shop-cluster
Username: coffee-admin
Password: CoffeeXy8d3a123!

Connection String: mongodb+srv://...

Atlas Dashboard: https://cloud.mongodb.com/v2/...

KEEP THIS FILE SECURE!
```

## 🔒 Security Notes

### API Keys
- Store securely (password manager)
- Never commit to Git
- Can be rotated in Atlas
- Only need them once for setup

### Database Password
- Auto-generated (strong)
- Saved in `atlas-credentials.txt`
- Keep this file secure
- Add to `.gitignore`

### Network Access
- Default: `0.0.0.0/0` (all IPs)
- For production: Restrict to specific IPs
- Change in Atlas dashboard

## 🎛️ Advanced Options

### Use Existing Cluster

If you already have a cluster:

```
Found existing clusters:
   1. my-cluster (IDLE)
   2. test-cluster (IDLE)

Use existing cluster? (yes/no): yes
Which cluster? (enter number): 1
```

### Custom Configuration

Edit `full-auto-atlas-setup.js` to customize:

```javascript
// Change cluster name
let clusterName = 'my-custom-name';

// Change region
regionName: 'EU_WEST_1'  // Europe
regionName: 'AP_SOUTHEAST_1'  // Asia

// Change provider
backingProviderName: 'GCP'  // Google Cloud
backingProviderName: 'AZURE'  // Microsoft Azure
```

## 🔄 Script Workflow

```
┌─────────────────────────┐
│  Get API Keys & Project │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Check Existing        │
│   Clusters              │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │ Exists?   │
      └─────┬─────┘
            │
    ┌───────┴───────┐
    │ No       Yes  │
    ▼               ▼
┌────────┐    ┌──────────┐
│ Create │    │   Use    │
│Cluster │    │ Existing │
└────┬───┘    └─────┬────┘
     └───────┬──────┘
             ▼
    ┌────────────────┐
    │  Wait for      │
    │  Ready (IDLE)  │
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │ Create DB User │
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │ Configure      │
    │ Network Access │
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │ Get Connection │
    │    String      │
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │  Save to .env  │
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │ Test Connection│
    └────────┬───────┘
             ▼
    ┌────────────────┐
    │ Seed Database  │
    └────────┬───────┘
             ▼
        ┌────────┐
        │  DONE! │
        └────────┘
```

## 🐛 Troubleshooting

### "Invalid API keys"

**Check:**
- Keys are correct (no extra spaces)
- Keys have "Project Owner" permissions
- Project ID is correct

**Solution:**
Create new API keys in Atlas

### "Cluster name already exists"

**Options:**
1. Use existing cluster (script will ask)
2. Choose different name
3. Delete old cluster in Atlas

### "Connection test failed"

**Wait a bit:**
- Cluster may still be initializing
- Network configuration takes time
- Try again in 2-3 minutes

### "Cannot create database user"

**Possible:**
- User already exists
- Enter existing password when prompted

### "Network access error"

**Not critical:**
- You can whitelist IPs manually
- Go to Atlas → Network Access
- Add IP: `0.0.0.0/0`

## 📈 Monitoring Your Cluster

### Atlas Dashboard

Visit: `https://cloud.mongodb.com/v2/YOUR_PROJECT_ID#/clusters`

**You can:**
- View cluster metrics
- See database collections
- Monitor connections
- Check logs
- Manage users
- Configure backups

### Command Line

```bash
# Test connection
pnpm test:connection

# View database
mongosh "YOUR_CONNECTION_STRING"
```

## 💰 Costs

### Free Tier (M0)
- **Cost**: $0/month forever
- **Storage**: 512 MB
- **RAM**: Shared
- **Backup**: Included
- **Perfect for**: Development, testing, small apps

### Upgrade Options
If you outgrow free tier:
- **M10**: ~$57/month (2GB RAM, 10GB storage)
- **M20**: ~$140/month (4GB RAM, 20GB storage)

## ✅ Verification Checklist

After setup completes:

- [ ] `.env` file exists with connection string
- [ ] `atlas-credentials.txt` has credentials
- [ ] `pnpm test:connection` succeeds
- [ ] Can see cluster in Atlas dashboard
- [ ] Database is seeded with data
- [ ] Apps can connect and work

## 🎉 Next Steps

1. **Start your app:**
   ```bash
   cd ../..
   pnpm dev:all
   ```

2. **Open apps:**
   - Customer: http://localhost:5173
   - Cashier: http://localhost:5174
   - KDS: http://localhost:5175
   - Dashboard: http://localhost:5176

3. **Create orders and watch real-time sync!**

## 📞 Need Help?

- **Atlas API Docs**: [docs.atlas.mongodb.com/api](https://docs.atlas.mongodb.com/api)
- **Main Setup Guide**: [MONGODB_ATLAS_SETUP.md](../../MONGODB_ATLAS_SETUP.md)
- **Manual Setup**: [INSTALLATION.md](../../INSTALLATION.md)

---

**🚀 Run the setup and get your cloud database in 5 minutes!**

```bash
cd packages/api-server
setup-atlas-complete.bat  # Windows
./setup-atlas-complete.sh # macOS/Linux
```

**Everything is automated - you just provide API keys!** 🎉

