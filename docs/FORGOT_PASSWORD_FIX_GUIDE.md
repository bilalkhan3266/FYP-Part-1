# Forgot Password - Fix Guide

## Issue
The forgot password feature was not sending verification codes because email configuration was missing from the `.env` file.

## Root Cause
The backend requires email credentials to send password reset codes via Gmail, but these were not configured in the environment variables.

## Solution

### Step 1: Update `.env` File
Add the following email configuration to `my-app/backend/.env`:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

### Step 2: Get Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate the app password (16-character password)
4. Copy and paste this into `EMAIL_PASSWORD` in `.env`

**Important:** Use an **App Password**, not your regular Gmail password!

### Step 3: Enhanced Password Validation
The forgot password feature now enforces the same strong password requirements as signup:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (!@#$%^&* etc.)

### Testing in Development Mode
When `NODE_ENV=development`, the backend logs the test code to console:
```
📧 Reset code for example@email.com: A1B2C3
⏱️ Code expires in 15 minutes
```

## How Forgot Password Works

### 1. **Request Reset Code** (Step 1)
- User enters email address
- Backend generates 6-character reset code
- Code is stored in memory with 15-minute expiry
- Email is sent with the reset code (check spam folder!)
- In development mode, code is logged to console

### 2. **Verify Code** (Step 2)
- User enters the reset code from email
- Backend validates code and expiry
- If valid, proceeds to password reset

### 3. **Reset Password** (Step 3)
- User enters new password with strong requirements
- Frontend validates password strength
- Backend validates and updates password in database
- User redirected to login page

## Troubleshooting

### Code not received?
1. Check spam/promotions folder in Gmail
2. Check browser console for test code (development mode)
3. Verify email address exists in database
4. Wait 1-2 seconds for email to be sent

### "Failed to send reset code"?
1. Check `.env` file has EMAIL_USER and EMAIL_PASSWORD
2. Verify App Password is correct (16 characters from Gmail)
3. Check MongoDB connection
4. Check backend logs in terminal

### Code expired?
- Reset codes expire after 15 minutes
- Request a new code if expired

## Files Modified
- `my-app/backend/.env` - Added email configuration
- `my-app/backend/server.js` - Updated password validation
- `my-app/src/auth/ForgotPassword.js` - Updated password validation

## Environment Variables Required

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/role_based_system

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_123456
JWT_EXPIRE=2h

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Email (REQUIRED FOR FORGOT PASSWORD)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-from-gmail
```

## Next Steps
1. Add your Gmail credentials to `.env`
2. Restart backend server
3. Test forgot password functionality
4. Check console/email for reset code
