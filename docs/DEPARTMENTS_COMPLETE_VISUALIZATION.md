# 📊 Complete Department Working Visualization

## System Overview Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                    RIPHAH STUDENT CLEARANCE MANAGEMENT SYSTEM                                   ║
║                         All Departments Workflow & Interaction                                   ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         SYSTEM ENTRY POINT                                       │
│                                                                                                  │
│  ┌──────────────────┐                                                                           │
│  │   STUDENT LOGS IN│                                                                           │
│  │       (JWT Auth) │                                                                           │
│  └────────┬─────────┘                                                                           │
│           │                                                                                     │
│           ▼                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐                          │
│  │         STUDENT DASHBOARD (Frontend Portal)                      │                          │
│  │  ┌──────────────────────┐  ┌──────────────────────┐              │                          │
│  │  │ View Certificate:    │  │ Submit Clearance:    │              │                          │
│  │  │ • Download PDF       │  │ • Fill Form          │              │                          │
│  │  │ • Print A4           │  │ • Select Department  │              │                          │
│  │  │ • Share with QR      │  │ • Add Details        │              │                          │
│  │  │ • Verify Online      │  │ • Submit Request     │              │                          │
│  │  └──────────────────────┘  └──────────────────────┘              │                          │
│  │  ┌──────────────────────┐  ┌──────────────────────┐              │                          │
│  │  │ Track Status:        │  │ Messages:            │              │                          │
│  │  │ • Pending Approval   │  │ • Department Replies │              │                          │
│  │  │ • 5-Department Grid  │  │ • Remarks & Feedback │              │                          │
│  │  │ • Progress Bar       │  │ • Notifications      │              │                          │
│  │  │ • Real-time Updates  │  │ • Approval/Rejection │              │                          │
│  │  └──────────────────────┘  └──────────────────────┘              │                          │
│  └──────────────────────────────────────────────────────────────────┘                          │
│           │                                                                                    │
│           │ POST /api/clearance (Student submits form)                                         │
│           ▼                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐                         │
│  │           BACKEND ROUTER & VALIDATOR                            │                         │
│  │  • JWT Verification                                             │                         │
│  │  • Form Validation                                              │                         │
│  │  • Department Issue Check (Auto-Clearance)                      │                         │
│  │  • Create Workflow Records                                      │                         │
│  └──────────────────────────────────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SEQUENTIAL DEPARTMENT WORKFLOW (5 PHASES)                            │
│                                                                                                 │
│  ┌───────────────┐   ┌──────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐ │
│  │ PHASE 1       │──▶│  PHASE 2     │──▶│  PHASE 3    │──▶│  PHASE 4    │──▶│  PHASE 5     │ │
│  │ Coordination  │   │ Library      │   │ Transport   │   │ Fee Dept    │   │ Student Svc  │ │
│  │ Office        │   │              │   │             │   │             │   │              │ │
│  └───────────────┘   └──────────────┘   └─────────────┘   └─────────────┘   └──────────────┘ │
│        |                    |                   |                 |                  |         │
│        ▼                    ▼                   ▼                 ▼                  ▼         │
│         1. Register      2. Library         3. Transport       4. Fee          5. Service    │
│         2. Issue Check   • Verify Card     • Vehicle Check   • Bills Check   • Dues Check   │
│         3. Department    • Check Fine      • Parking Slot    • Fine Payment  • Library      │
│            Issues        • Not Returned    • Pass/Permit      • Receipts      • Other       │
│                                                                                              │
│  Each Phase:                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Status Options: PENDING → APPROVED │ PENDING → REJECTED (with remarks)                │ │
│  │ Visibility: Only current phase department sees request                                 │ │
│  │ Action: Approve (auto-move to next) OR Reject (pause workflow)                       │ │
│  │ Notification: Student gets real-time update after each decision                       │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEPARTMENT DASHBOARDS (Cycle)                                      │
│                                                                                                 │
│  COORDINATION DASHBOARD:                LIBRARY DASHBOARD:                                    │
│  ├─ Pending Requests (Current Phase)    ├─ Pending: Students checked out book/CD            │
│  ├─ Department Issues View              ├─ Rejects: Fine due or item not returned           │
│  ├─ Action: Approve / Reject            ├─ Action: Mark as cleared or rejected              │
│  ├─ Message: Add remarks                ├─ Message: Item details / Payment info             │
│  └─ Next: Route to Library              └─ Next: Route to Transport                         │
│                                                                                                │
│  TRANSPORT DASHBOARD:                    FEE DEPARTMENT DASHBOARD:                            │
│  ├─ Pending: Vehicle records             ├─ Pending: Student dues checks                   │
│  ├─ Rejects: Parking violation/fine      ├─ Rejects: Outstanding bills                     │
│  ├─ Action: Approve/Reject               ├─ Action: Approve/Reject                         │
│  ├─ Message: Parking details             ├─ Message: Bill details                          │
│  └─ Next: Route to Fee Dept              └─ Next: Route to Student Service                 │
│                                                                                                │
│  STUDENT SERVICE DASHBOARD:              ADMIN DASHBOARD:                                     │
│  ├─ Pending: Final service dues          ├─ System Statistics                               │
│  ├─ Rejects: Outstanding issues          ├─ All Workflows (All Students)                    │
│  ├─ Action: Approve/Reject               ├─ Department Performance                          │
│  ├─ Message: Service issues              ├─ Reports & Analytics                             │
│  └─ Next: Mark as COMPLETED              ├─ User Management                                 │
│                                           └─ System Configuration                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        OUTCOME PATHS & COMPLETION ROUTES                                       │
│                                                                                                 │
│  APPROVAL SCENARIO (ALL APPROVE):                                                             │
│  Student submits                                                                              │
│         ↓                                                                                     │
│  Coord: ✓ Approve ──▶ Library: ✓ Approve ──▶ Transport: ✓ Approve ──▶ Fee: ✓ Approve       │
│                                                                                               │
│         ──▶ Student Service: ✓ Approve ──▶ Status: COMPLETED                                │
│                                                      ↓                                        │
│                                          ✅ CERTIFICATE GENERATED                            │
│                                                      ↓                                        │
│                                          📧 EMAIL WITH PDF SENT                              │
│                                                      ↓                                        │
│                                          📥 AVAILABLE FOR DOWNLOAD                           │
│                                                      ↓                                        │
│                                          🔍 QR CODE FOR VERIFICATION                         │
│                                                                                               │
│  ─────────────────────────────────────────────────────────────────────────────────────────    │
│                                                                                               │
│  REJECTION SCENARIO (ANY REJECT):                                                             │
│  Student submits                                                                              │
│         ↓                                                                                     │
│  Coord: ✓ Approve ──▶ Library: ✓ Approve ──▶ Transport: ✗ REJECT (remarks)                │
│                                                      ↓                                        │
│                                          Status: REJECTED                                    │
│                                                      ↓                                        │
│                                          ⚠️ WORKFLOW PAUSED                                  │
│                                                      ↓                                        │
│                                          📨 NOTIFICATION SENT                                │
│                                                      ↓                                        │
│                                          Student resolves issue                              │
│                                                      ↓                                        │
│                                          Click "RESUBMIT"                                    │
│                                                      ↓                                        │
│                                          Workflow restarts from Transport                    │
│                                                      ↓                                        │
│                                          Transport: ✓ Approve (after issue fixed)           │
│                                                      ↓                                        │
│                                          Continue to Fee → Student Service                   │
│                                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM ADMIN SUPERVISION & CONTROL                                          │
│                                                                                                 │
│  Admin Panel Features:                                                                        │
│  ├─ View ALL workflows (across all students)                                                 │
│  ├─ Department Performance Metrics:                                                          │
│  │  • Average approval time per department                                                  │
│  │  • Rejection rate                                                                        │
│  │  • Pending request count                                                                │
│  │  • Completion statistics                                                                │
│  ├─ User Management:                                                                        │
│  │  • Create/Edit department staff                                                        │
│  │  • Assign roles (coordination, library, transport, fee, service)                        │
│  │  • View activity logs                                                                  │
│  ├─ System Configuration:                                                                  │
│  │  • Department settings                                                                 │
│  │  • Email templates                                                                     │
│  │  • Notification preferences                                                            │
│  ├─ Reports:                                                                               │
│  │  • Monthly clearance trends                                                            │
│  │  • Department-wise breakdown                                                           │
│  │  • Bottleneck identification                                                           │
│  │  • Student demographic analysis                                                        │
│  └─ Intervention:                                                                          │
│     • Can approve/reject (override if needed)                                              │
│     • Can reset workflow                                                                  │
│     • Can send bulk messages                                                              │
│     • Can generate reports                                                                │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Department Responsibilities

