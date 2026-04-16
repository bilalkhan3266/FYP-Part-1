# Messaging System Debug & Test Guide

## Issue Summary
Departments are not receiving messages sent by admin. The problem was identified as a mismatch between how messages are stored and how they are retrieved.

## What Was Fixed

### Backend Changes
1. **Message Retrieval** (`messages.routes.js` - `/api/my-messages`):
   - ✅ Changed from querying only `recipient_department` 
   - ✅ Now queries both `recipient_id` AND `recipient_department` with proper regex matching
   - ✅ Handles both individual messages and broadcast messages

2. **Staff Message Endpoint** (`libraryRoutes.js` - `/my-messages`):
   - ✅ Changed from querying `sender_id` (outgoing messages)
   - ✅ Now queries `recipient_id` OR `recipient_department` (incoming messages)
   - ✅ Uses `$or` operator to match either condition

3. **Message Sending** (`adminRoutes.js` - POST `/api/admin/send-message`):
   - ✅ Added comprehensive logging to track created messages
   - ✅ Logs sample message with all fields to verify correct structure

4. **Diagnostics Endpoint** (`adminRoutes.js` - GET `/api/admin/diagnostics`):
   - ✅ New endpoint to check system state
   - ✅ Shows staff count by role
   - ✅ Shows messages by department
   - ✅ Lists sample messages

## How to Test

### Step 1: Check System Diagnostics
```
GET http://localhost:5000/api/admin/diagnostics
Headers: Authorization: Bearer <admin_token>
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "staffByRole": [
      { "_id": "library", "count": 2 },
      { "_id": "transport", "count": 1 },
      ...
    ],
    "messagesByDept": [
      { "_id": "library", "count": 5 },
      ...
    ],
    "totalMessages": 25,
    "totalUsers": 50,
    "sampleMessages": [...]
  }
}
```

**What to look for:**
- Are there staff members in each department role?
- Are there messages already in the database?
- Check the `sampleMessages` to see their structure (look for `recipient_department` and `recipient_id`)

### Step 2: Send a Test Message
1. Login as Admin
2. Go to Admin Messages
3. Select message type: **"Department"**
4. Select target type: **"Specific"**
5. Select a department (e.g., "Library")
6. Enter subject and message
7. Click Send

**Check the backend console:**
```
🔍 [send-message] Finding users for department: Library
✅ [send-message] Found X users for Library
✅ [send-message] Created X messages for X department users
📧 Sample message: { recipient_department: "library", recipient_id: "...", ... }
```

### Step 3: Login as Department Staff
1. Logout from Admin
2. Login as a staff member (e.g., Library staff with role "library")
3. Go to their Messages page
4. Check if the message appears

**Backend will log:**
```
🔍 [my-messages] Querying for staff: library (ID: ...)
✅ [my-messages] Found X messages for library staff
```

### Step 4: Test Broadcast to All Departments
1. Login as Admin
2. Go to Admin Messages
3. Select message type: **"Broadcast to Staff Role"**
4. Select a role (e.g., "📚 Library")
5. Enter subject and message
6. Click Send

**Check console:**
```
✅ [send-message] Found X users for library
✅ [send-message] Created X role-based broadcast messages to X staff
```

## Troubleshooting

### Problem: "No staff members found with role: library"
**Cause:** No users in the database with role "library"
**Solution:** 
1. Create staff users in Admin User Management
2. Make sure to assign the correct role:
   - Library
   - Transport
   - Laboratory
   - Fee Department
   - Coordination
   - Student Services

### Problem: Messages not appearing after sending
**Debug Steps:**
1. Run diagnostics to see if messages were created:
   ```
   GET /api/admin/diagnostics
   ```
2. Check the `sampleMessages` - are new messages there?
3. Login as staff and check console for query logs
4. Verify `recipient_department` matches the staff member's `role` (case-insensitive)

### Problem: Department appears in one place but not another
**Possible Causes:**
- Role name mismatch (e.g., "Library" vs "library" vs "LIBRARY")
- Department field vs Role field confusion
- Staff user doesn't have the correct role assigned

**How to Fix:**
1. Verify staff user role is one of:
   - library
   - transport
   - laboratory
   - feedepartment
   - coordination
   - studentservice
2. Admin form must use exact department names:
   - Library → searches for role: "library"
   - Transport → searches for role: "transport"
   - etc.

## Database Query Examples

### Find all Library staff
```javascript
db.users.find({ role: /^library$/i })
```

### Find all messages sent to Library staff
```javascript
db.messages.find({ recipient_department: /^library$/i, message_type: "notification" })
```

### Find all messages for a specific staff member
```javascript
db.messages.find({
  $or: [
    { recipient_id: ObjectId("...") },
    { recipient_department: /^library$/i }
  ]
})
```

## Message Flow Diagram

```
ADMIN SENDS MESSAGE
        ↓
Frontend: POST /api/admin/send-message
        ↓
Backend:
1. Find users with role matching selected department
2. For each user, create Message document:
   {
     sender_id: admin's id,
     recipient_id: staff_member's id,
     recipient_department: staff_member.role,
     subject: "[ADMIN REMINDER] ...",
     message_type: "notification",
     ...
   }
        ↓
STAFF MEMBER LOGS IN
        ↓
Frontend: GET /api/my-messages OR /library/my-messages
        ↓
Backend:
Query: Message.find({
  $or: [
    { recipient_id: staff_member's id },
    { recipient_department: staff_member.role, message_type: "notification" }
  ]
})
        ↓
Display messages to staff
```

## Key Files Modified

1. **g:\Part_3_Library\my-app\backend\routes\messages.routes.js**
   - Updated `/my-messages` endpoint for staff

2. **g:\Part_3_Library\my-app\backend\routes\libraryRoutes.js**
   - Updated `/my-messages` endpoint
   - Added diagnostic logging

3. **g:\Part_3_Library\my-app\backend\routes\adminRoutes.js**
   - Enhanced logging in `/send-message`
   - Added `/diagnostics` endpoint

4. **g:\Part_3_Library\backend\routes\messages.routes.js** (backup)
   - Same updates as messages.routes.js

5. **g:\Part_3_Library\backend\routes\libraryRoutes.js** (backup)
   - Same updates as my-app version

## Testing Checklist

- [ ] Create at least one staff member for each department
- [ ] Run `/api/admin/diagnostics` and verify staff counts
- [ ] Send a message to "Library" department
- [ ] Verify console shows "Created X messages"
- [ ] Login as Library staff and check messages appear
- [ ] Test sending to "All Departments"
- [ ] Test broadcast to specific role
- [ ] Test sending to individual student (SAP ID)

## Notes

- All role comparisons are case-insensitive (using regex with `i` flag)
- Messages are identified by `message_type: "notification"` for admin broadcasts
- Each staff member gets their own message document (not shared)
- Messages are sorted by `createdAt` in descending order (newest first)
