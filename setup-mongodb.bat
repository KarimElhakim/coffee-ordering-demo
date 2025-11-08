@echo off
echo ================================
echo Coffee Shop MongoDB Setup
echo ================================
echo.

REM Create .env files if they don't exist
if not exist .env (
    echo Creating root .env file...
    copy .env.example .env
)

if not exist packages\api-server\.env (
    echo Creating API server .env file...
    echo PORT=3001> packages\api-server\.env
    echo MONGODB_URI=mongodb://localhost:27017/coffee-shop>> packages\api-server\.env
    echo NODE_ENV=development>> packages\api-server\.env
)

echo.
echo Installing dependencies...
call pnpm install

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run: pnpm seed
echo 3. Run: pnpm dev:all
echo.
echo For MongoDB installation, see MONGODB_SETUP.md
echo.
pause

