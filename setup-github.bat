@echo off
REM GitHub Repository Setup Script for Windows
REM Usage: setup-github.bat <your-github-username>

if "%1"=="" (
    echo Usage: setup-github.bat ^<your-github-username^>
    exit /b 1
)

set GITHUB_USERNAME=%1
set REPO_NAME=coffee-ordering-demo

echo 🚀 Setting up GitHub repository for coffee-ordering-demo...
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
)

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if %errorlevel%==0 (
    echo ⚠️  Remote 'origin' already exists. Updating...
    git remote set-url origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
) else (
    echo 🔗 Adding remote repository...
    git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
)

REM Check if there are uncommitted changes
git status --porcelain >nul 2>&1
if %errorlevel%==0 (
    echo 📝 Staging all files...
    git add .
    
    echo 💾 Creating initial commit...
    git commit -m "Initial commit: Coffee ordering demo"
)

REM Set main branch
git branch -M main

echo.
echo ✅ Local repository is ready!
echo.
echo 📋 Next steps:
echo.
echo 1. Create a new repository on GitHub:
echo    https://github.com/new
echo    Name: %REPO_NAME%
echo    Visibility: Public (required for free GitHub Pages)
echo    DO NOT initialize with README, .gitignore, or license
echo.
echo 2. Push to GitHub:
echo    git push -u origin main
echo.
echo 3. Configure GitHub Secrets (Settings ^> Secrets and variables ^> Actions):
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo    - VITE_STRIPE_PUBLISHABLE_KEY
echo.
echo 4. Enable GitHub Pages (Settings ^> Pages):
echo    Source: GitHub Actions
echo.
echo 5. Set up Supabase and deploy Edge Functions (see SETUP_GITHUB.md)
echo.
echo Your apps will be available at:
echo   - Customer: https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/customer/
echo   - Cashier: https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/cashier/
echo   - KDS: https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/kds/
echo   - Dashboard: https://%GITHUB_USERNAME%.github.io/%REPO_NAME%/dashboard/
echo.

pause

