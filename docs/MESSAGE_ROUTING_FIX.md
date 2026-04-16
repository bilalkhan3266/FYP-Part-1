# Message Routing Fix - Student to Department Messages

## ❌ Problem Found

When students sent messages to departments, the system was incorrectly setting:

```javascript
// WRONG CODE (Line 2107-2108)
recipient_sapid: senderSapid,     // ❌ Set to student's SAP ID
recipient_id: senderId,            // ❌ Set to student's user ID
```

This caused the message to appear as if it was being sent BACK TO THE STUDENT instead of TO THE DEPARTMENT.

## ✅ Fix Applied

Changed the message creation for student-to-department messages:

```javascript
// CORRECTED CODE (Line 2107-2108)
recipient_sapid: null,              // ✅ Set to null for department messages
recipient_id: null,                 // ✅ Set to null for department messages
recipient_department: recipient_department,  // ✅ Message routed BY DEPARTMENT NAME
```

## 🔍 How Message Routing Works

### For Student → Department Messages:
```
Student sends message to "Library"
    ↓
Message saved with:
  - sender_sapid: "254" (student's SAP)
  - sender_role: "student"
  - recipient_department: "Library"
  - recipient_sapid: null (not used for dept messages)
  - recipient_id: null (not used for dept messages)
    ↓
Department staff fetches messages with query:
  {
    $or: [
      { sender_id: staffId },           // Messages they sent
      { recipient_id: staffId },        // Direct messages to them
      {                                 // Messages from students to their department
        recipient_department: /^Library$/i,
        sender_role: "student"
      }
    ]
  }
    ↓
Message properly DISPLAYED to Library department staff ✅
```

### For Department → Student Messages:
```
Department staff sends message to student 254
    ↓
Message saved with:
  - sender_sapid: null (department staff, not a student)
  - sender_role: "library" / "transport" / etc.
  - recipient_sapid: "254" (the student's SAP)
  - recipient_id: [student's MongoDB ID]
  - recipient_department: "Library" / "Transport" / etc.
    ↓
Student fetches messages with query:
  {
    $or: [
      { sender_id: studentId },      // Messages they sent
      { recipient_id: studentId }    // Messages sent to them ✅
    ]
  }
    ↓
Message properly DISPLAYED to student ✅
```

## 📝 Message Schema Reference

```javascript
{
  sender_id: ObjectId,                    // MongoDB user ID of sender
  sender_sapid: String,                   // SAP ID of STUDENT sender (null for dept)
  sender_role: String,                    // "student", "library", "transport", etc.
  sender_name: String,                    // Full name of sender
  
  recipient_id: ObjectId | null,          // MongoDB user ID of STUDENT recipient
  recipient_sapid: String | null,         // SAP ID of STUDENT recipient
  recipient_department: String,           // Department name (for dept messages)
  
  conversation_id: String,                // Unique ID for grouping messages
  
  subject: String,
  message: String,
  message_type: String,                   // "question", "reply", "notification", etc.
  is_read: Boolean,
  createdAt: Date
}
```

## 🔧 Files Changed

- **backend/server.js** - Line 2107-2108
  - Function: `/api/send-message` endpoint (student to department)
  - Changed: `recipient_sapid` and `recipient_id` from student's ID to `null`

## ✨ Impact

### Before Fix:
- ❌ Student sends to "Transport" department
- ❌ Message stored with `recipient_sapid: 254` (student's own SAP)
- ❌ Department queries can't find the message
- ❌ Message disappears / doesn't reach department

### After Fix:
- ✅ Student sends to "Transport" department
- ✅ Message stored with `recipient_department: "Transport"` and `recipient_sapid: null`
- ✅ Department queries find message using recipient_department filter
- ✅ Message properly displays in department's message list

## 🧪 Testing

To verify the fix works:

1. **Student sends message to Department:**
   ```bash
   curl -X POST http://localhost:5000/api/send-message \
     -H "Content-Type: application/json" \
     -d '{
       "recipient_department": "Library",
       "subject": "Book Request",
       "message": "I need to return a book"
     }'
   ```
   
   Expected: Message goes to Library department (recipient_department = "Library")

2. **Check message in DB:**
   ```javascript
   db.messages.findOne({ 
     sender_role: "student", 
     recipient_department: "Library"
   })
   
   // Should show: recipient_sapid: null, recipient_id: null ✅
   ```

3. **Library staff sees message:**
   - Library staff calls `/api/my-messages`
   - Should see messages where `recipient_department: /^Library$/i` and `sender_role: "student"`
   - Message now properly routed! ✅

## 📊 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Student → Department** | ❌ recipient_sapid = student's SAP | ✅ recipient_sapid = null |
| **Message Routing** | ❌ Routed back to student | ✅ Routed to department by name |
| **Department Visibility** | ❌ Message hidden from department | ✅ Message visible to department |
| **System** | ❌ Broken message delivery | ✅ Proper message delivery |

---

**Status**: ✅ FIXED  
**Date**: April 3, 2026  
**Files Changed**: backend/server.js (1 edit)  
**Lines Changed**: 2107-2108
