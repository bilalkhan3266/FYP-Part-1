# Side-by-Side Comparison: Before vs After

## 🔴 BEFORE (Broken) → 🟢 AFTER (Fixed)

---

## Component: ClearanceRequest.js

### Import & Setup

```javascript
// ❌ BEFORE
import { useNavigate } from "react-router-dom";
const storedUser = JSON.parse(localStorage.getItem("user")) || {};

// ✅ AFTER
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ClearanceRequest() {
  const navigate = useNavigate();
  const { user } = useAuthContext();  // ← Fresh data from context
```

---

### Form State

```javascript
// ❌ BEFORE
const [formData, setFormData] = useState({
  sapid: "",              // ← Not in database
  studentName: "",        // ← Not in database
  registrationNo: "",     // ← Not in database
  fatherName: "",         // ← Not in database
  program: "",            // ← Not in database
  semester: "",           // ← Not in database
  degreeStatus: "",       // ← Not in database
});

// ✅ AFTER
const [formData, setFormData] = useState({
  department: "",         // ← In database ✓
  reason: "",             // ← In database ✓
  status: "Pending",      // ← In database ✓
});
```

---

### Form Submit Handler

```javascript
// ❌ BEFORE
try {
  const res = await api.post("/student-clearance-request", formData);
  // ↑ WRONG ENDPOINT
  // ↑ NOT SENDING student_id
  // ↑ SENDING WRONG FIELDS
  
  if (res.data.success) {
    alert("✅ Clearance request submitted successfully!");
    setFormData({
      sapid: "",
      studentName: "",
      registrationNo: "",
      fatherName: "",
      program: "",
      semester: "",
      degreeStatus: "",
    });
    navigate("/student-dashboard");
  }
} catch (error) {
  alert(error.response?.data?.message || "Unable to submit request");
}

// ✅ AFTER
try {
  const res = await api.post("/clearance-requests", {
    student_id: user.id,  // ← NOW SENDING THIS
    ...formData           // ← department, reason, status
  });
  // ↑ CORRECT ENDPOINT
  // ↑ INCLUDES student_id
  // ↑ CORRECT FIELDS
  
  if (res.data.success) {
    alert("✅ Clearance request submitted successfully!");
    setFormData({
      department: "",
      reason: "",
      status: "Pending",
    });
    navigate("/student-dashboard");
  }
} catch (error) {
  alert(error.response?.data?.message || "Unable to submit request");
}
```

---

### Sidebar User Display

```javascript
// ❌ BEFORE
<div className="sd-avatar">
  {storedUser.name ? storedUser.name.charAt(0).toUpperCase() : "?"}
  // ↑ Stale data from localStorage
</div>
<h3 className="sd-name">{storedUser.name || "Student"}</h3>
<p className="sd-small">
  {storedUser.sap || "N/A"} • {storedUser.department || "N/A"}
</p>

// ✅ AFTER
<div className="sd-avatar">
  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
  // ↑ Fresh data from AuthContext
</div>
<h3 className="sd-name">{user?.full_name || "Student"}</h3>
<p className="sd-small">
  {user?.sap || "N/A"} • {user?.department || "N/A"}
</p>
```

---

### Form Fields HTML

```javascript
// ❌ BEFORE
{[
  { name: "sapid", label: "SAP ID" },
  { name: "studentName", label: "Student Name" },
  { name: "registrationNo", label: "Registration Number" },
  { name: "fatherName", label: "Father Name" },
  { name: "program", label: "Program (BSCS, BBA, etc.)" },
  { name: "semester", label: "Semester (e.g., 8th)" },
].map((item) => (

// ✅ AFTER
{[
  { name: "department", label: "Department (Library, Transport, etc.)" },
  { name: "reason", label: "Reason for Clearance" },
].map((item) => (
```

---

## Backend: server.js

### POST /clearance-requests Endpoint

```javascript
// ❌ BEFORE
app.post("/clearance-requests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    sapid,              // ← Frontend not sending anymore
    studentName,        // ← Frontend not sending anymore
    registrationNo,     // ← Frontend not sending anymore
    fatherName,         // ← Frontend not sending anymore
    program,            // ← Frontend not sending anymore
    semester,           // ← Frontend not sending anymore
    degreeStatus,       // ← Frontend not sending anymore
  } = req.body;

  // Validation for 7 fields (too many)
  if (!sapid || !studentName || !registrationNo || !fatherName || !program || !semester || !degreeStatus) {
    return apiError(res, 400, "All fields are required", "MISSING_REQUIRED_FIELDS");
  }

  await db.promise().execute(
    `INSERT INTO clearance_requests
     (user_id, sapid, student_name, registration_no, father_name, program, semester, degree_status, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [userId, sanitizeInput(sapid), sanitizeInput(studentName), ...]
  );
});

