@echo off
echo ====================================
echo Deploying to GitHub Repository
echo ====================================
echo.

cd /d "C:\Users\dougl\Documents\lakeside-retreat-clean"

echo Current directory:
cd
echo.

echo Git remote configuration:
git remote -v
echo.

echo Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo SUCCESS! Code pushed to GitHub
    echo ====================================
    echo.
    echo Next steps:
    echo 1. Go to Railway.app
    echo 2. Create new project
    echo 3. Deploy from GitHub
    echo 4. Select: lakeside-retreat-production
    echo ====================================
) else (
    echo.
    echo ====================================
    echo Push failed. Please check:
    echo 1. Internet connection
    echo 2. GitHub credentials
    echo 3. Repository exists
    echo ====================================
)

pause