### 📋 **Phase 1: Coordination Office (First Gate)**

```
ROLE: Initial Registration & Department Issue Verification
┌─────────────────────────────────────────────────────────────────────────┐
│ Department Code: "Coordination"                                          │
│ Database Table: DepartmentIssue (coordination field)                     │
│ Role Value: "coordination"                                               │
│                                                                           │
│ RESPONSIBILITIES:                                                        │
│ • Verify student registration is complete                               │
│ • Check coordination office has no pending issues                        │
│ • Examples: Missing documents, incomplete registration, etc.            │
│                                                                           │
│ DATABASE CHECKS:                                                         │
│ SELECT * FROM department_issues                                          │
│ WHERE student_id = ? AND department = 'coordination' AND status = ?     │
│                                                                           │
│ DECISION:                                                                │
│ ✓ APPROVED: No issues found → Route to Library                          │
│ ✗ REJECTED: Issues found → Workflow paused, notify student              │
│                                                                           │
│ DATA STORED IN: ClearanceWorkflow.phases[0]                             │
│ Status: "Approved" | "Rejected"                                         │
│ Remarks: "All documents verified" | "Missing transcript"                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 📚 **Phase 2: Library Department (Second Gate)**

```
ROLE: Library Clearance & Returned Books Verification
┌─────────────────────────────────────────────────────────────────────────┐
│ Department Code: "Library"                                               │
│ Database Table: DepartmentIssue (library field)                          │
│ Role Value: "library"                                                    │
│                                                                           │
│ RESPONSIBILITIES:                                                        │
│ • Check if student has library card registered                          │
│ • Verify all books/CDs have been returned                               │
│ • Check for outstanding fines                                           │
│ • Confirm library account is in good standing                           │
│                                                                           │
│ DATABASE CHECKS:                                                         │
│ SELECT * FROM library_records                                            │
│ WHERE student_id = ?                                                     │
│ • Book status: "checked_out" (FAIL) vs "returned" (PASS)                │
│ • Fine amount: > 0 (FAIL) vs = 0 (PASS)                                 │
│ • Card status: active                                                    │
│                                                                           │
│ DECISION:                                                                │
│ ✓ APPROVED: All books returned, no fines → Route to Transport           │
│ ✗ REJECTED: Unreturned items or fines → Workflow paused                 │
│                                                                           │
│ DATA STORED IN: ClearanceWorkflow.phases[1]                             │
│ Status: "Approved" | "Rejected"                                         │
│ Remarks: "All items cleared" | "Book ID 12345 not returned + Rs. 500"   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🚗 **Phase 3: Transport Department (Third Gate)**

