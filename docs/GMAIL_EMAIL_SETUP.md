# How to Enable Email Reset Code Delivery

## The Problem
Currently the reset code is displayed on screen in development mode. You need it sent to your actual Gmail inbox.

## The Solution - 3 Simple Steps

### Step 1: Get Gmail App Password ⚙️
1. Open: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Select:
   - **App:** Mail
   - **Device:** Windows Computer
4. Click **Generate**
5. Copy the 16-character password shown

### Step 2: Update `.env` File 📝
Open: `my-app/backend/.env`

Find this section:
```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
```

Replace with your actual values:
```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Important:** 
- Use your full Gmail address
- Paste the entire 16-character password (with spaces)
- Do NOT use your regular Gmail password

### Step 3: Restart Backend 🔄
1. Stop the backend server (Ctrl+C)
2. Run: `npm start` or `node server.js`
3. Wait for "Server running on port 5000"

## Test It ✅

1. Go to Forgot Password page
2. Enter your email address
3. Click "Send Reset Code"
4. **Check your Gmail inbox** (or spam folder)
5. Copy the code and verify it

## What Should Happen

**Before Configuration:**
- ❌ Test code shown on screen
- ❌ Message: "email credentials are not configured"

**After Configuration:**
- ✅ Email sent to your Gmail
- ✅ Code arrives in inbox within 1-2 seconds
- ✅ Professional email template with Riphah branding

## Email Template

When configured properly, you'll receive an email like:
```
TO: your.email@gmail.com
SUBJECT: Riphah University - Password Reset Code
BODY: 
  Your reset code: ABC123
  This code expires in 15 minutes
```

## Troubleshooting

### Still showing "Invalid reset request"?
- Make sure `.env` was updated
- Restart backend server
- Wait 2-3 seconds before verifying code (15-minute limit)

### Email not arriving?
1. Check spam/promotions folder
2. Verify email address is correct in `.env`
3. Check backend console for errors
4. Make sure 2FA is enabled on Gmail

### "Authentication failed" error?
- Your app password might be wrong
- Re-generate a new one from https://myaccount.google.com/apppasswords
- Remove any extra spaces when copying

## Important Notes
- ⚠️ Never share your App Password
- 🔐 App Password is different from Gmail password
- 📧 Works with @gmail.com accounts only
- ⏱️ Reset codes expire after 15 minutes
