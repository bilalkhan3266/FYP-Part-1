# Admin Message System - Testing & Verification Guide

## Quick Test (5 minutes)

### Step 1: Send Admin Message
1. **Open Browser** → Navigate to your app
2. **Login as Admin** (use admin credentials)
3. **Go to**: Dashboard → Messages (💬 icon)
4. **Fill Form**:
   - Message Type: "📌 Send to Department (Reminder)"
   - Target Type: "Specific"
   - Department: "Library"
   - Subject: `Test Admin Message - Time: $(date)`
   - Message: "This is a test message to verify the fix is working"
   - Priority: "normal"
5. **Click**: "📤 Send Message"
6. **Expected**: ✅ Green message: "Message sent successfully!"

### Step 2: Verify Message Received
1. **Open New Private Browser Window** (or logout)
2. **Login as Library Staff** (use library user credentials)
3. **Go to**: Messages (in Library module)
4. **Click**: "📢 Admin Broadcasts" tab
5. **Expected**: ✅ Your message appears with subject "[ADMIN REMINDER] Test Admin Message..."

---

## Complete Test Plan

### Test Case 1: Send to Specific Department (Library)

**Preconditions:**
- Admin account is logged in
- Library staff account exists and is accessible

**Steps:**
1. Go to Admin → Messages
2. Select Message Type: "📌 Send to Department (Reminder)"
3. Select Target Type: "Specific"
4. Select Department: "Library"
5. Enter Subject: "Specific Department Test"
6. Enter Message: "This message is only for the library department"
7. Click "📤 Send Message"

**Expected Results:**
- ✅ Success message appears
- ✅ Admin sidebar shows message was logged
- ✅ Library staff can see message in Admin Broadcasts tab
- ✅ Transport/Coordination staff do NOT see this message

**Verification:**
```
Admin View: Message sent to 1 staff member (library user)
Library View: Message visible in Admin Broadcasts
Transport View: Message NOT visible
```

---

### Test Case 2: Send to All Departments

**Preconditions:**
- Admin account logged in
- Multiple department staff accounts exist

**Steps:**
1. Go to Admin → Messages
2. Select Message Type: "📌 Send to Department (Reminder)"
3. Select Target Type: "All Departments"
4. Enter Subject: "All Departments Test"
5. Enter Message: "This message should appear in all department inboxes"
6. Click "📤 Send Message"

**Expected Results:**
- ✅ Success message shows count of recipients
- ✅ All departments see message in their Admin Broadcasts tabs:
  - Library ✅
  - Transport ✅
  - Laboratory ✅
  - Fee Department ✅
  - Coordination ✅
  - Student Service ✅

**Verification:**
```
Admin console should show: "Created X messages for X department users"
Each department shows message when logged in
```

---

### Test Case 3: Broadcast to Specific Role

**Preconditions:**
- Admin logged in
- Multiple staff members with same role exist

**Steps:**
1. Go to Admin → Messages
2. Select Message Type: "📢 Broadcast to Role"
3. Select Role: "library"
4. Enter Subject: "Role Broadcast Test"
5. Enter Message: "Broadcast message to all library staff"
6. Click "📤 Send Message"

**Expected Results:**
- ✅ Success message
- ✅ All library staff see message in Admin Broadcasts
- ✅ Other departments don't see it

---

### Test Case 4: Send to Specific Student

**Preconditions:**
- Admin logged in
- Student SAP ID known (e.g., "LS12345")

**Steps:**
1. Go to Admin → Messages
2. Select Message Type: "📧 Send to Student"
3. Enter Student SAP ID: "LS12345"
4. Enter Subject: "Student Specific Message"
5. Enter Message: "This message is for a specific student"
6. Click "📤 Send Message"

**Expected Results:**
- ✅ Success message
- ✅ Student sees message in their inbox when logged in

---

## Browser Console Testing

If you need to debug, open Browser Console (F12) and look for these logs:

### On Admin Side (When Sending)
```javascript
// You should see:
✅ [send-message] Validation passed
✅ [send-message] Found X department users
✅ [send-message] Created X messages for X department users
📧 Sample message: { recipient_id: "...", message_type: "notification", ... }
```

### On Department Side (When Viewing Messages)
```javascript
// You should see:
📨 Fetching messages for SAP ID: ..., Role: library, Department: Library
🔍 [my-messages] Querying for staff: library (ID: ...)
✅ [my-messages] Found X messages for library staff
```

### Browser Network Tab
- Request: `GET /api/my-messages`
- Response should include messages with `message_type: "notification"`

---

## Visual Checklist During Testing

### Message Appearance Checklist

When viewing "Admin Broadcasts" tab, each message should have:

- [ ] Subject starting with "[ADMIN REMINDER]"
- [ ] From: "System Administrator" or "Admin"
- [ ] Date and time stamp
- [ ] Full message text visible
- [ ] Read/Unread indicator
- [ ] Reply button (if reply feature enabled)
- [ ] Message priority indicator (if shown)

