# 🔐 Forgot Password Email Configuration Guide

## Problem Found
The forgot password feature was **NOT sending verification codes to emails**. The code was only being logged to the console for testing purposes.

## ✅ Solution Implemented

### 1. **Added Nodemailer to Backend**
- Installed `nodemailer` package to handle email sending
- Configured email sending in the `forgot-password-request` endpoint
- Added HTML email templates with proper formatting

### 2. **Environment Variables Setup**
Add the following to your `.env` file in the `my-app/backend/` directory:

```env
# Email Configuration for Password Reset
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 📧 Email Provider Setup Guide

### **Option 1: Using Gmail (Recommended)**

1. **Enable 2-Factor Authentication**
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" in left sidebar
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Still in Security section, find "App passwords"
   - Select "Mail" and "Windows Computer" (or your OS)
   - Google will generate a 16-character password
   - Copy this password to `.env` as `EMAIL_PASSWORD`

3. **Update .env file:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### **Option 2: Using Outlook/Hotmail**

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

### **Option 3: Using Yahoo Mail**

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-yahoo-password
```

### **Option 4: Custom SMTP Server**

```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

## 🔧 Installation Steps

### 1. Install Nodemailer Package
```bash
cd my-app/backend
npm install nodemailer
```

### 2. Update Environment Variables
Edit `my-app/backend/.env` and add email configuration

### 3. Restart Backend Server
```bash
npm start
# or
npm run dev
```

## ✨ Features Implemented

✅ **Professional HTML Email Template**
- Branded with Riphah University colors
- Clear reset code display
- Expiration time warning (15 minutes)
- Security reminders

✅ **Error Handling**
- Graceful fallback if email fails
- Console logging for debugging
- Test code available in development mode

✅ **Security**
- 6-character verification codes (hex format)
- 15-minute expiration time
- Codes stored in memory (not in database for testing phase)
- Prevents email enumeration (doesn't reveal if account exists)

## 🧪 Testing the Feature

### In Development Mode:
1. Click "Forgot Password" on login page
2. Enter any registered email
3. Check backend console - the code will be logged
4. The code is also returned in response for development testing
5. Use the code to reset password

### With Email Configured:
1. Click "Forgot Password" on login page
2. Enter registered email
3. Check email inbox (may take 30 seconds)
4. Copy the 6-character code
5. Paste in the verification field
6. Set new password

## 📝 Email Template Content

The email includes:
- University branding (blue gradient header)
- User's full name
- 6-character reset code (easy to read format)
- Expiration time (15 minutes)
- Security warning about unauthorized requests
- Footer with university info

## 🐛 Troubleshooting

### "Email not received"
1. Check spam/junk folder
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
3. Check backend console for errors
4. Gmail users: ensure App Password is used, not regular password

### "Invalid credentials error"
1. Verify email credentials are correct
2. For Gmail: ensure you used the 16-character App Password
3. For Outlook: ensure you enabled "Less secure apps" if needed
4. Test credentials by logging into email directly

### "Connection timeout"
1. Check internet connection
2. Verify firewall isn't blocking port 587 (SMTP)
3. Some networks block email ports - try different provider

### "CORS or 404 errors"
1. Verify backend is running: `npm start`
2. Check `REACT_APP_API_URL` in frontend `.env`
3. Ensure backend is on correct port (default: 5000)

## 📊 Current Implementation Details

**Endpoint:** `POST /api/forgot-password-request`
- Request: `{ email: "user@example.com" }`
- Response: `{ success: true, message: "...", _testCode: "ABC123" }` (dev only)

**Email Service:** Nodemailer
- Service: Configurable (gmail, outlook, yahoo, custom)
- Auth: Username/Password or App Password
- Timeout: 30 seconds
- Retry: 1 attempt

**Code Storage:** In-Memory Map
- Duration: 15 minutes
- Format: 6-character hex (uppercase)
- Cleared: After successful reset or expiration

## 🚀 Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Configure email in `.env` file
3. Restart backend server
4. Test forgot password flow
5. Monitor console for errors

## 📞 Support

If verification codes still aren't being sent:
1. Check backend console for error messages
2. Verify email credentials in `.env`
3. Ensure nodemailer is installed: `npm list nodemailer`
4. Check firewall/security settings blocking SMTP port

---

**Last Updated:** December 19, 2025
**Status:** ✅ Implemented with Nodemailer
