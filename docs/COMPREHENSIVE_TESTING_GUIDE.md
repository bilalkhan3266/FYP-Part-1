# Comprehensive Clearance System - Testing Guide

## 🧪 Unit Tests & Verification

### Test 1: All Departments Approved (SAP 999)
**Setup:**
- Create student with SAP ID 999
- Ensure NO DepartmentIssue records exist for SAP 999
- Student must exist in database

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/clearance-requests \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student All Clear",
    "sapid": "999",
    "registration_no": "REG999",
    "father_name": "Test Father",
    "program": "Computer Science",
    "semester": "6",
    "degree_status": "Active"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "✅ Clearance APPROVED - All departments cleared!",
  "overallStatus": "Completed",
  "certificateGenerated": true,
  "departmentStatuses": [
    {
      "name": "Coordination",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Library",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Transport",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Finance",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Student Services",
      "status": "Approved",
      "reason": "No outstanding dues"
    }
  ],
  "approvedDepartments": ["Coordination", "Library", "Transport", "Finance", "Student Services"],
  "rejectedDepartments": []
}
```

**Verification:**
- ✅ All 5 departments show "Approved"
- ✅ overallStatus === "Completed"
- ✅ certificateGenerated === true
- ✅ rejectedDepartments is empty

---

### Test 2: Mixed Approvals/Rejections (SAP 260)
**Setup:**
- Student SAP ID: 260
- Create DepartmentIssue records:
  - Library: "Physics Book" (status: "Issued")
  - Finance: "Tuition Fee" (status: "Issued")
  - Coordination, Transport, Student Services: NO records

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/clearance-requests \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Ahmed Ali",
    "sapid": "260",
    "registration_no": "REG260",
    "father_name": "Ali Khan",
    "program": "Computer Science",
    "semester": "6",
    "degree_status": "Active"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "❌ Clearance REJECTED - Please fix the issues and resubmit",
  "overallStatus": "Rejected",
  "certificateGenerated": false,
  "departmentStatuses": [
    {
      "name": "Coordination",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Library",
      "status": "Rejected",
      "reason": "Pending items: Physics Book",
      "pendingItems": ["Physics Book"]
    },
    {
      "name": "Transport",
      "status": "Approved",
      "reason": "No outstanding dues"
    },
    {
      "name": "Finance",
      "status": "Rejected",
      "reason": "Pending items: Tuition Fee",
      "pendingItems": ["Tuition Fee"]
    },
    {
      "name": "Student Services",
      "status": "Approved",
      "reason": "No outstanding dues"
    }
  ],
  "approvedDepartments": ["Coordination", "Transport", "Student Services"],
  "rejectedDepartments": ["Library", "Finance"]
}
```

**Verification:**
- ✅ Coordination: Approved (no dues)
- ✅ Library: Rejected (with reason)
- ✅ Transport: Approved (no dues)
- ✅ Finance: Rejected (with reason)
- ✅ Student Services: Approved (no dues)
- ✅ overallStatus === "Rejected"
- ✅ certificateGenerated === false
- ✅ rejectedDepartments contains Library and Finance

---

### Test 3: Resubmission Block After Completion (SAP 999)
**Setup:**
- Run Test 1 first (SAP 999 gets completed clearance)
- Try to submit clearance request again with same sapid

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/clearance-requests \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student All Clear",
    "sapid": "999",
    "registration_no": "REG999",
    "father_name": "Test Father",
    "program": "Computer Science",
    "semester": "6",
    "degree_status": "Active"
  }'
```

**Expected Result:**
```json
{
  "success": false,
  "message": "You have already completed your clearance. Please do not resubmit."
}
```

**Verification:**
- ✅ HTTP Status: 409 (Conflict)
- ✅ Error message indicates already completed
- ✅ No new validation record created

---

### Test 4: Resubmission Allowed After Rejection (SAP 260)
**Setup:**
- Run Test 2 first (SAP 260 gets rejected on Library and Finance)
- Clear the DepartmentIssue records for Library and Finance
- Try to submit clearance request again

**Step 1 - Create DepartmentIssue Records:**
```javascript
// In MongoDB - CREATE dues
db.department_issues.insertMany([
  {
    studentId: "260",
    departmentName: "Library",
    issueType: "Pending Books",
    status: "Issued",
    createdAt: new Date()
  },
  {
    studentId: "260",
    departmentName: "Finance",
    issueType: "Tuition Fee",
    status: "Issued",
    createdAt: new Date()
  }
])
```

**Step 2 - Submit Clearance (First Time):**
```bash
curl -X POST http://localhost:5000/api/clearance-requests \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Ahmed Ali",
    "sapid": "260",
    "registration_no": "REG260",
    "father_name": "Ali Khan",
    "program": "Computer Science",
    "semester": "6",
    "degree_status": "Active"
  }'
