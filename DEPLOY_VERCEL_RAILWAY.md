# 🚀 Deploy to Vercel (Frontend) & Railway (Backend)

## Quick Start - 2 Services, 2 Clicks!

### 📋 Pre-Requirements
- GitHub account (your repo is already there ✅)
- Vercel account (free - https://vercel.com/signup)
- Railway account (free - https://railway.app/login)
- MongoDB Atlas account (free - https://www.mongodb.com/cloud/atlas)

---

## 🔧 Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
```
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (FREE tier available)
3. Create a project
4. Build a database (FREE tier: M0)
5. Choose region closest to you
```

### 1.2 Get Connection String
```
1. Go to Database → Connect
2. Choose "Drivers"
3. Copy connection string
4. Format: mongodb+srv://username:password@cluster.mongodb.net/fypproject?retryWrites=true&w=majority
5. Replace <password> with your password
```

### 1.3 Save for Later
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/fypproject?retryWrites=true&w=majority
```

---

## 📦 Step 2: Deploy Backend to Railway

### 2.1 Login to Railway
```powershell
railway login
```
- Opens browser → Authenticate with GitHub
- Returns to terminal

### 2.2 Create Railway Project
```powershell
cd g:\Part_3_Library
railway init
```
Follow prompts:
```
? What is your project name?
→ fyp-backend

? Do you want to create a Railway project in this directory?
→ yes
```

### 2.3 Create Environment Variables
```powershell
railway variables set MONGODB_URI "mongodb+srv://username:password@cluster.mongodb.net/fypproject?retryWrites=true&w=majority"
railway variables set NODE_ENV production
railway variables set JWT_SECRET your_secret_key_here
railway variables set CORS_ORIGIN https://your-vercel-domain.vercel.app
```

### 2.4 Deploy Backend
```powershell
railway up
```

**Wait for deployment to complete...**

### 2.5 Get Backend URL
```powershell
railway open
```
Copy the deployment URL (will be like: `https://fyp-backend-prod.up.railway.app`)

**Save this URL** - you'll need it for frontend!

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Environment
```powershell
# Edit: frontend\.env.local
REACT_APP_API_URL=https://fyp-backend-prod.up.railway.app
REACT_APP_ENV=production
```

### 3.2 Commit Changes
```powershell
cd g:\Part_3_Library
git add .
git commit -m "chore: Update API URL for Vercel deployment"
git push origin master
```

### 3.3 Deploy to Vercel
**Option A: CLI (Recommended)**
```powershell
cd g:\Part_3_Library\frontend
vercel --prod
```

**Option B: Web Dashboard**
1. Go to: https://vercel.com/new
2. Import from Git → Select your GitHub repo
3. Framework: Create React App ✅
4. Build Command: `npm run build`
5. Output Directory: `build`
6. Environment Variables:
   ```
   REACT_APP_API_URL = https://fyp-backend-prod.up.railway.app
   REACT_APP_ENV = production
   ```
7. Click Deploy!

### 3.4 Get Frontend URL
After deployment:
```
Your app is ready at: https://fyp-app-abc123.vercel.app
```

---

## 🔗 Final URLs

Once deployed, you'll have:

| Service | URL |
|---------|-----|
| **Frontend** | `https://your-app.vercel.app` |
| **Backend API** | `https://your-backend.up.railway.app/api` |
| **Database** | MongoDB Atlas |

---

## 🧪 Test Deployment

### Test Frontend
```
Open: https://your-app.vercel.app
Should load without errors
```

### Test Backend API
```
Open: https://your-backend.up.railway.app/api/health
Should return: {"status":"ok","message":"Server is running"}
```

### Test Login
1. Open frontend URL
2. Try to login
3. Should connect to backend ✅

---

## 🔐 Production Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use MongoDB Atlas (not local)
- [ ] Set CORS_ORIGIN to your Vercel domain
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set NODE_ENV=production
- [ ] Hide sensitive keys in Railway variables (not in code)

---

## 📊 Cost Breakdown (April 2026)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel (Frontend) | FREE | ✅ Free tier sufficient |
| Railway (Backend) | FREE | ✅ $5 free credits/month |
| MongoDB Atlas | FREE | ✅ M0 cluster (512MB) |
| **TOTAL** | **FREE** | ✅ Everything free! |

---

## ❌ Troubleshooting

### Frontend loads but API calls fail
```
✗ Problem: CORS error
✓ Solution: Update REACT_APP_API_URL to Railway backend URL
✓ Re-deploy frontend after changing .env
```

### Backend API returns 500 error
```
✗ Problem: MongoDB connection failed
✓ Solution: Check MONGODB_URI in Railway variables
✓ Ensure MongoDB Atlas allows your IP
```

### Vercel deployment fails
```
✗ Problem: Build error
✓ Solution: Run `npm run build` locally first
✓ Check for TypeScript/ESLint errors
✓ Review Vercel build logs
```

### Railway deployment fails
```
✗ Problem: Missing dependencies
✓ Solution: Ensure package.json is in backend root
✓ Check for missing environment variables
```

---

## 📖 Useful Commands

### Vercel CLI
```powershell
vercel --prod              # Deploy to production
vercel --prod --confirm    # Deploy without prompts
vercel logs -f             # Watch logs
vercel env pull            # Pull environment variables
```

### Railway CLI
```powershell
railway up                 # Deploy from current directory
railway logs -f            # Watch logs
railway variables list     # Show all environment variables
railway open              # Open project in browser
```

### Git
```powershell
git status                 # Check changes
git add .                  # Stage all
git commit -m "message"    # Commit
git push origin master     # Push to GitHub
```

---

## ✅ After Deployment

1. **Monitor Logs**
   - Vercel: Dashboard → Deployments → Logs
   - Railway: `railway logs -f`

2. **Test Endpoints**
   - Frontend: Open in browser
   - API: Test health check, login, requests

3. **Setup Custom Domain** (Optional)
   - Vercel: Add domain in settings
   - Railway: Add custom domain

4. **Enable Auto-Deploys**
   - Vercel: Already enabled for GitHub repo
   - Railway: Connect to GitHub for auto-deploy

5. **Backup Database**
   - MongoDB Atlas: Enable automated backups
   - Railway: Check backup options

---

## 🎉 You're Live!

Your FYP project is now deployed to production!

**Deployment successful when:**
- ✅ Frontend loads at Vercel URL
- ✅ Backend API responds at Railway URL
- ✅ Database connected to MongoDB Atlas
- ✅ Login works end-to-end
- ✅ All department dashboards show data

---

## 📞 Need Help?

### Vercel Support
- Docs: https://vercel.com/docs
- Status: https://www.vercelstatus.com

### Railway Support
- Docs: https://docs.railway.app
- Community: https://railway.app/community

### MongoDB Support
- Docs: https://docs.mongodb.com/manual
- Atlas Help: https://docs.atlas.mongodb.com

---

**Version**: 1.0
**Last Updated**: April 17, 2026
**Status**: Production Ready ✅
