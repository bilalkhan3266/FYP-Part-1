# Certificate System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except public verification) require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Generate Certificate PDF

**Endpoint**: `POST /api/certificates/:certId/generate-pdf`

**Description**: Generate and download certificate as PDF

**Authentication**: Required (Student)

**Parameters**:
- `:certId` (path) - Certificate ID from ComprehensiveClearanceValidation

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response**:
- **Type**: `application/pdf`
- **Status**: 200
- **Body**: PDF File Binary Data

**Example**:
```bash
curl -X POST http://localhost:5000/api/certificates/507f1f77bcf86cd799439011/generate-pdf \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o certificate.pdf
```

**Error Responses**:
```json
{
  "success": false,
  "message": "Certificate not found or not authorized"
}
```

---

### 2. Send Certificate Email

**Endpoint**: `POST /api/certificates/:certId/send-email`

**Description**: Generate PDF and send via email with attachment

**Authentication**: Required (Student)

**Parameters**:
- `:certId` (path) - Certificate ID

**Request**:
```javascript
curl -X POST http://localhost:5000/api/certificates/507f1f77bcf86cd799439011/send-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Certificate email sent successfully",
  "messageId": "<message-id-from-email-provider>"
}
```

**Response** (Error):
```json
{
  "success": false,
  "reason": "Failed to generate PDF",
  "message": "Failed to send certificate email"
}
```

**Email Details**:
- **To**: Student's registered email
- **Subject**: 🎓 Your Clearance Certificate - Approved
- **Attachment**: PDF file (Clearance_Certificate_[SAPID].pdf)
- **Template**: Professional HTML with branding

---

### 3. Download Certificate

**Endpoint**: `GET /api/certificates/:certId/download`

**Description**: Download PDF certificate (may download from backend or generate new)

**Authentication**: Required (Student)

**Parameters**:
- `:certId` (path) - Certificate ID

**Request**:
```bash
curl -X GET http://localhost:5000/api/certificates/507f1f77bcf86cd799439011/download \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -o certificate.pdf
```