```
ROLE: Vehicle & Parking Clearance
┌─────────────────────────────────────────────────────────────────────────┐
│ Department Code: "Transport"                                             │
│ Database Table: DepartmentIssue (transport field)                        │
│ Role Value: "transport"                                                  │
│                                                                           │
│ RESPONSIBILITIES:                                                        │
│ • Verify parking permit status                                           │
│ • Check for traffic violations or parking fines                         │
│ • Confirm vehicle is not impounded                                      │
│ • Verify shuttle/transport account clearance                            │
│                                                                           │
│ DATABASE CHECKS:                                                         │
│ SELECT * FROM transport_records                                          │
│ WHERE student_id = ?                                                     │
│ • Vehicle status: "parked_legally" (PASS) vs "violation" (FAIL)          │
│ • Outstanding fines: Rs. 0 (PASS) vs > 0 (FAIL)                         │
│ • Permit: "active" and not expired                                       │
│                                                                           │
│ DECISION:                                                                │
│ ✓ APPROVED: No violations, no fines, permit active → Route to Fee      │
│ ✗ REJECTED: Violations or fines found → Workflow paused                │
│                                                                           │
│ DATA STORED IN: ClearanceWorkflow.phases[2]                             │
│ Status: "Approved" | "Rejected"                                         │
│ Remarks: "Permit valid until 2026" | "Parking fine Rs. 1000 pending"    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 💰 **Phase 4: Fee Department (Fourth Gate)**

```
ROLE: Financial Clearance & Dues Verification
┌─────────────────────────────────────────────────────────────────────────┐
│ Department Code: "Fee Department"                                        │
│ Database Table: DepartmentIssue (fee_department field)                   │
│ Role Value: "feedepartment"                                              │
│                                                                           │
│ RESPONSIBILITIES:                                                        │
│ • Verify tuition fees paid in full                                       │
│ • Check for outstanding hostel dues (if applicable)                      │
│ • Verify lab/practical fees cleared                                      │
│ • Confirm all financial obligations settled                              │
│ • Check for any pending payments                                         │
│                                                                           │
│ DATABASE CHECKS:                                                         │
│ SELECT * FROM fee_records                                                │
│ WHERE student_id = ? AND for_year = ?                                    │
│ • Tuition_paid: full amount received                                      │
│ • Lab_fees: Rs. 0 outstanding                                            │
│ • Hostel_dues: Rs. 0 outstanding                                         │
│ • Other_charges: all settled                                             │
│                                                                           │
│ DECISION:                                                                │
│ ✓ APPROVED: All fees paid → Route to Student Service                    │
│ ✗ REJECTED: Outstanding dues exist → Workflow paused                    │
│                                                                           │
│ DATA STORED IN: ClearanceWorkflow.phases[3]                             │
│ Status: "Approved" | "Rejected"                                         │
│ Remarks: "All fees cleared" | "Hostel dues Rs. 25,000 pending"          │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🎓 **Phase 5: Student Service Department (Final Gate)**

