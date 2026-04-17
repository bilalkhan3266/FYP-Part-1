# 🚀 RAILWAY DEPLOYMENT - QUICK REFERENCE

## 📋 ENVIRONMENT VARIABLES TO ADD

Copy-paste these into Railway Variables tab:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRE=7d
CORS_ORIGIN=https://frontend-pied-two-x4gwfxbawy.vercel.app
EMAIL_SERVICE=gmail
EMAIL_USER=bilalyousafxai326@gmail.com
EMAIL_PASS=ygxtzqloygrsniok
FRONTEND_URL=https://frontend-pied-two-x4gwfxbawy.vercel.app
REACT_APP_API_URL=https://[will-update-after-deployment]
```

## 🎯 RAILWAY STEPS (5 STEPS)

1. **https://railway.app** → Dashboard
2. **+ New Project** → Deploy from GitHub
3. Select **bilalkhan3266/FYP-Part-1**
4. **Variables tab** → Add all 11 variables above
5. **Deploy** button → Wait for ✅

## ✅ AFTER DEPLOYED

- Copy backend URL: `https://xxx.up.railway.app`
- Update `REACT_APP_API_URL` in Railway with this URL
- Update same variable in Vercel frontend
- Redeploy Vercel

## ⏱️ TIME: 10 minutes

---

## 🔍 VERIFY DEPLOYMENT

```bash
# Test backend is running
curl https://[your-railway-url]/api/health

# Should return: {"status":"ok","message":"Server is running"}
```

## 🆘 IF THINGS GO WRONG

**Check Railway Logs tab:**
- Any errors shown there?
- Red = problem
- Green = working

**Most common issues:**
- ❌ Missing variables → Add all 11
- ❌ MONGODB_URI wrong → Copy exactly
- ❌ CORS_ORIGIN wrong → Must be Vercel URL

**Still broken?** → Check /RAILWAY_DEPLOYMENT_GUIDE.md for full troubleshooting