// ✅ AFTER
app.post("/clearance-requests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    student_id,         // ← Frontend now sends this
    department,         // ← Frontend now sends this
    reason,             // ← Frontend now sends this
    status,             // ← Frontend now sends this
  } = req.body;

  // Simple validation for 2 required fields
  if (!student_id || !department) {
    return apiError(res, 400, "student_id and department are required", "MISSING_REQUIRED_FIELDS");
  }

  const result = await db.promise().execute(
    `INSERT INTO clearance_requests
     (student_id, department, reason, status, submitted_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [student_id, sanitizeInput(department), sanitizeInput(reason || ""), sanitizeInput(status || "Pending")]
  );

  return apiSuccess(res, 201, "Clearance request submitted successfully", { id: result[0].insertId });
});
```

---

### GET /clearance-requests Endpoint

```javascript
// ❌ BEFORE
app.get("/clearance-requests", authMiddleware, async (req, res) => {
  // Check if user is admin (only admin can view all)
  if (req.user.role !== "admin") {
    return apiError(res, 403, "Forbidden", "FORBIDDEN");
  }

  const [rows] = await db.promise().query(
    "SELECT * FROM clearance_requests ORDER BY submitted_at DESC"
    // ↑ Returns ALL clearance requests
  );
});

// ✅ AFTER
app.get("/clearance-requests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  // No admin check - each user gets their own requests
  const [rows] = await db.promise().query(
    "SELECT * FROM clearance_requests WHERE student_id = ? ORDER BY submitted_at DESC",
    [userId]  // ← Returns only USER'S requests
  );
});
```

---

## Database: database.sql

### Table Schema Changes

```sql
-- ❌ BEFORE (Old schema - doesn't match new form)
CREATE TABLE clearance_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,              -- ← Wrong column name
  sapid VARCHAR(50),                 -- ← Not in new form
  student_name VARCHAR(100),         -- ← Not in new form
  registration_no VARCHAR(50),       -- ← Not in new form
  father_name VARCHAR(100),          -- ← Not in new form
  program VARCHAR(100),              -- ← Not in new form
  semester VARCHAR(50),              -- ← Not in new form
  degree_status VARCHAR(50),         -- ← Not in new form
  submitted_at TIMESTAMP
);

-- ✅ AFTER (New schema - matches new form)
CREATE TABLE clearance_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,           -- ✓ Correct column name
  department VARCHAR(100) NOT NULL,  -- ✓ In new form
  reason TEXT,                       -- ✓ In new form
  status VARCHAR(50) DEFAULT 'Pending', -- ✓ In new form
  remarks TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at)
);
```

---

## Data Flow Comparison

### ❌ BEFORE (Broken Flow)

```
Student fills form with: sapid, studentName, registrationNo, etc.
              ↓
Frontend sends to: /student-clearance-request
              ↓
No student_id sent → Backend doesn't know who submitted
              ↓
Backend expects: sapid, studentName, etc.
              ↓
Database table has different columns
              ↓
❌ INSERT FAILS - Mismatch everywhere
```

### ✅ AFTER (Working Flow)

```
Student fills form with: department, reason
              ↓
Frontend sends to: /clearance-requests
              ↓
Including student_id: user.id from AuthContext
              ↓
Backend receives and validates: student_id, department
              ↓
Backend INSERTs into: clearance_requests table
              ↓
columns match: (student_id, department, reason, status, submitted_at)
              ↓
✅ INSERT SUCCEEDS - Data saved to database
```

---

## Summary Table

| Aspect | ❌ Before | ✅ After |
|--------|----------|---------|
| **User Data Source** | localStorage (stale) | AuthContext (fresh) |
| **Form Fields** | 7 fields (sapid, name, regNo, etc.) | 2 fields (department, reason) |
| **API Endpoint** | /student-clearance-request | /clearance-requests |
| **Student ID Sent** | No | Yes ✓ |
| **Backend Expectation** | 7 fields | 4 fields |
| **Database Columns** | 8 columns (old schema) | 5 columns (new schema) |
| **Data Saved** | ❌ No | ✅ Yes |
| **Lint Errors** | ❌ Yes | ✅ No |
| **Database Errors** | ❌ Column mismatch | ✅ All columns match |

---

**Result: ✅ Complete alignment between frontend, backend, and database**
