# Test Steps: Verify Library Reply Message Delivery

## Manual Testing Instructions

### Prerequisites
- Backend server running on port 5000
- MongoDB running on localhost:27017
- At least 2 users created: 1 Student + 1 Library Staff

### Test Case: Library Replies to Student Message

#### Step 1: Login as Student
1. Open the application
2. Click "Login"
3. Enter student credentials (e.g., email: student@example.com, password: password)
4. Click "Sign In"
5. **Expected**: Student dashboard loads successfully

#### Step 2: Send Message to Library
1. Navigate to "Messages" or "Compose Message"
2. Fill in the form:
   - **Select Department**: Library
   - **Subject**: Test Library Request
   - **Message**: Can I request a book on programming?
3. Click "Send Message"
4. **Expected**: See notification "Message sent successfully"

#### Step 3: Verify Message Appears in Library Inbox
1. Logout from student account
2. Login as Library Staff (e.g., email: library@example.com)
3. Navigate to Messages
4. **Expected**: See the student's message in the inbox

#### Step 4: Reply to Student Message
1. In Library staff's message view
2. Click "Reply" button on the student's message
3. Type reply message: "Yes, we have that book available. Please visit the library counter."
4. Click "Send Reply"
5. **Expected**: See notification "Reply sent successfully"
6. **IMPORTANT**: Note the timestamp when reply was sent

#### Step 5: Verify Student Receives Reply
1. Logout from Library staff account
2. Login back as Student (using same credentials from Step 1)
3. Navigate to Messages
4. **EXPECTED RESULT**: 
   - ✅ See BOTH the original message (student's question) AND
   - ✅ See the Library's reply message
   - ✅ Reply shows the timestamp from Step 4
   - ✅ Reply shows "Library" or "Library Staff" as sender
   - ✅ Message content shows the reply text

### Expected Message Display Order
```
Messages for Student:
1. [REPLY] Library Staff - "Re: Test Library Request"
   Reply message appears at TOP (newest)

2. [QUESTION] Student - "Test Library Request" 
   Original message appears below
```

### If Test Fails: What to Check

**If student doesn't see the reply:**

1. Check backend logs for:
   ```
   📨 Fetching messages for SAP ID: [student_sapid], Role: student
   🔍 Student query parameters:
      - Looking for recipient_sapid: [student_sapid]
      - OR recipient_id: [student_id]
   ✅ Found X messages for student [student_sapid]
   ```

2. Verify the reply message was created:
   ```
   ✅ Reply saved successfully: [reply_message_id]
      Reply sender_id: [library_staff_id]
      Reply recipient_sapid: [student_sapid]
      Reply recipient_id: [student_id]
   ```

3. Check if recipient_id matches:
   - Student's `req.user.id` from JWT token
   - Should match the `recipient_id` field in reply message

### Database Verification (MongoDB)

If you need to manually verify, run:
```javascript
db.messages.findOne({ message_type: "reply" }, { 
  _id: 1, 
  sender_name: 1, 
  recipient_id: 1, 
  recipient_sapid: 1, 
  message_type: 1,
  createdAt: 1
})
```

Should show:
- `sender_name`: "Library Staff"
- `recipient_id`: Student's MongoDB ObjectId
- `recipient_sapid`: Student's SAP ID
- `message_type`: "reply"

## Automated Testing

You can use the provided test script:
```bash
cd G:\Part_3_Library
node test-library-reply.js
```

Expected output:
```
🎉 SUCCESS! Library reply is now visible to the student!
```

## Success Criteria

✅ Student sends message to Library department
✅ Library staff sees the message
✅ Library staff clicks Reply and sends message
✅ System shows "Reply sent successfully"
✅ **Student SEES the reply in their message inbox** ← Main fix
✅ Reply shows correct sender (Library)
✅ Reply shows correct timestamp
✅ Reply message content is readable

## Related Test Cases

These should also work now:
- ✅ Transport department replies
- ✅ Laboratory department replies  
- ✅ Fee Department replies
- ✅ Coordination department replies
- ✅ Student Service replies
- ✅ Any custom department replies

## Troubleshooting

### Issue: "Message sent successfully" but reply doesn't appear
**Cause**: Fixed by updating student query to use `req.user.id` instead of `req.user._id`
**Status**: ✅ RESOLVED

### Issue: "Cannot determine student SAP ID from original message"
**Cause**: Student's original message doesn't have `sender_sapid` set
**Solution**: System falls back to looking up student by `sender_id` and getting SAP from User record
**Status**: ✅ WORKING

### Issue: Student doesn't see message even after 5 minutes
**Cause**: Browser caching or need to refresh
**Solution**: Clear browser cache or hard refresh (Ctrl+Shift+R)

## Support Documentation

- [Library Reply Fix Complete](LIBRARY_REPLY_FIX_COMPLETE.md)
- [Library Reply Quick Fix](LIBRARY_REPLY_QUICK_FIX.md)
- Message Routes: `/backend/routes/messages.routes.js`
- Server Endpoints: `/backend/server.js` (around line 1435)
