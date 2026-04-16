# Certificate Email Troubleshooting Guide

## 🔍 Status Check

Your certificate email system is **CONFIGURED AND WORKING** ✅

- ✅ Email credentials configured in `.env`
- ✅ SMTP connection successful (tested with Gmail)
- ✅ Certificate generation working
- ✅ Email service sending messages

## 📧 Why Email Might Not Appear

### 1. **Email Going to Spam/Junk** (Most Common)
Gmail and other email providers may filter clearance emails as spam. Check:
- **Spam/Junk folder** in your email
- **Promotions tab** (if using Gmail)
- **All Mail/Other** folder
- **Email filters** or rules you may have set

### 2. **Email Delay** (5-30 minutes)
Sometimes emails take time to deliver. Wait a few minutes and refresh your inbox.

### 3. **Wrong Email Address**
If your email address in the system is incorrect, the email won't arrive.

## 🧪 Test Your Email

### Option 1: Test Email Endpoint
Send yourself a test email to verify your email address is correct:

**URL:** `GET /api/certificate-email-test`

```bash
curl -X GET http://localhost:5000/api/certificate-email-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent to your-email@gmail.com",
  "studentRecord": {
    "name": "Your Name",
    "email": "your-email@gmail.com",
    "sap": "12345",
    "department": "Computer Science"
  },
  "messageId": "<...@gmail.com>"
}
```

### Option 2: Check Your Email
1. Go to your **email inbox**
2. Look for subject: `✅ Your Clearance Certificate is Ready`
3. Check **Spam/Junk** folder
4. Check **Promotions** tab (Gmail)

## 🔄 Resend Certificate Email

If you approved clearance but didn't receive the email, you can manually resend it:

**URL:** `POST /api/resend-certificate-email`

**Request Body:**
```json
{
  "validationId": "69d40cd41b88b4fd46d998d8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate email has been resent to your-email@gmail.com. Please check your inbox and spam folder.",
  "messageId": "<...@gmail.com>"
}
```

## 📋 Email Configuration Details

### Current Setup
- **Email Service:** Gmail
- **Email Address:** bilalyousafxai326@gmail.com
- **Authentication:** App Password (NOT regular password)
- **Sender Name:** Riphah Clearance System

### Environment Variables (.env)
```
EMAIL_SERVICE=gmail
EMAIL_USER=bilalyousafxai326@gmail.com
EMAIL_PASS=ygxtzqloygrsniok
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
```

## ✅ Email Content

When a student's clearance is **APPROVED**, they receive:

**Subject:** ✅ Your Clearance Certificate is Ready - Riphah University

**Email Includes:**
- ✅ Student Name
- ✅ SAP ID
- ✅ Registration Number
- ✅ Program & Department
- ✅ Approved Departments List
- ✅ QR Code for verification
- ✅ Link to download certificate
- ✅ Certificate completion date

## 🔧 Debug Information

### Email Service Logs
When a certificate is generated, you should see in server logs:

```
📧 Sending clearance certificate email...
   Student found: YES
   Student email: ali9@gmail.com
   Student full_name: Ali Khan
   Student department: Computer Science

📨 Calling sendClearanceCertificateEmail for 675...
═══════════════════════════════════════════════════════
📧 CLEARANCE CERTIFICATE EMAIL SERVICE
═══════════════════════════════════════════════════════
Student Name: Ali Khan
Student Email: ali9@gmail.com
SAP ID: 675
Email User Configured: true
Email Pass Configured: true
═══════════════════════════════════════════════════════
📨 Creating email transporter...
📨 Sending email with options:
   From: Riphah Clearance System <bilalyousafxai326@gmail.com>
   To: ali9@gmail.com
   Subject: ✅ Your Clearance Certificate is Ready - Riphah University
✅ Clearance email SENT to ali9@gmail.com
   Message ID: <66cbceac-c2de-684f-b5dd-8560569846f8@gmail.com>
   Response: 250 2.0.0 OK  1775504773 ffacd0b85a97d-43d1e2a6f1esm41971206f8f.2 - gsmtp
```

### Test Email Command
```bash
node backend/test-email.js
```

### Debug Latest Certificate
```bash
node backend/debug-clearance-email.js
```

## 📝 Solutions

### 1. Email Still Not Arriving?
- **Check spam folder** - This is the most common issue
- **Compare email** - Make sure `student.email` in database matches actual email
- **Try test endpoint** - `/api/certificate-email-test` to verify address

### 2. Change Sender Email
If you want to use a different email sender:
1. Edit `.env` file
2. Update `EMAIL_USER=your-new-email@gmail.com`
3. Update `EMAIL_PASS=your-app-password`
4. Restart backend server

### 3. Student Email Not in Database
If clearing shows "No certificate email" in logs:
1. Check student's User record has `.email` field
2. Update student email in database
3. Resend certificate using `/api/resend-certificate-email`

## 🎯 Quick Checklist

- [ ] Check spam/junk folder
- [ ] Wait 5-10 minutes for delivery
- [ ] Run test email endpoint
- [ ] Check server logs for errors
- [ ] Verify student email in database
- [ ] Try resending certificate email
- [ ] Check email password is correct App Password

## 📞 Support

If email still isn't working:
1. Check server console logs
2. Run `node backend/test-email.js`
3. Run `node backend/debug-clearance-email.js`
4. Check database student record has `.email` field
5. Verify Gmail credentials are correct

---

**Last Updated:** April 7, 2026
**Status:** Email System ✅ Working