```
ROLE: Student Services Final Clearance
┌─────────────────────────────────────────────────────────────────────────┐
│ Department Code: "Student Service"                                       │
│ Database Table: DepartmentIssue (student_service field)                  │
│ Role Value: "studentservice"                                             │
│                                                                           │
│ RESPONSIBILITIES:                                                        │
│ • Verify student conduct record (no disciplinary action)                 │
│ • Check for outstanding library/lab keys                                 │
│ • Verify all borrowed items returned                                     │
│ • Confirm no pending grievances                                          │
│ • Final clearance authority before certificate generation                │
│                                                                           │
│ DATABASE CHECKS:                                                         │
│ SELECT * FROM student_services                                           │
│ WHERE student_id = ?                                                     │
│ • Conduct_record: "good" (PASS) vs "violation" (FAIL)                    │
│ • Outstanding_keys: 0 (PASS) vs > 0 (FAIL)                              │
│ • Grievances: resolved (PASS) vs pending (FAIL)                          │
│ • Borrowed_items: all returned                                           │
│                                                                           │
│ DECISION:                                                                │
│ ✓ APPROVED: All cleared → WORKFLOW COMPLETE                             │
│ ✗ REJECTED: Issues found → Workflow paused                              │
│                                                                           │
│ ON APPROVAL:                                                             │
│ 1. Set status = "COMPLETED"                                              │
│ 2. Generate certificate with QR code                                     │
│ 3. Send email with PDF attachment                                        │
│ 4. Create system notification                                            │
│ 5. Update student dashboard                                              │
│                                                                           │
│ DATA STORED IN: ClearanceWorkflow.phases[4]                             │
│ Status: "Approved" | "Rejected"                                         │
│ Remarks: "Ready for graduation" | "Lab key not returned"                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🔧 **System Admin Role (Oversight & Control)**

```
ROLE: System Administration & Monitoring
┌─────────────────────────────────────────────────────────────────────────┐
│ Database Table: User (where role = "admin")                              │
│ Role Value: "admin"                                                      │
│                                                                           │
│ DASHBOARD FEATURES:                                                      │
│                                                                           │
│ 1. VIEW ALL WORKFLOWS                                                    │
│    • Filter by: Student name, SAP ID, status, date range                 │
│    • Show: All 5 phases for each student                                 │
│    • Timeline: Submission date → Current phase → Completion              │
│                                                                           │
│ 2. DEPARTMENT STATISTICS                                                 │
│    • Coordination: 45 pending, 1200 approved, 5 rejected                │
│    • Library: 32 pending, 950 approved, 12 rejected                     │
│    • Transport: 28 pending, 1100 approved, 2 rejected                   │
│    • Fee: 55 pending, 1050 approved, 8 rejected                         │
│    • Student Service: 20 pending, 1180 approved, 3 rejected             │
│    • Average time per phase: 3-5 hours                                   │
│                                                                           │
│ 3. PERFORMANCE METRICS                                                   │
│    • Approval rate by department                                         │
│    • Average processing time per phase                                   │
│    • Bottleneck identification                                           │
│    • Peak request times                                                  │
│    • Rejection rate trends                                               │
│                                                                           │
│ 4. USER MANAGEMENT                                                       │
│    • Add/Edit/Delete staff members                                       │
│    • Assign departments and roles                                        │
│    • View activity logs (who did what and when)                          │
│    • Reset passwords if needed                                           │
│    • Track login history                                                 │
│                                                                           │
│ 5. SYSTEM OVERRIDE ACTIONS                                               │
│    • Manual approve/reject any phase (with reason)                       │
│    • Reset student workflow to start over                                │
│    • Reset specific phase only                                           │
│    • Send bulk notifications                                             │
│    • Manually generate certificate if needed                             │
│                                                                           │
│ 6. REPORTS & ANALYTICS                                                   │
│    • Monthly clearance rate: 92% completion                              │
│    • Average days to complete: 8 days                                    │
│    • Department comparison: Which processes fastest?                     │
│    • Student demographics: Semester-wise breakdown                       │
│    • Export to Excel/PDF for meetings                                    │
│                                                                           │
│ 7. CONFIGURATION                                                         │
│    • Department names and codes                                          │
│    • Email templates for notifications                                   │
│    • Phase order (can reorder if needed)                                 │
│    • Certificate template customization                                  │
│    • System settings and preferences                                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DATA COLLECTIONS & FLOW                           │
│                                                                             │
│  STUDENT SUBMISSION (Frontend → Backend)                                   │
│  ────────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Student fills form:                                                       │
│  • Student Name, SAP ID                                                   │
│  • Father Name, Program, Semester                                          │
│  • Degree Status, Registration Number                                      │
│                                                                             │
│              ↓ POST /api/clearance (with JWT token)                        │
│                                                                             │
│  Backend creates:                                                          │
│  • ClearanceWorkflow (main workflow record)                               │
│  • Phases array (5 stages initialized as PENDING)                         │
│  • ComprehensiveClearanceValidation (tracking)                            │
│                                                                             │
│              ↓ Check DepartmentIssue records                               │
│                                                                             │
│  Auto-check logic:                                                         │
│  FOR EACH department (Coordination → Library → Transport → Fee → Service): │
│    SELECT * FROM department_issues                                         │
│    WHERE student_sapid = ? AND status = 'pending'                         │
│    IF found: Set phase status = "Rejected"                                │
│    ELSE: Set phase status = "Approved"                                    │
│                                                                             │
│              ↓ If ALL approved: Status = COMPLETED                         │
│              ↓ If ANY rejected: Status = REJECTED                          │
│                                                                             │
│  Generate Certificate:                                                     │
│  • QR code with workflow ID                                               │
│  • PDF certificate (PDFKit)                                               │
│                                                                             │
│  Send Notifications:                                                       │
│  • Email with PDF to student                                              │
│  • Messages to all department heads                                        │
│  • System notifications in dashboard                                       │
│                                                                             │
│                                                                             │
│  DEPARTMENT REVIEW (Cycle through each)                                   │
│  ───────────────────────────────────────────────────────────────────      │
│                                                                             │
│  Department Staff logs in → See requests for CURRENT PHASE ONLY            │
│    GET /api/clearance/department                                           │
│    Filter: overallStatus = "In Progress" AND currentPhase = dept_index    │
│                                                                             │
│  Staff reviews request details:                                            │
│  • Student name, SAP ID, program                                          │
│  • Department-specific info (books, fines, permits, fees, conduct)        │
│                                                                             │
│  Staff decision:                                                           │
│  PUT /api/clearance/:workflowId/approve (with remarks)                    │
│       or                                                                    │
│  PUT /api/clearance/:workflowId/reject (with reason)                      │
│                                                                             │
│  Update workflow:                                                          │
│  IF APPROVE:                                                               │
│    • phases[currentPhase].status = "Approved"                             │
│    • phases[currentPhase].approverName = staff_name                       │
│    • currentPhase++ (move to next)                                         │
│    • IF currentPhase == 5: overallStatus = "Completed"                    │
│    • ELSE: overallStatus = "In Progress"                                  │
│                                                                             │
│  IF REJECT:                                                                │
│    • phases[currentPhase].status = "Rejected"                             │
│    • overallStatus = "Rejected"                                            │
│    • Workflow paused (student can resubmit)                               │
│                                                                             │
│  Send notifications:                                                       │
│  • Student gets immediate update                                          │
│  • Next department notified (if approved)                                 │
│  • System logs activity                                                    │
│                                                                             │
│                                                                             │
│  CERTIFICATE GENERATION & DELIVERY                                        │
│  ──────────────────────────────────────────────────────────────────       │
│                                                                             │
│  Trigger: All phases approved (status = "COMPLETED")                      │
│                                                                             │
│  Step 1: Generate Certificate                                             │
│  • Call certificateGenerator.js                                           │
│  • Input: Student data + approval info                                    │
│  • Output: PDF file (stored in /certificates folder)                      │
│  • Include: QR code linking to /verify endpoint                           │
│                                                                             │
│  Step 2: Send Email                                                       │
│  • Call emailService.js                                                   │
│  • To: student_email (from User record)                                   │
│  • Subject: "Clearance Approved - Certificate Attached"                  │
│  • Attachment: PDF file                                                   │
│  • Template: Professional HTML with university branding                    │
│                                                                             │
│  Step 3: Create Message                                                   │
│  • Save to Message collection                                             │
│  • Type: "notification"                                                   │
│  • Show in student dashboard                                              │
│  • Include download link                                                  │
│                                                                             │
│  Step 4: Update Records                                                   │
│  • ClearanceWorkflow: completedAt = now                                   │
│  • ComprehensiveClearanceValidation: certificateGenerated = true          │
│  • Update dashboard refresh                                               │
│                                                                             │
│  Available for Student:                                                    │
│  • View certificate in dashboard                                          │
│  • Download PDF file                                                      │
│  • Print to A4 format                                                     │
│  • Share via QR code                                                      │
│  • Public verification at /verify/:id                                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Request State Lifecycle

