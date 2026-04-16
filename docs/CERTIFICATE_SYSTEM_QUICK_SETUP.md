# Certificate System - Quick Setup Guide

## 🚀 Installation & Configuration

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install html2canvas jspdf
```

### Step 2: Configure Email Service

Edit `backend/.env` and add Gmail credentials:

```env
# Gmail Configuration (Required for Email Sending)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Frontend URL (for email verification links)
FRONTEND_URL=http://192.168.100.198:3000
```

**Getting Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already done)
3. Go to "App passwords" (appears under 2FA settings)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Paste into `.env` as `GMAIL_PASSWORD`

### Step 3: Restart Services

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## 📋 What Was Implemented

### Backend (Node.js/Express)

✅ **PDF Certificate Generation Service**
- `backend/services/certificateGenerator.js`
- Generates professional PDF using PDFKit
- Includes QR codes, student info, department list
- Creates professional university-style certificate

✅ **Email Service with Attachments**
- `backend/services/emailService.js`
- Sends certificate email with PDF attachment
- Professional HTML email template
- Handles approval and rejection notifications

✅ **New API Endpoints**
- `POST /api/certificates/:certId/generate-pdf` - Generate PDF
- `POST /api/certificates/:certId/send-email` - Send email with attachment
- `GET /api/certificates/:certId/download` - Download certificate
- `GET /api/verify/:certificateId` - Public verification endpoint

✅ **Automatic Trigger**
- Clearance approval automatically triggers:
  - PDF generation
  - Email sending with attachment
  - QR code creation
  - Notification to student

### Frontend (React)

✅ **Professional Certificate Component**
- `frontend/src/components/Student/ProfessionalCertificateDesign.js`
- Premium university-style design
- Responsive layout (mobile & desktop)
- Download, Print, Share buttons
- QR code display for verification

✅ **UI Improvements**
- Centered card layout
- Gold/Blue color scheme
- Elegant typography
- Shadow and spacing effects
- Print-friendly CSS

---

## 🧪 Testing the System

### Test 1: Generate Certificate

```bash
# 1. Login as student
# 2. Submit clearance request
# 3. All 5 departments should approve automatically
# 4. Check if certificate appears in dashboard
```

### Test 2: Download PDF

```bash
# 1. After approval, go to Certificates section
# 2. Click "Download Certificate"
# 3. PDF should download as: Clearance_Certificate_[SAP].pdf
# 4. Open and verify content
```

### Test 3: Email with Attachment

```bash
# 1. Check student email (may be in spam)
# 2. Email subject: "🎓 Your Clearance Certificate - Approved"
# 3. Attachment: Clearance_Certificate_[SAP].pdf
# 4. Download and verify PDF quality
```

### Test 4: QR Code Verification

```bash
# 1. In certificate view, scan QR code
# 2. Or manually visit: /verify/[certificate-id]
# 3. Should show certificate verification page
# 4. Displays student info and clearance status
```

---

## 👀 Visual Reference

### Certificate Design

```
┌─────────────────────────────────────────────────┐
│         Riphah International University         │
│          CLEARANCE CERTIFICATE                  │
│     Faculty of Engineering & Sciences           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Student Name: JOHN DOE                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Student ID (SAP): 60                      │ │
│  │ Date of Completion: April 13, 2026       │ │
│  │ Certificate ID: 507f1f77bcf86cd799439011 │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Approved by the Following Departments:        │
│  ✓ Coordination      ✓ Transport               │
│  ✓ Library           ✓ Fee Department          │
│  ✓ Student Service                             │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │                                         │  │
│  │           [QR CODE HERE]                │  │
│  │       (Scan to Verify)                  │  │
│  │                                         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ___________  ___________  [SEAL]             │
│  Registrar    Head of Dept                     │
│                                                 │
│  Riphah International University, Islamabad   │
│  Generated on April 13, 2026                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Email Template

```
Subject: 🎓 Your Clearance Certificate - Approved

Dear John Doe,

Congratulations! Your clearance request has been APPROVED by all departments.
Your clearance certificate is attached to this email.

Student ID (SAP): 60
Certificate ID: 507f1f77bcf86cd799439011
Approval Date: April 13, 2026

✓ Cleared by All Departments:
  • Coordination
  • Transport
  • Library
  • Fee Department
  • Student Service

[VERIFY CERTIFICATE] [VIEW DASHBOARD]

Attachment: Clearance_Certificate_60.pdf

---
Riphah International University
Office of the Registrar
```

