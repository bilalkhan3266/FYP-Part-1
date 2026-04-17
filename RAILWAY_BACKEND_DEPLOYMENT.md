# 🚀 Deploy Backend to Railway (Step-by-Step)

## ⚠️ IMPORTANT: Backend Location
**Backend is located at:** `my-app/backend`  
**Do NOT use:** `backend/` directory  
**Correct path:** `FYP-Part-1/my-app/backend`

---

## 📋 Prerequisites
- ✅ GitHub account (you have: bilalkhan3266)
- ✅ Frontend already deployed to Vercel
- ✅ GitHub repository: https://github.com/bilalkhan3266/FYP-Part-1

---

## 🎯 Step 1: Create Railway Account & Connect GitHub (5 minutes)

1. Go to **https://railway.app**
2. Sign up / Login (use GitHub account for easier integration)
3. Click **"New Project"** or **"Create"**
4. Select **"Deploy from GitHub repo"**
5. Click **"Select a repo"**
6. Find and select: `bilalkhan3266/FYP-Part-1`
7. Click **"Connect"** / **"Authorize"**

---

## 🎯 Step 2: Configure Project for Backend Deployment (3 minutes)

### Option A: Automatic Detection (Recommended)
1. After connecting repo, Railway may auto-detect Node.js
2. If prompted, confirm deployment of `my-app/backend`
3. Click **"Deploy"**

### Option B: Manual Configuration
1. Click **"Add Service"** → **"From GitHub Repo"**
2. Select branch: **`master`**
3. **IMPORTANT:** In "Root Directory" field, enter: **`my-app/backend`**
4. Click **"Deploy"**

---

## 🎯 Step 3: Set Environment Variables (3 minutes)

1. Go to your Railway project dashboard
2. Click on the backend service
3. Go to **"Variables"** tab
4. Click **"Add Variable"** and add these (one by one):

| Variable Name | Value |
|---------------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject` |
| `JWT_SECRET` | `your_super_secret_jwt_key_change_this_in_production_2024` |
| `JWT_EXPIRE` | `7d` |
| `CORS_ORIGIN` | `https://frontend-pied-two-x4gwfxbawy.vercel.app` |

**⚠️ Before deploying to production:**
- Change `MONGODB_URI` to your actual MongoDB Atlas connection string
- Change `JWT_SECRET` to a secure random value
- Verify `CORS_ORIGIN` matches your Vercel frontend URL

---

## 🎯 Step 4: Deploy (Automatic)

1. Click **"Deploy"** button (or redeploy from latest commit)
2. Watch deployment logs:
   - ✅ "Building" → "Successfully built"
   - ✅ "Deploying" → "Deployment successful"
   - Takes 2-3 minutes
3. Get your backend URL:
   - Click on service
   - Look for "Public URL" or "Domain"
   - Copy the URL (format: `https://[project-name].up.railway.app`)

---

## 📍 Get Your Backend Production URL

After deployment completes:

```
Your Backend URL: https://[your-railway-url].up.railway.app

Example: https://riphah-clearance-backend-prod.up.railway.app
```

**Save this URL - you'll need it in the next step!**

---

## ✅ Verify Backend is Running

Test your backend deployment:

```bash
# Test health endpoint
curl https://[your-railway-url]/api/health

# Expected response: 
# { "status": "OK", "timestamp": "..." }
```

Or open in browser: `https://[your-railway-url]/api/health`

---

## 🔗 Step 5: Update Frontend with Backend URL

Once you have your Railway backend URL:

1. Open `frontend/.env.local` locally
2. Update this line:
   ```
   REACT_APP_API_URL=https://[your-railway-url]
   ```
   
   Example:
   ```
   REACT_APP_API_URL=https://riphah-clearance-backend-prod.up.railway.app
   ```

3. Save and push to GitHub:
   ```bash
   git add frontend/.env.local
   git commit -m "chore: Update backend API URL to production Railway URL"
   git push origin master
   ```

4. Vercel automatically redeploys frontend with new backend URL

---

## 🧪 Step 6: Test Production Deployment

1. Open your Vercel frontend URL: https://frontend-pied-two-x4gwfxbawy.vercel.app
2. Try to login:
   - Email: `student@example.com`
   - Password: `password123`
3. Check browser DevTools (F12) → Network tab:
   - API calls should go to your Railway backend
   - Look for requests to `[your-railway-url]/api/...`
4. Login should work end-to-end

---

## 🐛 Troubleshooting

### Deployment fails on Railway
- Check build logs in Railway dashboard
- Verify `my-app/backend` path is correct in root directory
- Ensure all dependencies in `my-app/backend/package.json` are correct
- Check for syntax errors in JavaScript files

### Backend URL not working
- Verify backend deployed successfully (check Railway logs)
- Make sure environment variables are set correctly
- Check if MongoDB is accessible
- Look at server logs for errors

### Login not working from frontend
- Verify CORS_ORIGIN is set to your Vercel frontend URL
- Check JWT_SECRET is the same on both frontend and backend
- Verify MongoDB connection string is correct
- Check browser DevTools for actual error messages

### Cannot connect to MongoDB
- Verify MongoDB Atlas cluster is created and running
- Check connection string in MONGODB_URI variable
- Ensure IP whitelist includes `0.0.0.0/0` in MongoDB Atlas

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Users                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  Vercel Frontend        │
        │ (React App)             │
        │ frontend-pied-xxx...    │
        └────────────┬────────────┘
                     │ HTTP Requests
        ┌────────────▼────────────┐
        │  Railway Backend        │
        │ (Node.js Express)       │
        │ your-railway-url...     │
        └────────────┬────────────┘
                     │ Database Queries
        ┌────────────▼────────────┐
        │  MongoDB Atlas          │
        │ (MongoDB Cloud)         │
        │ Free M0 Cluster         │
        └─────────────────────────┘
```

---

## 💰 Cost Breakdown (Railway)

| Item | Free Tier | Cost |
|------|-----------|------|
| Monthly credit | $5 | Free |
| Node.js app hosting | Included | Free |
| Database connections | 100 concurrent | Free |
| **Monthly total** | | **$0** |

Your backend deployment is **completely free!**

---

## 📝 Quick Reference

```yaml
Repository: https://github.com/bilalkhan3266/FYP-Part-1
Backend Path: my-app/backend
Backend Deployment: Railway
Frontend URL: https://frontend-pied-two-x4gwfxbawy.vercel.app
Framework: Node.js + Express
Database: MongoDB Atlas (Free)
Total Monthly Cost: $0
```

---

## ✨ After Deployment Complete

1. ✅ Frontend deployed on Vercel
2. ✅ Backend deployed on Railway
3. ✅ Database on MongoDB Atlas
4. ✅ All components connected
5. ✅ Production system live!

**Congratulations! Your full-stack application is now in production!** 🎉

---

**Need help?**
- Railway Docs: https://docs.railway.app
- Common Issues: https://railway.app/support
- GitHub Repo: https://github.com/bilalkhan3266/FYP-Part-1

**Last Updated:** April 17, 2026  
**Status:** Ready for production deployment