```
STUDENT VIEW                          DEPARTMENT VIEW                       System State
─────────────────────────────────     ────────────────────────────────     ─────────────────────

[Submit Form]                                                               
       ↓
[Pending Approval]     ──────►  Coord: [Pending Request]                  Phase 0: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
[Library Checking]     ──────►  Lib: [Pending Request]                    Phase 1: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
[Transport Checking]   ──────►  Trans: [Pending Request]                  Phase 2: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
[Fee Verification]     ──────►  Fee: [Pending Request]                    Phase 3: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
[Service Final Check]  ──────►  Serv: [Pending Request]                   Phase 4: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
✅ APPROVED                                                                 Status: COMPLETED
       ↓
[Certificate Ready]
       ↓
[📧 Email Sent]
       ↓
[📥 Download]
       ↓
[Cleared!]


REJECTION PATH:
──────────────

[Submit Form]                                                               
       ↓
[Pending Approval]     ──────►  Coord: [Pending Request]                  Phase 0: Pending
                                    ↓ (Reviews)
                                [Approve]
       ↓
[Library Checking]     ──────►  Lib: [Pending Request]                    Phase 1: Pending
                                    ↓ (Reviews)
                                [REJECT - Book not returned]
       ↓
❌ REJECTED                                                                  Status: REJECTED
       ↓
⚠️ [Workflow Paused]
       ↓
💬 [Message from Library]
   "Please return book ID 12345 by MM/DD/YY"
       ↓
Student resolves issue
       ↓
[Resubmit Request]
       ↓
[Library Re-checking]  ──────►  Lib: [Re-check Request]                   Phase 1: Pending (Retry)
                                    ↓ (Reviews again)
                                [Approve]
       ↓
[Transport Checking]   ──────►  Trans: [Pending Request]                  Phase 2: Pending
       (Continue from Phase 2)
```

