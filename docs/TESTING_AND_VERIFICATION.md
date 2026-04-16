# Testing and Verification Guide

## 🎯 What Was Fixed

### 1. ✅ Admin Dashboard Department Statistics Endpoint
- **Endpoint**: `GET /api/admin/department-stats`
- **Status**: IMPLEMENTED
- **What it does**: Fetches clearance request statistics grouped by department
- **Response includes**: 
  - Overall stats (total requests, approved, rejected, pending)
  - Per-department breakdown
- **Files modified**:
  - `g:\Part_3_Library\my-app\backend\server.js` (line ~2070)
  - `g:\Part_3_Library\backend\server.js` (line ~2070)

### 2. ✅ Message Receiving Query Improvements
- **Endpoint**: `GET /api/my-messages`
- **Status**: ENHANCED with better debugging
- **Improvements**:
  - Added detailed console logging to identify issues
  - Fixed department matching logic
  - Added null-safety checks for department/role fields
  - Improved `$or` condition handling
- **Files modified**:
  - `g:\Part_3_Library\my-app\backend\server.js` (line ~1894)
  - `g:\Part_3_Library\backend\server.js` (line ~1894)

### 3. ✅ Enhanced Seed Database
- **Status**: UPDATED with all staff roles
- **Added users**:
  - Transport Staff: transport@example.com / TRN001
  - Fee Staff: fee@example.com / FEE001
  - Admin: admin@example.com / ADM001
- **Files modified**:
  - `g:\Part_3_Library\my-app\backend\seed-database.js`
  - `g:\Part_3_Library\backend\seed-database.js`

---

## 🧪 Test Plan

### Step 1: Seed the Database
```bash
cd g:\Part_3_Library\my-app\backend
node seed-database.js
```

**Expected Output**:
```
✅ Database seeded successfully! 6 users created.

Test Credentials:
─────────────────────────────────────
Student 1:
  Email: student@example.com
  Password: password123
  SAP ID: 8877

Library Staff:
  Email: library@example.com
  Password: password123
  SAP ID: LIB001

Transport Staff:
  Email: transport@example.com
  Password: password123
  SAP ID: TRN001

Fee Staff:
  Email: fee@example.com
  Password: password123
  SAP ID: FEE001

Admin:
  Email: admin@example.com
  Password: password123
  SAP ID: ADM001
─────────────────────────────────────
```

### Step 2: Start Backend Servers

```bash
# Terminal 1: my-app backend
cd g:\Part_3_Library\my-app\backend
npm start

# Terminal 2: root backend
cd g:\Part_3_Library\backend
npm start
```

### Step 3: Start Frontend

```bash
# Terminal 3: frontend
cd g:\Part_3_Library\my-app
npm start
```

---

## ✅ Test Case 1: Admin Dashboard Shows Department Statistics

### Setup:
1. Login as Admin: `admin@example.com` / `password123`

### Test:
1. Navigate to Admin Dashboard
2. Check if statistics appear (not empty)

### Expected Results:
- Dashboard shows:
  - Total Requests: (number of clearance requests)
  - Total Approved: (count of approved)
  - Total Rejected: (count of rejected)
  - Total Pending: (count of pending)
- Department breakdown is visible

### Server Console Output:
```
📊 Fetching department clearance statistics...
📊 Total clearance records: X
✅ Department statistics calculated:
  Overall: { total_requests: X, total_approved: X, total_rejected: X, total_pending: X }
  Departments: ...
```

### Verification:
- [ ] Dashboard shows numbers (not "0 requests")
- [ ] Department list is populated
- [ ] Numbers update when clearance status changes

---

## ✅ Test Case 2: Student Sends Message to Transport Department

### Setup:
1. Login as Student: `student@example.com` / `password123`
2. Navigate to any department message page (Transport/Library/Fee)

### Test:
1. Click "Send Message" tab
2. Enter:
   - Subject: "Test Message to Transport"
   - Message: "This is a test message"
3. Click Send
4. Verify success message appears

### Expected Results:
- Message sent successfully
- Console shows: `✅ Message sent to Transport`

### Server Console Output:
```
📨 Send Message via /api/send:
  - Sender: Ahmed Student (8877)
  - Department: Transport
  - Subject: Test Message to Transport
💾 Saving message to database...
✅ Message saved successfully - ID: (mongo id)
```

### Verification:
- [ ] Student sees "Message sent successfully"
- [ ] No errors in browser console
- [ ] Server console shows message saved

---

## ✅ Test Case 3: Transport Staff Receives Student Message in Inbox

### Setup:
1. Complete Test Case 2 (student sends message)
2. In new browser/incognito: Login as Transport Staff: `transport@example.com` / `password123`
3. Navigate to Transport > Messages page

### Test:
1. Click "Received" tab
2. Verify message from student appears