### Message Content Example

```
┌─────────────────────────────────────────────┐
│ 📬 Admin Broadcasts (Library)                │
├─────────────────────────────────────────────┤
│                                              │
│ ❌ [ADMIN REMINDER] Test Admin Message      │
│    From: Administrator                      │
│    Date: 2025-12-24 14:30:00               │
│    Priority: Normal                         │
│                                              │
│    This is a test message to verify the     │
│    fix is working                           │
│                                              │
│    [✓] Mark as Read  [↩] Reply   [🗑] Delete
│                                              │
└─────────────────────────────────────────────┘
```

---

## Database Verification (Optional)

If you have access to MongoDB, verify messages were created:

### MongoDB Commands

```javascript
// Check total messages sent by admin
db.messages.countDocuments({
  sender_role: "admin",
  message_type: "notification"
})

// Expected: Should show count > 0 if you've sent messages

// Check messages for specific department
db.messages.find({
  recipient_department: /^library$/i,
  message_type: "notification"
}).count()

// Expected: Should show count matching sent messages

// View sample message
db.messages.findOne({
  sender_role: "admin",
  message_type: "notification"
})

// Expected output should look like:
{
  _id: ObjectId("..."),
  sender_id: ObjectId("..."),
  sender_name: "Admin Name",
  sender_role: "admin",
  recipient_id: ObjectId("..."),
  recipient_department: "library",
  message_type: "notification",
  subject: "[ADMIN REMINDER] Your Subject",
  message: "Your message text",
  status: "Pending",
  is_read: false,
  createdAt: ISODate("2025-12-24T14:30:00.000Z")
}
```

---

## Troubleshooting

### Issue: Messages not appearing in Department Broadcasts

**Check 1: Verify message was sent**
- Admin Dashboard → Messages → View Messages (button)
- Look for the message in the list
- If not there, check browser console for errors

**Check 2: Verify message_type is correct**
- Open Browser DevTools → Network tab
- Look at API response from `/api/my-messages`
- Check that messages have `"message_type": "notification"`

**Check 3: Clear browser cache**
- Clear localStorage: `localStorage.clear()`
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Reload page

**Check 4: Verify user roles match**
- Admin sending to department: "Library"
- Library user's role should be: "library" (lowercase in DB)
- Check MongoDB: `db.users.findOne({ email: "library@email.com" })`
- Verify `role: "library"`

### Issue: Different departments seeing each other's messages

**This is a bug. Check:**
1. Verify backend query filter in `/api/my-messages`
2. Should be: `{ recipient_id: userId } OR { recipient_department: roleRegex }`
3. Not: `{ recipient_id: { $exists: true } }`

---

## Performance Testing

### Message Load Time

1. **Admin sends 100 messages** to all departments
2. **Library staff logs in** and opens Admin Broadcasts
3. **Measure**: How long does it take to load?
   - Expected: < 2 seconds
   - If > 5 seconds: May need database indexing

### Recommended Index (if needed)

```javascript
db.messages.createIndex({
  recipient_department: 1,
  message_type: 1,
  createdAt: -1
})

db.messages.createIndex({
  recipient_id: 1,
  createdAt: -1
})
```

---

## Sign-Off Checklist

After completing tests, verify:

- [ ] Can send message to specific department ✅
- [ ] Message appears in that department's broadcasts ✅
- [ ] Message appears with "[ADMIN REMINDER]" prefix ✅
- [ ] Can send to all departments ✅
- [ ] All departments receive the message ✅
- [ ] Can broadcast to specific role ✅
- [ ] Staff members with that role see the message ✅
- [ ] Other departments don't see restricted messages ✅
- [ ] Messages are in correct order (newest first) ✅
- [ ] Can view message details ✅
- [ ] Can reply to messages ✅
- [ ] Browser console has no errors ✅
- [ ] Network requests are successful (200 status) ✅

---

## Quick Reference

### URLs & Endpoints

| Component | URL | Endpoint |
|-----------|-----|----------|
| Admin Messages | /admin-messages | /api/admin/send-message |
| Library View | /library/messages | /api/my-messages |
| Transport View | /transport/messages | /api/my-messages |
| Coordination View | /coordination/messages | /api/my-messages |
| Get Broadcasts | - | /api/my-messages + filter |

### Key Fields

Message object should contain:
```javascript
{
  message_type: "notification",           // CRITICAL
  recipient_id: ObjectId,                 // For specific staff
  recipient_department: "library",        // For broadcast to role
  subject: "[ADMIN REMINDER] ...",       // Format check
  is_read: false,                         // Initially
  createdAt: Date                         // Newest first
}
```

### Filter Logic

**Backend** (in /api/my-messages):
```javascript
// Find messages where:
{ recipient_id: userId } OR 
{ recipient_department: userRole AND message_type: 'notification' }
```

**Frontend** (in component):
```javascript
// Filter for:
msg.message_type === 'notification'
```

---

**Last Updated**: December 24, 2025  
**Status**: Ready for Testing ✅