---

## Real-World Scenario Example

```
STUDENT: Ahmed Ali (SAP: 2019-0456)
────────────────────────────────────

TIMELINE:

Monday 10:00 AM - Student submits clearance request
├─ Auto-check runs:
│  • Coordination: ✓ No issues
│  • Library: ✗ Book not returned + Rs. 500 fine
│  • Transport: ✓ No issues
│  • Fee: ✓ No dues
│  • Student Service: ✓ No issues
│
├─ Result: REJECTED at Library phase
├─ Status: Workflow paused
└─ Student notification: "Please return book ID 2023-456 to library"

Monday 12:30 PM - Student goes to library
├─ Returns book
├─ Pays Rs. 500 fine
└─ Gets clearance from librarian

Monday 1:00 PM - Student clicks "RESUBMIT" in dashboard
├─ System re-checks library issues
├─ Library status now: ✓ CLEARED
├─ Auto-approval system continues from Transport
├─ All remaining departments approve automatically
│  • Transport: ✓ Approved
│  • Fee: ✓ Approved
│  • Student Service: ✓ Approved
├─ Status: COMPLETED
└─ Certificate generated

Monday 1:05 PM - Student receives email
├─ Subject: "Your Clearance is Approved!"
├─ Attachment: Clearance_Certificate_2019-0456.pdf
├─ Body: "Congratulations! You are cleared for graduation."
└─ Link: Download certificate / Verify online

Monday 2:00 PM - Student downloads certificate
├─ Opens PDF in dashboard
├─ Certificate shows:
│  • Name: Ahmed Ali
│  • SAP ID: 2019-0456
│  • All 5 departments: ✓ APPROVED
│  • Issue Date: MM/DD/2026
│  • QR Code: Verification link
└─ Prints A4 copy for records

Admin Dashboard View (Same time):
├─ New completion: Ahmed Ali (SAP 2019-0456)
├─ Total time: 7 hours (with resubmit)
├─ Department breakdown:
│  • Coordination: Passed immediately
│  • Library: Failed once, passed on resubmit
│  • Transport: Passed immediately
│  • Fee: Passed immediately
│  • Student Service: Passed immediately
└─ Certificate generated successfully
```

