# MongoDB Atlas Setup - Chrome Authentication

This guide shows you how to set up MongoDB Atlas using **Chrome browser authentication**.

## 🚀 Quick Start (Automated with Chrome)

### Windows

```bash
cd coffee-ordering-demo\packages\api-server
setup-atlas-chrome.bat
```

### macOS / Linux

```bash
cd coffee-ordering-demo/packages/api-server
chmod +x setup-atlas-chrome.sh
./setup-atlas-chrome.sh
```

## 📋 What This Does

1. **Opens Chrome Browser** - Launches a Chrome window
2. **Navigates to MongoDB Atlas** - Goes to https://cloud.mongodb.com
3. **Waits for Your Login** - You log in manually (secure!)
4. **Automatically Extracts Connection String** - Script takes over after login
5. **Saves Configuration** - Creates `.env` file with your connection string
6. **Tests Connection** - Verifies everything works

## 🎬 Step-by-Step Process

### Step 1: Run the Script

**Windows:**
```bash
cd coffee-ordering-demo\packages\api-server
setup-atlas-chrome.bat
```

**macOS/Linux:**
```bash
cd coffee-ordering-demo/packages/api-server
chmod +x setup-atlas-chrome.sh
./setup-atlas-chrome.sh
```

### Step 2: Chrome Opens

A Chrome browser window will open automatically and navigate to:
```
https://cloud.mongodb.com/
```

### Step 3: Log In

In the Chrome window that opened:

**Option A: Sign in with Google**
1. Click "Sign in with Google"
2. Choose your Google account
3. Authorize MongoDB Atlas

**Option B: Sign in with Email**
1. Click "Sign in"
2. Enter your email and password
3. Complete authentication

**Option C: Create New Account**
1. Click "Sign up"
2. Fill in your details
3. Create account and log in

### Step 4: Script Takes Over

Once you're logged in, the automation script will:
- ✅ Detect successful login
- ✅ Find your database cluster
- ✅ Click "Connect" button
- ✅ Select "Connect your application"
- ✅ Extract the connection string
- ✅ Ask for password (if needed)
- ✅ Add database name (`coffee-shop`)
- ✅ Save to `.env` file
- ✅ Test the connection

### Step 5: Done!

You'll see:
```
✅ Configuration saved to .env
🧪 Testing connection...
✅ Successfully connected to MongoDB Atlas!

🎉 Setup complete! Next steps:
   1. Seed database: cd ../.. && pnpm seed
   2. Start app: pnpm dev:all
```

## 🔒 Security Notes

### Your Credentials are Safe

- ✅ **You log in manually** - Script never sees your password
- ✅ **Chrome handles authentication** - Uses Google/MongoDB's secure login
- ✅ **Local execution only** - Everything runs on your computer
- ✅ **No external services** - No third-party involved
- ✅ **Standard browser** - Same as logging in normally

### What Gets Saved

Only the **connection string** is saved to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coffee-shop
```

This is the same string you'd copy manually from Atlas dashboard.

## 📹 What You'll See

### Terminal Output:
```
================================
MongoDB Atlas Setup with Chrome
================================

Installing dependencies...
Installing Playwright browsers...

================================
Opening Chrome for authentication...
================================

INSTRUCTIONS:
1. A Chrome window will open
2. Log in to MongoDB Atlas with your credentials
3. The script will then automatically:
   - Find your cluster
   - Get the connection string
   - Save configuration

Please DO NOT close the terminal!

🌐 Launching browser...
📍 Navigating to MongoDB Atlas...

✅ MongoDB Atlas loaded!
📝 Please log in to your account in the browser window.
```

### Chrome Browser:
- Opens to MongoDB Atlas
- Shows normal login page
- You enter credentials
- Script waits patiently

### After Login:
```
✅ Login successful!
🔍 Looking for your database clusters...
📊 Navigating to Database view...
🔗 Looking for Connect button...
✅ Found Connect button!
📱 Clicking "Connect your application"...
🔍 Searching for connection string...
✅ Connection string found!

