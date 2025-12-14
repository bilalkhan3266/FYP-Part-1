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

// Import Models
const User = require("./models/User");
const ClearanceRequest = require("./models/ClearanceRequest");
const DepartmentClearance = require("./models/DepartmentClearance");
const Message = require("./models/Message");

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

    console.log('📝 Signup Request:', {
      full_name,
      email,
      role,
      has_sap: !!sap,
      has_department: !!department
    });

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

    console.log('✅ User created successfully:', newUser._id);

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
    console.error('❌ Signup Error:', err.message);
    console.error('Error Details:', {
      name: err.name,
      code: err.code,
      message: err.message
    });
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed: ' + err.message 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login Request:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Login successful for user:', email);

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
    console.error('❌ Login Error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed: ' + err.message 
    });
  }
});

// Update User Profile
app.put('/api/update-profile', verifyToken, async (req, res) => {
  try {
    const { id } = req.user;
    const { full_name, email, password } = req.body;

    console.log('📝 Update Profile Request for user:', id);
    console.log('   Full Name:', full_name);
    console.log('   Email:', email);
    console.log('   Password Changed:', !!password);

    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    const updateData = {
      full_name: full_name.trim(),
      email: email.trim()
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
      id,
      updateData,
      { new: true }
    ).select('-password');

    console.log('✅ Profile updated successfully for:', email);

    const userResponse = {
      id: updatedUser._id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role.toLowerCase(),
      sap: updatedUser.sap,
      department: updatedUser.department
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (err) {
    console.error('❌ Update Profile Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile: ' + err.message
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
      // Don't reveal if email exists (security best practice)
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

    console.log(`📧 Reset code for ${email}: ${resetCode}`);
    console.log(`⏱️ Code expires in 15 minutes`);

    // TODO: In production, send this code via email using nodemailer or similar
    // For now, log it for testing
    // Example implementation:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   to: email,
    //   subject: 'Password Reset Code',
    //   html: `Your password reset code is: ${resetCode}. It expires in 15 minutes.`
    // });

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      // Remove this in production - only for development/testing:
      _testCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
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

    console.log('📝 Clearance Request Received:');
    console.log('  - Student Name:', student_name);
    console.log('  - SAP ID:', sapid);
    console.log('  - Registration No:', registration_no);
    console.log('  - Father Name:', father_name);
    console.log('  - Program:', program);
    console.log('  - Semester:', semester);
    console.log('  - Degree Status:', degree_status);
    console.log('  - User ID:', req.user.id);

    // Validation with specific error messages
    if (!student_name || student_name.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Student name is required' 
      });
    }

    if (!sapid || sapid.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'SAP ID is required' 
      });
    }

    if (!registration_no || registration_no.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration number is required' 
      });
    }

    if (!father_name || father_name.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Father name is required' 
      });
    }

    if (!program || program.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Program is required' 
      });
    }

    if (!semester || semester.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Semester is required' 
      });
    }

    if (!degree_status || degree_status.toString().trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Degree status is required' 
      });
    }

    // Create main clearance request
    const clearanceRequest = new ClearanceRequest({
      student_id: req.user.id,
      student_name: student_name.toString().trim(),
      sapid: sapid.toString().trim(),
      registration_no: registration_no.toString().trim(),
      father_name: father_name.toString().trim(),
      program: program.toString().trim(),
      semester: semester.toString().trim(),
      degree_status: degree_status.toString().trim(),
      department: department || '',
      status: 'Pending'
    });

    console.log('💾 Saving main clearance request...');
    const mainRequest = await clearanceRequest.save();
    console.log('✅ Main request saved:', mainRequest._id);

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
      sapid: sapid.toString().trim(),
      student_name: student_name.toString().trim(),
      registration_no: registration_no.toString().trim(),
      father_name: father_name.toString().trim(),
      program: program.toString().trim(),
      semester: semester.toString().trim(),
      degree_status: degree_status.toString().trim(),
      department_name: dept,
      status: 'Pending',
      createdAt: new Date()
    }));

    console.log('💾 Saving department clearance records...');
    await DepartmentClearance.insertMany(departmentRecords);
    console.log(`✅ Saved ${departmentRecords.length} department records`);

    res.status(201).json({
      success: true,
      message: 'Clearance request submitted successfully to all departments',
      requestId: mainRequest._id,
      details: {
        student: sapid,
        departments: departments.length,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('❌ Clearance Request Error:', err);
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit clearance request: ' + err.message
    });
  }
});

