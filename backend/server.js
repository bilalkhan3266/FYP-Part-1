// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Import Routes
const libraryRoutes = require("./routes/libraryRoutes");

// --------------------
// Express app
// --------------------
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// MongoDB Connection
// --------------------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

console.log('🔄 Attempting to connect to MongoDB...');
console.log(`📍 Connection String: ${MONGO_URI}`);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('\n✅ MongoDB connected successfully!');
    console.log(`📊 Database: role_based_system`);
    console.log(`🚀 Server ready to accept requests\n`);
  })
  .catch(err => {
    console.error('\n❌ MongoDB connection error:');
    console.error('Error Message:', err.message);
    console.error('Connection String:', MONGO_URI);
    console.error('\n💡 Possible Solutions:');
    console.error('1. Make sure MongoDB is running (mongod)');
    console.error('2. Check your MONGO_URI in .env file');
    console.error('3. If using MongoDB Atlas, ensure IP whitelist includes your IP');
    console.error('4. Check network connectivity\n');
    // Continue running to allow server startup
    console.log('⚠️  Server starting without database connection...\n');
  });

// --------------------
// Schemas & Models
// --------------------
// User Schema
const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  sap: String,
  department: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Clearance Request Schema
const clearanceRequestSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student_name: String,
  sapid: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ClearanceRequest = mongoose.model('ClearanceRequest', clearanceRequestSchema);

// Department Clearance Schema
const departmentClearanceSchema = new mongoose.Schema({
  clearance_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClearanceRequest' },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sapid: String,
  student_name: String,
  registration_no: String,
  father_name: String,
  program: String,
  semester: String,
  degree_status: String,
  department_name: String,
  status: { type: String, default: 'Pending' },
  remarks: String,
  approved_by: String,
  approved_at: Date,
  createdAt: { type: Date, default: Date.now }
});

const DepartmentClearance = mongoose.model('DepartmentClearance', departmentClearanceSchema);

// Message Schema (Two-way conversation between students and departments)
const messageSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true, index: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: String,
  sender_role: String,
  sender_sapid: String,
  recipient_sapid: { type: String, required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient_department: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  message_type: { type: String, enum: ['info', 'warning', 'error', 'success', 'question', 'reply'], default: 'reply' },
  is_read: { type: Boolean, default: false },
  read_at: Date,
  parent_message_id: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// --------------------
// JWT Configuration
// --------------------
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2h';

// --------------------
// Middleware: Verify JWT Token
// --------------------
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// --------------------
// AUTHENTICATION ROUTES
// --------------------
// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { full_name, email, password, role, sap, department } = req.body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full name, email, password, and role are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - normalize role to lowercase
    const newUser = new User({
      full_name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      sap: sap || null,
      department: department || null
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, full_name: newUser.full_name, role: newUser.role, sap: newUser.sap, department: newUser.department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Return user without password
    const userResponse = {
      id: newUser._id,
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role.toLowerCase(),
      sap: newUser.sap,
      department: newUser.department
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, full_name: user.full_name, role: user.role, sap: user.sap, department: user.department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const userResponse = {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role.toLowerCase(),
      sap: user.sap,
      department: user.department
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
      error: null
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// --------------------
// PASSWORD RESET ROUTES
// --------------------
// Store temporary reset codes
const resetCodes = new Map();

// Request Password Reset
app.post('/api/forgot-password-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: 'If email exists, reset code has been sent'
      });
    }

    // Generate reset code
    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes.set(email, {
      code: resetCode,
      expiresAt,
      userId: user._id
    });

    console.log(`Reset code for ${email}: ${resetCode}`);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// Verify Reset Code
app.post('/api/verify-reset-code', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({
        success: false,
        message: 'No reset request found'
      });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Reset code expired'
      });
    }

    if (resetData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    res.json({
      success: true,
      message: 'Code verified successfully'
    });
  } catch (err) {
    console.error('Verify Code Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset request'
      });
    }

    if (resetData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Reset code expired'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(resetData.userId, {
      password: hashedPassword
    });

    // Clean up
    resetCodes.delete(email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// --------------------
// Clearance Request (Student) - Submits to all departments
// --------------------
app.post('/api/clearance-requests', verifyToken, async (req, res) => {
  try {
    const { student_name, sapid, registration_no, father_name, program, semester, degree_status, department } = req.body;

    // Validation
    if (!student_name || !sapid || !registration_no || !father_name || !program || !semester || !degree_status) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Create main clearance request
    const clearanceRequest = new ClearanceRequest({
      student_id: req.user.id,
      student_name,
      sapid,
      registration_no,
      father_name,
      program,
      semester,
      degree_status,
      department,
      status: 'Pending'
    });

    const mainRequest = await clearanceRequest.save();

    const departments = [
      'Library',
      'Transport',
      'Laboratory',
      'Student Service',
      'Fee Department',
      'Coordination',
      'HOD'
    ];

    // Create clearance record for each department
    const departmentRecords = departments.map(dept => ({
      clearance_request_id: mainRequest._id,
      student_id: req.user.id,
      sapid,
      student_name,
      registration_no,
      father_name,
      program,
      semester,
      degree_status,
      department_name: dept,
      status: 'Pending',
      createdAt: new Date()
    }));

    await DepartmentClearance.insertMany(departmentRecords);

    res.status(201).json({
      success: true,
      message: 'Clearance request submitted successfully to all departments',
      requestId: mainRequest._id
    });
  } catch (err) {
    console.error('Clearance Request Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit clearance request' 
    });
  }
});

