# 🚀 Railway Deployment Guide

This guide will walk you through deploying ToDone to Railway in just a few minutes!

## Prerequisites

- GitHub account
- Railway account (free at [railway.app](https://railway.app))
- OpenAI API key (optional, for AI features)

## Step 1: Prepare Your Repository

1. **Create a new GitHub repository**
   ```bash
   # On GitHub.com, create a new repository called "todone-railway"
   ```

2. **Push this code to GitHub**
   ```bash
   cd ~/Desktop/ToDoneRailway
   git init
   git add .
   git commit -m "Initial commit - Railway ready ToDone app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/todone-railway.git
   git push -u origin main
   ```

## Step 2: Deploy to Railway

### Option A: One-Click Deploy (Recommended)

1. **Click the deploy button** in the README.md
2. **Connect your GitHub account** to Railway
3. **Select your repository** (`todone-railway`)
4. **Railway will automatically deploy** your app

### Option B: Manual Deploy

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `todone-railway` repository**
6. **Railway will detect it's a Node.js app and deploy automatically**

## Step 3: Configure Environment Variables

After deployment, go to your Railway project settings:

1. **Click on your project** in Railway dashboard
2. **Go to "Variables" tab**
3. **Add these environment variables:**

| Variable | Value | Required |
|----------|-------|----------|
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | ✅ Yes |
| `OPENAI_API_KEY` | `sk-your-openai-api-key-here` | ❌ Optional |
| `EMAIL_DOMAIN` | `yourdomain.com` | ❌ Optional |

### Getting OpenAI API Key (Optional)

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account
3. Go to "API Keys" section
4. Create a new API key
5. Copy and paste it into Railway variables

## Step 4: Test Your Deployment

1. **Visit your Railway URL** (shown in the Railway dashboard)
2. **Sign up** with your email and password
3. **Copy your forward email** (shown after registration)
4. **Test the app** by adding a manual todo

## Step 5: Set Up Email Forwarding (Optional)

To enable email-to-todo functionality:

1. **Use an email service** like SendGrid, Mailgun, or Resend
2. **Configure webhooks** to point to: `https://your-app.railway.app/api/email-webhook`
3. **Forward emails** to your unique address

## 🎉 You're Done!

Your ToDone app is now live and accessible from anywhere!

### Your App URL
Your app will be available at: `https://your-app-name.railway.app`

### Features Available
- ✅ User registration and login
- ✅ Todo creation and management
- ✅ Drag and drop reordering
- ✅ Priority levels and deadlines
- ✅ Sample todos for new users
- ✅ Responsive design

### Next Steps
1. **Test all features** thoroughly
2. **Set up email forwarding** if desired
3. **Customize the app** as needed
4. **Share with others**!

## 🔧 Troubleshooting

### App Won't Start
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `package.json` has correct start script

### Database Issues
- Railway automatically creates the SQLite database
- Check logs for database initialization errors
- Verify the app has write permissions

### API Errors
- Check the health endpoint: `https://your-app.railway.app/health`
- Verify JWT_SECRET is set
- Check CORS settings if calling from frontend

### Email Processing Not Working
- Verify OPENAI_API_KEY is set (if using AI features)
- Check webhook endpoint is accessible
- Test with a simple email forward

## 📞 Support

If you need help:
1. Check Railway logs in the dashboard
2. Verify all environment variables
3. Test the health endpoint
4. Check this guide again

---

**Happy deploying! 🚀** 