```

**Expected Result:** overallStatus === "Rejected"

**Step 3 - Clear the Issues:**
```javascript
// In MongoDB - CLEAR dues
db.department_issues.updateMany(
  { studentId: "260", departmentName: { $in: ["Library", "Finance"] } },
  { $set: { status: "Cleared" } }
)
```

**Step 4 - Resubmit Clearance (Second Time):**
```bash
curl -X POST http://localhost:5000/api/clearance-requests \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Ahmed Ali",
    "sapid": "260",
    "registration_no": "REG260",
    "father_name": "Ali Khan",
    "program": "Computer Science",
    "semester": "6",
    "degree_status": "Active"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "✅ Clearance APPROVED - All departments cleared!",
  "overallStatus": "Completed",
  "certificateGenerated": true,
  "isResubmission": true
  // ... all departments approved
}
```

**Verification:**
- ✅ First submission: overallStatus === "Rejected"
- ✅ After clearing issues and resubmitting
- ✅ Second submission: overallStatus === "Completed"
- ✅ certificateGenerated === true
- ✅ isResubmission === true
- ✅ No error blocking the resubmission

---

### Test 5: Get Clearance Status Endpoint
**Setup:**
- Use SAP 260 which has completed clearance

**Test Command:**
```bash
curl -X GET "http://localhost:5000/api/clearance-status?student_id=USER_MONGODB_ID"
```

**Expected Result:**
```json
{
  "success": true,
  "overallStatus": "Completed",
  "certificateGenerated": true,
  "qrCode": "CLEARANCE_260_507f1f77bcf86cd799439011",
  "departmentStatuses": [
    {
      "name": "Coordination",
      "status": "Approved",
      "reason": "No outstanding dues",
      "pendingItems": [],
      "validatedAt": "2026-04-03T10:30:00Z"
    },
    // ... other departments
  ],
  "summary": {
    "total": 5,
    "cleared": 5,
    "rejected": 0,
    "progressPercentage": 100
  }
}
```

**Verification:**
- ✅ Returns latest clearance validation record
- ✅ Includes all 5 department statuses
- ✅ Shows QR code if generated
- ✅ Shows correct summary statistics

---

## 🔍 Code Verification Points

### 1. Verify ComprehensiveClearanceValidation Model
```bash
File: backend/models/ComprehensiveClearanceValidation.js
Checklist:
  ✅ Has departmentStatuses array schema
  ✅ Each entry has: name, status, reason, pendingItems, validatedAt
  ✅ Has overallStatus field
  ✅ Has certificateGenerated boolean
  ✅ Has submissionCount
  ✅ Has indexes on {sapid, overallStatus} and {student_id}
```

### 2. Verify clearanceValidator Utility
```bash
File: backend/utils/clearanceValidator.js
Checklist:
  ✅ Has validateStudentClearanceAllDepartments() function
  ✅ Function loops through all 5 departments: 
      ["Coordination", "Library", "Transport", "Finance", "Student Services"]
  ✅ NO break/return statements in the loop
  ✅ Checks ALL 5 before deciding overallStatus
  ✅ Has canStudentSubmitClearance() function
  ✅ Function checks previous completion/rejection status
  ✅ Returns canSubmit boolean with reason
```

### 3. Verify Server Endpoint Changes
```bash
File: backend/server.js
Location: POST /api/clearance-requests (around line 647)
Checklist:
  ✅ Calls canStudentSubmitClearance() first
  ✅ Returns 409 if submission blocked
  ✅ Calls validateStudentClearanceAllDepartments() ONCE
  ✅ Passes sapid to validation function
  ✅ Saves to ComprehensiveClearanceValidation model
  ✅ Checks overallStatus === "Completed" for certificate
  ✅ Splits departments into approved/rejected arrays
  ✅ Returns new response format with departmentStatuses[]

Location: GET /api/clearance-status (around line 956)
Checklist:
  ✅ Queries ComprehensiveClearanceValidation
  ✅ Fetches latest record (sorted by submittedAt)
  ✅ Returns departmentStatuses[] array
  ✅ Returns summary with total/cleared/rejected counts
  ✅ Includes certificateGenerated flag
```

---

## 📊 Data Validation Examples

### Scenario A: Student with No Issues
```
Database State:
  DepartmentIssue collection: EMPTY for sapId 260

