@echo off
echo ====================================
echo MongoDB Atlas - EASY Setup
echo ====================================
echo.
echo This is the SIMPLEST way to set up MongoDB Atlas!
echo.
echo What you'll do:
echo 1. Log in to Atlas in your regular browser
echo 2. Copy your connection string
echo 3. Paste it here
echo 4. Done!
echo.
echo No complex automation - just copy/paste!
echo ====================================
pause
echo.

echo Installing dependencies...
call pnpm install >nul 2>&1

echo.
node quick-setup.js

pause

