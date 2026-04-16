# Admin User Management System - Complete Guide

## Overview

The Admin User Management system allows system administrators to:
- ✅ Create users for all departments (Library, Transport, Laboratory, etc.)
- ✅ View all users in a searchable, filterable table
- ✅ Delete department staff users
- ✅ Protect student users from accidental deletion
- ✅ Search by name, email, or SAP ID
- ✅ Filter by user role

## Features

### 1. **Create New Users**
- Accessible via "➕ Create New User" button in the header
- Modal form with required fields:
  - **Full Name**: User's complete name
  - **Email**: Unique email address (enforced)
  - **Password**: Minimum 6 characters (hashed for security)
  - **Role**: Select from 8 role options
  - **Department**: Automatically synced with role selection
  - **SAP ID** (Optional): Student or staff ID

### 2. **User List Display**
- Table shows all users with columns:
  - User Avatar with initials
  - Name
  - Email
  - Role (color-coded badge)
  - Department
  - SAP ID
  - Creation Date
  - Actions

### 3. **Search & Filter**
- **Search Box**: Find users by name, email, or SAP ID
- **Role Filter**: Filter by specific user role
- **User Count**: Shows number of matching results

### 4. **Delete Users**
- Red "🗑️ Delete" button for non-student users
- Student users show "🔒 Protected" badge (cannot delete)
- Confirmation dialog before deletion
- Success/error notifications

## User Roles

| Role | Department | Code |
|------|-----------|------|
| 📚 Library Staff | Library | `library` |
| 🚌 Transport Staff | Transport | `transport` |
| 🔬 Laboratory Staff | Laboratory | `laboratory` |
| 🎓 Student Service Staff | Student Service | `studentservice` |
| 💰 Fee Department Staff | Fee Department | `feedepartment` |
| 🏢 Coordination Staff | Coordination | `coordination` |
| 👨‍💼 HOD | HOD | `hod` |
| 🔐 Admin | N/A | `admin` |

## Technical Implementation

### Frontend Components

**File**: `src/components/Admin/AdminUserManagement.js`

```javascript
// Main features:
- State management for users, loading, errors
- Fetch users on component mount
- Modal form for creating new users
- Auto-sync department with role selection
- Search and filter functionality
- Delete confirmation and execution
- Real-time success/error alerts
```

**Styling**: `src/components/Admin/AdminUserManagement.css`
- Gradient purple sidebar (667eea → 764ba2)
- Color-coded role badges
- Responsive table with sticky header
- Modal animations and transitions
- Mobile-friendly layout

### Backend API Endpoints

**Base URL**: `/api/admin`

#### 1. Get All Users
```
GET /api/admin/users
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "full_name": "John Doe",
      "email": "john@riphah.edu.pk",
      "role": "library",
      "department": "Library",
      "sap": "1234567",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### 2. Create New User
```
POST /api/admin/create-user
Authorization: Bearer {token}

Request Body:
{
  "full_name": "Jane Smith",
  "email": "jane@riphah.edu.pk",
  "password": "SecurePass123",
  "role": "library",
  "department": "Library",
  "sap": "9876543"
}

Response:
{
  "success": true,
  "message": "✅ User Jane Smith created successfully",
  "data": { ...user object without password }
}
```

#### 3. Delete User
```
DELETE /api/admin/users/{userId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "✅ User Jane Smith deleted successfully"
}

Error (if student):
{
  "success": false,
  "message": "❌ Cannot delete student users"
}
```

### Backend Routes File
**Location**: `backend/routes/adminRoutes.js`

```javascript
// Endpoints added:
router.get('/users', verifyToken, verifyAdmin, ...)
router.post('/create-user', verifyToken, verifyAdmin, ...)
router.delete('/users/:userId', verifyToken, verifyAdmin, ...)