🔐 Configuration...
💾 Saving configuration...
✅ Configuration saved to .env

🧪 Testing connection...
✅ Successfully connected to MongoDB Atlas!

🎉 Setup complete!
```

## 🎯 If You Don't Have a Cluster Yet

If you're new to MongoDB Atlas and don't have a cluster:

### The script will stop and tell you:

```
⚠️  No database clusters found!

📝 Please create a cluster first:
   1. Click "Build a Database"
   2. Choose "Shared" (Free tier)
   3. Select region closest to you
   4. Click "Create"
   5. Wait 1-3 minutes for cluster creation

Then run this script again!
```

### Quick Cluster Creation:

1. In the Chrome window, click **"Build a Database"**
2. Choose **"Shared"** (M0 - Free tier)
3. **Cloud Provider**: AWS / Google Cloud / Azure (any works)
4. **Region**: Choose closest to your location
5. **Cluster Name**: `coffee-shop` (or any name)
6. Click **"Create"**
7. Wait 1-3 minutes
8. Run the script again!

## 🔄 Alternative: Manual Method

If automation doesn't work, you can get the connection string manually:

### Steps:
1. Go to https://cloud.mongodb.com/
2. Log in
3. Click on your cluster
4. Click **"Connect"**
5. Choose **"Connect your application"**
6. **Copy** the connection string
7. Run: `pnpm setup:atlas` (interactive script)
8. **Paste** the connection string when prompted

## 🐛 Troubleshooting

### Chrome doesn't open

**Check:**
```bash
# Verify Playwright is installed
pnpm exec playwright --version

# Reinstall if needed
pnpm exec playwright install chromium
```

### "Cannot find module playwright"

**Solution:**
```bash
cd packages/api-server
pnpm install
pnpm exec playwright install chromium
```

### Script hangs after login

**Possible causes:**
1. No clusters created yet → Create a cluster first
2. Slow internet → Wait a bit longer
3. Page structure changed → Use manual method

**Solution:**
Press `Ctrl+C` to stop, then use manual setup:
```bash
pnpm setup:atlas
```

### "Connection test failed"

**Possible causes:**
1. Wrong password in connection string
2. IP not whitelisted
3. Cluster not ready

**Solution:**
1. Check your database user password
2. Go to Atlas → Network Access → Add IP (0.0.0.0/0)
3. Wait for cluster to be active

### Browser closes too quickly

The script waits 5 seconds before closing. If you need more time:

Edit `automate-atlas-connection.js`:
```javascript
// Change this line (near the end)
await page.waitForTimeout(5000);  // Change 5000 to 10000 for 10 seconds
```

## 📊 What Gets Created

After successful setup:

### File: `packages/api-server/.env`
```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/coffee-shop?retryWrites=true&w=majority
NODE_ENV=development
```

### Screenshot: `atlas-dashboard.png`
A screenshot of your Atlas dashboard (for debugging)

## ✅ Verify Setup

### Test connection:
```bash
pnpm test:connection
```

Expected output:
```
🧪 Testing MongoDB connection...
✅ Successfully connected to MongoDB
   Stores: 0
   Menu Items: 0
   Stations: 0
⚠️  Database is empty. Run: pnpm seed
```

### Seed database:
```bash
cd ../..
pnpm seed
```

### Start everything:
```bash
pnpm dev:all
```

## 🎉 Success!

Your apps will now use MongoDB Atlas:
- 🔧 API Server: http://localhost:3001
- 🛒 Customer: http://localhost:5173
- 💰 Cashier: http://localhost:5174
- 🍳 KDS: http://localhost:5175
- 📊 Dashboard: http://localhost:5176

All data stored in MongoDB Atlas cloud! ☁️

## 📞 Need Help?

- **Main Guide**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- **Installation**: [INSTALLATION.md](../../INSTALLATION.md)
- **MongoDB Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**Ready to start?**

**Windows:** `setup-atlas-chrome.bat`  
**macOS/Linux:** `./setup-atlas-chrome.sh`

**Your credentials stay secure - you log in yourself! 🔒**