**Response**:
- **Type**: `application/pdf`
- **Status**: 200
- **Headers**:
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="Clearance_Certificate_60.pdf"
  ```

---

### 4. List All Certificates

**Endpoint**: `GET /api/certificates`

**Description**: Get all certificates for logged-in student

**Authentication**: Required (Student)

**Request**:
```bash
curl -X GET http://localhost:5000/api/certificates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student_name": "John Doe",
      "sapid": "60",
      "father_name": "Father Name",
      "program": "BS(CS)",
      "semester": "8",
      "department": "Computer Science",
      "degree_status": "Active",
      "qr_code": "CLEARANCE_60_507f1f77bcf86cd799439011",
      "submitted_at": "2026-04-13T10:30:00Z",
      "completed_at": "2026-04-13T10:35:00Z",
      "validationId": "507f1f77bcf86cd799439011",
      "departments": [
        {
          "name": "Coordination",
          "status": "Approved",
          "validatedAt": "2026-04-13T10:30:00Z"
        },
        {
          "name": "Transport",
          "status": "Approved",
          "validatedAt": "2026-04-13T10:31:00Z"
        },
        {
          "name": "Library",
          "status": "Approved",
          "validatedAt": "2026-04-13T10:32:00Z"
        },
        {
          "name": "Fee Department",
          "status": "Approved",
          "validatedAt": "2026-04-13T10:33:00Z"
        },
        {
          "name": "Student Service",
          "status": "Approved",
          "validatedAt": "2026-04-13T10:34:00Z"
        }
      ]
    }
  ],
  "count": 1
}
```

---

### 5. Get Certificate Details

**Endpoint**: `GET /api/clearance-certificate`

**Description**: Get latest certificate details for student

**Authentication**: Required (Student)

**Request**:
```bash
curl -X GET http://localhost:5000/api/clearance-certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "certificate": {
    "student_name": "John Doe",
    "sapid": "60",
    "father_name": "Father Name",
    "program": "BS(CS)",
    "semester": "8",
    "department": "Computer Science",
    "degree_status": "Active",
    "qr_code": "CLEARANCE_60_507f1f77bcf86cd799439011",
    "submitted_at": "2026-04-13T10:30:00Z",
    "completed_at": "2026-04-13T10:35:00Z",
    "validationId": "507f1f77bcf86cd799439011",
    "departments": [
      {
        "name": "Coordination",
        "status": "Approved",
        "validatedAt": "2026-04-13T10:30:00Z"
      },
      // ... other departments
    ]
  }
}
```

---

### 6. Verify Certificate (Public- No Auth)

**Endpoint**: `GET /api/verify/:certificateId`

**Description**: Verify certificate validity and details (public endpoint)

**Authentication**: Not Required ✅

**Parameters**:
- `:certificateId` (path) - Certificate ID

**Request**:
```bash
curl -X GET http://localhost:5000/api/verify/507f1f77bcf86cd799439011
```

**Response** (Valid Certificate):
```json
{
  "success": true,
  "verified": true,
  "certificate": {
    "student_name": "John Doe",
    "sapid": "60",
    "departments": [
      "Coordination",
      "Transport",
      "Library",
      "Fee Department",
      "Student Service"
    ],
    "completed_at": "2026-04-13T10:35:00Z",
    "certificate_id": "507f1f77bcf86cd799439011",
    "qr_code": "CLEARANCE_60_507f1f77bcf86cd799439011"
  }
}
```

**Response** (Invalid/Not Found):
```json
{
  "success": false,
  "message": "Certificate not found"
}
```

---

## Data Models

### ComprehensiveClearanceValidation (Certificate)

```javascript
{
  _id: ObjectId,
  student_id: ObjectId,              // Reference to User
  sapid: String,                     // Student SAP ID
  student_name: String,              // Full name
  father_name: String,               // Father's name
  program: String,                   // Degree program
  semester: String,                  // Current semester
  degree_status: String,             // Active/Graduated
  
  // Department validation results
  departmentStatuses: [
    {
      name: String,                  // Dept name
      status: String,                // Approved/Rejected
      reason: String,                // Reason
      pendingItems: [String],        // Pending issues
      validatedAt: Date
    }
  ],
  
  // Overall status
  overallStatus: String,             // Completed/Rejected
  certificateGenerated: Boolean,
  qr_code: String,
  certificate_generated_at: Date,
  
  // Timestamps
  submittedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Email Service

### sendCertificateEmail Function

**Location**: `backend/services/emailService.js`

**Input Parameters**:
```javascript
{
  studentEmail: "student@university.edu",
  studentName: "John Doe",
  sapId: "60",
  pdfBuffer: <Buffer>,              // PDF binary data
  certificateId: "507f1f77bcf86cd799439011",
  departments: ["Coordination", "Transport", ...],
  verificationLink: "http://app.com/verify/..."
}
```

**Output**:
```javascript
{
  success: true,
  messageId: "<email-provider-id>",
  email: "student@university.edu"
}
```

---

## PDF Generator Service

### generateCertificatePDF Function

**Location**: `backend/services/certificateGenerator.js`

**Input Parameters**:
```javascript
{
  studentName: String,               // Full name
  sapId: String,                    // SAP ID
  certificateId: String,            // Cert ID
  departments: Array,               // ["Dept1", "Dept2", ...]
  date: Date,                       // Completion date
  qrCodeData: String                // Data for QR code
}
```

**Output**:
```javascript
Buffer // PDF file as binary buffer
```

**PDF Features**:
- Professional A4 layout
- Embedded QR code
- Department list
- Signature placeholders
- University branding
- Print-friendly design

---

## Example: Complete Workflow

### 1. Clearance Approval

```
POST /api/clearance-requests (Auto-triggers on all approved)
↓
Generates PDF Certificate
Sends Email with Attachment
Creates Verification QR
```

### 2. Student Downloads Certificate

```
GET /api/certificates (List all certificates)
Select certificate
↓
POST /api/certificates/:id/generate-pdf
↓
Browser downloads PDF
```

### 3. Share Certificate

```
GET /api/verify/:certificateId (Share this link)
↓
Anyone can verify certificate
No authentication required
Shows public certificate details
```

---

## Rate Limiting

No rate limiting implemented. For production, consider:
- Max 10 requests per minute for certificate endpoints
- Max 5 email sends per hour per student
- Cache frequently accessed verifications

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Certificate not generated yet | Wait for clearance completion |
| 404 | Certificate not found | Wrong certificate ID |
| 401 | Unauthorized | Missing or invalid token |
| 500 | Failed to generate PDF | Check PDFKit installation |
| 500 | Failed to send email | Check Gmail credentials in .env |

---

## Testing with cURL

### Generate PDF
```bash
curl -X POST http://localhost:5000/api/certificates/507f1f77bcf86cd799439011/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o test.pdf
```

### Send Email
```bash
curl -X POST http://localhost:5000/api/certificates/507f1f77bcf86cd799439011/send-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Verify Certificate
```bash
curl -X GET http://localhost:5000/api/verify/507f1f77bcf86cd799439011
```

### List Certificates
```bash
curl -X GET http://localhost:5000/api/certificates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Technology Stack

- **PDF Generation**: PDFKit (Node.js)
- **QR Codes**: QRCode.js
- **Email**: Nodemailer (Gmail SMTP)
- **Frontend**: React + Tailwind CSS + html2canvas/jsPDF
- **Database**: MongoDB (ComprehensiveClearanceValidation)

---

**API Version**: 1.0.0
**Last Updated**: April 13, 2026
