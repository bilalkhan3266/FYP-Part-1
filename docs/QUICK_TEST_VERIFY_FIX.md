# ✅ Quick Test: Verify 500 Error Is Fixed

**Estimated Time**: 2-3 minutes

---

## Backend Verification

### 1. Check Model Schema ✓
```bash
# Verify enum values are correct
grep -n "enum:" backend/models/ComprehensiveClearanceValidation.js | head -1
```

Expected output:
```
25:        enum: ["Coordination", "Library", "Transport", "Fee Department", "Student Service"],
```

### 2. Check Validator ✓
```bash
# Verify validator uses correct names
grep -A 6 "const departments = \[" backend/utils/clearanceValidator.js
```

Expected output:
```
const departments = [
  "Coordination",
  "Library",
  "Transport",
  "Fee Department",
  "Student Service"
];
```

---

## API Test (Postman or cURL)

### Test Case: Submit Clearance Request

**Endpoint**: `POST http://192.168.100.198:5000/api/clearance-requests`

**Headers**:
```
Authorization: Bearer <valid_student_token>
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "sapid": "48397",
  "student_name": "Test Student",
  "father_name": "Father Name",
  "program": "BS Computer Science",
  "semester": "6",
  "degree_status": "Regular"
}
```

### Expected Response ✅

**Status**: `200 OK` (NOT 500)

**Response Body**:
```json
{
  "success": true,
  "overallStatus": "Rejected",
  "certificateGenerated": false,
  "departmentStatuses": [
    {
      "name": "Coordination",
      "status": "Approved",
      "reason": "No outstanding dues or items",
      "pendingItems": [],
      "validatedAt": "2026-04-12T..."
    },
    {
      "name": "Library",
      "status": "Approved",
      "reason": "No outstanding dues or items",
      "pendingItems": [],
      "validatedAt": "2026-04-12T..."
    },
    {
      "name": "Transport",
      "status": "Approved",
      "reason": "No outstanding dues or items",
      "pendingItems": [],
      "validatedAt": "2026-04-12T..."
    },
    {
      "name": "Fee Department",
      "status": "Rejected",
      "reason": "Pending items not cleared: Fee: Outstanding dues - Rs. 25000",
      "pendingItems": [
        "Fee: Outstanding dues - Rs. 25000"
      ],
      "validatedAt": "2026-04-12T..."
    },
    {
      "name": "Student Service",
      "status": "Approved",
      "reason": "No outstanding dues or items",
      "pendingItems": [],
      "validatedAt": "2026-04-12T..."
    }
  ],
  "approvedDepartments": ["Coordination", "Library", "Transport", "Student Service"],
  "rejectedDepartments": ["Fee Department"]
}
```

### ❌ DO NOT See

❌ `500 Internal Server Error`
❌ `"not a valid enum value"`
❌ `"ComprehensiveClearanceValidation validation failed"`
❌ `"Finance"` in response (should be "Fee Department")
❌ `"Student Services"` in response (should be "Student Service")

---

## Browser Console Check

Open Developer Tools (F12) → Console tab

### Should NOT see:
```
❌ AxiosError
❌ 500 Internal Server Error
❌ "Failed to process clearance request: ComprehensiveClearanceValidation..."
❌ "is not a valid enum value"
```

### Should see:
```
✅ Response 200 OK
✅ Success with complete department statuses
✅ "Fee Department" in the response
✅ "Student Service" in the response
```

---

## Database Verification

### Check Stored Document
```javascript
// In MongoDB CLI
db.comprehensiveclearancevalidations.findOne({ sapid: "48397" })
```

Should show in `departmentStatuses` array:
```javascript
[
  { name: "Coordination", ... },
  { name: "Library", ... },
  { name: "Transport", ... },
  { name: "Fee Department", ... },    // ✅ Correct name
  { name: "Student Service", ... }    // ✅ Correct name
]
```

---

## Full End-to-End Test

### Step 1: Login as Student
```bash
curl -X POST http://192.168.100.198:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "48397@students.riphah.edu.pk",
    "password": "password123"
  }'
```
Copy the token from response.

### Step 2: Submit Clearance
```bash
curl -X POST http://192.168.100.198:5000/api/clearance-requests \
  -H "Authorization: Bearer <token_from_step_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "sapid": "48397",
    "student_name": "Student Name",
    "father_name": "Father Name",
    "program": "BS Computer Science",
    "semester": "6",
    "degree_status": "Regular"
  }'
```

### Step 3: Check Response
- ✅ Status code: 200
- ✅ `success: true`
- ✅ `departmentStatuses` with correct names
- ✅ No 500 error

### Step 4: Check Database
```javascript
db.comprehensiveclearancevalidations.findOne({ sapid: "48397" })
```
- ✅ Document saved
- ✅ Correct department names stored
- ✅ No model validation errors

---

## Rollback (if needed)

If you need to revert:
```bash
git diff HEAD~1 backend/models/ComprehensiveClearanceValidation.js
git diff HEAD~1 backend/utils/clearanceValidator.js
git diff HEAD~1 backend/server.js
```

---

## Success Criteria ✅

- [ ] No 500 errors when submitting clearance
- [ ] Response includes "Fee Department" (not "Finance")
- [ ] Response includes "Student Service" (not "Student Services")
- [ ] All 5 departments appear in response
- [ ] Database stores correct names
- [ ] Student can see clearance status in frontend
- [ ] No validation errors in console

---

## If Tests Fail

### 500 Error Still Present
- Check that model enum was updated correctly
- Verify no syntax errors in changes
- Restart backend server
- Check MongoDB connection

### Wrong Department Names in Response
- Verify mapping code was removed
- Check that validator is using correct names
- Restart backend

### Partial Failure (Some Names Wrong)
- One of the fixes wasn't applied
- Check all 6 file locations listed above
- Verify all changes were saved

---

## Files to Verify

1. **backend/models/ComprehensiveClearanceValidation.js**
   - Line 25-26: Enum should be `["Coordination", "Library", "Transport", "Fee Department", "Student Service"]`

2. **backend/utils/clearanceValidator.js**
   - Line 10-19: `const departments` should list correct 5 names

3. **backend/controllers/autoClearanceController.js**
   - Line 9: `const DEPARTMENTS` should have correct names

4. **backend/server.js**
   - Line ~760: Test data should use correct names
   - Verify NO mapping functions like `deptNameMap` or `departmentNameMap`

---

## Quick Test Summary

| Check | Expected | Status |
|-------|----------|--------|
| Model Enum | 5 correct names | ✓ |
| Validator | Uses correct names | ✓ |
| API Response | 200 OK + correct names | ✓ |
| Database | Correct names stored | ✓ |
| No 500 Error | ✓ | ✓ |
| Department Names | Fee Department, Student Service | ✓ |
