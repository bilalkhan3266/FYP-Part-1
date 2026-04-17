# 📧 CERTIFICATE EMAIL FEATURE - SETUP GUIDE

## ✅ FEATURE OVERVIEW

When a student **completes clearance from ALL departments**, the system automatically:

1. ✅ Generates a PDF certificate
2. ✅ Creates a QR code for verification
3. ✅ **Sends an email with the certificate as PDF attachment**
4. ✅ Includes verification link and department clearance details

---

## 🔴 CURRENT ISSUE

**Certificate emails are NOT being sent because email credentials are missing from environment variables.**

The code IS there and working correctly, but it's silently failing because:
- `EMAIL_USER` is not set
- `EMAIL_PASS` is not set

---

## ✅ HOW TO FIX IT

### Step 1: Create Gmail App Password (5 minutes)

1. Go to your Gmail account: https://myaccount.google.com
2. Click **"Security"** (left sidebar)
3. Enable **"2-Step Verification"** (if not already enabled)
4. Scroll down to **"App passwords"**
5. Select:
   - **App:** Mail
   - **Device:** Windows PC (or your device)
6. Click **"Generate"**
7. Gmail will show a 16-character password
8. **Copy this password** - you'll need it in next step

**Example:**
```
Generated password: abcd efgh ijkl mnop
(without spaces: abcdefghijklmnop)
```

---

### Step 2: Add Email Configuration to Railway

On Railway dashboard for your backend:

1. Go to **"Variables"** in your backend service
2. Add these new variables:

| Variable Name | Value | Example |
|---|---|---|
| `EMAIL_SERVICE` | `gmail` | gmail |
| `EMAIL_USER` | Your Gmail email | `riphah.clearance@gmail.com` |
| `EMAIL_PASS` | Gmail app password (from Step 1) | `abcdefghijklmnop` |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://frontend-pied-two-x4gwfxbawy.vercel.app` |
| `REACT_APP_API_URL` | Your Railway backend URL | `https://your-backend.up.railway.app` |

3. **Save and redeploy** - Railway will automatically redeploy with new variables

---

### Step 3: Update Local Development (.env)

Edit `my-app/backend/.env.local` or `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/role_based_system
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
```

---

## 📧 HOW THE EMAIL FEATURE WORKS

### When Email is Sent

**Trigger:** Final department approves the student's clearance

```
Department Staff Approves Last Phase
        ↓
System marks overallStatus = "Completed"
        ↓
Generates PDF Certificate
        ↓
Creates QR Code
        ↓
Fetches Student Email from Database
        ↓
Sends Email with Certificate (if EMAIL_USER is configured)
        ↓
Student receives email ✅
```

---

### Email Template Includes

✅ **Student Information:**
- Name
- SAP ID
- Program
- Department

✅ **Department Clearance Status:**
- All 5 departments with ✓ Approved status

✅ **Certificate Details:**
- Certificate download link
- QR code for verification
- Verification URL
- Approval date

✅ **Professional Design:**
- Riphah International University branding
- Styled table with clearance status
- Security features (QR code, verification link)

---

## 🧪 TEST THE FEATURE

### Step 1: Trigger a Complete Clearance

1. Login as **Student**:
   - Email: `student@example.com`
   - Password: `password123`

2. Submit clearance request
   - Fill all required fields
   - Click "Submit Clearance Request"

3. **Login as Department Staff** (5 times) - approve each phase:
   - Coordination Office
   - Library
   - Transport  
   - Fee Department
   - Student Service

4. Each staff member approves the current phase
5. When **final department (Student Service) approves** → Email is sent

### Step 2: Check Email

1. Go to the Gmail account you configured
2. Look for email from that same Gmail account
3. Check spam folder if not in inbox
4. Email should have:
   - Subject: "✅ Clearance Certificate Approved"
   - Student details
   - Department status table
   - Download certificate link
   - QR code for verification

---

## 🔐 Important Security Notes

### Gmail App Password
- **Different from your Gmail password**
- Only works for email sending
- Safely revoked if compromised
- Each device/app can have separate password

### Email Credentials in Production
- **NEVER commit .env.production with real credentials to GitHub**
- Always set via Railway Variables (encrypted by Railway)
- Rotate credentials periodically
- Use a dedicated Gmail account (not personal)

### Recommended Setup for Production
- Create dedicated email: `riphah.clearance@gmail.com` (or similar)
- Enable 2FA on this account
- Generate app-specific password
- Store credentials only in Railway Variables

---

## 🐛 Troubleshooting