// Middleware included:
- verifyToken: Validates JWT
- verifyAdmin: Checks if user.role === 'admin'
- Password hashing with bcryptjs
- Email validation and uniqueness check
```

## Security Features

✅ **JWT Authentication**: All endpoints require valid token
✅ **Role-Based Access**: Only admin users can access endpoints
✅ **Password Hashing**: Passwords hashed with bcryptjs (10 rounds)
✅ **Email Uniqueness**: Database constraint prevents duplicate emails
✅ **Student Protection**: Cannot delete student role users
✅ **Input Validation**: All fields validated before database insert
✅ **Error Handling**: Comprehensive try-catch with meaningful messages

## Usage Flow

### Creating a New Department Staff Member

1. **Admin navigates** to User Management from sidebar
2. **Clicks** "➕ Create New User" button
3. **Fills form**:
   - Name: `Ahmed Hassan`
   - Email: `ahmed.hassan@riphah.edu.pk`
   - Password: `MySecurePass123`
   - Role: `📚 Library Staff`
   - Department: Auto-sets to `Library`
   - SAP: `1234567` (optional)
4. **Submits form** → API call to `/api/admin/create-user`
5. **Sees success** message → Table refreshes with new user
6. New user can now login with credentials

### Deleting a Department Staff Member

1. **Admin finds user** in table (search/filter if needed)
2. **Clicks** "🗑️ Delete" button on user row
3. **Confirms deletion** in popup dialog
4. **API call** to `/api/admin/users/{userId}`
5. **Sees success** message → Table refreshes
6. User account is removed from system

### Finding Users

**By Search**:
- Type name: `Ahmed` → Shows all users named Ahmed
- Type email: `ahmed@` → Shows all users with ahmed email
- Type SAP: `1234567` → Shows user with that SAP ID

**By Role Filter**:
- Select "Library" → Shows only library staff
- Select "Student Service" → Shows only student service staff

## Database Schema

```javascript
User Model:
{
  _id: ObjectId,
  full_name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  role: String (required),
  sap: String (optional),
  department: String (optional),
  created_at: Date (default: now),
  createdAt: Date (MongoDB default)
}
```

## Error Handling

| Error | Solution |
|-------|----------|
| "Missing required fields" | Fill all marked with * |
| "Email already exists" | Use different email |
| "Password must be at least 6 characters" | Enter longer password |
| "Access denied. Admin only." | Login with admin account |
| "Cannot delete student users" | Only delete department staff |
| "User not found" | Refresh page, user may have been deleted |

## Navigation Integration

The component is fully integrated in admin sidebar:

```
📊 Dashboard
📋 Clearance Requests
👥 User Management ← NEW
💬 Messages
⚙️ Settings
🚪 Logout
```

## Responsive Design

- ✅ **Desktop (1200px+)**: Full layout with sidebar
- ✅ **Tablet (768px-1199px)**: Stacked layout, adjusted spacing
- ✅ **Mobile (< 768px)**: Hidden sidebar, fullscreen table
- ✅ **Small Mobile (< 480px)**: Compact mode with horizontal scroll table

## Color Scheme

- **Primary**: #667eea → #764ba2 (gradient)
- **Success**: #3c3 (green alerts)
- **Error**: #c33 (red alerts)
- **Secondary**: #f5f5f5 (background)
- **Text**: #333 (dark gray)

## Future Enhancements

- [ ] Edit user functionality
- [ ] Bulk user import via CSV
- [ ] User activity logs
- [ ] Email verification for new users
- [ ] Password reset functionality
- [ ] User deactivation (soft delete)
- [ ] Export users to PDF/Excel

## Testing Checklist

- [ ] Create user with all roles
- [ ] Search by name, email, SAP ID
- [ ] Filter by role
- [ ] Verify password hashing (check DB)
- [ ] Try duplicate email (should fail)
- [ ] Try password < 6 chars (should fail)
- [ ] Delete non-student user (should work)
- [ ] Try delete student user (should fail)
- [ ] Verify created users can login
- [ ] Check responsive design on mobile
- [ ] Verify JWT validation (logout then try access)

## Files Modified/Created

### Frontend
- ✅ `src/components/Admin/AdminUserManagement.js` (NEW)
- ✅ `src/components/Admin/AdminUserManagement.css` (NEW)
- ✅ `my-app/src/components/Admin/AdminUserManagement.js` (NEW)
- ✅ `my-app/src/components/Admin/AdminUserManagement.css` (NEW)
- ✅ `src/App.js` (Updated - added route)
- ✅ `my-app/src/App.js` (Updated - added route)

### Backend
- ✅ `backend/routes/adminRoutes.js` (Updated - added endpoints)
- ✅ `my-app/backend/routes/adminRoutes.js` (Updated - added endpoints)

## Support & Troubleshooting

If you encounter issues:

1. **Check JWT Token**: Ensure admin user is logged in
2. **Check Bcrypt**: Ensure `bcryptjs` is installed: `npm install bcryptjs`
3. **Check MongoDB**: Verify User collection exists and has proper indexes
4. **Check Console**: View browser/server console for detailed error messages
5. **Clear Cache**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

---

**Status**: ✅ COMPLETE AND READY TO USE
**Last Updated**: January 2025
**Version**: 1.0