// --------------------
// View Clearance Status (Student)
// --------------------
app.get('/api/clearance-status', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('🔍 Fetching clearance status for student:', studentId);

    // Get all department statuses for this student
    const statuses = await DepartmentClearance.find({ student_id: studentId })
      .sort({ department_name: 1 });

    console.log(`✅ Found ${statuses.length} department clearance records`);
    console.log('📋 Statuses:', statuses.map(s => `${s.department_name}: ${s.status}`).join(', '));

    // Calculate progress
    const clearedCount = statuses.filter(s => s.status === 'Approved' || s.status === 'Cleared').length;
    const rejectedCount = statuses.filter(s => s.status === 'Rejected').length;
    const pendingCount = statuses.filter(s => s.status === 'Pending').length;
    const totalCount = statuses.length;
    const progressPercentage = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

    res.json({
      success: true,
      data: statuses,
      summary: {
        total: totalCount,
        cleared: clearedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        progressPercentage: progressPercentage
      }
    });
  } catch (err) {
    console.error('❌ Clearance Status Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch clearance status: ' + err.message
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
// ========== SEND MESSAGE (POST /api/send) ==========
// Alias for /api/send-message - students send to departments
app.post('/api/send', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderName = req.user.full_name;
    const senderRole = req.user.role;
    const senderSapid = req.user.sap;
    const { recipientDepartment, subject, message } = req.body;

    console.log('📨 Send Message via /api/send:');
    console.log('  - Sender:', senderName, '(' + senderSapid + ')');
    console.log('  - Department:', recipientDepartment);
    console.log('  - Subject:', subject);
    console.log('  - Full body:', JSON.stringify(req.body));

    // Validation
    if (!recipientDepartment || !subject || !message) {
      console.log('❌ Validation failed');
      console.log('  - recipientDepartment:', recipientDepartment);
      console.log('  - subject:', subject);
      console.log('  - message:', message);
      return res.status(400).json({
        success: false,
        message: '❌ Department, subject, and message are required'
      });
    }

    // Create unique conversation ID
    const conversation_id = `${senderSapid}-${recipientDepartment}-${Date.now()}`;

    // Create new message object with all required fields
    const messageObj = {
      conversation_id: conversation_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_sapid: senderSapid,
      recipient_sapid: senderSapid,
      recipient_id: senderId,
      recipient_department: recipientDepartment,
      subject: subject.trim(),
      message: message.trim(),
      message_type: 'question',
      is_read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Creating message object:', messageObj);

    const newMessage = new Message(messageObj);

    console.log('💾 Saving message to database...');
    const savedMessage = await newMessage.save();

    console.log(`✅ Message saved successfully - ID: ${savedMessage._id}`);

    res.status(201).json({
      success: true,
      message: `✅ Message sent to ${recipientDepartment}`,
      messageId: savedMessage._id,
      conversation_id: savedMessage.conversation_id
    });
  } catch (err) {
    console.error('❌ Send Message Error (/api/send):', err);
    console.error('❌ Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({
      success: false,
      message: '❌ Failed to send message: ' + err.message
    });
  }
});