### "Certificate email not being sent"

**Check 1: Email credentials in environment**
```bash
# In Railway, check Variables tab:
- EMAIL_USER is set? ✓
- EMAIL_PASS is set? ✓
- EMAIL_SERVICE is set? ✓
```

**Check 2: Student email in database**
```bash
# Query MongoDB:
db.users.findOne({ sap: "student-sap-id" })
# Should have "email" field with valid email
```

**Check 3: Backend logs**
- Go to Railway dashboard
- Click on backend service
- View logs - look for:
  - "📧 CLEARANCE CERTIFICATE EMAIL SERVICE"
  - "✅ Certificate email sent"
  - Or error messages with "EMAIL CONFIGURATION ERROR"

### Error: "EMAIL CONFIGURATION ERROR: EMAIL_USER or EMAIL_PASS missing"

**Solution:**
1. Go to Railway dashboard
2. Add EMAIL_USER and EMAIL_PASS to Variables
3. Redeploy backend
4. Try approval again

### Error: "Gmail authentication failed"

**Solution:**
1. Verify Gmail app password (not regular password)
2. Check for spaces in password (remove them)
3. Ensure 2FA is enabled on Gmail account
4. Generate new app password and update Railway

### Email goes to spam

**Solution:**
1. Student should check spam folder
2. Add sender email to contacts
3. Mark as "Not Spam"
4. Use more professional Gmail account name

---

## 📋 Verification Checklist

- [ ] Gmail account created/available
- [ ] 2-Factor Authentication enabled on Gmail
- [ ] Gmail app password generated
- [ ] EMAIL_USER set in Railway Variables
- [ ] EMAIL_PASS set in Railway Variables (app password)
- [ ] EMAIL_SERVICE set to `gmail`
- [ ] FRONTEND_URL set in Railway Variables
- [ ] REACT_APP_API_URL set in Railway Variables
- [ ] Backend redeployed after adding variables
- [ ] Test: Complete clearance for a student
- [ ] Email received by student with certificate

---

## 📚 Code References

### Where Email is Sent

**File:** `my-app/backend/routes/clearanceWorkflowRoutes.js`  
**Line:** ~518 (in the PUT `/clearance/:id/approve` endpoint)

```javascript
// When final phase is approved:
if (isLastPhase) {
  // ... certificate generation code ...
  
  // Send email (async, don't block response)
  const student = await User.findById(workflow.studentId);
  if (student?.email) {
    sendClearanceCertificateEmail({
      studentName: workflow.studentName,
      studentEmail: student.email,
      sapId: workflow.sapid,
      // ... other details ...
    }).catch((e) => console.error("Email error:", e));
  }
}
```

### Email Service

**File:** `my-app/backend/utils/emailService.js`

Contains:
- `sendClearanceCertificateEmail()` - Main function
- HTML email template with styling
- QR code generation and embedding
- Department status table

---

## 🎯 What Happens After Email is Sent

1. ✅ Email arrives in student's inbox (or spam)
2. ✅ Student can download certificate as PDF
3. ✅ Student can print certificate
4. ✅ Student can view QR code for verification
5. ✅ Verification link works for 30 days
6. ✅ Certificate is archived in MongoDB

---

## 💡 Best Practices

1. **Test locally first** with dummy Gmail account
2. **Use dedicated email address** for production (not personal Gmail)
3. **Verify all 5 departments** have approvers before going live
4. **Test with real student** before full deployment
5. **Monitor logs** for first few weeks
6. **Train staff** on approval workflow
7. **Set up backup email** in case primary fails

---

## 📞 Additional Help

**If certificate email still not sending after setup:**

1. Check Railway logs for errors
2. Verify Gmail credentials are correct
3. Ensure student has valid email in database
4. Check 5 departments are all approved
5. Contact Gmail support if "less secure apps" error

---

## ✨ Summary

| Item | Status | Action |
|------|--------|--------|
| **Email Feature Code** | ✅ Complete | Already built in |
| **Missing Configuration** | 🔴 Need Setup | Add to Railway Variables |
| **Gmail Account** | ⏳ Setup Required | Create dedicated account |
| **App Password** | ⏳ Generate Required | Get 16-char password |
| **Railway Variables** | ⏳ Add Required | Add 5 new variables |
| **Testing** | ⏳ Test Required | Trigger full clearance |

**Once configured: ✅ Emails will be sent automatically to all cleared students!**

---

**Last Updated:** April 17, 2026  
**Feature Status:** Complete and ready (just needs email configuration)  
**Setup Time:** ~15 minutes
