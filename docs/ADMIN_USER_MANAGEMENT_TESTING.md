# Admin User Management - Quick Start & Testing Guide

## 🚀 Quick Start

### Step 1: Verify Admin Login
```
1. Go to: http://localhost:3000/login
2. Login with admin account
3. You should be redirected to admin dashboard
```

### Step 2: Navigate to User Management
```
1. Click "👥 User Management" in left sidebar
2. Page loads with user list and "➕ Create New User" button
3. You're ready to manage users!
```

## 📋 Testing Checklist

### Test 1: Create a New Library Staff User
```
✓ Click "➕ Create New User" button
✓ Fill form:
  - Full Name: Ahmed Hassan
  - Email: ahmed.hassan@riphah.edu.pk
  - Password: TestPass123
  - Role: 📚 Library Staff
  - Department: Should auto-set to "Library"
  - SAP ID: 1234567
✓ Click "✅ Create User"
✓ See success message: "✅ User Ahmed Hassan created successfully!"
✓ User appears in table
```

### Test 2: Search by Name
```
✓ In search box, type: Ahmed
✓ Table shows only users with "Ahmed" in name
✓ Count shows filtered results
✓ Clear search (select all, delete) → table resets
```

### Test 3: Search by Email
```
✓ In search box, type: ahmed.hassan@
✓ Finds user by email match
✓ Works with partial email
```

### Test 4: Filter by Role
```
✓ Click role dropdown
✓ Select "Library"
✓ Shows only library staff members
✓ Select "All Roles" → shows all users
```

### Test 5: Create Multiple Departments
```
✓ Test 1: Role "🚌 Transport Staff" → Department auto-sets to "Transport"
✓ Test 2: Role "🔬 Laboratory Staff" → Department auto-sets to "Laboratory"
✓ Test 3: Role "💰 Fee Department Staff" → Department auto-sets to "Fee Department"
✓ All users appear in table with correct roles
```

### Test 6: Try Invalid Inputs
```
✓ Try create with missing Full Name → Error shown
✓ Try create with missing Email → Error shown
✓ Try create with password < 6 chars → Error shown
✓ Try create with duplicate email → Error shown: "Email already exists"
```

### Test 7: Delete Non-Student User
```
✓ Find library staff user in table
✓ Click "🗑️ Delete" button
✓ Confirmation dialog appears
✓ Click "OK" to confirm
✓ See success message
✓ User disappears from table
```

### Test 8: Try Delete Student (Should Fail)
```
✓ If you have student users in table:
  - Click "🗑️ Delete" on student user
  - Should see: "❌ Cannot delete student users"
  - OR user shows "🔒 Protected" badge (cannot delete)
```

### Test 9: Test New User Login
```
✓ Create new library user: test@riphah.edu.pk / pass123456
✓ Logout from admin
✓ Login page: http://localhost:3000/login
✓ Enter test@riphah.edu.pk / pass123456
✓ Should successfully login as library staff
✓ Redirects to library dashboard
```

### Test 10: Responsive Design
```
✓ Test on Desktop (1200px): Full sidebar visible
✓ Test on Tablet (768px): Responsive layout
✓ Test on Mobile (480px): Table scrollable, sidebar hidden
✓ All buttons and forms work on all sizes
```

## 🔧 Backend Testing (Optional)

### Test API Endpoints with cURL or Postman

#### 1. Get All Users
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 2. Create User
```bash
curl -X POST http://localhost:5000/api/admin/create-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@riphah.edu.pk",
    "password": "TestPass123",
    "role": "library",
    "department": "Library",
    "sap": "9876543"
  }'
```

#### 3. Delete User
```bash
curl -X DELETE http://localhost:5000/api/admin/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 Expected Results

### User Creation Success Response
```json
{
  "success": true,
  "message": "✅ User Ahmed Hassan created successfully",
  "data": {
    "_id": "...",
    "full_name": "Ahmed Hassan",
    "email": "ahmed.hassan@riphah.edu.pk",
    "role": "library",
    "department": "Library",
    "sap": "1234567",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### User Delete Error (Student Protection)
```json
{
  "success": false,
  "message": "❌ Cannot delete student users"
}
```

## 🐛 Common Issues & Solutions

### Issue: Modal not opening
**Solution**: Check browser console for errors, verify React version

### Issue: "Access denied. Admin only"
**Solution**: Logout and login with admin account only

### Issue: "Email already exists"
**Solution**: Use different email address or delete the existing user

### Issue: Users table shows empty
**Solution**: 
- Check database connection
- Verify MongoDB is running
- Check admin token is valid

### Issue: Password not being hashed
**Solution**: Ensure `bcryptjs` is installed in backend

### Issue: Delete button not working
**Solution**: Check if user role is "student" (protected)

## 📈 Performance Tips

- **Large user lists**: Use search/filter to narrow results
- **Bulk operations**: Consider CSV import feature (future)
- **Database indexes**: Ensure email field is indexed

## 🔐 Security Verification

Run these security checks:

1. **Check Password Hashing**:
   - Create user via UI
   - Check MongoDB directly
   - Password should NOT be plain text

2. **Check JWT Protection**:
   - Try access endpoint without token
   - Should get "401 Unauthorized"

3. **Check Role Verification**:
   - Login as non-admin
   - Try access admin endpoints
   - Should get "403 Access denied"

4. **Check Student Protection**:
   - Try delete student via API
   - Should get "400 Cannot delete students"

## ✅ Completion Checklist

- [ ] Admin can create users for all departments
- [ ] Admin can search users by name, email, SAP ID
- [ ] Admin can filter users by role
- [ ] Admin can delete non-student users
- [ ] Student users cannot be deleted
- [ ] New users can login with created credentials
- [ ] Invalid inputs show proper error messages
- [ ] Success messages appear after operations
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] Backend API endpoints respond correctly
- [ ] JWT authentication is enforced
- [ ] Password hashing is working

## 📞 Support Commands

### Check MongoDB Connection
```bash
mongo mongodb://localhost:27017
use clearance_db
db.users.find().limit(5)
```

### Check Backend Server Logs
```bash
cd backend
npm start
# Look for "✅ Server running on http://localhost:5000"
```

### Check Frontend Console
```
F12 → Console tab → Look for errors/warnings
```

---

**All tests passing?** ✅ System is ready for production!

**Test Date**: ___________
**Tester**: ___________
**Status**: ___________
