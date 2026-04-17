# ⚡ RAILWAY SETUP - SUPER SIMPLE

## 🎯 STEP 1: Add Variables

In Railway Variables tab, click **"New Variable"** for EACH one:

**VARIABLE 1:**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://admin:Password123@cluster0.mongodb.net/fypproject`

**VARIABLE 2:**
- Name: `NODE_ENV`
- Value: `production`

**VARIABLE 3:**
- Name: `JWT_SECRET`
- Value: `your_super_secret_jwt_key_change_this_in_production_2024`

**VARIABLE 4:**
- Name: `JWT_EXPIRE`
- Value: `7d`

**VARIABLE 5:**
- Name: `CORS_ORIGIN`
- Value: `https://frontend-pied-two-x4gwfxbawy.vercel.app`

**VARIABLE 6:**
- Name: `EMAIL_SERVICE`
- Value: `gmail`

**VARIABLE 7:**
- Name: `EMAIL_USER`
- Value: `bilalyousafxai326@gmail.com`

**VARIABLE 8:**
- Name: `EMAIL_PASS`
- Value: `ygxtzqloygrsniok`

**VARIABLE 9:**
- Name: `FRONTEND_URL`
- Value: `https://frontend-pied-two-x4gwfxbawy.vercel.app`

**VARIABLE 10:**
- Name: `REACT_APP_API_URL`
- Value: `https://fypproject.up.railway.app`

---

## 🎯 STEP 2: Redeploy

Click **"Redeploy"** button (top right)

Wait 2-3 minutes ⏳

---

## 🎯 STEP 3: Check Logs

Click **"Logs"** tab

Look for:
```
✅ MongoDB connected
🚀 Server running
```

If you see this → **SUCCESS!** ✅

---

## 🎯 STEP 4: Get Your URL

Click **"Settings"** tab

Find: **"Public URL"** or **"Domain"**

Copy it (looks like: `https://fypproject.up.railway.app`)

---

## ✅ Done!

Your backend is now **LIVE** 🚀

Tell me your backend URL when ready!
