@echo off
echo ==========================================
echo FULLY AUTOMATED MongoDB Atlas Setup
echo ==========================================
echo.
echo This script will AUTOMATICALLY:
echo.
echo 1. Create a FREE MongoDB Atlas cluster
echo 2. Create database user
echo 3. Configure network access
echo 4. Get connection string
echo 5. Save configuration
echo 6. Seed database
echo 7. Test everything
echo.
echo You only need to provide:
echo - Atlas API keys (one-time setup)
echo - Project ID
echo.
echo ==========================================
pause
echo.

echo Installing dependencies...
call pnpm install

echo.
echo Starting automated setup...
echo.
node full-auto-atlas-setup.js

echo.
echo ==========================================
echo Setup complete!
echo ==========================================
pause