---

## API Endpoints Quick Reference

```
STUDENT ENDPOINTS:
─────────────────
POST   /api/clearance                    Submit clearance request
GET    /api/clearance/student            View my clearance status
GET    /api/certificates                 List my certificates
GET    /api/certificates/:id/download    Download certificate PDF
POST   /api/clearance/:id/resubmit       Resubmit rejected request

DEPARTMENT ENDPOINTS:
────────────────────
GET    /api/clearance/department         View requests for my phase
PUT    /api/clearance/:id/approve        Approve a request
PUT    /api/clearance/:id/reject         Reject a request
GET    /api/clearance/department/history View processed requests

ADMIN ENDPOINTS:
────────────────
GET    /api/admin/workflows              View all workflows
GET    /api/admin/statistics             Get department stats
POST   /api/admin/users                  Manage staff users
GET    /api/admin/reports                Generate reports
PUT    /api/admin/override/:id           Manual override

PUBLIC ENDPOINT:
─────────────────
GET    /api/verify/:certificateId       Verify certificate (public)
```

---

## Summary Table

| Department | Role | Input | Process | Output | Next Phase |
|---|---|---|---|---|---|
| **Coordination** | 1st Gate | Student request | Verify registration | ✓ Approve / ✗ Reject | Library |
| **Library** | 2nd Gate | Books status | Check returned items & fines | ✓ Approve / ✗ Reject | Transport |
| **Transport** | 3rd Gate | Vehicle records | Check violations & permits | ✓ Approve / ✗ Reject | Fee |
| **Fee Department** | 4th Gate | Financial records | Check tuition & dues | ✓ Approve / ✗ Reject | Student Service |
| **Student Service** | 5th Gate | Conduct record | Final clearance | ✓ Approve / ✗ Reject | Certificate |
| **System Admin** | Oversight | All data | Monitor & control | Reports & Metrics | Dashboard |

---

**Status**: System is fully operational with all 7 roles integrated ✅
**Architecture**: Sequential multi-phase workflow with rejection handling ✅
**Real-time**: All updates visible to students immediately ✅