// Send initial message to department OR library to student
app.post('/api/send-message', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderName = req.user.full_name;
    const senderRole = req.user.role;
    const senderSapid = req.user.sap;
    const { recipient_department, recipient_sapid, subject, message, message_type } = req.body;

    console.log('📨 Message Received:');
    console.log('  - Full Body:', JSON.stringify(req.body));
    console.log('  - Recipient Department:', recipient_department);
    console.log('  - Recipient SAP ID:', recipient_sapid);
    console.log('  - Subject:', subject);
    console.log('  - Message:', message);
    console.log('  - Sender:', senderName, '(' + senderSapid + ')');

    // Validation
    if (!subject || !message) {
      console.log('❌ Validation Failed - Missing fields');
      return res.status(400).json({
        success: false,
        message: '❌ Subject and message are required'
      });
    }

    // CASE 1: Library staff sending to student (using recipient_sapid)
    if (recipient_sapid) {
      const messageHelper = require('./utils/messageHelper');
      
      // Find student by SAP ID
      const student = await messageHelper.findStudentBySapId(recipient_sapid);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `❌ Student with SAP ID ${recipient_sapid} not found`
        });
      }

      const newMessage = new Message({
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        sender_sapid: senderSapid,
        recipient_id: student._id,
        recipient_sapid: recipient_sapid.trim(),
        recipient_department: 'Library',
        subject: subject.trim(),
        message: message.trim(),
        message_type: message_type || 'info',
        is_read: false,
        createdAt: new Date()
      });

      await newMessage.save();

      console.log(`✅ Message sent successfully to ${student.full_name}`);
      
      return res.status(201).json({
        success: true,
        message: '✅ Message sent successfully!',
        data: { 
          id: newMessage._id,
          recipient: student.full_name
        }
      });
    }

    // CASE 2: Student sending to department (using recipient_department)
    if (!recipient_department) {
      return res.status(400).json({
        success: false,
        message: '❌ Department and message are required'
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

// --------------------
// DEPARTMENT STAFF - SEND MESSAGE TO STUDENT
// --------------------
// This endpoint allows department staff (library, etc.) to send messages to students
app.post('/api/department/send-message', verifyToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderName = req.user.full_name;
    const senderRole = req.user.role;
    const senderDept = req.user.department; // Department name (e.g., "Library")
    const { student_sapid, subject, message } = req.body;

    // Validation
    if (!student_sapid || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: '❌ Student SAP ID, subject, and message are required'
      });
    }

    // Find the student
    const student = await User.findOne({ sap: student_sapid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '❌ Student not found'
      });
    }

    // Create unique conversation ID
    const conversation_id = `${student_sapid}-${senderDept}-${Date.now()}`;

    // Create message
    const newMessage = new Message({
      conversation_id,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      sender_sapid: senderRole === 'student' ? req.user.sap : null,
      recipient_sapid: student_sapid,
      recipient_id: student._id,
      recipient_department: senderDept,
      subject,
      message,
      message_type: 'department_notification'
    });

    await newMessage.save();

    console.log(`📬 Department message sent from ${senderName} (${senderDept}) to student ${student_sapid}`);

    res.status(201).json({
      success: true,
      message: `✅ Message sent to student`,
      messageId: newMessage._id,
      conversation_id
    });
  } catch (err) {
    console.error('Department Message Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to send message'
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
        uniqueConversations[msg.conversation_id] = {
          conversation_id: msg.conversation_id,
          subject: msg.subject,
          sender_name: msg.sender_name,
          sender_sapid: msg.sender_sapid,
          recipient_department: msg.recipient_department,
          createdAt: msg.createdAt || new Date()
        };
      }
    });

    const conversationsList = Object.values(uniqueConversations);

    res.status(200).json({
      success: true,
      data: conversationsList
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
// ========== GET ALL MESSAGES FOR STUDENT ==========
app.get('/api/my-messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    let query = {};
    
    if (userRole === 'student') {
      // Students see both messages they sent AND received
      query = {
        $or: [
          { sender_id: userId },        // Messages they sent
          { recipient_id: userId }       // Messages they received
        ]
      };
    } else if (userRole === 'library') {
      // Library staff see messages for Library department
      query = { recipient_department: 'Library' };
    } else {
      // Other staff see messages for their department
      query = { recipient_department: userDept };
    }

    console.log('📨 Fetching messages for:', userRole, '- User ID:', userId);
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100);
    console.log(`✅ Found ${messages.length} messages`);

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('My Messages Error:', err);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch messages'
    });
  }
});

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
    if ((user.role || '').toLowerCase() !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    // Fetch pending requests from DepartmentClearance for Library department
    const pendingRequests = await DepartmentClearance.find({
      department_name: 'Library',
      status: 'Pending'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ createdAt: -1 });

    console.log(`📚 Library - Fetching pending requests: Found ${pendingRequests.length} records`);

    res.status(200).json({
      success: true,
      data: pendingRequests || []
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
    if ((user.role || '').toLowerCase() !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    // Fetch approved requests from DepartmentClearance for Library department
    const approvedRequests = await DepartmentClearance.find({
      department_name: 'Library',
      status: 'Approved'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    console.log(`📚 Library - Fetching approved requests: Found ${approvedRequests.length} records`);

    res.status(200).json({
      success: true,
      data: approvedRequests || []
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
    if ((user.role || '').toLowerCase() !== 'library') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    // Fetch rejected requests from DepartmentClearance for Library department
    const rejectedRequests = await DepartmentClearance.find({
      department_name: 'Library',
      status: 'Rejected'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    console.log(`📚 Library - Fetching rejected requests: Found ${rejectedRequests.length} records`);

    res.status(200).json({
      success: true,
      data: rejectedRequests || []
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
// DEPARTMENT - SEARCH STUDENT BY SAP ID
// ============================================
app.get('/api/department/search-student/:sapid', verifyToken, async (req, res) => {
  try {
    const { sapid } = req.params;
    const departmentName = req.user.department;

    if (!departmentName) {
      return res.status(403).json({
        success: false,
        message: '❌ User is not assigned to a department'
      });
    }

    console.log(`🔍 Searching for student SAP ID: ${sapid} in ${departmentName}`);

    // Find all clearance records for this student in this department
    const studentRequests = await DepartmentClearance.find({
      sapid: sapid.trim().toUpperCase(),
      department_name: departmentName
    })
      .populate('student_id', 'full_name email sap')
      .populate('clearance_request_id')
      .sort({ createdAt: -1 });

    if (studentRequests.length === 0) {
      return res.status(404).json({
        success: true,
        data: [],
        message: `No requests found for student SAP ID: ${sapid}`
      });
    }

    console.log(`✅ Found ${studentRequests.length} record(s) for student ${sapid}`);

    res.status(200).json({
      success: true,
      data: studentRequests,
      message: `Found ${studentRequests.length} request(s) for student ${sapid}`
    });
  } catch (error) {
    console.error('Search Student Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to search for student'
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
    const librarianName = req.user.full_name;

    // Update DepartmentClearance record
    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        approved_by: librarianName,
        approved_at: new Date(),
        remarks: remarks || ''
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    if (!departmentClearance) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    console.log(`✅ Library approved clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Approved by: ${librarianName}`);
    console.log(`   Remarks: ${remarks || 'None'}`);


    // Create approval message in conversation
    const conversationId = `${departmentClearance.sapid}-Library-approval-${Date.now()}`;
    const approvalMessage = new Message({
      conversation_id: conversationId,
      sender_id: librarianId,
      sender_name: librarianName,
      sender_role: 'library',
      sender_sapid: req.user.sap,
      recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id,
      recipient_department: 'Library',
      subject: '✅ Library Clearance Approved',
      message: `Your library clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`,
      message_type: 'notification'
    });

    await approvalMessage.save();

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
    const librarianName = req.user.full_name;

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Rejection remarks are required'
      });
    }

    // Update DepartmentClearance record
    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        approved_by: librarianName,
        approved_at: new Date(),
        remarks: remarks.trim()
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    if (!departmentClearance) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    console.log(`❌ Library rejected clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Rejected by: ${librarianName}`);
    console.log(`   Reason: ${remarks}`);

    // Create rejection message in conversation
    const conversationId = `${departmentClearance.sapid}-Library-rejection-${Date.now()}`;
    const rejectionMessage = new Message({
      conversation_id: conversationId,
      sender_id: librarianId,
      sender_name: librarianName,
      sender_role: 'library',
      sender_sapid: req.user.sap,
      recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id,
      recipient_department: 'Library',
      subject: '❌ Library Clearance Rejected',
      message: `Your library clearance has been rejected. Reason: ${remarks}`,
      message_type: 'notification'
    });

    await rejectionMessage.save();

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

// ============================================
// FEE DEPARTMENT ENDPOINTS
// ============================================
// GET PENDING REQUESTS
app.get('/api/fee/pending-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'feedepartment') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const pendingRequests = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Pending'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ createdAt: -1 });

    console.log(`💰 Fee Department - Fetching pending requests: Found ${pendingRequests.length} records`);

    res.status(200).json({
      success: true,
      data: pendingRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch pending requests'
    });
  }
});

// GET APPROVED REQUESTS
app.get('/api/fee/approved-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'feedepartment') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const approvedRequests = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Approved'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    console.log(`💰 Fee Department - Fetching approved requests: Found ${approvedRequests.length} records`);

    res.status(200).json({
      success: true,
      data: approvedRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch approved requests'
    });
  }
});

// GET REJECTED REQUESTS
app.get('/api/fee/rejected-requests', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'feedepartment') {
      return res.status(403).json({
        success: false,
        message: '❌ Access denied'
      });
    }

    const rejectedRequests = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Rejected'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    console.log(`💰 Fee Department - Fetching rejected requests: Found ${rejectedRequests.length} records`);

    res.status(200).json({
      success: true,
      data: rejectedRequests || []
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch rejected requests'
    });
  }
});

// APPROVE REQUEST
app.put('/api/fee/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;

    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        approved_by: staffName,
        approved_at: new Date(),
        remarks: remarks || ''
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    if (!departmentClearance) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    console.log(`✅ Fee Department approved clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Approved by: ${staffName}`);
    console.log(`   Remarks: ${remarks || 'None'}`);

    const conversationId = `${departmentClearance.sapid}-FeeApproval-${Date.now()}`;
    const approvalMessage = new Message({
      conversation_id: conversationId,
      sender_id: staffId,
      sender_name: staffName,
      sender_role: 'feedepartment',
      sender_sapid: req.user.sap,
      recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id,
      recipient_department: 'Fee Department',
      subject: '✅ Fee Clearance Approved',
      message: `Your fee clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`,
      message_type: 'notification'
    });

    await approvalMessage.save();

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

// REJECT REQUEST
app.put('/api/fee/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Rejection remarks are required'
      });
    }

    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        approved_by: staffName,
        approved_at: new Date(),
        remarks: remarks.trim()
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    if (!departmentClearance) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    console.log(`❌ Fee Department rejected clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Rejected by: ${staffName}`);
    console.log(`   Reason: ${remarks}`);

    const conversationId = `${departmentClearance.sapid}-FeeRejection-${Date.now()}`;
    const rejectionMessage = new Message({
      conversation_id: conversationId,
      sender_id: staffId,
      sender_name: staffName,
      sender_role: 'feedepartment',
      sender_sapid: req.user.sap,
      recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id,
      recipient_department: 'Fee Department',
      subject: '❌ Fee Clearance Rejected',
      message: `Your fee clearance has been rejected. Reason: ${remarks}`,
      message_type: 'notification'
    });

    await rejectionMessage.save();

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
// ============================================
// TRANSPORT DEPARTMENT ENDPOINTS
// ============================================
app.get('/api/transport/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'transport') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Transport', status: 'Pending' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`🚌 Transport - Found ${requests.length} pending requests`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Transport Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/transport/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'transport') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Transport', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/transport/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'transport') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Transport', status: 'Rejected' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/transport/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Transport-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'transport', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Transport', subject: '✅ Transport Clearance Approved', message: `Your transport clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('Transport Approve Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/transport/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    if (!remarks || remarks.trim().length === 0) return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Transport-rejection-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'transport', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Transport', subject: '❌ Transport Clearance Rejected', message: `Your transport clearance has been rejected. Reason: ${remarks}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('Transport Reject Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

// ============================================
// LABORATORY DEPARTMENT ENDPOINTS
// ============================================
app.get('/api/laboratory/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'laboratory') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Laboratory', status: 'Pending' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`🧪 Laboratory - Found ${requests.length} pending requests`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Laboratory Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/laboratory/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'laboratory') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Laboratory', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/laboratory/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'laboratory') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Laboratory', status: 'Rejected' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/laboratory/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Laboratory-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'laboratory', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Laboratory', subject: '✅ Laboratory Clearance Approved', message: `Your laboratory clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('Laboratory Approve Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/laboratory/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    if (!remarks || remarks.trim().length === 0) return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Laboratory-rejection-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'laboratory', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Laboratory', subject: '❌ Laboratory Clearance Rejected', message: `Your laboratory clearance has been rejected. Reason: ${remarks}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('Laboratory Reject Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

// ============================================
// STUDENT SERVICE DEPARTMENT ENDPOINTS
// ============================================
app.get('/api/studentservice/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'studentservice') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Student Service', status: 'Pending' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`👥 Student Service - Found ${requests.length} pending requests`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Student Service Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/studentservice/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'studentservice') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Student Service', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/studentservice/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'studentservice') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Student Service', status: 'Rejected' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/studentservice/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-StudentService-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'studentservice', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Student Service', subject: '✅ Student Service Clearance Approved', message: `Your student service clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('Student Service Approve Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/studentservice/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    if (!remarks || remarks.trim().length === 0) return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-StudentService-rejection-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'studentservice', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Student Service', subject: '❌ Student Service Clearance Rejected', message: `Your student service clearance has been rejected. Reason: ${remarks}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('Student Service Reject Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

// ============================================
// COORDINATION OFFICE ENDPOINTS
// ============================================
app.get('/api/coordination/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'coordination') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Coordination', status: 'Pending' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`📋 Coordination - Found ${requests.length} pending requests`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Coordination Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/coordination/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'coordination') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Coordination', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/coordination/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'coordination') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'Coordination', status: 'Rejected' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/coordination/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Coordination-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'coordination', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Coordination', subject: '✅ Coordination Clearance Approved', message: `Your coordination clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('Coordination Approve Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/coordination/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    if (!remarks || remarks.trim().length === 0) return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-Coordination-rejection-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'coordination', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Coordination', subject: '❌ Coordination Clearance Rejected', message: `Your coordination clearance has been rejected. Reason: ${remarks}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('Coordination Reject Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

// ============================================
// HOD DEPARTMENT ENDPOINTS
// ============================================
app.get('/api/hod/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hod') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'HOD', status: 'Pending' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`👨‍🎓 HOD - Found ${requests.length} pending requests`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('HOD Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/hod/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hod') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'HOD', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/hod/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hod') return res.status(403).json({ success: false, message: '❌ Access denied' });
    const requests = await DepartmentClearance.find({ department_name: 'HOD', status: 'Rejected' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/hod/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-HOD-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'hod', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'HOD', subject: '✅ HOD Clearance Approved', message: `Your HOD clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('HOD Approve Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/hod/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;
    if (!remarks || remarks.trim().length === 0) return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    if (!record) return res.status(404).json({ success: false, message: '❌ Request not found' });
    const message = new Message({ conversation_id: `${record.sapid}-HOD-rejection-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'hod', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'HOD', subject: '❌ HOD Clearance Rejected', message: `Your HOD clearance has been rejected. Reason: ${remarks}`, message_type: 'notification' });
    await message.save();
    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('HOD Reject Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

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
