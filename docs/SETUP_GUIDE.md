# 🚀 TWO-WAY MESSAGING - QUICK START GUIDE

## Installation & Setup

### 1. **Backend Setup**
```bash
cd g:\Part_3_Library\my-app\backend
npm install
node server.js
```
✅ Server runs on `http://localhost:5000`

### 2. **Frontend Setup**
```bash
cd g:\Part_3_Library\my-app
npm start
```
✅ App runs on `http://localhost:3000`

---

## 🎯 Testing Two-Way Messaging

### **Test Case 1: Student Sends Message to Department**

**Step 1:** Login as Student
```
Email: student@example.com
Password: password123
```

**Step 2:** Go to "💬 Messages"

**Step 3:** Click "➕ New Message"

**Step 4:** Fill form
```
Department: Library
Subject: Clearance Status Query
Message: Hi, can you check my clearance status?
```

**Step 5:** Click "📤 Send Message"

✅ **Result:** Message appears in Library Department's inbox

---

### **Test Case 2: Department Replies to Student**

**Step 1:** Login as Library Staff
```
Email: library@example.com
Password: password123
Role: library
```

**Step 2:** Go to "Messages"

**Step 3:** Click conversation from student

**Step 4:** See message thread

**Step 5:** Type reply in reply area:
```
"Your clearance is approved! Please visit the library within 3 days."
```

**Step 6:** Click "📤 Send Reply"

✅ **Result:** Student sees department reply in conversation

---

### **Test Case 3: Multi-Reply Conversation**

**Continue conversation:**
- Student replies: "Thank you! Will visit tomorrow"
- Library replies: "Great! See you soon"
- Student replies: "Thanks, see you!"

✅ **Result:** Full conversation thread visible to both

---

## 📊 Database Structure

### MongoDB Collections

**Collection: messages**
```javascript
{
  conversation_id: "SAP-DEPT-TIMESTAMP",  // Groups all replies
  sender_id: ObjectId,
  sender_name: "John Doe",
  sender_role: "student" | "library" | "transport" | etc,
  sender_sapid: "12345",
  recipient_department: "Library",
  subject: "Clearance Status Query",
  message: "Hi, can you check...",
  message_type: "question" | "reply" | "info",
  is_read: false,
  read_at: null,
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

---

## 🔄 Data Flow

### **Student to Department (New Message)**
```
Student clicks "New Message"
    ↓
Fills department + subject + message
    ↓
POST /api/send-message
    ↓
Backend creates message with conversation_id
    ↓
Message stored in MongoDB
    ↓
Department sees in GET /api/conversations
```

### **Department to Student (Reply)**
```
Department opens conversation
    ↓
Sees all previous messages
    ↓
Types reply
    ↓
POST /api/messages/:conversation_id/reply
    ↓
Backend appends to conversation thread
    ↓
Student sees reply in GET /api/conversations/:id
```

---

## 🔐 Privacy & Security

✅ **SAPID-based Privacy**
- Students only see their own messages
- Departments only see messages for their department
- No cross-department visibility

✅ **Role-based Access**
- Students can only send to departments
- Departments can only reply to their messages
- Staff cannot see other department messages

✅ **Read Tracking**
- Each message tracks if read
- Timestamp of when read
- Both parties see read status

---

## 🎨 UI Components

### **Sidebar**
```
[➕ New Message]
──────────────
[Library]        → Click to view
  Clearance...    conversation
  Dec 7, 2025

[Transport]
  Request...
  Dec 6, 2025

[HOD]
  Final Appr...
  Dec 5, 2025
```

### **Thread View**
```
┌─────────────────────────┐
│ Subject                 │
│ with Library            │
├─────────────────────────┤
│ You                 2pm │
│ Hi, can you check...    │
│                         │
│ LIBRARY          3:30pm │
│ Your clearance is...    │
│ ✓ Read at 3:35pm       │
├─────────────────────────┤
│ [Reply text...]         │
│ [📤 Send Reply]         │
└─────────────────────────┘
```

---

## 🚨 Troubleshooting

### **Messages not showing?**
1. Check conversation_id is unique
2. Verify sender_role matches user role
3. Check MongoDB connection

### **Can't reply?**
1. Verify conversation exists
2. Check conversation_id format
3. Ensure department matches

### **Unread count wrong?**
1. Check is_read flag in database
2. Verify user.id is set correctly
3. Refresh unread count

---

## 📝 API Reference

### POST /api/send-message
**New conversation from student to department**
```javascript
Body: {
  recipient_department: "Library",
  subject: "My Question",
  message: "Please help..."
}
Response: {
  success: true,
  messageId: "...",
  conversation_id: "..."
}
```

### POST /api/messages/:conversation_id/reply
**Reply in existing conversation**
```javascript
Body: {
  message: "Here is my response..."
}
Response: {
  success: true,
  messageId: "..."
}
```

### GET /api/conversations
**Get all conversations**
```javascript
Response: {
  success: true,
  data: [
    {
      conversation_id: "...",
      subject: "...",
      sender_name: "...",
      recipient_department: "...",
      createdAt: "..."
    }
  ]
}
```

### GET /api/conversations/:conversation_id
**Get full conversation thread**
```javascript
Response: {
  success: true,
  data: [
    {
      sender_name: "...",
      sender_role: "...",
      message: "...",
      is_read: true,
      createdAt: "..."
    }
  ]
}
```

---

## ✅ Verification Checklist

- [ ] Backend running on localhost:5000
- [ ] Frontend running on localhost:3000
- [ ] MongoDB connected
- [ ] Can login as student
- [ ] Can send new message to department
- [ ] Message appears in department inbox
- [ ] Can login as department staff
- [ ] Can see student message in conversations
- [ ] Can reply to message
- [ ] Student sees department reply
- [ ] Can have multi-message conversation
- [ ] Unread count shows correctly
- [ ] Messages refresh every 10 seconds
- [ ] Delete message works
- [ ] All styling looks correct

---

## 🎉 All Done!

Your two-way messaging system is ready to use! 

Students and departments can now communicate back and forth in real-time conversations. Each message shows who sent it, when it was read, and belongs to a specific conversation thread.

**Enjoy!** 🚀
