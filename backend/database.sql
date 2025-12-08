-- MongoDB Collections Documentation
-- Use MongoDB Compass to create these collections

-- ============================================================
-- USERS COLLECTION (Already exists)
-- ============================================================
-- Collections in MongoDB role_based_system:
-- - users (Student, Library, Admin accounts)

-- ============================================================
-- MESSAGES COLLECTION (Extended for library)
-- ============================================================
-- Sample document structure for library clearance requests:
db.messages.insertOne({
  _id: ObjectId(),
  sender: ObjectId("librarian_id"),
  recipient_sapid: "23-ARID-001",
  studentId: ObjectId("student_user_id"),
  studentName: "Ali Khan",
  department: "Computer Science",
  subject: "Library Clearance Request",
  message: "Please approve my library clearance",
  message_type: "library_request",  // or "library_approval", "library_rejection"
  status: "Pending",  // "Pending", "Approved", "Rejected"
  remarks: "",
  approvedBy: ObjectId("librarian_id"),
  is_read: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

-- For library approval notifications:
db.messages.insertOne({
  _id: ObjectId(),
  sender: ObjectId("librarian_id"),
  recipient_sapid: "23-ARID-001",
  studentId: ObjectId("student_user_id"),
  subject: "✅ Library Clearance Approved",
  message: "Your library clearance request has been approved!",
  message_type: "library_approval",
  is_read: false,
  createdAt: new Date()
});

-- For library rejection notifications:
db.messages.insertOne({
  _id: ObjectId(),
  sender: ObjectId("librarian_id"),
  recipient_sapid: "23-ARID-001",
  studentId: ObjectId("student_user_id"),
  subject: "❌ Library Clearance Rejected",
  message: "Your library clearance request has been rejected.",
  message_type: "library_rejection",
  is_read: false,
  createdAt: new Date()
});

-- ============================================================
-- INDEXES (Create these for better performance)
-- ============================================================
db.messages.createIndex({ "message_type": 1, "status": 1, "createdAt": -1 });
db.messages.createIndex({ "recipient_sapid": 1 });
db.messages.createIndex({ "studentId": 1 });
db.messages.createIndex({ "is_read": 1 });
db.messages.createIndex({ "createdAt": -1 });

-- ============================================================
-- QUERIES (Common operations in library routes)
-- ============================================================
-- Pending library clearance requests:
db.messages.find({ message_type: "library_request", status: "Pending" }).sort({ createdAt: -1 });

-- Approved library clearance requests:
db.messages.find({ message_type: "library_request", status: "Approved" }).sort({ updatedAt: -1 });

-- Rejected library clearance requests:
db.messages.find({ message_type: "library_request", status: "Rejected" }).sort({ updatedAt: -1 });

-- Messages for a specific student:
db.messages.find({ recipient_sapid: "23-ARID-001" });

-- Unread notifications for a student:
db.messages.find({ recipient_sapid: "23-ARID-001", is_read: false });

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Use MongoDB Compass to view and manage collections
-- 2. The backend uses Mongoose models to interact with MongoDB
-- 3. Library clearance requests are stored in the messages collection
-- 4. Use message_type field to differentiate library requests from other messages
-- 5. Status field tracks the clearance status (Pending/Approved/Rejected)

