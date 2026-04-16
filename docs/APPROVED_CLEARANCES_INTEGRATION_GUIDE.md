# ✅ APPROVED CLEARANCES SYSTEM - INTEGRATION GUIDE

## 🎯 Overview

When a student's clearance is **FULLY APPROVED** (all departments = Approved, overallStatus = "Completed"), the record automatically appears in the **Approved tab** of EVERY department with complete student details.

---

## 🏗️ BACKEND ARCHITECTURE

### New Unified API Endpoints

#### 1. GET `/api/approved-clearances/:departmentName`
Returns all fully approved clearances for a department.

**Query Parameters:**
```
- search: Search by SAP ID or student name
- limit: Number of records (default: 20, max: 100)
- page: Page number (default: 1)
- sortBy: 'date' or 'name' (default: date)
- sortOrder: 'asc' or 'desc' (default: desc)
```

**Example Request:**
```bash
GET /api/approved-clearances/Library?search=675&limit=10&page=1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "69d40cd41b88b4fd46d998d8",
      "studentId": "69d40cae1b88b4fd46d998c8",
      "studentName": "Ali Khan",
      "sapId": "675",
      "email": "ali9@gmail.com",
      "studentDepartment": "Computer Science",
      "registrationNo": "CS-2024-001",
      "fatherName": "Hassan Khan",
      "program": "BS Computer Science",
      "semester": "2",
      "degreeStatus": "Active",
      "departmentName": "Library",
      "clearanceStatus": "Approved",
      "dateApproved": "2026-04-07T10:30:00Z",
      "certificateId": "CLEARANCE_675_69d40cd41b88b4fd46d998d8",
      "approvedDepartments": [
        "Coordination",
        "Library",
        "Transport",
        "Finance",
        "Student Services"
      ],
      "certificateGenerated": true,
      "departmentStatus": "Approved",
      "fullRecord": {
        "overallStatus": "Completed",
        "departmentStatuses": [...],
        "submittedAt": "2026-04-07T08:00:00Z",
        "completedAt": "2026-04-07T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5,
    "hasMore": true
  },
  "filters": {
    "departmentName": "Library",
    "search": "675"
  }
}
```

#### 2. GET `/api/approved-clearances/:departmentName/stats`
Returns statistics for approved clearances.

**Response:**
```json
{
  "success": true,
  "stats": {
    "departmentName": "Library",
    "totalApproved": 125,
    "thisMonth": 32,
    "today": 3,
    "averagePerDay": 4
  }
}
```

#### 3. GET `/api/approved-clearances/:departmentName/export?format=csv`
Export approved clearances as CSV or JSON.

---

## 💾 DATA SOURCE

### ComprehensiveClearanceValidation Model

The system uses the existing `ComprehensiveClearanceValidation` collection:

```javascript
{
  student_id: ObjectId,
  sapid: String,
  student_name: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  
  departmentStatuses: [
    {
      name: "Library" | "Coordination" | "Transport" | "Finance" | "Student Services",
      status: "Approved" | "Rejected",
      reason: String,
      validatedAt: Date
    }
  ],
  
  overallStatus: "Completed",  // <-- KEY FILTER
  certificateGenerated: true,
  qr_code: String,
  completedAt: Date
}
```

**Key Condition:**
```javascript
overallStatus === "Completed" && certificateGenerated === true
```

---

## 🎨 FRONTEND INTEGRATION

### Using ApprovedClearancesViewer Component

The new `ApprovedClearancesViewer.js` component handles all approved clearance viewing logic.

#### 1. Import in Department Dashboard

```jsx
import ApprovedClearancesViewer from "../shared/ApprovedClearancesViewer";
```

#### 2. Add to Approved Tab

```jsx
export default function TransportDashboard() {
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "pending" ? "border-b-2 border-blue-600" : ""
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "approved" ? "border-b-2 border-green-600" : ""
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "rejected" ? "border-b-2 border-red-600" : ""
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "approved" && (
        <ApprovedClearancesViewer departmentName="Transport" />
      )}
    </div>
  );
}
```

### Features

✅ **Search & Filter**
- Search by SAP ID or student name
- Real-time filtering (500ms debounce)
- Results update as you type

✅ **Pagination**
- Navigate between pages
- Configurable page size (10, 20, 50)
- Shows total records and current page

✅ **Statistics**
- Total approved count
- This month's approvals
- Today's approvals
- Average per day

✅ **Export**
- Export to CSV format
- Includes all student details
- Timestamped filename

✅ **Details Modal**
- View complete student information
- Show all approved departments
- Display certificate ID
- Professional formatted view

✅ **Loading States**
- Loader while fetching data
- Error handling with user-friendly messages
- Empty state message

---

## 🔄 HOW IT WORKS

### 1. Student Submits Clearance
```
Student fills form → POST /api/clearance-requests
```

### 2. System Validates All Departments
```
✓ Checks DepartmentIssue records for each department
✓ Marks each department as Approved/Rejected
```

