# Lakeside Retreat Website - Clean Repository

## Railway Deployment Instructions

Since the original repository has structural issues, you have two options:

### Option A: Create a New GitHub Repository (Recommended)

1. Go to GitHub and create a new repository:
   - Name: `lakeside-retreat-production` (or similar)
   - Make it private
   - Don't initialize with README

2. In your terminal, navigate to this clean directory:
   ```bash
   cd C:\Users\dougl\Documents\lakeside-retreat-clean
   ```

3. Remove the old origin and add the new one:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/Lakesideglamping/lakeside-retreat-production.git
   git push -u origin main
   ```

4. In Railway:
   - Create a new project
   - Connect to the new GitHub repository
   - It should deploy automatically

### Option B: Manual Railway Deployment

1. In Railway dashboard:
   - Create a new project
   - Choose "Deploy from GitHub"
   - Select your repository
   - In Settings, set the Root Directory to:
     `OneDrive/Desktop/LakesideRetreat/LakesideRetreat/lakeside-retreat-website`

2. Add these environment variables in Railway:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - Add your other environment variables (Stripe keys, etc.)

## Project Structure

This clean repository contains:
- All website files
- Backend server (`server-railway-debug.js` and `server-secure.js`)
- Proper package.json configuration
- Images and assets
- No unnecessary parent directories

## Important Files

- `server-railway-debug.js` - Main server file for Railway
- `package.json` - Dependencies and scripts
- `Procfile` - Tells Railway how to start the app
- `railway.json` - Railway-specific configuration

## Environment Variables Needed

Make sure to set these in Railway:
- `STRIPE_SECRET_KEY`
- `UPLISTING_API_KEY`
- `SENDGRID_API_KEY` (if using email)
- `DATABASE_URL` (if using database)
- Any other API keys your app needs

## Testing Locally

To test the app locally:
```bash
npm install
node server-railway-debug.js
```

The app will run on http://localhost:3000