Expected Validation:
  Coordination → Check: 0 issues found → Approved ✅
  Library → Check: 0 issues found → Approved ✅
  Transport → Check: 0 issues found → Approved ✅
  Finance → Check: 0 issues found → Approved ✅
  Student Services → Check: 0 issues found → Approved ✅

Result:
  overallStatus: "Completed"
  certificateGenerated: true
```

### Scenario B: Student with Multiple Issues
```
Database State:
  DepartmentIssue:
    - studentId: "260", departmentName: "Library", 
      issueType: "Book", status: "Issued"
    - studentId: "260", departmentName: "Finance",
      issueType: "Fee", status: "Pending"

Expected Validation:
  Coordination → Check: 0 issues found → Approved ✅
  Library → Check: 1 issue found (Issued) → Rejected ❌
  Transport → Check: 0 issues found → Approved ✅
  Finance → Check: 1 issue found (Pending) → Rejected ❌
  Student Services → Check: 0 issues found → Approved ✅

Result:
  overallStatus: "Rejected"
  certificateGenerated: false
  rejectedDepartments: ["Library", "Finance"]
```

### Scenario C: Student Cleared Issues, Resubmits
```
Cycle 1 - Initial Submission:
  Database: DepartmentIssue with status: "Issued" for Library
  Result: Rejected (Library has uncleared issue)

Action: Admin clears the issue
  Update: DepartmentIssue status: "Cleared"

Cycle 2 - Resubmission:
  Database: DepartmentIssue with status: "Cleared" for Library
  Validation: status = "Cleared" → excluded from validation
  Result: Approved (ALL departments clear)
  Certificate: GENERATED ✅
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Certificate Not Generated On Approval
**Symptom:** overallStatus === "Completed" but certificateGenerated === false

**Check:**
```javascript
// In POST /api/clearance-requests endpoint:
if (validationResult.overallStatus === "Completed") {
  // This MUST execute
  const qr_code = `CLEARANCE_${sapid}_${validationId}`;
  // ... generate certificate
  comprehensiveRecord.certificateGenerated = true;
  comprehensiveRecord.qr_code = qr_code;
} else {
  // Only reaches here if any dept rejected
  comprehensiveRecord.certificateGenerated = false;
}
```

### Issue 2: Validation Only Checks One Department
**Symptom:** Only Coordination status returned, others missing

**Check:**
```javascript
// validateStudentClearanceAllDepartments MUST have:
const departments = ["Coordination", "Library", "Transport", "Finance", "Student Services"];

for (const dept of departments) {  // ← MUST NOT have break/return inside
  // Check this department
  // ... validation logic ...
}
// ← ALL 5 must be checked before returning
```

### Issue 3: Cannot Resubmit After Rejection
**Symptom:** After rejection, trying to resubmit gives "Cannot submit" error

**Check canStudentSubmitClearance:**
```javascript
if (overallStatus === "Rejected") {
  // This case MUST allow submission
  return { canSubmit: true, isResubmission: true };
}
```

---

## 📈 Performance Checks

### Query Performance
```bash
Database Query: 
  db.department_issues.find({
    studentId: "260",
    departmentName: "Library",
    status: { $ne: "Cleared" }
  })

Expected: < 100ms per department
Total for 5 departments: < 500ms

Issue: If slow, add index on {studentId, departmentName}
```

---

## ✅ Sign-Off Checklist

Before considering the refactor complete, verify:

- [ ] Test 1 Passed: All departments approved → Certificate generated
- [ ] Test 2 Passed: Mixed approvals/rejections → Correct per-dept status
- [ ] Test 3 Passed: Cannot resubmit after completion → 409 error
- [ ] Test 4 Passed: Can resubmit after rejection → Succeeds if issues cleared
- [ ] Test 5 Passed: GET endpoint returns comprehensive data
- [ ] Code Review: ComprehensiveClearanceValidation model complete
- [ ] Code Review: clearanceValidator functions correct
- [ ] Code Review: Server endpoints properly refactored
- [ ] Database: Indexes created on {sapid, overallStatus}
- [ ] Database: Old DepartmentClearance data still available for reference
- [ ] Frontend: Dashboard updated to show new response format
- [ ] Frontend: Rejection reasons displayed per department
- [ ] Frontend: Certificate download only shown when certificateGenerated === true
- [ ] Logs: Validation results logged with timestamps and reasons
- [ ] Performance: Validation completes in < 1 second

---

**Status:** Testing Guide Ready  
**Last Updated:** April 3, 2026