### 3. If All Approved
```
✓ overallStatus = "Completed"
✓ certificateGenerated = true
✓ Certificate email sent to student
```

### 4. Auto-Visible in All Departments
```
✓ Appears in Approved tabs WITHOUT creating separate records
✓ Uses single ComprehensiveClearanceValidation record
✓ Query filter: overallStatus === "Completed"
```

---

## 📋 DEPARTMENT APPROVED TABS

Each department dashboard now shows:

### Table Columns
| Column | Data |
|--------|------|
| Student Name | `studentName` |
| SAP ID | `sapId` |
| Department | `studentDepartment` |
| Program | `program` |
| Approved Date | `dateApproved` |
| Status | "Approved" ✓ |
| Actions | View Details |

### Features per Department

**Library**
```jsx
<ApprovedClearancesViewer departmentName="Library" />
```

**Coordination**
```jsx
<ApprovedClearancesViewer departmentName="Coordination" />
```

**Transport**
```jsx
<ApprovedClearancesViewer departmentName="Transport" />
```

**Finance**
```jsx
<ApprovedClearancesViewer departmentName="Finance" />
```

**Student Services**
```jsx
<ApprovedClearancesViewer departmentName="Student Services" />
```

---

## 🔐 SECURITY

### Access Control
```javascript
// Only department staff can view their own department
// OR admin/hod can view all departments

if (userDepartment && userDepartment !== departmentName) {
  if (req.user.role !== 'admin' && req.user.role !== 'hod') {
    return res.status(403).json({ message: "Access denied" });
  }
}
```

### No Data Duplication
```
✓ Single record in ComprehensiveClearanceValidation
✓ Reused across all departments
✓ No separate records per department
✓ Updated in one place = reflected everywhere
```

---

## 📊 REAL-TIME BEHAVIOR

### Scenario: Student Clears All Departments

**Time 1: 10:00 AM**
- Student submits clearance
- System validates all departments
- All departments approve
- Certificate generated
- Email sent

**Time 2: 10:05 AM**
- Student appears in Library → Approved Tab ✓
- Student appears in Coordination → Approved Tab ✓
- Student appears in Transport → Approved Tab ✓
- Student appears in Finance → Approved Tab ✓
- Student appears in Student Services → Approved Tab ✓

**No manual refresh required** - Component uses React state and API calls

---

## 🧪 TESTING

### Test Endpoint
```bash
# Get approved clearances for Library
curl -X GET "http://localhost:5000/api/approved-clearances/Library" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by SAP ID
curl -X GET "http://localhost:5000/api/approved-clearances/Library?search=675" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get statistics
curl -X GET "http://localhost:5000/api/approved-clearances/Library/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Export to CSV
curl -X GET "http://localhost:5000/api/approved-clearances/Library/export?format=csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o approved-clearances.csv
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Backend ✓
- [x] Created `/api/approved-clearances/:departmentName` endpoint
- [x] Added stats endpoint
- [x] Added export endpoint
- [x] Added to server.js
- [x] Security checks implemented
- [x] Pagination implemented
- [x] Search implemented

### Frontend ✓
- [x] Created ApprovedClearancesViewer component
- [x] Implemented search/filter
- [x] Added pagination
- [x] Added statistics cards
- [x] Added export to CSV
- [x] Added details modal
- [x] Responsive design

### Department Dashboards - TODO
- [ ] Update TransportDashboard.js
- [ ] Update LibraryDashboard.js
- [ ] Update CoordinationDashboard.js (FeeDepartment)
- [ ] Update FinanceDashboard.js
- [ ] Update StudentServiceDashboard.js

---

## 🚀 DEPLOYMENT

### 1. Restart Backend
```bash
cd backend
npm start
```

### 2. Test API
```bash
curl http://localhost:5000/api/approved-clearances/Library
```

### 3. Update Department Dashboards
Replace old approved sections with new component

### 4. Test in Browser
- Go to each department dashboard
- Click "Approved" tab
- Verify completed clearances appear
- Test search functionality
- Test export

---

## 📞 SUPPORT

### Common Issues

**Q: Records not appearing?**
A: Check that `overallStatus === "Completed"` and `certificateGenerated === true`

**Q: Search not working?**
A: Component debounces search by 500ms - wait for results

**Q: Export not working?**
A: Ensure browser allows downloads; check network tab

**Q: Permission denied?**
A: Verify user has appropriate role (library, transport, etc.)

---

## 📚 FILES MODIFIED/CREATED

**Backend:**
- `routes/approvedClearancesAPI.js` - NEW
- `server.js` - UPDATED (import & setup)

**Frontend:**
- `components/shared/ApprovedClearancesViewer.js` - NEW

**To Update:**
- `Transport/TransportDashboard.js`
- `Library/LibraryDashboard.js`
- `FeeDepartment/FeeDepartmentDashboard.js`
- `StudentServiceDepartment/ServiceDashboard.js`
- `Coordination/CoordinationDashboard.js`

---

**Last Updated:** April 7, 2026
**Status:** Ready for Integration
