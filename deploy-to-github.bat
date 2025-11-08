@echo off
echo ================================
echo Deploy to GitHub
echo ================================
echo.
echo This script will:
echo 1. Run safety checks
echo 2. Add all changes
echo 3. Commit with message
echo 4. Push to GitHub
echo.
pause

echo.
echo Running safety checks...
node check-before-deploy.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Safety checks failed! Please fix errors before deploying.
    pause
    exit /b 1
)

echo.
echo ================================
echo Safety checks passed!
echo ================================
echo.

set /p COMMIT_MSG="Enter commit message: "

echo.
echo Adding changes...
git add .

echo.
echo Committing...
git commit -m "%COMMIT_MSG%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ================================
echo ✅ Deployed to GitHub!
echo ================================
echo.
pause