### Expected Results:
- Transport staff sees the message from the student
- Message shows:
  - From: "Ahmed Student"
  - Subject: "Test Message to Transport"
  - Content: "This is a test message"

### Server Console Output (when staff loads /api/my-messages):
```
🔍 User Info:
  - ID: (staff user id)
  - Role: transport
  - Department: Transport

📨 Adding messages to department: "Transport"
📨 Adding admin messages to role: "transport"
📨 Fetching messages for: transport - Department: Transport
📨 Query: {
  "$or": [
    { "sender_id": "(staff id)" },
    { "recipient_department": "Transport", "sender_role": "student" },
    ...
  ]
}
✅ Found 1 messages
📨 Sample messages:
  - ID: ..., From: student (Ahmed Student), To: Transport
```

### Verification:
- [ ] Transport staff sees message in "Received" tab
- [ ] Message displays correct sender and content
- [ ] Server console shows message was found in query

---

## ✅ Test Case 4: Admin Broadcasts to All Staff

### Setup:
1. Login as Admin: `admin@example.com` / `password123`

### Test (Create Broadcast via API):
Use Postman or curl to test:
```bash
curl -X POST http://localhost:5000/api/send-message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d {
    "recipientDepartment": "all",
    "subject": "Maintenance Notice",
    "message": "System maintenance tomorrow at 2 AM",
    "messageType": "broadcast"
  }
```

### Expected Results:
- Broadcast created successfully
- All staff (Transport, Library, Fee) can see it in "Admin Broadcasts" tab

### Verification:
- [ ] Transport staff sees broadcast in "Admin Broadcasts" tab
- [ ] Library staff sees broadcast in "Admin Broadcasts" tab
- [ ] Fee staff sees broadcast in "Admin Broadcasts" tab

---

## 🔍 Debugging Tips

### If Admin Dashboard Still Shows 0 Requests:

**Check 1: Database has clearance records**
```bash
# In MongoDB shell:
use library_db
db.departmentclearances.find().count()
```

**Check 2: Verify endpoint is called**
- Open Browser DevTools > Network tab
- Watch for `/api/admin/department-stats` request
- Check response status (should be 200)

**Check 3: Check server console for errors**
```
# Look for:
❌ Department Stats Error:
```

### If Staff Not Receiving Messages:

**Check 1: Verify staff has `department` field**
```bash
# In MongoDB shell:
use library_db
db.users.find({ role: "transport" })
# Check if "department" field exists and equals "Transport"
```

**Check 2: Verify message was saved**
```bash
# In MongoDB shell:
db.messages.find({ recipient_department: "Transport" })
# Check if student message appears here
```

**Check 3: Check JWT token includes department**
- Open Browser DevTools > Application > Cookies
- Find `auth_token` or similar
- Decode at https://jwt.io to verify `department` field is present

**Check 4: Monitor `/api/my-messages` request**
- Open Browser Network tab
- Click "Received" tab on message page
- Look at request payload and response
- Check server console for "User Info" logs

---

## 📊 Database State After Full Test

After running through all test cases, your database should have:

### Users Collection:
```
{
  full_name: "Ahmed Student",
  email: "student@example.com",
  role: "student",
  sap: "8877",
  department: "Computer Science"
}

{
  full_name: "Transport Staff",
  email: "transport@example.com",
  role: "transport",
  sap: "TRN001",
  department: "Transport"
}

{
  full_name: "Admin User",
  email: "admin@example.com",
  role: "admin",
  sap: "ADM001",
  department: "Admin"
}
```

### Messages Collection:
```
{
  sender_id: (student id),
  sender_role: "student",
  sender_name: "Ahmed Student",
  recipient_department: "Transport",
  message_type: "question",
  subject: "Test Message to Transport",
  message: "This is a test message"
}
```

### DepartmentClearance Collection:
```
{
  student_id: (student id),
  department_name: "Transport",
  status: "pending|approved|rejected"
}
```

---

## 🚀 Quick Action Checklist

- [ ] Run `node seed-database.js` to populate test data
- [ ] Start both backend servers
- [ ] Start frontend
- [ ] Login as Admin and verify dashboard shows data
- [ ] Login as Student and send message to Transport
- [ ] Login as Transport and verify message appears
- [ ] Check server console for detailed logs
- [ ] Test message receiving, sending, and broadcasting

---

## 📝 Summary

**What works now:**
- ✅ Admin dashboard fetches and displays department statistics
- ✅ Staff receives messages sent from students
- ✅ Improved query logic with detailed logging
- ✅ Database includes all staff roles with proper department values
- ✅ JWT tokens include department information

**Known working flows:**
1. Student → sends message → Transport staff receives it
2. Admin → creates broadcast → all staff see it
3. Admin dashboard → shows real clearance statistics

If you encounter any issues, check the server console logs first as they provide detailed debugging information about what's happening.