---

## 🔍 Checking If Everything Works

### Check Backend Services

```bash
# 1. Backend should start without errors
npm start

# Look for:
# ✅ MongoDB connected successfully!
# 🚀 Server running on http://localhost:5000

# 2. Check if services are loaded
ls -la backend/services/
# Should show:
# - certificateGenerator.js
# - emailService.js
```

### Check Frontend Component

```bash
# 1. Frontend should start
npm start

# Look for successful compilation

# 2. Navigate to Certificates section
# Should see ProfessionalCertificateDesign component
```

### Check Email Configuration

```bash
# 1. Verify .env has credentials
cat backend/.env | grep GMAIL

# 2. Check Gmail account
# - Go to https://myaccount.google.com/security
# - Verify 2FA enabled
# - Check App passwords list shows recent entry
```

---

## 📊 Certificate Workflow

```
Student Submits Clearance Request
           ↓
     Validation Process
    (5 Department Check)
           ↓
    All Departments Approve?
           ↓ YES
    ✅ Approved Status Set
           ↓
    Generate Certificate ID
    Generate QR Code
           ↓
    📄 Generate PDF Certificate
    Using PDFKit Service
           ↓
    📧 Send Email with:
    - PDF Attachment
    - Verification Link
    - Student Info
           ↓
    Create System Notification
    Update Dashboard
           ↓
    Student Receives Email
    Downloads Certificate
    Scans QR Code
    Shares Certificate
```

---

## 🆘 Troubleshooting

### Issue: "Email not sending"

**Solution:**
1. Verify `.env` file has correct credentials
2. Use app password, NOT regular Gmail password
3. Check if 2FA is enabled in Gmail account
4. Check spam folder in email
5. Check server logs for error messages

```bash
# Check logs for email errors
tail -100 server.log | grep -i email
```

### Issue: "PDF not generating"

**Solution:**
1. Verify PDFKit is installed: `npm list pdfkit`
2. Check server logs for PDFKit errors
3. Verify QRCode package: `npm list qrcode`
4. Check if approval triggers PDF generation

```bash
# Check logs for PDF generation
tail -100 server.log | grep -i "GENERATING PDF"
```

### Issue: "Certificate not appearing"

**Solution:**
1. Verify clearance status is "Completed"
2. Check if certificateGenerated flag is true
3. Verify student email is in database
4. Check Frontend console for API errors

```bash
# Check certificate in database
curl -X GET http://localhost:5000/api/certificates \
  -H "Authorization: Bearer [TOKEN]"
```

---

## 📦 Dependencies Summary

**Backend** (Already Installed):
- `nodemailer: ^8.0.2` - Email sending
- `pdfkit: ^0.18.0` - PDF generation
- `qrcode: ^1.5.4` - QR code generation

**Frontend** (Install with command below):
- `html2canvas` - HTML to canvas conversion
- `jspdf` - PDF generation (fallback)

**Installation:**
```bash
cd frontend
npm install html2canvas jspdf
```

---

## ✨ Features Implemented

- ✅ Professional university-style certificate design
- ✅ Automatic PDF generation using PDFKit
- ✅ QR code embedding and verification
- ✅ Email sending with PDF attachment
- ✅ Modern React component with Tailwind CSS
- ✅ Download, Print, Share functionality
- ✅ Public certificate verification endpoint
- ✅ Responsive design (mobile & desktop)
- ✅ Print-friendly CSS
- ✅ Professional email templates

---

## 🎉 Next Steps

1. ✅ Run `npm install html2canvas jspdf` in frontend
2. ✅ Configure Gmail credentials in `.env`
3. ✅ Restart backend and frontend
4. ✅ Test with clearance request
5. ✅ Check email for certificate
6. ✅ Download and verify PDF quality
7. ✅ Scan QR code to verify

---

**Status**: 🚀 READY TO USE
**Date**: April 13, 2026
**Version**: 1.0.0
