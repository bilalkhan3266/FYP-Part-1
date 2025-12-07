# 🧪 QUICK TESTING GUIDE

## Step 1: Verify Servers Are Running

### Backend (Should show in terminal)
```
✅ Server running at http://localhost:5000
✅ Database connected
```

### Frontend (Should show in terminal)
```
✅ Compiled successfully!
✅ Local: http://localhost:3000
```

---

## Step 2: Test Signup

1. Go to `http://localhost:3000/signup`
2. Fill in the form:
   - **Full Name:** Test Student
   - **Email:** student@test.com
   - **Password:** password123
   - **Role:** Select "Student"
   - **SAP:** 123456
   - **Department:** (Optional)
3. Click **"Sign Up"**
4. ✅ Should redirect to Student Dashboard

---

## Step 3: Test Student Dashboard

After signup, you should see:
- ✅ Welcome message with your name
- ✅ Circular progress indicator (0% initially)
- ✅ Three stat cards (Approved, Pending, Rejected)
- ✅ "New Clearance Request" button
- ✅ Sidebar with profile picture (first letter of name)

---

## Step 4: Test Creating Clearance Request

1. Click **"New Clearance Request"** or navigate via sidebar
2. Fill the form:
   - **Select Department:** Choose any (Finance, Academic Affairs, etc.)
   - **Reason:** "I need clearance to graduate because I have completed all coursework and need final clearance" (min 10 chars)
3. Click **"Submit Request"**
4. ✅ Should see green success notification
5. ✅ Should auto-redirect to dashboard after 1.5 seconds
6. ✅ Should see the clearance request in the department cards

---

## Step 5: Check Database

### Connect to MySQL
```bash
mysql -u root -p
USE role_based_system;
```

### Verify Clearance Request Was Saved
```sql
SELECT * FROM clearance_requests;
```

### Expected Output
```
id | student_id | department | reason | status | submitted_at
1  | 1          | Finance    | I need... | Pending | [timestamp]
```

---

## Step 6: Test Dashboard Features

### Check Progress Bar
- Initially shows **0%** (no approved requests)
- Circular indicator should be empty

### Check Stats
- **Approved:** 0 (green card)
- **Pending:** 1 (orange card - shows your new request)
- **Rejected:** 0 (red card)

### Check Department Card
- Should show your submitted department
- Status badge: **PENDING** (orange)
- Should display your reason text
- Action buttons: Message, Demo Clear

---

## Step 7: Test Logout

1. Click **"Logout"** button in sidebar
2. ✅ Should redirect to login page
3. Login again with same credentials
4. ✅ Dashboard should load with your previous data

---

## Step 8: Simulate Department Approval

### Update Database (to test progress display)
```sql
UPDATE clearance_requests 
SET status = 'Approved' 
WHERE id = 1;
```

### Refresh Dashboard
- Progress should now show **100%**
- Stat cards should update:
  - **Approved:** 1 (green)
  - **Pending:** 0
- Department card should show **APPROVED** badge (green)
- **Certificate section** should appear

---

## Step 9: Test Multiple Requests

1. Create another clearance request from different department
2. Dashboard should now show:
   - Progress: **50%** (1 approved, 1 pending)
   - Pending card: **1**
   - Two department cards in grid

---

## Step 10: Test Responsive Design

### Mobile View (375px)
1. Open DevTools (F12)
2. Toggle device toolbar
3. Set to iPhone SE or 375px width
4. Verify:
   - ✅ Sidebar is accessible
   - ✅ Cards stack vertically
   - ✅ Text is readable
   - ✅ Buttons are clickable

### Tablet View (768px)
1. Set to iPad or 768px width
2. Verify:
   - ✅ Grid adjusts to 2 columns
   - ✅ Sidebar is visible
   - ✅ All content readable

---

## 🐛 Troubleshooting

### Error: "Failed to connect to server"
- ✅ Check backend is running on port 5000
- ✅ Check MySQL database is accessible
- ✅ Check `.env` file has correct DB credentials

### Error: "Token expired"
- ✅ Clear localStorage and login again
- ✅ Token lasts 2 hours
- ✅ Check browser console for details

### Form not submitting
- ✅ Check Network tab (DevTools) for API errors
- ✅ Verify all required fields are filled
- ✅ Check reason is at least 10 characters
- ✅ Check token is in Authorization header

### Dashboard not loading data
- ✅ Refresh the page
- ✅ Check browser console for errors
- ✅ Verify you're logged in
- ✅ Check MySQL clearance_requests table has data

---

## ✅ Expected Results

After completing all steps:

| Feature | Status |
|---------|--------|
| Signup | ✅ Working |
| Login | ✅ Working |
| Dashboard | ✅ Displays correctly |
| Create Request | ✅ Saves to database |
| Progress Bar | ✅ Calculates correctly |
| Department Cards | ✅ Shows all requests |
| Responsive Design | ✅ Works on all sizes |
| Logout | ✅ Clears session |
| Database Sync | ✅ Real-time updates |

---

## 📱 API Endpoints (for manual testing)

### Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password123"}'
```

### Create Clearance Request
```bash
curl -X POST http://localhost:5000/clearance-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "student_id":1,
    "department":"Finance",
    "reason":"Need clearance to graduate",
    "status":"Pending"
  }'
```

### Get Clearance Requests
```bash
curl -X GET http://localhost:5000/clearance-requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**All tests should pass! 🎉**
