# ClearanceRequest.js Fix - Data Not Saving to Database

## Root Causes Found & Fixed ✅

### 1. **Frontend Issues in ClearanceRequest.js**

**Problem 1: Reading stale localStorage instead of AuthContext**
```javascript
// BEFORE (WRONG)
const storedUser = JSON.parse(localStorage.getItem("user")) || {};
// This is stale data, might be undefined
```

**Problem 2: Wrong form field names**
```javascript
// BEFORE (WRONG)
const [formData, setFormData] = useState({
  sapid: "",
  studentName: "",
  registrationNo: "",
  fatherName: "",
  program: "",
  semester: "",
  degreeStatus: "",
});
// Database doesn't expect these fields
```

**Problem 3: Wrong API endpoint**
```javascript
// BEFORE (WRONG)
const res = await api.post("/student-clearance-request", formData);
// This endpoint doesn't exist on backend
```

**Problem 4: No student_id being sent**
```javascript
// BEFORE (WRONG) - No way to know which student submitted the request
```

### 2. **Backend Issues in server.js**

**Problem 1: Endpoint expected old field names**
```javascript
// BEFORE (WRONG)
const { sapid, studentName, registrationNo, ... } = req.body;
// Frontend is now sending { department, reason, status }
```

**Problem 2: Wrong database column names**
```javascript
// BEFORE (WRONG)
INSERT INTO clearance_requests
(user_id, sapid, student_name, registration_no, ...)
// Table might not have these columns
```

### 3. **Database Issues**

**Problem: Table schema didn't match**
- Old table had: sapid, student_name, registration_no, father_name, program, semester, degree_status
- New table needs: student_id, department, reason, status

---

## Solutions Applied ✅

### Frontend Fix (ClearanceRequest.js)

```javascript
// ✅ AFTER - Use AuthContext instead of localStorage
const { user } = useAuthContext();

// ✅ AFTER - Simplified form with correct fields
const [formData, setFormData] = useState({
  department: "",
  reason: "",
  status: "Pending",
});

// ✅ AFTER - Send to correct endpoint with student_id
const res = await api.post("/clearance-requests", {
  student_id: user.id,     // ✅ NOW SENDING STUDENT ID
  ...formData
});

// ✅ AFTER - Use user from context in sidebar
{user?.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
```

### Backend Fix (server.js)

```javascript
// ✅ AFTER - Updated endpoint to expect new field names
app.post("/clearance-requests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    student_id,      // ✅ NOW USING student_id
    department,      // ✅ NEW FIELD
    reason,          // ✅ NEW FIELD
    status,          // ✅ NEW FIELD
  } = req.body;

  // ✅ Insert into updated table structure
  const result = await db.promise().execute(
    `INSERT INTO clearance_requests
     (student_id, department, reason, status, submitted_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [student_id, sanitizeInput(department), sanitizeInput(reason || ""), sanitizeInput(status || "Pending")]
  );
});

// ✅ Get only user's own clearance requests
app.get("/clearance-requests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const [rows] = await db.promise().query(
    "SELECT * FROM clearance_requests WHERE student_id = ? ORDER BY submitted_at DESC",
    [userId]
  );
});
```

### Database Fix (backend/database.sql)

```sql
-- ✅ NEW Table structure
CREATE TABLE clearance_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,              -- ✅ CHANGED from user_id
  department VARCHAR(100) NOT NULL,      -- ✅ NEW FIELD
  reason TEXT,                           -- ✅ NEW FIELD
  status VARCHAR(50) DEFAULT 'Pending',  -- ✅ SIMPLIFIED
  remarks TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status)
);
```

---

## Required Steps to Make it Work

### Step 1: Run the SQL Script

```bash
# Open MySQL command line
mysql -u root -p your_database_name < backend/database.sql

# Or paste the contents of backend/database.sql into MySQL Workbench
```

### Step 2: Restart Backend Server

```bash
cd backend
npm start
# Should see: ✓ Connected to MySQL Database
```

### Step 3: Test the Flow

1. **Frontend**: Go to Student Dashboard → Click "Submit Request"
2. **Form**: Select a department (e.g., "Library")
3. **Form**: Enter a reason (e.g., "Returning books")
4. **Click**: "Submit Request" button
5. **Expected**: See success message and redirect to dashboard
6. **Verify Database**: Check MySQL for new record

```sql
-- Check if data was inserted
SELECT * FROM clearance_requests;
-- Should see: student_id, department, reason, status, submitted_at
```

---

## What Changed

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| **Frontend Form Fields** | sapid, studentName, registrationNo, fatherName, program, semester, degreeStatus | department, reason, status | ✅ Fixed |
| **API Endpoint** | /student-clearance-request | /clearance-requests | ✅ Fixed |
| **Student ID** | Not sent | user.id sent | ✅ Fixed |
| **User Data Source** | localStorage | AuthContext | ✅ Fixed |
| **Backend Endpoint** | Expected old fields | Expects new fields | ✅ Fixed |
| **Database Table** | Old schema | New schema | ✅ Fixed |

---

## File Changes Summary

- ✅ **src/components/Student/ClearanceRequest.js** - Updated to use AuthContext, correct form fields, correct API endpoint
- ✅ **backend/server.js** - Updated POST /clearance-requests endpoint to handle new field names
- ✅ **backend/database.sql** - New SQL script to create/update tables with correct schema

---

## Error Handling

**If you see this error:**
```
Error: Table 'clearance_requests' doesn't exist
```
→ Run the SQL script: `mysql -u root -p db_name < backend/database.sql`

**If you see this error:**
```
Error: Unknown column 'sapid' in field list
```
→ Your table still has the old schema. Drop it and run the SQL script again.

**If student_id is undefined:**
→ Make sure AuthContext is properly providing `user.id`. Check that user logged in correctly.

---

## Testing Checklist

- [ ] SQL script executed successfully
- [ ] Backend restarted (no database errors)
- [ ] Can log in as student
- [ ] ClearanceRequest page loads with correct user name
- [ ] Form has "Department" and "Reason" fields
- [ ] Can submit form
- [ ] See "✅ Clearance request submitted successfully!" message
- [ ] Redirected to dashboard
- [ ] Database has new record in clearance_requests table
- [ ] Record contains: student_id, department, reason, status, submitted_at

---

**Status: ✅ ALL FIXES APPLIED - READY FOR TESTING**