// --------------------
// View Clearance Status (Student)
// --------------------
app.get('/api/clearance-status', verifyToken, async (req, res) => {
  try {
    // Get all department statuses for this student
    const statuses = await DepartmentClearance.find({ student_id: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: statuses
    });
  } catch (err) {
    console.error('Clearance Status Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch clearance status' 
    });
  }
});

// --------------------
// Get All Clearance Requests (for specific department)
// --------------------
app.get('/api/clearance-requests/department/:deptName', verifyToken, async (req, res) => {
  try {
    const { deptName } = req.params;

    // Verify user is from the requested department
    if (req.user.department !== deptName) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Get all pending requests for this department
    const requests = await DepartmentClearance.find({ 
      department_name: deptName,
      status: 'Pending'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('Clearance Requests Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch requests' 
    });
  }
});

// --------------------
// Approve/Reject Clearance Request (Department Staff)
// --------------------
app.put('/api/clearance-requests/:requestId/approve', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update the request
    const updated = await DepartmentClearance.findByIdAndUpdate(
      requestId,
      {
        status,
        remarks,
        approved_by: req.user.email,
        approved_at: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`
    });
  } catch (err) {
    console.error('Approve Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve request' 
    });
  }
});

// Update Clearance Status
app.put('/api/clearance-requests/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    await ClearanceRequest.findByIdAndUpdate(id, { status, updatedAt: Date.now() });

    res.json({
      success: true,
      message: 'Clearance status updated'
    });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
});

// --------------------
// PROFILE ROUTES
// --------------------
// Get Profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Update Profile
app.put('/api/update-profile', verifyToken, async (req, res) => {
  try {
    const { full_name, email, sap, department, password } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full name and email are required' 
      });
    }

    // Check if email exists for another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Update user
    const updateData = {
      full_name,
      email,
      sap,
      department,
      updatedAt: Date.now()
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters' 
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// --------------------
// MESSAGE ROUTES (Two-way conversation)
// --------------------
// Send initial message to department
app.post('/api/send-message', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderName = req.user.full_name;
    const senderRole = req.user.role;
    const senderSapid = req.user.sap;
    const { recipient_department, subject, message, message_type } = req.body;

    // Validation
    if (!recipient_department || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: '❌ Department, subject, and message are required'
      });
    }

    // Create unique conversation ID
    const conversation_id = `${senderSapid}-${recipient_department}-${Date.now()}`;

    // Create new message
    const newMessage = new Message({
      conversation_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_sapid: senderSapid,
      recipient_sapid: senderSapid,
      recipient_id: senderId,
      recipient_department,
      subject,
      message,
      message_type: message_type || 'question'
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: `✅ Message sent to ${recipient_department}`,
      messageId: newMessage._id,
      conversation_id
    });
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to send message'
    });
  }
});

// Reply to a message in conversation
app.post('/api/messages/:conversation_id/reply', verifyToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const senderId = req.user.id;
    const senderName = req.user.full_name;
    const senderRole = req.user.role;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '❌ Message is required'
      });
    }

    // Find the original message to get details
    const originalMessage = await Message.findOne({ conversation_id }).sort({ createdAt: -1 });
    
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: '❌ Conversation not found'
      });
    }

    // Create reply message
    const replyMessage = new Message({
      conversation_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_sapid: senderRole === 'student' ? req.user.sap : originalMessage.sender_sapid,
      recipient_sapid: senderRole === 'student' ? req.user.sap : originalMessage.sender_sapid,
      recipient_id: senderRole === 'student' ? senderId : originalMessage.sender_id,
      recipient_department: originalMessage.recipient_department,
      subject: `Re: ${originalMessage.subject}`,
      message,
      message_type: 'reply',
      parent_message_id: originalMessage._id
    });

    await replyMessage.save();

    res.status(201).json({
      success: true,
      message: `✅ Reply sent`,
      messageId: replyMessage._id
    });
  } catch (err) {
    console.error('Reply Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to send reply'
    });
  }
});

// Get all conversations for a student (by SAPID)
app.get('/api/conversations', verifyToken, async (req, res) => {
  try {
    const userSapid = req.user.sap;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'student') {
      query = { sender_sapid: userSapid };
    } else {
      // Department staff can see conversations for their department
      query = { recipient_department: req.user.department };
    }

    const conversations = await Message.find(query)
      .sort({ createdAt: -1 })
      .select('conversation_id subject sender_name sender_sapid recipient_department createdAt');

    // Group by conversation_id to get unique conversations
    const uniqueConversations = {};
    conversations.forEach(msg => {
      if (!uniqueConversations[msg.conversation_id]) {
        uniqueConversations[msg.conversation_id] = msg;
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(uniqueConversations)
    });
  } catch (err) {
    console.error('Get Conversations Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch conversations'
    });
  }
});

// Get conversation thread by conversation_id
app.get('/api/conversations/:conversation_id', verifyToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const messages = await Message.find({ conversation_id })
      .sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ Conversation not found'
      });
    }

    // Mark all messages as read for current user
    const userId = req.user.id;
    await Message.updateMany(
      { 
        conversation_id,
        recipient_id: userId,
        is_read: false
      },
      { 
        is_read: true,
        read_at: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Get Thread Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch conversation thread'
    });
  }
});

// Get unread message count
app.get('/api/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'student') {
      query = { recipient_id: userId, is_read: false };
    } else {
      query = { recipient_department: req.user.department, is_read: false };
    }

    const count = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (err) {
    console.error('Unread Count Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch unread count'
    });
  }
});

// Delete message (soft delete by marking read status)
app.delete('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Message.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '❌ Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Message deleted'
    });
  } catch (err) {
    console.error('Delete Message Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to delete message'
    });
  }
});

// ============================================
// LIBRARY DEPARTMENT - GET PENDING REQUESTS
// ============================================
app.get('/api/library/pending-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const clearanceRequests = await ClearanceRequest.find({
      department: 'Library',
      status: 'Pending'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: clearanceRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch pending requests'
    });
  }
});

// ============================================
// LIBRARY DEPARTMENT - GET APPROVED REQUESTS
// ============================================
app.get('/api/library/approved-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const clearanceRequests = await ClearanceRequest.find({
      department: 'Library',
      status: 'Approved'
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: clearanceRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch approved requests'
    });
  }
});

// ============================================
// LIBRARY DEPARTMENT - GET REJECTED REQUESTS
// ============================================
app.get('/api/library/rejected-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const clearanceRequests = await ClearanceRequest.find({
      department: 'Library',
      rejectionStatus: 'Rejected'
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: clearanceRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch rejected requests'
    });
  }
});

// ============================================
// LIBRARY DEPARTMENT - APPROVE REQUEST WITH COMMENT
// ============================================
app.put('/api/library/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const librarianId = req.user.id;

    const clearanceRequest = await ClearanceRequest.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        libraryApprovedBy: librarianId,
        libraryRemarks: remarks || '',
        libraryApprovedAt: new Date()
      },
      { new: true }
    );

    if (!clearanceRequest) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Send message to student
    const message = new Message({
      senderId: librarianId,
      senderRole: 'library',
      recipientSapid: clearanceRequest.sapid,
      subject: 'Library Clearance Approved',
      message: `Your library clearance has been approved. ${remarks ? `Comment: ${remarks}` : ''}`,
      messageType: 'success',
      isRead: false
    });

    await message.save();

    res.status(200).json({
      success: true,
      message: '✅ Request approved and student notified'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to approve request'
    });
  }
});

// ============================================
// LIBRARY DEPARTMENT - REJECT REQUEST WITH COMMENT
// ============================================
app.put('/api/library/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const librarianId = req.user.id;

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Rejection remarks are required'
      });
    }

    const clearanceRequest = await ClearanceRequest.findByIdAndUpdate(
      id,
      {
        rejectionStatus: 'Rejected',
        status: 'Rejected',
        libraryApprovedBy: librarianId,
        libraryRemarks: remarks.trim(),
        libraryApprovedAt: new Date()
      },
      { new: true }
    );

    if (!clearanceRequest) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Send rejection message to student
    const message = new Message({
      senderId: librarianId,
      senderRole: 'library',
      recipientSapid: clearanceRequest.sapid,
      subject: 'Library Clearance Rejected',
      message: `Your library clearance has been rejected. Reason: ${remarks.trim()}`,
      messageType: 'error',
      isRead: false
    });

    await message.save();

    res.status(200).json({
      success: true,
      message: '✅ Request rejected and student notified'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to reject request'
    });
  }
});

// --------------------
// Mount Library Routes
// --------------------
app.use('/api', libraryRoutes);

// --------------------
// Health Check
// --------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// --------------------
// Error Handling
// --------------------
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database: MongoDB`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;
