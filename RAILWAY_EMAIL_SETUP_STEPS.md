# 🚀 RAILWAY EMAIL SETUP - STEP BY STEP

**Status:** Your email credentials are configured locally ✅  
**Next:** Add them to Railway production

---

## 📋 YOUR EMAIL CREDENTIALS

These are already in your local `.env`:

```
EMAIL_SERVICE=gmail
EMAIL_USER=bilalyousafxai326@gmail.com
EMAIL_PASS=ygxtzqloygrsniok
FRONTEND_URL=https://frontend-pied-two-x4gwfxbawy.vercel.app
REACT_APP_API_URL=https://your-railway-backend-url
```

---

## 🎯 STEP 1: Go to Railway Dashboard

1. Open: https://railway.app
2. Log in to your account
3. Go to your project (FYP-Part-1 backend)

**Screenshot area:** You should see "My Projects" page

---

## 🎯 STEP 2: Open Backend Service

1. Click on your backend service (should say something like "Backend" or "Node.js")
2. You should see a green ✓ if deployed

**Screenshot area:** Service list shows "Backend" with status

---

## 🎯 STEP 3: Go to Variables Tab

1. In the service details page, look for tabs at the top
2. Click **"Variables"** tab (not Logs, not Deployments)

**Screenshot area:** Shows tabs: Deployments | Logs | **Variables** | Settings

---

## 🎯 STEP 4: Add Email Variables

In the Variables tab, you'll see an input field or button.

Click **"+ Add Variable"** or the input field, then add each variable ONE BY ONE:

### Variable 1: EMAIL_SERVICE
```
Name:  EMAIL_SERVICE
Value: gmail
```
Click ✓ or press Enter

### Variable 2: EMAIL_USER
```
Name:  EMAIL_USER
Value: bilalyousafxai326@gmail.com
```
Click ✓ or press Enter

### Variable 3: EMAIL_PASS
```
Name:  EMAIL_PASS
Value: ygxtzqloygrsniok
```
Click ✓ or press Enter

### Variable 4: FRONTEND_URL
```
Name:  FRONTEND_URL
Value: https://frontend-pied-two-x4gwfxbawy.vercel.app
```
Click ✓ or press Enter

### Variable 5: REACT_APP_API_URL
```
Name:  REACT_APP_API_URL
Value: https://your-backend.up.railway.app
```
*(Replace with your actual Railway backend URL)*
Click ✓ or press Enter

---

## 🎯 STEP 5: Redeploy Backend

After adding all 5 variables:

1. Look for a **"Redeploy"** button (usually top right)
2. Click it
3. Railway will show a deployment progress
4. Wait for it to complete (2-3 minutes)
5. Status should show ✅ when done

**Screenshot area:** Shows deployment progress with timestamps

---

## ✅ COMPLETE!

Your email configuration is now live on Railway! 

**Test it:**
1. Go to https://frontend-pied-two-x4gwfxbawy.vercel.app
2. Submit a clearance request
3. Approve through all 5 departments
4. Check your email for certificate

---

## 🆘 NEED HELP?

### Can't find Variables tab?
- Make sure you're in the **service details** page
- Not in project settings
- Look for service name at top

### Variables not saving?
- Click ✓ after each one
- Wait for it to show in the list
- Don't refresh the page

### Deployment shows error?
- Check variable names exactly (case-sensitive)
- Check no extra spaces
- Try adding them again

### Still no email after redeploy?
- Wait 2-3 minutes after redeploy completes
- Test with a fresh clearance submission
- Check spam folder
- Backend logs should show email attempt

---

## 📝 WHAT'S HAPPENING

```
Railway gets these variables
         ↓
Backend restarts with new config
         ↓
Certificate email code can now access credentials
         ↓
When student completes clearance:
         ↓
Email is generated with:
  - Student info
  - Certificate details
  - QR code
  - Download link
         ↓
Sent to: bilalyousafxai326@gmail.com
         ↓
Forwarded to student email in database
         ↓
Student receives certificate email! ✅
```

---

## 📌 REMEMBER

- Email only sends when student is **100% cleared** (all 5 departments approve)
- Email is sent to the **student's email** in your database
- Subject line: "✅ Clearance Certificate Approved"
- Includes QR code for verification
- Professional Riphah branding

---

## 🎉 ONCE COMPLETE

Your Riphah E Clearance system will have:

✅ Full-stack production deployment  
✅ Auto-generated certificate PDFs  
✅ QR codes for verification  
✅ **Automated certificate emails**  
✅ Professional email templates  
✅ Zero manual steps needed  

**Everything is now COMPLETE!** 🚀

---

**Files Updated:**
- ✅ `my-app/backend/.env.production` - Email credentials added

**Next Action:** Follow steps 1-5 above on Railway dashboard

**Time needed:** 5 minutes

**Difficulty:** ⭐ Very Easy (just copy-paste variables)
