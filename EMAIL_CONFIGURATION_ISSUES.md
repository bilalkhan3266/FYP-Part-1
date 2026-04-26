# Email System Issues Found & Fixed

## Summary
The system has 3 email features that require proper configuration:
1. **OTP (Sign Up Verification)** 
2. **Forgot Password Email**
3. **Clearance Certificate Email**

---

## Issues Found & Status

### ✅ Issue #1: Forgot Password Email NOT SENT (FIXED)
**Location:** `backend/server.js` - Line 882-939  
**Problem:** The endpoint had a TODO comment instead of actual email sending code  
**Status:** ✅ **FIXED** - Commit `47bc68a3`  
**What was wrong:**
```javascript
// BEFORE (NOT WORKING):
// TODO: In production, send this code via email using nodemailer or similar
// For now, log it for testing
// (No actual email sending)
```

**What's fixed:**
```javascript
// AFTER (NOW WORKING):
const emailResult = await sendPasswordResetEmail({
  userName: user.full_name || user.name || user.email,
  userEmail: user.email,
  resetCode: resetCode,
  expiresInMinutes: 15
});
```

**Note:** `my-app/backend/server.js` already had this implemented correctly

---

### ⚠️ Issue #2: Email Configuration Missing on Railway (NOT YET FIXED)
**Affects:** All 3 email features (OTP, Forgot Password, Certificate)  
**Status:** ⚠️ **NEEDS CONFIGURATION**  
**Problem:** `EMAIL_USER` and `EMAIL_PASS` environment variables not set on Railway

**Current email service code:**
- Both backend servers use `nodemailer` with Gmail SMTP
- Requires: `EMAIL_USER` (Gmail address) and `EMAIL_PASS` (Gmail App Password)
- Code supports both Gmail and SendGrid, but neither is configured

**To fix:**
1. Open your Railway project dashboard: https://railway.app/project
2. Go to your backend service settings
3. Add environment variables:
   - `EMAIL_USER`: Your Gmail address (e.g., `your.email@gmail.com`)
   - `EMAIL_PASS`: Your Gmail App Password (NOT your regular password!)
     - How to get App Password: https://myaccount.google.com/apppasswords
     - Select "Mail" and "Windows Computer" → Generate
     - Copy the 16-character password into `EMAIL_PASS`

**Example environment variables:**
```
EMAIL_USER=clearanceportal@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_SERVICE=gmail
```

---

### ✅ Issue #3: OTP Email Implementation (APPEARS WORKING)
**Location:** `backend/server.js` - Line 478 (in signup endpoint)  
**Status:** ✅ **IMPLEMENTED** - will work once EMAIL credentials are configured  
**How it works:**
- When user signs up, OTP is generated
- `sendOtpEmail()` is called asynchronously
- Uses `emailService.js` which handles both Gmail and SendGrid

---

### ✅ Issue #4: Clearance Certificate Email (APPEARS WORKING)
**Location:** Multiple locations:
- `backend/controllers/autoClearanceController.js`
- `backend/routes/clearanceWorkflowRoutes.js`
- `backend/routes/autoClearanceRoutes.js`

**Status:** ✅ **IMPLEMENTED** - will work once EMAIL credentials are configured  
**How it works:**
- When all departments approve → certificate email sent
- Student can also resend certificate via `/api/auto-clearance/email-certificate`
- Uses `sendClearanceCertificateEmail()` function

---

## Email Service Architecture

### File: `backend/utils/emailService.js`
Unified email service that supports:
1. **SendGrid** (preferred for Railway - HTTP API, no SMTP ports needed)
   - Requires: `SENDGRID_API_KEY` environment variable
   
2. **Nodemailer** (fallback - requires Gmail SMTP)
   - Requires: `EMAIL_USER` and `EMAIL_PASS` environment variables

### Current Configuration
```javascript
const useSendGrid = () => !!process.env.SENDGRID_API_KEY;

// If SendGrid API key exists → uses SendGrid
// Otherwise → falls back to Nodemailer (Gmail SMTP)
// If neither configured → emails fail silently with warnings
```

---

## How to Test Email System

### Test Endpoint
**GET** `https://fyp-part-1-production.up.railway.app/api/test-email`

**Response if configured:**
```json
{
  "success": true,
  "message": "Test OTP email sent successfully!"
}
```

**Response if NOT configured:**
```json
{
  "success": false,
  "message": "Email not configured: EMAIL_USER or EMAIL_PASS missing from Railway environment variables",
  "EMAIL_USER": "MISSING",
  "EMAIL_PASS": "MISSING"
}
```

---

## Production Email Configuration Recommendation

For best reliability on Railway, use **SendGrid** instead of Gmail SMTP:

1. **Create SendGrid account:** https://sendgrid.com/
2. **Generate API key:** Settings → API Keys → Create Key
3. **Add to Railway environment:**
   - `SENDGRID_API_KEY=SG.xxx...` (keep EMAIL_USER/EMAIL_PASS empty)

**Why SendGrid is better for Railway:**
- Uses HTTP API (no SMTP port restrictions)
- Better deliverability
- Automatic error handling
- Email logs and analytics

---

## Email Features Checklist

- [x] OTP email on signup - Code implemented, needs credentials
- [x] Forgot password email - Code fixed in latest commit
- [x] Certificate email on approval - Code implemented, needs credentials
- [ ] Email credentials configured on Railway - **ACTION NEEDED**
- [ ] Test all 3 email features after configuration

---

## Summary of Changes in This Session

**Commit:** `47bc68a3`  
**File:** `backend/server.js`  
**Changes:** 
- Replaced TODO comment with actual password reset email sending code
- Now calls `sendPasswordResetEmail()` function
- Email will be sent when user clicks "Forgot Password"

---

## Next Steps

1. **Configure EMAIL_USER and EMAIL_PASS on Railway** (or use SendGrid)
2. **Test email endpoint:** GET `/api/test-email`
3. **Test signup:** Register new student → check inbox for OTP email
4. **Test forgot password:** Click forgot password → check inbox for reset code
5. **Test certificate:** After all approvals → check inbox for certificate

