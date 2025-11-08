# GitHub Deployment Guide

This guide shows you how to safely deploy your coffee shop system to GitHub.

## 🔒 Pre-Deployment Checklist

Before deploying, make sure:
- ✅ No sensitive files (.env, credentials) are committed
- ✅ .gitignore is properly configured
- ✅ All code compiles without errors
- ✅ MongoDB connection uses environment variables

## 🚀 Quick Deploy

### Option 1: Automated Script (Recommended)

**Windows:**
```bash
deploy-to-github.bat
```

This will:
1. Run safety checks automatically
2. Add all changes
3. Prompt for commit message
4. Push to GitHub

### Option 2: Manual Deploy

```bash
# 1. Run safety checks
node check-before-deploy.js

# 2. Add changes
git add .

# 3. Commit
git commit -m "Add MongoDB Atlas integration"

# 4. Push to GitHub
git push origin main
```

## 📋 What Gets Deployed

### ✅ Included (Safe to Commit):
- All source code
- Configuration examples (.env.example)
- Documentation (README, setup guides)
- Package definitions (package.json)
- Build configurations
- MongoDB models and schemas
- API client code

### ❌ Excluded (Protected by .gitignore):
- `.env` files (contains your MongoDB password!)
- `CREDENTIALS.txt` (your connection details)
- `node_modules/` (dependencies)
- `dist/` and `build/` (build outputs)
- `atlas-dashboard.png` (screenshots)

## 🔐 Environment Variables

After deploying, anyone who clones your repo will need to:

### 1. Create MongoDB Atlas Account
- Go to https://cloud.mongodb.com/
- Sign up for free

### 2. Create Their Own Cluster
- Follow: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

### 3. Configure Environment Variables

**Create `packages/api-server/.env`:**
```env
PORT=3001
MONGODB_URI=mongodb+srv://their-username:their-password@their-cluster.mongodb.net/coffee-shop
NODE_ENV=development
```

**Create `.env` in root:**
```env
VITE_API_URL=http://localhost:3001
VITE_USE_DEMO_MODE=false
```

## 🎯 For Team Members

If someone clones your repository:

### Quick Setup:
```bash
# 1. Clone
git clone https://github.com/YOUR-USERNAME/coffee-ordering-demo.git
cd coffee-ordering-demo

# 2. Install dependencies
pnpm install

# 3. Set up MongoDB Atlas
#    Follow MONGODB_ATLAS_SETUP.md to get connection string

# 4. Configure environment
cd packages/api-server
pnpm setup:easy
#    Paste their connection string when prompted

# 5. Seed database
pnpm seed

# 6. Start apps
cd ../..
pnpm dev:all
```

## 🌐 Repository Structure

```
coffee-ordering-demo/
├── .gitignore                 # Protects sensitive files
├── .env.example               # Template for configuration
├── check-before-deploy.js     # Safety checks
├── deploy-to-github.bat       # Deployment script
│
├── packages/
│   ├── api-server/            # MongoDB backend
│   │   ├── src/
│   │   │   ├── models/       # Mongoose schemas
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── db.ts         # MongoDB connection
│   │   │   ├── server.ts     # Express + Socket.io
│   │   │   └── seed.ts       # Database seeding
│   │   ├── .env.example      # Template
│   │   └── package.json
│   │
│   └── api-client/            # API client library
│       ├── src/
│       │   ├── mongo-client.ts  # MongoDB client
│       │   ├── demo.ts          # Demo mode
│       │   └── index.ts         # Main exports
│       └── package.json
│
├── apps/                      # Frontend applications
│   ├── customer/
│   ├── cashier/
│   ├── kds/
│   └── dashboard/
│
└── Documentation/
    ├── START_HERE.md
    ├── INSTALLATION.md
    ├── MONGODB_ATLAS_SETUP.md
    ├── QUICK_START_MONGODB.md
    └── README_MONGODB.md
```

## ⚠️ Important Security Notes

### Never Commit:
- ❌ MongoDB connection strings with passwords
- ❌ API keys or secrets
- ❌ `.env` files
- ❌ `CREDENTIALS.txt` or similar files

### Always Use:
- ✅ Environment variables (`process.env.MONGODB_URI`)
- ✅ `.env.example` templates (with placeholders)
- ✅ `.gitignore` to protect sensitive files

## 🐛 Troubleshooting

### "Safety checks failed"

Run checks manually to see details:
```bash
node check-before-deploy.js
```

Fix any errors shown, then try deploying again.

### "Sensitive files are staged"

```bash
# Unstage the file
git reset HEAD path/to/sensitive/file

# Make sure it's in .gitignore
echo "path/to/sensitive/file" >> .gitignore
```

### "Large files found"

GitHub has a 100MB file limit. Remove large files:
```bash
# Remove from staging
git rm --cached path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore
```

## 📝 Recommended Commit Messages

Good commit message examples:
- "Add MongoDB Atlas integration with full CRUD operations"
- "Replace Supabase with MongoDB backend"
- "Add real-time Socket.io updates"
- "Complete MongoDB migration and documentation"

## 🔄 After Deployment

### 1. Verify on GitHub
- Check repository at: https://github.com/YOUR-USERNAME/coffee-ordering-demo
- Verify no .env files are visible
- Check README displays correctly

### 2. Test Clone
```bash
# In a different directory
git clone https://github.com/YOUR-USERNAME/coffee-ordering-demo.git test-clone
cd test-clone

# Verify sensitive files are not included
ls packages/api-server/.env
#  Should show: File not found
```

### 3. Update README (if needed)
Make sure your README has:
- Setup instructions
- MongoDB Atlas setup link
- Environment variable configuration
- How to run the project

## 🎉 Success!

Your code is now on GitHub with:
- ✅ No sensitive data exposed
- ✅ Complete MongoDB implementation
- ✅ Full documentation
- ✅ Easy setup for other developers
- ✅ Professional .gitignore configuration

## 📞 Need Help?

- Check safety before commit: `node check-before-deploy.js`
- View what will be committed: `git status`
- See ignored files: `git status --ignored`

---

**Remember: Never commit passwords or API keys!** 🔒

