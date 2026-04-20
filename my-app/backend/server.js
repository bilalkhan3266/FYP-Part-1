// backend/server.js
// Force Railway redeploy - CORS preflight fix deployment
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Import Routes
const libraryRoutes = require("./routes/libraryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const hodRoutes = require("./routes/hodRoutes");
const clearanceWorkflowRoutes = require("./routes/clearanceWorkflowRoutes");
const issueRoutes = require("./routes/issueRoutes");
const returnRoutes = require("./routes/returnRoutes");
const autoClearanceRoutes = require("./routes/autoClearanceRoutes");
const approvedClearancesAPI = require("./routes/approvedClearancesAPI");
const comprehensiveApprovalRoutes = require("./routes/comprehensiveApprovalRoutes");

// Import Models
const User = require("./models/User");
const ClearanceRequest = require("./models/ClearanceRequest");
const DepartmentClearance = require("./models/DepartmentClearance");
const DepartmentIssue = require("./models/DepartmentIssue");
const ComprehensiveClearanceValidation = require("./models/ComprehensiveClearanceValidation");
const Message = require("./models/Message");
const AdminMessage = require("./models/AdminMessage");
const DepartmentStats = require("./models/DepartmentStats");
const PendingUser = require("./models/PendingUser");
const DocumentQRCode = require("./models/DocumentQRCode");
const { sendClearanceCertificateEmail, sendPasswordResetEmail, sendOtpEmail } = require("./utils/emailService");
const { validateStudentClearanceAllDepartments, canStudentSubmitClearance } = require("./utils/clearanceValidator");
const { generateCertificatePDF } = require("./services/certificateGenerator");
const { sendCertificateEmail, sendRejectionEmail } = require("./services/emailService");

// --------------------
// Express app
// --------------------
const app = express();

// Fix #1: CORS - allow all Vercel preview/production URLs and localhost
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost/127.0.0.1 port
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    // Allow ALL Vercel preview and production URLs
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    // Allow specific production origins from env
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With']
}));

// Store cors options for reuse in OPTIONS handlers
const corsOptionsForPreflight = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'],
  credentials: false
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Global OPTIONS Handler (CORS Preflight)
// --------------------
app.options('*', cors(corsOptionsForPreflight));

// Additional explicit OPTIONS for main endpoints
app.options('/api/signup', cors(corsOptionsForPreflight));
app.options('/api/login', cors(corsOptionsForPreflight));
app.options('/api/clearance-requests', cors(corsOptionsForPreflight));
app.options('/api/clearance/department', cors(corsOptionsForPreflight));
app.options('/api/department-issues', cors(corsOptionsForPreflight));
app.options('/api/department-returns', cors(corsOptionsForPreflight));
app.options('/api/health', cors(corsOptionsForPreflight));

// --------------------
// Health Check Route (single definition)
// --------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// --------------------
// PUBLIC: Verify Certificate via QR Code (No Auth Required)
// --------------------
app.get('/api/verify-certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    console.log(`🔍 Certificate verification request for: ${certificateId}`);

    // Find the clearance request with this QR code
    const clearanceReq = await ClearanceRequest.findOne({ 
      certificate_qr_code: certificateId
    });

    if (!clearanceReq) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found or invalid',
        certificateId: certificateId
      });
    }

    // Get student info
    const student = await User.findById(clearanceReq.student_id);

    // Get all department approvals
    const statuses = await DepartmentClearance.find({
      clearance_request_id: clearanceReq._id,
      status: 'Approved'
    });

    const validDepartments = ['Coordination', 'Library', 'Transport', 'Fee Department', 'Student Service'];
    const allDepartments = await DepartmentClearance.find({
      clearance_request_id: clearanceReq._id,
      department_name: { $in: validDepartments }
    });

    const allApproved = allDepartments.length === 5 && 
                        allDepartments.every(d => d.status === 'Approved' || d.status === 'Cleared');

    console.log(`✅ Certificate verified: ${clearanceReq.student_name} (${clearanceReq.sapid})`);

    res.json({
      success: true,
      verified: true,
      certificate: {
        student_name: clearanceReq.student_name || student?.full_name,
        sapid: clearanceReq.sapid,
        program: clearanceReq.program,
        department: clearanceReq.department,
        certificate_id: certificateId,
        issue_date: clearanceReq.hod_approved_at || clearanceReq.submitted_at,
        status: allApproved ? 'Valid & Approved' : 'Pending',
        departments_approved: statuses.length,
        total_departments: allDepartments.length,
        departments: allDepartments.map(d => ({
          name: d.department_name,
          status: d.status,
          approved_by: d.approved_by,
          approved_at: d.approved_at
        }))
      }
    });
  } catch (err) {
    console.error('❌ Certificate Verification Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify certificate: ' + err.message
    });
  }
});

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
    console.log('⚠️  Server starting without database connection...\n');
  });

// --------------------
// JWT Configuration
// --------------------
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_123456';
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
// Signup (Step 1: Validate + Send OTP)
app.post('/api/signup', async (req, res) => {
  try {
    const { full_name, email, password, role, sap, department } = req.body;

    console.log('📝 Signup Request:', { full_name, email, role, has_sap: !!sap, has_department: !!department });

    // ===== VALIDATION =====

    // 1. Check all required fields
    if (!full_name || !email || !password || !sap || !department) {
      return res.status(400).json({ success: false, message: 'Full name, email, password, SAP ID, and department are required' });
    }

    // 2. Validate Full Name (at least 3 alphabetic characters, no numbers/special chars)
    if (!/^[A-Za-z ]{3,}$/.test(full_name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must be at least 3 letters and contain only alphabets' });
    }

    // 3. Validate SAP ID (numbers only)
    if (!/^[0-9]+$/.test(sap.trim())) {
      return res.status(400).json({ success: false, message: 'SAP ID must contain only numbers' });
    }

    // 4. Validate university email format
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[0-9]+@students\.riphah\.edu\.pk$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Only university email allowed (e.g. 48397@students.riphah.edu.pk)' });
    }

    // 5. SAP ID must match email prefix
    const emailPrefix = normalizedEmail.split('@')[0];
    if (emailPrefix !== sap.trim()) {
      return res.status(400).json({ success: false, message: 'SAP ID must match your university email' });
    }

    // 6. Validate Password (min 8 chars, 1 uppercase, 1 number, 1 special char)
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with uppercase, number, and special character' });
    }

    // 7. Ensure role is Student only
    if (!role || role.toLowerCase() !== 'student') {
      return res.status(400).json({ success: false, message: 'Signup is only available for students' });
    }

    // 8. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const existingSAP = await User.findOne({ sap: sap.trim() });
    if (existingSAP) {
      return res.status(400).json({ success: false, message: 'SAP ID already registered' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert into PendingUser (replace if same email already pending)
    await PendingUser.findOneAndUpdate(
      { email: normalizedEmail },
      {
        full_name: full_name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        sap: sap.trim(),
        department: department.trim(),
        otp,
        otpExpiry,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send OTP email (asynchronously to avoid blocking response)
    sendOtpEmail({
      userName: full_name.trim(),
      userEmail: normalizedEmail,
      otp,
      expiresInMinutes: 5
    }).catch(err => {
      console.warn('⚠️ OTP email could not be sent:', err.message);
    });

    console.log(`✅ OTP generated for ${normalizedEmail}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail
    });
  } catch (err) {
    console.error('❌ Signup Error:', err.message);
    res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
  }
});

// Verify OTP (Step 2: Create user account)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });

    if (!pendingUser) {
      return res.status(400).json({ success: false, message: 'No pending signup found. Please signup again.' });
    }

    // Check OTP match
    if (pendingUser.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check OTP expiry
    if (new Date() > pendingUser.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please resend.' });
    }

    // Double-check user doesn't already exist
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await PendingUser.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'Account already exists. Please login.' });
    }

    // Create actual user
    const newUser = new User({
      full_name: pendingUser.full_name,
      email: pendingUser.email,
      password: pendingUser.password, // already hashed
      role: 'student',
      sap: pendingUser.sap,
      department: pendingUser.department
    });

    await newUser.save();

    // Delete pending user
    await PendingUser.deleteOne({ email: normalizedEmail });

    console.log(`✅ User verified & created: ${normalizedEmail}`);

    res.status(201).json({
      success: true,
      message: 'Signup successful. Please login.'
    });
  } catch (err) {
    console.error('❌ OTP Verification Error:', err.message);
    res.status(500).json({ success: false, message: 'Verification failed: ' + err.message });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });

    if (!pendingUser) {
      return res.status(400).json({ success: false, message: 'No pending signup found. Please signup again.' });
    }

    // Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    pendingUser.otp = otp;
    pendingUser.otpExpiry = otpExpiry;
    await pendingUser.save();

    // Send email
    const emailResult = await sendOtpEmail({
      userName: pendingUser.full_name,
      userEmail: normalizedEmail,
      otp,
      expiresInMinutes: 5
    });

    if (!emailResult.success) {
      console.warn('⚠️ Resend OTP email could not be sent:', emailResult.reason || emailResult.error);
    }

    console.log(`✅ OTP resent for ${normalizedEmail}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email'
    });
  } catch (err) {
    console.error('❌ Resend OTP Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
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
    console.log(`📧 Forgot password request received for: ${email}`);

    if (!email) {
      console.log(`❌ No email provided`);
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔍 Searching for user with email: ${normalizedEmail}`);
    const user = await User.findOne({ email: normalizedEmail });
    console.log(`👤 User found:`, user ? `Yes (ID: ${user._id})` : 'No');

    if (!user) {
      // Don't reveal if email exists (security best practice)
      console.log(`⚠️ Email not found, returning generic success message`);
      return res.json({
        success: true,
        message: 'If email exists, reset code has been sent'
      });
    }

    // Generate reset code
    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes.set(normalizedEmail, {
      code: resetCode,
      expiresAt,
      userId: user._id
    });

    console.log(`📧 Reset code for ${email}: ${resetCode}`);
    console.log(`⏱️ Code expires in 15 minutes`);

    // ==================== SEND RESET CODE EMAIL ====================
    console.log('📧 Sending password reset email...');
    try {
      const emailResult = await sendPasswordResetEmail({
        userName: user.full_name || user.name || user.email,
        userEmail: user.email,
        resetCode: resetCode,
        expiresInMinutes: 15
      });
      
      if (emailResult.success) {
        console.log(`✅ Password reset email sent successfully to ${user.email}`);
      } else {
        console.warn(`⚠️ Password reset email failed: ${emailResult.reason || emailResult.error}`);
      }
    } catch (emailErr) {
      console.error('❌ Error sending password reset email:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Password reset code has been sent to your email'
    });
  } catch (err) {
    console.error('❌ Forgot Password Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to process request: ' + err.message
    });
  }
});

// ========== TEST EMAIL ENDPOINT (FOR DEBUGGING) ==========
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🧪 TESTING EMAIL CONFIGURATION');
    console.log('═══════════════════════════════════════════════════════');
    
    const nodemailer = require('nodemailer');
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ EMAIL CREDENTIALS NOT CONFIGURED');
      console.error('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
      console.error('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
      return res.status(400).json({
        success: false,
        error: 'Email credentials not configured in .env file'
      });
    }

    console.log('✅ Email credentials found:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    console.log('   EMAIL_PASS: (hidden) - Length:', process.env.EMAIL_PASS.length, 'chars');

    // Create transporter
    console.log('\n📨 Creating mail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log('📨 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    console.log('\n📧 Sending test email...');
    const testEmail = process.env.EMAIL_USER; // Send to self
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '✅ Email Configuration Test - Success',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;background:#f0f0f0;border-radius:8px">
          <h2 style="color:green">✅ Email Configuration Working!</h2>
          <p>Your Gmail SMTP configuration is set up correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email Account: ${testEmail}</li>
            <li>Service: Gmail</li>
            <li>Time: ${new Date().toLocaleString()}</li>
          </ul>
          <p style="color:gray;font-size:12px">Password reset emails should now work.</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('═══════════════════════════════════════════════════════\n');

    res.json({
      success: true,
      message: 'Email configuration is working correctly!',
      details: {
        emailUser: process.env.EMAIL_USER,
        testEmailSentTo: testEmail,
        messageId: info.messageId
      }
    });
  } catch (err) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ EMAIL CONFIGURATION TEST FAILED');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error Type:', err.code || err.name);
    console.error('Error Message:', err.message);
    console.error('Full Error:', err);
    console.error('═══════════════════════════════════════════════════════\n');

    res.status(500).json({
      success: false,
      error: err.message,
      errorCode: err.code,
      help: {
        'ENOTFOUND': 'Network error - Gmail SMTP server not found. Check internet connection.',
        'EAUTH': 'Gmail authentication failed - check EMAIL_PASS. Did you generate an APP PASSWORD from Google?',
        'ESOCKET': 'Connection refused - Gmail is blocking the connection. Check Gmail security settings.',
        'Invalid login': 'Gmail credentials incorrect. Regenerate app password at https://myaccount.google.com/apppasswords',
        'ERR_AUTH_FAILED': 'Gmail authentication failed. Ensure you\'re using an App Password, not your regular password.'
      }[err.code] || 'Unknown email error - see error details above'
    });
  }
});

// ========== TEST CLEARANCE CERTIFICATE EMAIL ==========
app.get('/api/test-certificate-email', verifyToken, async (req, res) => {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎓 TESTING CLEARANCE CERTIFICATE EMAIL');
    console.log('═══════════════════════════════════════════════════════');
    
    const student = await User.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    console.log('Student Found:', student.email);

    const testResult = await sendClearanceCertificateEmail({
      studentName: student.full_name || student.name || "Test Student",
      studentEmail: student.email,
      sapId: student.sap || "TEST123",
      department: student.department || "Test Department",
      program: "Test Program",
      qrCode: "TEST_CERT_" + Date.now(),
      approvedBy: "All 5 Departments",
      approvedAt: new Date(),
      departments: [
        { name: "Coordination", status: "Approved" },
        { name: "Transport", status: "Approved" },
        { name: "Library", status: "Approved" },
        { name: "Fee Department", status: "Approved" },
        { name: "Student Service", status: "Approved" }
      ]
    });

    if (testResult.success) {
      console.log('✅ Certificate email test sent successfully!');
      console.log('═══════════════════════════════════════════════════════\n');
      return res.json({
        success: true,
        message: 'Test certificate email sent successfully!',
        studentEmail: student.email,
        messageId: testResult.messageId
      });
    } else {
      console.error('❌ Certificate email test failed:', testResult.error);
      console.log('═══════════════════════════════════════════════════════\n');
      return res.status(500).json({
        success: false,
        error: testResult.error
      });
    }
  } catch (err) {
    console.error('❌ Certificate Email Test Error:', err.message);
    console.error('Stack:', err.stack);
    console.log('═══════════════════════════════════════════════════════\n');
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Fix #2: Verify Reset Code - don't delete the code, mark as verified instead
app.post('/api/verify-reset-code', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const resetData = resetCodes.get(normalizedEmail);

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

    // Mark as verified but do NOT delete — reset-password still needs it
    resetData.verified = true;

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

    const normalizedEmail = email.trim().toLowerCase();
    const resetData = resetCodes.get(normalizedEmail);

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
      resetCodes.delete(normalizedEmail);
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
    resetCodes.delete(normalizedEmail);

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
    const { student_name, sapid, father_name, program, semester, degree_status } = req.body;

    console.log('\n📝 CLEARANCE REQUEST RECEIVED');
    console.log('  Student:', student_name);
    console.log('  SAP ID:', sapid);
    console.log('  User ID:', req.user.id);

    // ==================== VALIDATION ====================
    if (!student_name || student_name.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }

    if (!sapid || sapid.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'SAP ID is required' });
    }

    // ✅ CHECK IF SAPID EXISTS IN DEPARTMENT ISSUES (NEW VALIDATION)
    const sapidStr = sapid.toString().trim();
    const issueRecord = await DepartmentIssue.findOne({ studentId: sapidStr });

    console.log(`\n🔍 SAPID VALIDATION CHECK:`);
    console.log(`   📌 SAPID from form: "${sapidStr}"`);
    console.log(`   🔎 Searching in DepartmentIssue collection...`);

    if (!issueRecord) {
      console.error(`❌ VALIDATION FAILED: SAPID "${sapidStr}" NOT FOUND in DepartmentIssue records`);
      return res.status(404).json({
        success: false,
        message: "The Record Is Not Found Against This sapid",
        errorCode: "SAPID_NOT_FOUND",
        details: {
          sapid: sapidStr,
          reason: "This SAPID is not registered in the system for clearance processing"
        }
      });
    }

    console.log(`✅ VALIDATION PASSED: SAPID "${sapidStr}" found in DepartmentIssue`);
    console.log(`   Department: ${issueRecord.departmentName}`);
    console.log(`   Status: ${issueRecord.status}\n`);

    if (!father_name || father_name.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'Father name is required' });
    }

    if (!program || program.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'Program is required' });
    }

    if (!semester || semester.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'Semester is required' });
    }

    const semesterNum = parseInt(semester.toString().trim());
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be a number between 1 and 12'
      });
    }

    if (!degree_status || degree_status.toString().trim() === '') {
      return res.status(400).json({ success: false, message: 'Degree status is required' });
    }

    // ==================== SUBMISSION CONTROL ====================
    console.log('\n🔒 CHECKING SUBMISSION CONTROL...');
    
    const submissionCheck = await canStudentSubmitClearance(sapid.toString().trim(), ComprehensiveClearanceValidation);
    
    if (!submissionCheck.canSubmit) {
      console.log(`❌ Cannot submit: ${submissionCheck.reason}`);
      return res.status(409).json({
        success: false,
        message: submissionCheck.reason,
        existingRecord: submissionCheck.existingRecord
      });
    }

    if (submissionCheck.isResubmission) {
      console.log(`🔄 RESUBMISSION ALLOWED - Previous request was rejected`);
      console.log(`   Student can fix issues and resubmit`);
    }

    // ==================== COMPREHENSIVE VALIDATION ====================
    console.log('\n🚀 STARTING COMPREHENSIVE CLEARANCE VALIDATION');
    console.log(`   Technology: Using sapId ${sapid} to check ALL departments at once`);

    const studentInfo = {
      student_name: student_name.toString().trim(),
      father_name: father_name.toString().trim(),
      program: program.toString().trim(),
      semester: semesterNum.toString(),
      degree_status: degree_status.toString().trim()
    };

    const validationResult = await validateStudentClearanceAllDepartments(
      sapid.toString().trim(),
      studentInfo
    );

    // ==================== SAVE VALIDATION RESULT ====================
    console.log('\n💾 SAVING COMPREHENSIVE VALIDATION RESULT...');
    
    const comprehensiveRecord = new ComprehensiveClearanceValidation({
      student_id: req.user.id,
      ...validationResult
    });

    const savedRecord = await comprehensiveRecord.save();
    console.log(`✅ Validation result saved: ${savedRecord._id}`);

    // ==================== CREATE DEPARTMENT CLEARANCE RECORDS ====================
    // This allows the records to appear in department dashboards' approved tabs
    console.log('\n📋 CREATING DEPARTMENT CLEARANCE RECORDS...');
    console.log(`   📊 ValidationResult keys:`, Object.keys(validationResult));
    console.log(`   📊 Department statuses count:`, validationResult.departmentStatuses ? validationResult.departmentStatuses.length : 'UNDEFINED');
    console.log(`   📊 Department statuses from validation:`, JSON.stringify(validationResult.departmentStatuses, null, 2));
    try {
      const departmentRecords = validationResult.departmentStatuses.map(dept => ({
        clearance_request_id: savedRecord._id,
        student_id: req.user.id,
        sapid: sapid.toString().trim(),
        student_name: student_name.toString().trim(),
        department_name: dept.name,
        status: dept.status === 'Approved' ? 'Approved' : 'Pending',
        remarks: `Auto-validated by comprehensive clearance system`,
        submittedAt: new Date(),
        approvedAt: dept.status === 'Approved' ? new Date() : null,
        isAutoApproved: false,
        phaseStatus: dept.status === 'Approved' ? 'Approved' : 'Pending',
        phaseRemarks: dept.status === 'Approved' ? 'Student cleared - no issues found' : 'Pending validation'
      }));

      console.log(`   🔍 Records to insert:`, JSON.stringify(departmentRecords, null, 2));
      const insertedRecords = await DepartmentClearance.insertMany(departmentRecords);
      console.log(`✅ Created ${insertedRecords.length} DepartmentClearance records`);
      console.log(`   Records saved with IDs:`, insertedRecords.map(r => ({ id: r._id, dept: r.department_name, status: r.status })));
      departmentRecords.forEach(rec => {
        console.log(`   ✅ ${rec.department_name}: ${rec.status}`);
      });
    } catch (deptErr) {
      console.error(`❌ Error creating DepartmentClearance records:`, deptErr.message);
      console.error(`   Stack:`, deptErr.stack);
    }

    // ==================== GENERATE CERTIFICATE IF APPROVED ====================
    if (validationResult.overallStatus === "Completed") {
      console.log('\n🎓 GENERATING CERTIFICATE...');
      
      const qrCode = `CLEARANCE_${sapid}_${savedRecord._id}`;
      
      await ComprehensiveClearanceValidation.findByIdAndUpdate(savedRecord._id, {
        certificateGenerated: true,
        qr_code: qrCode,
        certificate_generated_at: new Date(),
        completedAt: new Date()
      });

      console.log(`✅ Certificate generated with QR: ${qrCode}`);
      
      // ==================== GENERATE PDF AND SEND CERTIFICATE EMAIL ====================
      console.log('📧 Generating PDF and sending certificate email...');
      try {
        const student = await User.findById(req.user.id);
        console.log(`   Student found: ${student ? 'YES' : 'NO'}`);
        
        if (student && student.email) {
          console.log(`   Student email: ${student.email}`);
          
          // Get approved departments
          const approvedDepartments = validationResult.departmentStatuses
            .filter(d => d.status === 'Approved')
            .map(d => d.name);

          console.log(`\n📄 Generating certificate PDF...`);
          
          // Generate PDF
          const pdfBuffer = await generateCertificatePDF({
            studentName: student.full_name || student.name || sapid,
            sapId: sapid,
            certificateId: savedRecord._id.toString(),
            departments: approvedDepartments,
            date: new Date(),
            qrCodeData: qrCode
          });

          console.log(`   ✅ PDF generated: ${pdfBuffer.length} bytes`);

          // Send email with PDF attachment
          console.log(`\n📨 Sending certificate email with PDF attachment...`);
          const emailResult = await sendCertificateEmail({
            studentEmail: student.email,
            studentName: student.full_name || student.name || sapid,
            sapId: sapid,
            pdfBuffer: pdfBuffer,
            certificateId: savedRecord._id.toString(),
            departments: approvedDepartments,
            verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${savedRecord._id.toString()}`
          });
          
          if (emailResult.success) {
            console.log(`✅ Certificate email with PDF sent successfully to ${student.email}`);
            console.log(`   Message ID: ${emailResult.messageId}`);
          } else {
            console.error(`❌ Certificate email FAILED: ${emailResult.reason || emailResult.error}`);
          }
        } else {
          console.error('❌ Student record or email not found in database');
          if (!student) {
            console.error(`   Could not find user with ID: ${req.user.id}`);
          } else {
            console.error(`   User found but email is empty: ${student.email}`);
          }
        }
      } catch (emailErr) {
        console.error('❌ Error in certificate email process:', emailErr.message);
        console.error('   Stack:', emailErr.stack);
      }
      
      // Send approval notification
      await new Message({
        conversation_id: `${sapid}-clearance-approved-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "Clearance System",
        sender_role: "system",
        sender_sapid: "SYSTEM",
        recipient_sapid: sapid,
        recipient_id: req.user.id,
        recipient_department: "System",
        subject: "✅ CLEARANCE APPROVED - Certificate Ready",
        message: `Congratulations! Your clearance request has been APPROVED by all 5 departments. Your certificate has been generated and sent to your email. You can also download it from your dashboard.`,
        message_type: "notification"
      }).save().catch(err => console.error('Error saving notification:', err));
    } else {
      console.log('\n❌ REJECTED - One or more departments have pending dues');
      console.log(`   Rejected departments: ${validationResult.rejectedDepartments.join(", ")}`);
      
      // Send rejection notification with specific reasons
      const reasons = validationResult.departmentStatuses
        .filter(d => d.status === "Rejected")
        .map(d => `${d.name}: ${d.reason}`)
        .join("\n");

      await new Message({
        conversation_id: `${sapid}-clearance-rejected-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "Clearance System",
        sender_role: "system",
        sender_sapid: "SYSTEM",
        recipient_sapid: sapid,
        recipient_id: req.user.id,
        recipient_department: "System",
        subject: "⚠️ CLEARANCE REJECTED - Action Required",
        message: `Your clearance request has been rejected due to pending issues:\n\n${reasons}\n\nPlease fix these issues and resubmit your request.`,
        message_type: "notification"
      }).save().catch(err => console.error('Error saving notification:', err));
    }

    // ==================== RESPONSE ====================
    console.log('\n📊 SENDING RESPONSE TO CLIENT');
    
    return res.status(201).json({
      success: true,
      message: validationResult.overallStatus === "Completed" 
        ? "✅ Clearance APPROVED - All departments cleared!"
        : "❌ Clearance REJECTED - Please fix the issues and resubmit",
      validationId: savedRecord._id,
      overallStatus: validationResult.overallStatus,
      certificateGenerated: validationResult.certificateGenerated,
      departmentStatuses: validationResult.departmentStatuses.map(d => ({
        name: d.name,
        status: d.status,
        reason: d.reason
      })),
      approvedDepartments: validationResult.approvedDepartments,
      rejectedDepartments: validationResult.rejectedDepartments,
      isResubmission: submissionCheck.isResubmission || false
    });

  } catch (err) {
    console.error('\n❌ CLEARANCE REQUEST ERROR');
    console.error('   Error Name:', err.name);
    console.error('   Error Message:', err.message);
    console.error('   Stack Trace:', err.stack);
    if (err.errors) {
      console.error('   Validation Errors:', err.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process clearance request: ' + err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// --------------------
// GET Department Clearance Requests (Both Pending & Approved)
// --------------------
app.get('/api/clearance/department', verifyToken, async (req, res) => {
  try {
    const userDept = req.user.department;
    console.log('\n🔍 Department staff fetching requests for:', userDept);

    // Department names now match directly (no conversion needed)
    const ccvDeptName = userDept;
    console.log(`  📊 Mapped department: ${userDept} → ${ccvDeptName}`);

    // Query ComprehensiveClearanceValidation (the actual data source)
    const allRecords = await ComprehensiveClearanceValidation.find().sort({ createdAt: -1 });
    console.log(`  📊 Total CCV records: ${allRecords.length}`);

    // Transform a CCV record into the format the frontend expects
    const transformRecord = (record, statusOverride) => {
      const deptStatus = record.departmentStatuses.find(d => d.name === ccvDeptName);
      return {
        _id: record._id,
        studentName: record.student_name || 'Unknown Student',
        sapid: record.sapid,
        program: record.program,
        semester: record.semester,
        phaseStatus: statusOverride || (deptStatus ? deptStatus.status : record.overallStatus),
        phaseRemarks: deptStatus ? deptStatus.reason : '',
        submittedAt: record.submittedAt || record.createdAt,
        completedAt: record.completedAt,
        overallStatus: record.overallStatus,
        isAutoApproved: true,
      };
    };

    // APPROVED: Students cleared from ALL departments (overallStatus === "Completed")
    const approvedRecords = allRecords
      .filter(r => r.overallStatus === 'Completed')
      .map(r => transformRecord(r, 'Approved'));

    // REJECTED: Students where THIS specific department rejected them
    const rejectedRecords = allRecords
      .filter(r => {
        const deptStatus = r.departmentStatuses.find(d => d.name === ccvDeptName);
        return deptStatus && deptStatus.status === 'Rejected';
      })
      .map(r => transformRecord(r, 'Rejected'));

    // PENDING: Students whose request is still in progress for this department
    const pendingRecords = allRecords
      .filter(r => {
        if (r.overallStatus === 'Completed') return false;
        const deptStatus = r.departmentStatuses.find(d => d.name === ccvDeptName);
        return deptStatus && deptStatus.status === 'Pending';
      })
      .map(r => transformRecord(r, 'Pending'));

    console.log(`  📊 FINAL COUNTS:`);
    console.log(`  📋 Pending: ${pendingRecords.length}`);
    console.log(`  ✅ Fully Approved (All Departments): ${approvedRecords.length}`);
    console.log(`  ❌ Rejected: ${rejectedRecords.length}`);

    res.json({
      success: true,
      pending: pendingRecords,
      approved: approvedRecords,
      rejected: rejectedRecords,
    });
  } catch (err) {
    console.error('❌ Error fetching department requests:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch requests: ' + err.message
    });
  }
});

// --------------------
// Get Clearance Certificate Data (Student)
// --------------------
// ========== GET ALL STUDENT CERTIFICATES ==========
app.get('/api/certificates', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const sapid = req.user.sap;

    console.log(`📜 Fetching all certificates for student: ${studentId} (SAP: ${sapid})`);

    // Get all comprehensive clearance validations with generated certificates
    const certificates = await ComprehensiveClearanceValidation.find({
      student_id: studentId,
      certificateGenerated: true,
      overallStatus: 'Completed'
    }).sort({ completedAt: -1 });

    // Get student info
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Format certificates for frontend
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      student_name: student.full_name,
      sapid: sapid,
      father_name: student.father_name,
      program: student.program,
      semester: student.semester,
      department: student.department,
      degree_status: student.degree_status || 'Active',
      qr_code: cert.qr_code,
      submitted_at: cert.submittedAt,
      completed_at: cert.completedAt,
      validationId: cert._id,
      departments: cert.departmentStatuses
        .filter(d => d.status === 'Approved')
        .map(d => ({
          name: d.name,
          status: d.status,
          validatedAt: d.validatedAt
        }))
    }));

    console.log(`✅ Found ${formattedCertificates.length} certificates for student ${sapid}`);

    res.json({
      success: true,
      data: formattedCertificates,
      count: formattedCertificates.length
    });
  } catch (err) {
    console.error('❌ Error fetching certificates:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates: ' + err.message
    });
  }
});

// ========== GET SINGLE CERTIFICATE DATA ==========
app.get('/api/clearance-certificate', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const sapid = req.user.sap;

    console.log(`📄 Certificate Request - Student: ${studentId} (SAP: ${sapid})`);

    // Get the latest comprehensive clearance validation
    const comprehensiveRecord = await ComprehensiveClearanceValidation.findOne({
      student_id: studentId
    }).sort({ submittedAt: -1 });

    if (!comprehensiveRecord) {
      console.log('❌ No clearance validation record found');
      return res.status(404).json({ 
        success: false, 
        message: 'No clearance request found' 
      });
    }

    // Check if certificate was generated (only if ALL departments approved)
    if (!comprehensiveRecord.certificateGenerated || comprehensiveRecord.overallStatus !== 'Completed') {
      console.log('❌ Certificate not available - Clearance status:', comprehensiveRecord.overallStatus);
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate is not available. All departments must approve your clearance first.' 
      });
    }

    // Get student info from comprehensive record (which has all the clearance data)
    console.log(`✅ Certificate available for student ${sapid}`);

    res.json({
      success: true,
      certificate: {
        student_name: comprehensiveRecord.student_name,
        sapid: comprehensiveRecord.sapid,
        father_name: comprehensiveRecord.father_name,
        program: comprehensiveRecord.program,
        semester: comprehensiveRecord.semester,
        department: comprehensiveRecord.departmentStatuses?.[0]?.name || 'N/A',
        degree_status: comprehensiveRecord.degree_status || 'Active',
        qr_code: comprehensiveRecord.qr_code,
        submitted_at: comprehensiveRecord.submittedAt,
        completed_at: comprehensiveRecord.completedAt,
        validationId: comprehensiveRecord._id,
        // Include all approved departments
        departments: comprehensiveRecord.departmentStatuses
          .filter(d => d.status === 'Approved')
          .map(d => ({
            name: d.name,
            status: d.status,
            validatedAt: d.validatedAt
          }))
      }
    });
  } catch (err) {
    console.error('❌ Certificate Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch certificate data' 
    });
  }
});

// ========== DOWNLOAD CERTIFICATE ==========
app.get('/api/certificates/:certId/download', verifyToken, async (req, res) => {
  try {
    const { certId } = req.params;
    const studentId = req.user.id;

    console.log(`📥 Certificate download request: ${certId} for student: ${studentId}`);

    // Find the certificate
    const certificate = await ComprehensiveClearanceValidation.findOne({
      _id: certId,
      student_id: studentId,
      certificateGenerated: true,
      overallStatus: 'Completed'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not authorized'
      });
    }

    // Get student info
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate HTML content for the certificate
    const certData = {
      student_name: certificate.student_name,
      sapid: certificate.sapid,
      father_name: certificate.father_name,
      program: certificate.program,
      department: certificate.departmentStatuses?.[0]?.name || student.department,
      qr_code: certificate.qr_code,
      completed_at: certificate.completedAt,
      departments: certificate.departmentStatuses
        .filter(d => d.status === 'Approved')
        .map(d => d.name)
    };

    // Generate a simple HTML version (can be converted to PDF on frontend)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Clearance Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #1a3a52; padding-bottom: 20px; }
          .content { margin: 40px 0; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RIPHAH INTERNATIONAL UNIVERSITY</h1>
            <p>STUDENT CLEARANCE CERTIFICATE</p>
          </div>
          <div class="content">
            <p><strong>Student Name:</strong> ${certData.student_name}</p>
            <p><strong>SAP ID:</strong> ${certData.sapid}</p>
            <p><strong>Father's Name:</strong> ${certData.father_name}</p>
            <p><strong>Program:</strong> ${certData.program}</p>
            <p><strong>Department:</strong> ${certData.department}</p>
            <p><strong>Approved Departments:</strong> ${certData.departments.join(', ')}</p>
            <p><strong>Certificate ID:</strong> ${certData.qr_code}</p>
            <p><strong>Completed:</strong> ${new Date(certData.completed_at).toLocaleDateString()}</p>
          </div>
          <div class="footer">
            <p>This is an official clearance certificate issued by Riphah International University.</p>
            <p>Certificate ID: ${certData.qr_code}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="clearance-certificate-${certificate.sapid}.html"`);
    res.send(htmlContent);

    console.log(`✅ Certificate download sent for student ${certificate.sapid}`);
  } catch (err) {
    console.error('❌ Certificate download error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate: ' + err.message
    });
  }
});

// --------------------
// View Clearance Status (Student)
// --------------------
app.get('/api/clearance-status', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentSap = req.user.sap;
    console.log('🔍 Fetching clearance status for student:', studentSap || studentId);

    // Fetch  latest comprehensive clearance validation
    const validationRecord = await ComprehensiveClearanceValidation.findOne({
      student_id: studentId
    }).sort({ submittedAt: -1 });

    if (!validationRecord) {
      console.log('⚠️ No clearance validation record found');
      return res.json({
        success: true,
        data: null,
        summary: {
          total: 5,
          cleared: 0,
          rejected: 0,
          pending: 0,
          notStarted: 5,
          progressPercentage: 0
        },
        message: 'No clearance request submitted yet'
      });
    }

    console.log(`✅ Found clearance validation: ${validationRecord._id}`);
    console.log(`   Overall Status: ${validationRecord.overallStatus}`);
    console.log(`   Certificate: ${validationRecord.certificateGenerated ? 'Generated' : 'Not Generated'}`);

    // Use department statuses directly (names already in correct format)
    const mappedDepartmentStatuses = validationRecord.departmentStatuses.map(d => ({
      name: d.name,
      status: d.status,
      reason: d.reason,
      pendingItems: d.pendingItems || [],
      validatedAt: d.validatedAt
    }));

    // Calculate summary
    const clearedCount = mappedDepartmentStatuses.filter(d => d.status === 'Approved').length;
    const rejectedCount = mappedDepartmentStatuses.filter(d => d.status === 'Rejected').length;
    const totalCount = 5;
    const progressPercentage = Math.round((clearedCount / totalCount) * 100);

    res.json({
      success: true,
      data: validationRecord,
      departmentStatuses: mappedDepartmentStatuses,
      summary: {
        total: totalCount,
        cleared: clearedCount,
        rejected: rejectedCount,
        pending: 0,
        notStarted: 0,
        progressPercentage: progressPercentage
      },
      overallStatus: validationRecord.overallStatus,
      certificateGenerated: validationRecord.certificateGenerated,
      qrCode: validationRecord.qr_code || null
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

    console.log(`📋 Department approval updated: ${updated.department_name} - ${status}`);

    // If approved, check if ALL departments are now approved
    if (status === 'Approved') {
      const clearanceRequestId = updated.clearance_request_id;
      const studentId = updated.student_id;

      // Check all department statuses for this clearance request
      const allDeptRecords = await DepartmentClearance.find({
        clearance_request_id: clearanceRequestId
      });

      console.log(`🔍 Checking all departments for request ${clearanceRequestId}`);
      console.log(`   Total departments: ${allDeptRecords.length}`);
      console.log(`   Approved: ${allDeptRecords.filter(d => d.status === 'Approved').length}`);

      // Check if all are approved
      const allApproved = allDeptRecords.every(d => d.status === 'Approved');

      if (allApproved) {
        console.log(`✅ ALL DEPARTMENTS APPROVED! Moving to HOD for final approval`);
        
        // Update all records to mark them as ready for HOD
        await DepartmentClearance.updateMany(
          { clearance_request_id: clearanceRequestId },
          { ready_for_hod: true }
        );

        // Update the main clearance request
        await ClearanceRequest.findByIdAndUpdate(
          clearanceRequestId,
          { hod_status: 'Ready for HOD' }
        );

        // Send notification to student
        const clearanceReq = await ClearanceRequest.findById(clearanceRequestId);
        const message = new Message({
          conversation_id: `${clearanceReq.sapid}-hod-ready-${Date.now()}`,
          sender_id: new mongoose.Types.ObjectId(),
          sender_name: 'System',
          sender_role: 'system',
          sender_sapid: 'SYSTEM',
          recipient_sapid: clearanceReq.sapid,
          recipient_id: studentId,
          recipient_department: 'System',
          subject: '🎯 All Departments Approved - Awaiting HOD Final Approval',
          message: `Congratulations! All departments have approved your clearance request. Your application is now awaiting final approval from the HOD (Head of Department).`,
          message_type: 'notification'
        });
        await message.save();
        console.log(`📨 Notification sent to student`);
      }
    }

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      readyForHOD: updated.status === 'Approved' ? (await checkAllDepartmentsApproved(updated.clearance_request_id)) : false
    });
  } catch (err) {
    console.error('Approve Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve request' 
    });
  }
});

// Helper function to check if all departments approved
async function checkAllDepartmentsApproved(clearanceRequestId) {
  const allRecords = await DepartmentClearance.find({ clearance_request_id: clearanceRequestId });
  return allRecords.every(d => d.status === 'Approved');
}

// --------------------
// Sequential Workflow: Approve Current & Create Next Department
// --------------------
// This endpoint handles sequential approvals: approve current dept and create next dept record
app.post('/api/clearance-approve-and-continue', verifyToken, async (req, res) => {
  try {
    const { deptClearanceId, status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Find and update current department record
    const currentDept = await DepartmentClearance.findByIdAndUpdate(
      deptClearanceId,
      {
        status,
        remarks,
        approved_by: req.user.email,
        approved_at: status === 'Approved' ? new Date() : null
      },
      { new: true }
    );

    if (!currentDept) {
      return res.status(404).json({ success: false, message: 'Department clearance record not found' });
    }

    const studentSap = currentDept.sapid;
    const clearanceRequestId = currentDept.clearance_request_id;
    const currentSequence = currentDept.sequence_order;

    console.log(`\n✅ ${currentDept.department_name} - ${status}`);
    console.log(`📊 Sequence Order: ${currentSequence} of 5`);

    if (status === 'Rejected') {
      console.log(`❌ REQUEST REJECTED by ${currentDept.department_name}`);
      
      // Send notification to student - offer to resubmit
      await new Message({
        conversation_id: `${studentSap}-dept-rejected-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: currentDept.department_name,
        sender_role: 'department',
        recipient_sapid: studentSap,
        recipient_id: currentDept.student_id,
        recipient_department: 'System',
        subject: `⚠️ Clearance Rejected by ${currentDept.department_name}`,
        message: `Your clearance request has been rejected by the ${currentDept.department_name} department with the following remarks: ${remarks || 'No remarks provided'}. You can resubmit your request after addressing the concerns.`,
        message_type: 'warning'
      }).save().catch(err => console.error('Error saving message:', err));

      return res.json({
        success: true,
        message: `Request rejected by ${currentDept.department_name}`,
        status: 'Rejected',
        canResubmit: true
      });
    }

    // APPROVED - Create next department record if not at the end
    const departmentSequence = [
      { name: 'Coordination', order: 1 },
      { name: 'Transport', order: 2 },
      { name: 'Library', order: 3 },
      { name: 'Fee Department', order: 4 },
      { name: 'Student Service', order: 5 }
    ];

    const nextSequence = currentSequence + 1;

    if (nextSequence <= 5) {
      // Create next department record
      const nextDept = departmentSequence.find(d => d.order === nextSequence);
      
      console.log(`\n📤 Creating NEXT DEPARTMENT: ${nextDept.name} (Stage ${nextSequence} of 5)`);

      const nextRecord = new DepartmentClearance({
        clearance_request_id: clearanceRequestId,
        student_id: currentDept.student_id,
        sapid: studentSap,
        student_name: currentDept.student_name,
        father_name: currentDept.father_name,
        program: currentDept.program,
        semester: currentDept.semester,
        degree_status: currentDept.degree_status,
        department_name: nextDept.name,
        status: 'Pending',
        sequence_order: nextSequence,
        resubmission_count: 0,
        createdAt: new Date()
      });

      await nextRecord.save();
      console.log(`✅ ${nextDept.name} record created - awaiting approval`);

      // Send notification to student about progress
      await new Message({
        conversation_id: `${studentSap}-progress-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: 'Clearance System',
        sender_role: 'system',
        sender_sapid: 'SYSTEM',
        recipient_sapid: studentSap,
        recipient_id: currentDept.student_id,
        recipient_department: 'System',
        subject: `✅ Approved by ${currentDept.department_name} - Stage ${nextSequence}: ${nextDept.name}`,
        message: `🎉 Great news! Your clearance request has been approved by ${currentDept.department_name}. Your request is now moving to ${nextDept.name} (Stage ${nextSequence} of 5). You'll be notified when the next department reviews your request.`,
        message_type: 'success'
      }).save().catch(err => console.error('Error saving message:', err));

      return res.json({
        success: true,
        message: `Approved by ${currentDept.department_name}. Moving to ${nextDept.name}...`,
        currentStage: `Stage ${currentSequence}`,
        nextStage: `Stage ${nextSequence}: ${nextDept.name}`,
        progressPercentage: Math.round((currentSequence / 5) * 100)
      });
    } else {
      // ALL DEPARTMENTS APPROVED - Clearance Complete!
      console.log(`\n🎉🎉🎉 ALL DEPARTMENTS APPROVED! CLEARANCE COMPLETE!`);

      // Update main clearance request to mark as complete
      const qrCode = generateQRCode(studentSap, clearanceRequestId);
      const clearanceReq = await ClearanceRequest.findByIdAndUpdate(
        clearanceRequestId,
        { 
          status: 'Completed',
          certificate_status: 'Ready',
          certificate_qr_code: qrCode
        },
        { new: true }
      );

      // Send certificate email to student
      const student = await User.findById(currentDept.student_id);
      if (student && student.email) {
        console.log(`📧 Sending certificate email to ${student.email}...`);
        try {
          const { sendClearanceCertificateEmail } = require('./utils/emailService');
          const emailResult = await sendClearanceCertificateEmail({
            studentName: student.full_name || 'Student',
            studentEmail: student.email,
            sapId: studentSap,
            department: currentDept.department,
            program: currentDept.program,
            qrCode: qrCode,
            approvedBy: 'All Departments',
            approvedAt: new Date(),
            departments: [
              { name: 'Coordination', status: 'Approved' },
              { name: 'Transport', status: 'Approved' },
              { name: 'Library', status: 'Approved' },
              { name: 'Fee Department', status: 'Approved' },
              { name: 'Student Service', status: 'Approved' }
            ]
          });
          
          if (emailResult.success) {
            console.log(`✅ Certificate email sent successfully`);
            // Update certificate status
            await ClearanceRequest.findByIdAndUpdate(clearanceRequestId, { certificate_sent_at: new Date() });
          }
        } catch (emailErr) {
          console.error('⚠️ Error sending certificate email:', emailErr.message);
        }
      }

      // Send completion notification
      await new Message({
        conversation_id: `${studentSap}-complete-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: 'Clearance System',
        sender_role: 'system',
        sender_sapid: 'SYSTEM',
        recipient_sapid: studentSap,
        recipient_id: currentDept.student_id,
        recipient_department: 'System',
        subject: `🎓 Clearance Completed - Certificate Ready`,
        message: `Congratulations! Your clearance request has been approved by ALL departments! Your clearance certificate is now ready. You can download and print it from your dashboard. A copy has been sent to your registered email.`,
        message_type: 'success'
      }).save().catch(err => console.error('Error saving message:', err));

      return res.json({
        success: true,
        message: '🎉 Clearance Complete! All departments approved. Certificate ready for download.',
        status: 'Completed',
        certificateReady: true,
        progressPercentage: 100
      });
    }
  } catch (err) {
    console.error('❌ Sequential Approval Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval: ' + err.message
    });
  }
});

// Helper function to generate QR code
function generateQRCode(sapid, clearanceRequestId) {
  // This would integrate with a QR code library like 'qrcode'
  // For now, return a simple identifier that can be used to generate QR
  return `CLEARANCE_${sapid}_${clearanceRequestId}`;
}

// Get Student's Existing Clearance Requests (with full history)
app.get('/api/clearance-requests', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentSap = req.user.sap;
    console.log('📋 Fetching clearance request history for student:', studentSap || studentId);

    // Get all comprehensive clearance validations for this student
    const validationRecords = await ComprehensiveClearanceValidation.find({
      student_id: studentId
    }).sort({ submittedAt: -1 });

    if (!validationRecords || validationRecords.length === 0) {
      console.log('⚠️ No clearance requests found');
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Transform validation records to match expected format
    const transformedRecords = validationRecords.map(record => {
      // Convert overallStatus to user-friendly status for frontend filtering
      const statusMap = {
        'Completed': 'Approved',
        'Pending': 'Pending',
        'Rejected': 'Rejected',
        'Resubmission': 'Resubmission'
      };
      
      return {
        _id: record._id,
        student_id: record.student_id,
        sapid: record.sapid,
        student_name: record.student_name,
        father_name: record.father_name,
        program: record.program,
        semester: record.semester,
        submitted_at: record.submittedAt,
        completed_at: record.completedAt,
        overallStatus: record.overallStatus,
        status: statusMap[record.overallStatus] || record.overallStatus,
        certificateGenerated: record.certificateGenerated,
        submissionCount: record.submissionCount,
        // Department statuses with correct names
        departmentStatuses: record.departmentStatuses.map(d => ({
          name: d.name,
          status: d.status,
          reason: d.reason,
          pendingItems: d.pendingItems || [],
          validatedAt: d.validatedAt,
          isAutoApproved: false  // Not applicable in new system
        }))
      };
    });

    console.log(`✅ Found ${validationRecords.length} clearance request(s)`);

    res.json({
      success: true,
      data: transformedRecords,
      count: transformedRecords.length
    });
  } catch (err) {
    console.error('❌ Fetch Requests Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests: ' + err.message
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

// Resubmit Clearance Request (after rejection)
app.post('/api/clearance-requests/resubmit', verifyToken, async (req, res) => {
  try {
    const { department } = req.body;
    console.log('🔄 Resubmitting clearance request for student:', req.user.id, 'Department:', department);

    if (department) {
      // Resubmit to a specific department only
      const rejectedRecord = await DepartmentClearance.findOne({
        student_id: req.user.id,
        department_name: department,
        status: 'Rejected'
      });

      if (!rejectedRecord) {
        return res.status(400).json({
          success: false,
          message: `No rejected request found for ${department}`
        });
      }

      // Update the specific rejected record back to Pending
      await DepartmentClearance.findByIdAndUpdate(
        rejectedRecord._id,
        {
          status: 'Pending',
          remarks: '',
          approved_by: '',
          approved_at: null,
          createdAt: new Date()
        }
      );

      console.log(`✅ Resubmitted to ${department}`);

      res.json({
        success: true,
        message: `Clearance request resubmitted successfully to ${department}`,
        details: {
          department: department,
          newStatus: 'Pending',
          timestamp: new Date()
        }
      });
    } else {
      // Original behavior: resubmit to all rejected departments
      console.log('🔄 Resubmitting clearance request for all rejected departments');

      // Find all rejected requests for this student
      const rejectedRecords = await DepartmentClearance.find({
        student_id: req.user.id,
        status: 'Rejected'
      });

      if (rejectedRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No rejected requests to resubmit'
        });
      }

      // Check if student has any pending requests (cannot resubmit if already pending)
      const pendingRecords = await DepartmentClearance.find({
        student_id: req.user.id,
        status: 'Pending'
      });

      if (pendingRecords.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending clearance request. Please wait for it to be reviewed.'
        });
      }

      // Update all rejected records back to Pending
      const updateResult = await DepartmentClearance.updateMany(
        { student_id: req.user.id, status: 'Rejected' },
        {
          $set: {
            status: 'Pending',
            remarks: '',
            approved_by: '',
            approved_at: null,
            createdAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} rejected records to Pending`);

      res.json({
        success: true,
        message: 'Clearance request resubmitted successfully to all departments',
        details: {
          resubmittedCount: updateResult.modifiedCount,
          timestamp: new Date()
        }
      });
    }
  } catch (err) {
    console.error('❌ Resubmit Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit clearance request: ' + err.message
    });
  }
});

// --------------------
// HOD CLEARANCE APPROVAL ROUTES
// --------------------

// Resubmit clearance to a specific department
app.post('/api/clearance-requests/resubmit-department', verifyToken, async (req, res) => {
  try {
    const { department_name } = req.body;
    const studentId = req.user.id;
    console.log('🔄 Resubmit Request Details:', {
      department_name,
      studentId,
      timestamp: new Date()
    });

    if (!department_name) {
      console.warn('⚠️ Department name missing');
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Find the rejected request for this specific department
    const rejectedRecord = await DepartmentClearance.findOne({
      student_id: studentId,
      department_name: department_name,
      status: 'Rejected'
    });

    console.log('🔍 Rejected Record Search:', {
      found: !!rejectedRecord,
      query: { student_id: studentId, department_name, status: 'Rejected' }
    });

    if (!rejectedRecord) {
      console.warn('⚠️ No rejected record found for:', department_name);
      return res.status(400).json({
        success: false,
        message: `No rejected request found for ${department_name}. Record may have been already processed or doesn't exist.`
      });
    }

    // Check if student already has a pending request for this department
    const pendingRecord = await DepartmentClearance.findOne({
      student_id: studentId,
      department_name: department_name,
      status: 'Pending'
    });

    console.log('⏳ Pending Record Check:', {
      found: !!pendingRecord
    });

    if (pendingRecord) {
      console.warn('⚠️ Pending request already exists:', department_name);
      return res.status(400).json({
        success: false,
        message: `You already have a pending request with ${department_name}. Please wait for review.`
      });
    }

    // Update the rejected record back to Pending for this specific department
    const updateResult = await DepartmentClearance.updateOne(
      { 
        _id: rejectedRecord._id,
        student_id: studentId, 
        department_name: department_name,
        status: 'Rejected' 
      },
      {
        $set: {
          status: 'Pending',
          remarks: '',
          approved_by: '',
          approved_at: null,
          createdAt: new Date()
        }
      }
    );

    console.log('📝 Update Result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      department: department_name
    });

    if (updateResult.modifiedCount === 0) {
      throw new Error('Failed to update record - no documents modified');
    }

    console.log(`✅ Successfully updated ${department_name} to Pending`);

    res.json({
      success: true,
      message: `Clearance request resubmitted to ${department_name}`,
      details: {
        department: department_name,
        status: 'Pending',
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('❌ Resubmit Department Error:', {
      message: err.message,
      stack: err.stack,
      department: req.body?.department_name,
      studentId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit clearance request: ' + err.message
    });
  }
});

// Diagnostic endpoint - Check all records for a student
app.get('/api/diagnostic/my-records', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('🔍 Diagnostic: Checking records for student:', studentId);

    const records = await DepartmentClearance.find({ student_id: studentId }).sort({ department_name: 1 });

    const summary = records.map(r => ({
      department: r.department_name,
      status: r.status,
      remarks: r.remarks || 'N/A',
      hasRejectedRecord: r.status === 'Rejected',
      canResubmit: r.status === 'Rejected'
    }));

    res.json({
      success: true,
      totalRecords: records.length,
      studentId,
      records: summary,
      rawRecords: records
    });
  } catch (err) {
    console.error('❌ Diagnostic Error:', err);
    res.status(500).json({
      success: false,
      message: 'Error: ' + err.message
    });
  }
});

// Get all clearance requests ready for HOD approval
app.get('/api/hod/pending-approvals', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching pending HOD approvals for user:', req.user.email);
    console.log('User role:', req.user.role);
    
    // Verify user is HOD
    if (req.user.role !== 'hod') {
      console.log('❌ Access denied - not HOD role');
      return res.status(403).json({
        success: false,
        message: 'Access denied - HOD role required'
      });
    }
    
    // Get clearance requests that are ready for HOD
    console.log('🔍 Searching for requests with hod_status: "Ready for HOD"');
    const readyForHOD = await ClearanceRequest.find({
      hod_status: 'Ready for HOD'
    })
    .populate('student_id', 'full_name email sap')
    .sort({ submitted_at: -1 })
    .lean();

    console.log(`✅ Found ${readyForHOD.length} applications ready for HOD approval`);

    // Get detailed department records for each request
    const details = await Promise.all(
      readyForHOD.map(async (clearanceReq) => {
        try {
          const deptRecords = await DepartmentClearance.find({
            clearance_request_id: clearanceReq._id
          }).lean();
          
          return {
            ...clearanceReq,
            departmentStatus: deptRecords || []
          };
        } catch (error) {
          console.error('Error fetching dept records for:', clearanceReq._id, error);
          return {
            ...clearanceReq,
            departmentStatus: []
          };
        }
      })
    );

    res.json({
      success: true,
      count: details.length,
      data: details
    });
  } catch (err) {
    console.error('🔴 HOD Pending Approvals Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals: ' + err.message
    });
  }
});

// HOD Approve Clearance Request (with QR Code generation)
app.post('/api/hod/approve-clearance/:clearanceRequestId', verifyToken, async (req, res) => {
  try {
    const { clearanceRequestId } = req.params;
    const { remarks } = req.body;
    const hodId = req.user.id;
    const hodName = req.user.full_name || req.user.email;

    console.log(`🔐 HOD approving clearance request: ${clearanceRequestId}`);
    console.log(`   HOD: ${hodName}`);

    // Get the clearance request
    const clearanceReq = await ClearanceRequest.findById(clearanceRequestId);
    if (!clearanceReq) {
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found'
      });
    }

    // Check if it's ready for HOD
    if (clearanceReq.hod_status !== 'Ready for HOD') {
      return res.status(400).json({
        success: false,
        message: 'This request is not ready for HOD approval'
      });
    }

    // Generate unique QR code
    const qrCodeId = `CLEAR-${Date.now()}-${clearanceReq.sapid}`;
    
    console.log(`📊 Generating QR Code: ${qrCodeId}`);

    // Create DocumentQRCode record
    const qrCode = new DocumentQRCode({
      qrCode: qrCodeId,
      documentName: 'Clearance Certificate',
      studentName: clearanceReq.student_name,
      studentSapId: clearanceReq.sapid,
      studentDepartment: clearanceReq.department || 'N/A',
      createdByHOD: hodName,
      isActive: true,
      generatedAt: new Date()
    });

    const savedQR = await qrCode.save();
    console.log(`✅ QR Code saved: ${savedQR._id}`);

    // Update clearance request with HOD approval and QR code
    const updatedReq = await ClearanceRequest.findByIdAndUpdate(
      clearanceRequestId,
      {
        hod_status: 'HOD Approved',
        hod_approved_by: hodName,
        hod_approved_at: new Date(),
        qr_code: qrCodeId,
        status: 'Completed'
      },
      { new: true }
    );

    // Update all department records as well
    await DepartmentClearance.updateMany(
      { clearance_request_id: clearanceRequestId },
      { ready_for_hod: false }
    );

    // Send success notification to student
    const message = new Message({
      conversation_id: `${clearanceReq.sapid}-hod-approved-${Date.now()}`,
      sender_id: hodId,
      sender_name: hodName,
      sender_role: 'hod',
      sender_sapid: req.user.sap,
      recipient_sapid: clearanceReq.sapid,
      recipient_id: clearanceReq.student_id,
      recipient_department: 'System',
      subject: '✅ CLEARANCE APPROVED - Certificate Ready',
      message: `Congratulations! Your clearance has been approved by the HOD. Your clearance certificate is ready. QR Code: ${qrCodeId}${remarks ? `\n\nRemarks: ${remarks}` : ''}`,
      message_type: 'notification'
    });
    await message.save();

    // Send email notification to student (non-blocking)
    try {
      const student = await User.findById(clearanceReq.student_id);
      if (student && student.email) {
        const deptRecords = await DepartmentClearance.find({ clearance_request_id: clearanceRequestId });
        const departments = deptRecords.map(d => ({ name: d.department_name || d.department, status: d.status || 'Approved' }));

        sendClearanceCertificateEmail({
          studentName: clearanceReq.student_name,
          studentEmail: student.email,
          sapId: clearanceReq.sapid,
          department: clearanceReq.department,
          program: clearanceReq.program,
          qrCode: qrCodeId,
          approvedBy: hodName,
          approvedAt: new Date(),
          departments,
        }).catch(err => console.error('Email send error:', err.message));
      }
    } catch (emailErr) {
      console.error('Email lookup error:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Clearance request approved by HOD successfully',
      qrCode: qrCodeId,
      details: {
        studentName: clearanceReq.student_name,
        sapId: clearanceReq.sapid,
        approvedBy: hodName,
        approvedAt: new Date()
      }
    });
  } catch (err) {
    console.error('HOD Approve Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to approve clearance: ' + err.message
    });
  }
});

// Get QR Code details for verification
app.get('/api/hod/verify-qr/:qrCode', verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.params;

    const qrRecord = await DocumentQRCode.findOne({ qrCode });
    if (!qrRecord) {
      return res.status(404).json({
        success: false,
        message: 'QR Code not found'
      });
    }

    res.json({
      success: true,
      data: qrRecord
    });
  } catch (err) {
    console.error('QR Verify Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code: ' + err.message
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
        recipient_department: req.user.department || senderRole, // Use actual sender's department, not hardcoded 'Library'
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
      recipient_sapid: null,              // ✅ FIXED: Set to null for department messages
      recipient_id: null,                 // ✅ FIXED: Set to null for department messages
      recipient_department: recipient_department,
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
app.post('/api/messages/reply/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
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
    const originalMessage = await Message.findById(messageId);
    
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: '❌ Message not found'
      });
    }
    
    const conversation_id = originalMessage.conversation_id;

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

// --------------------
// ADMIN - SEND MESSAGE TO DEPARTMENTS/STUDENTS
// --------------------
app.post('/api/admin/send-message', verifyToken, async (req, res) => {
  console.log('🚀 [ENDPOINT HIT] /api/admin/send-message request received');
  console.log('🔑 User from token:', req.user ? { id: req.user.id, role: req.user.role } : 'NO USER');
  
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      console.log('❌ User role is not admin:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin role required'
      });
    }

    const { messageType, subject, message, priority, targetType, department, studentSapId, roleTarget } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.full_name || 'Admin';

    console.log('✅ Admin role verified');

    // Validation
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    console.log('📨 Admin sending message:', { messageType, subject, targetType, department, studentSapId, roleTarget });

    let messagesSent = 0;
    let recipients = [];

    // CASE 1: Send to student
    if (messageType === 'student') {
      if (!studentSapId) {
        return res.status(400).json({
          success: false,
          message: 'Student SAP ID is required'
        });
      }

      const student = await User.findOne({ sap: studentSapId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with SAP ID ${studentSapId} not found`
        });
      }

      const newMessage = new Message({
        sender_id: senderId,
        sender_name: senderName,
        sender_role: 'admin',
        sender_sapid: null,
        recipient_id: student._id,
        recipient_sapid: student.sap,
        recipient_department: 'admin',
        subject: subject.trim(),
        message: message.trim(),
        message_type: 'notification',
        priority: priority || 'normal',
        is_read: false,
        createdAt: new Date()
      });

      await newMessage.save();
      messagesSent = 1;
      recipients.push(student.full_name);
    }
    
    // CASE 2: Send to all departments or specific department
    else if (messageType === 'department') {
      try {
        let departmentUsers = [];

        if (targetType === 'all') {
          // Send to all department staff (case-insensitive)
          departmentUsers = await User.find({
            role: { $regex: /^(library|transport|laboratory|feedepartment|coordination|studentservice)$/i }
          });
          console.log(`Found ${departmentUsers.length} users for all departments`);
        } else if (targetType === 'specific') {
          if (!department) {
            return res.status(400).json({
              success: false,
              message: 'Department is required'
            });
          }
          // Map department name to role (case-insensitive)
          const deptMapping = {
            'Library': /^library$/i,
            'Transport': /^transport$/i,
            'Laboratory': /^laboratory$/i,
            'Fee Department': /^feedepartment$/i,
            'Coordination': /^coordination$/i,
            'Student Service': /^studentservice$/i,
            'Student Services': /^studentservice$/i
          };
          
          const roleRegex = deptMapping[department];
          if (!roleRegex) {
            return res.status(400).json({
              success: false,
              message: `Invalid department: ${department}`
            });
          }
          departmentUsers = await User.find({ role: roleRegex });
          console.log(`Found ${departmentUsers.length} users for department: ${department}`);
        }

        // Send message to each department user
        for (const user of departmentUsers) {
          try {
            const newMessage = new Message({
              sender_id: senderId,
              sender_name: senderName,
              sender_role: 'admin',
              sender_sapid: null,
              recipient_id: user._id,
              recipient_sapid: user.sap,
              recipient_department: user.department,
              subject: subject.trim(),
              message: message.trim(),
              message_type: 'notification',
              priority: priority || 'normal',
              is_read: false,
              createdAt: new Date()
            });

            await newMessage.save();
            messagesSent++;
            recipients.push(`${user.full_name} (${user.department})`);
          } catch (innerErr) {
            console.error(`Error saving message for user ${user.full_name}:`, innerErr.message);
          }
        }
      } catch (deptErr) {
        console.error('Department message error:', deptErr);
        throw deptErr;
      }
    }
    
    // CASE 3: Send to role (broadcast)
    else if (messageType === 'role') {
      if (!roleTarget) {
        return res.status(400).json({
          success: false,
          message: 'Target role is required'
        });
      }

      const roleUsers = await User.find({ role: roleTarget });

      // Send message to each role user
      for (const user of roleUsers) {
        const newMessage = new Message({
          sender_id: senderId,
          sender_name: senderName,
          sender_role: 'admin',
          sender_sapid: null,
          recipient_id: user._id,
          recipient_sapid: user.sap,
          recipient_department: user.department,
          subject: subject.trim(),
          message: message.trim(),
          message_type: 'notification',
          priority: priority || 'normal',
          is_read: false,
          createdAt: new Date()
        });

        await newMessage.save();
        messagesSent++;
        recipients.push(`${user.full_name} (${user.department})`);
      }
    }

    console.log(`✅ Admin message sent to ${messagesSent} recipients`);

    console.log(`✅ Final response - sending ${messagesSent} messages to recipients:`, recipients);
    res.status(201).json({
      success: true,
      message: `✅ Message sent successfully to ${messagesSent} recipient(s)!`,
      messagesSent,
      recipients
    });
  } catch (err) {
    console.error('❌ Admin Message Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send message: ' + err.message
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

// ========== GET ALL MESSAGES FOR STUDENT ==========
app.get('/api/my-messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const userDept = req.user.department;

    console.log('🔍 User Info:');
    console.log('  - SAP ID:', req.user.sap || userId);
    console.log('  - Role:', userRole);
    console.log('  - Department:', userDept);

    let query = {};
    
    if (userRole === 'student') {
      // Students should only see messages they RECEIVED (recipient)
      // Messages they SENT are shown via /api/student/sent-messages endpoint
      query = {
        recipient_id: userId       // Only messages they received
      };
    } else {
      // Staff (department personnel) see:
      // 1. Messages FROM students to their department
      // 2. Messages they SENT to students
      // 3. Messages sent DIRECTLY to them by admin (recipient_id)
      const orConditions = [
        // Messages they sent
        { sender_id: userId },
        // Messages sent directly to them (admin messages, library to student, etc)
        { recipient_id: userId }
      ];

      // Add messages from students to their department (case-insensitive match)
      // Support multiple ways to identify the department:
      // 1. Exact match on department field
      // 2. Match by role name if no department
      // 3. Match common department name variations
      
      const departmentVariations = [];
      
      if (userDept) {
        console.log(`📨 Adding student messages to department: "${userDept}"`);
        // Escape special regex characters in the department name
        const escapedDept = userDept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        departmentVariations.push(`^${escapedDept}$`);
        
        // Also add variations (e.g., "Fee Department" matches "fee" or "feedepartment")
        const deptVariation = escapedDept.replace(/\s+department\s*$/i, '');
        if (deptVariation !== escapedDept) {
          departmentVariations.push(`^${deptVariation}$`);
        }
      }
      
      // Also match by role if it's a department role
      const deptRoleMap = {
        'library': 'Library',
        'transport': 'Transport',
        'laboratory': 'Laboratory',
        'lab': 'Laboratory',
        'studentservice': 'Student Service',
        'feedepartment': 'Fee Department',
        'coordination': 'Coordination',
        'admin': 'Admin'
      };
      
      if (deptRoleMap[userRole]) {
        const roleVariation = deptRoleMap[userRole];
        const escapedRole = roleVariation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        departmentVariations.push(`^${escapedRole}$`);
        console.log(`📨 Added role mapping: ${userRole} -> ${roleVariation}`);
      }

      // Build the OR conditions for all department variations
      console.log(`📨 Department variations to search for: ${JSON.stringify(departmentVariations)}`);
      departmentVariations.forEach(variation => {
        orConditions.push({ 
          $and: [
            { recipient_department: { $regex: variation, $options: 'i' } },
            { sender_role: 'student' }
          ]
        });
      });

      query = { $or: orConditions };
    }

    console.log('📨 Fetching messages for:', userRole, '- Department:', userDept);
    if (userRole === 'student') {
      console.log('📨 Query: Looking for messages addressed to SAP ID:', req.user.sap || userId);
    } else {
      console.log('📨 Query:', JSON.stringify(query, null, 2));
    }
    
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100).lean().exec();
    console.log(`✅ Found ${messages.length} messages`);

    // Log sample messages for debugging
    if (messages.length > 0) {
      console.log('📨 Sample messages:');
      messages.slice(0, 3).forEach(msg => {
        console.log(`  - SAP ID: ${msg.recipient_sapid || 'N/A'}, From: ${msg.sender_role} (${msg.sender_name}), To Dept: ${msg.recipient_department}`);
      });
    }

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

// ========== MARK MESSAGE AS READ ==========
app.put('/api/mark-message-read/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only the recipient can mark a message as read
    if (message.recipient_id !== userId && message.recipient_department !== req.user.department) {
      console.log('❌ Unauthorized: User is not the recipient');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    message.is_read = true;
    message.read_at = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (err) {
    console.error('❌ Mark Message Read Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
});

// ========== GET STAFF SENT MESSAGES (GET /api/staff/sent-messages) ==========
// Staff can view messages they have sent to students
app.get('/api/staff/sent-messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'student') {
      return res.status(403).json({
        success: false,
        message: '❌ Students cannot view staff sent messages'
      });
    }

    // Convert userId string to ObjectId for proper matching
    let objectId;
    try {
      const mongoose = require('mongoose');
      // The userId from JWT is a string representation of ObjectId
      // We need to convert it to actual ObjectId for Mongoose to match it
      objectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;
      console.log('  - Converted ObjectId:', objectId);
    } catch (conversionErr) {
      console.warn('⚠️ ObjectId conversion issue:', conversionErr.message);
      objectId = userId;
    }

    // Query for messages where sender_id matches the staff member
    const messages = await Message.find({
      sender_id: objectId
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

    console.log(`✅ Found ${messages.length} sent messages for staff`);
    
    if (messages.length > 0) {
      console.log('  - Sample message sender_id:', messages[0].sender_id);
      console.log('  - Match check - First message sender_id == userId?', 
        messages[0].sender_id.toString() === userId);
    }

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (err) {
    console.error('❌ Staff Sent Messages Error:', err.message);
    console.error('  Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch sent messages: ' + err.message,
      error: err.message
    });
  }
});

// ========== GET STUDENT SENT MESSAGES (GET /api/student/sent-messages) ==========
// Students can view messages they have sent to departments
app.get('/api/student/sent-messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: '❌ Only students can view student sent messages'
      });
    }

    // Convert userId string to ObjectId for proper matching
    let objectId;
    try {
      const mongoose = require('mongoose');
      objectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;
      console.log('📤 Student Sent Messages - Converted ObjectId:', objectId);
    } catch (conversionErr) {
      console.warn('⚠️ ObjectId conversion issue:', conversionErr.message);
      objectId = userId;
    }

    // Query for messages where sender_id matches the student AND sender_role is student
    const sentMessages = await Message.find({
      sender_id: objectId,
      sender_role: 'student'
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

    console.log(`✅ Found ${sentMessages.length} sent messages for student ${req.user.sap}`);
    
    if (sentMessages.length > 0) {
      console.log('  - Sample sent messages:');
      sentMessages.slice(0, 3).forEach(msg => {
        console.log(`    • To: ${msg.recipient_department}, Subject: ${msg.subject}, At: ${msg.createdAt}`);
      });
    }

    res.status(200).json({
      success: true,
      data: sentMessages,
      count: sentMessages.length
    });
  } catch (err) {
    console.error('❌ Student Sent Messages Error:', err.message);
    console.error('  Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch sent messages: ' + err.message,
      error: err.message
    });
  }
});

// ========== ADMIN MESSAGE LOG (GET /api/admin/message-log) ==========
// Admin can view all messages they've sent
app.get('/api/admin/message-log', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const messages = await AdminMessage.find({ 'sender.id': req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('❌ Message Log Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch message log' });
  }
});

// ========== GET ADMIN BROADCASTS (GET /api/admin/messages) ==========
// Staff can view admin broadcasts sent to their department/role
app.get('/api/admin/messages', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    console.log('📢 Fetching admin broadcasts for staff:');
    console.log('  - User Role:', userRole);
    console.log('  - User Department:', userDept);

    // Only staff can view admin messages
    if (userRole === 'student') {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Students cannot view admin broadcasts'
      });
    }

    // Query for admin messages sent to their role or department
    const messages = await Message.find({
      sender_role: 'admin',
      $or: [
        { recipient_department: userRole },
        { recipient_department: { $regex: `^${userRole}$`, $options: 'i' } },
        { recipient_department: userDept },
        { recipient_department: { $regex: `^${userDept}$`, $options: 'i' } },
        { recipient_department: 'all' },
        { message_type: 'broadcast' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

    console.log(`✅ Found ${messages.length} admin broadcasts`);

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (err) {
    console.error('❌ Admin Messages Error:', err.message);
    res.status(200).json({
      success: true,
      data: [],
      message: 'No admin broadcasts available'
    });
  }
});

// Get admin department statistics
app.get('/api/admin/department-stats', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only admin can view department stats
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '❌ Only admins can view department statistics'
      });
    }

    console.log('📊 Fetching department clearance statistics...');

    // Get all department clearance records from both sources
    const dcRecords = await DepartmentClearance.find({}).lean().exec();
    const ccvRecords = await ComprehensiveClearanceValidation.find({ overallStatus: 'Completed' }).lean().exec();
    
    console.log(`📊 DepartmentClearance records: ${dcRecords.length}`);
    console.log(`📊 ComprehensiveClearanceValidation completed records: ${ccvRecords.length}`);

    // Department name mapping not needed - names already in correct format
    
    // Transform CCV completed records to match DepartmentClearance format
    const transformedCCVRecords = ccvRecords.map(record => {
      // For CCV with all departments completed, create a record for each department
      const records = [];
      
      // departmentStatuses is an ARRAY, not an object
      if (record.departmentStatuses && Array.isArray(record.departmentStatuses)) {
        record.departmentStatuses.forEach(deptStatus => {
          // Only include approved departments
          if (deptStatus.status === 'Approved') {
            records.push({
              department_name: deptStatus.name,
              status: 'approved', // Approved department = approved
              student_name: record.student_name,
              sap_id: record.sapid,
              student_email: record.email,
              submittedAt: record.submittedAt,
              completedAt: record.completedAt || record.certificate_generated_at || record.submittedAt,
              source: 'CCV'
            });
          }
        });
      }
      return records;
    }).flat();

    const allRecords = [...dcRecords, ...transformedCCVRecords];
    
    console.log(`📊 Total records after merge: ${allRecords.length}`);

    // Define the 5 main departments (Laboratory removed)
    const mainDepartments = ['Library', 'Transport', 'Fee Department', 'Coordination', 'Student Service'];
    
    // Initialize all 5 departments with 0 counts
    const statsByDept = {};
    mainDepartments.forEach(dept => {
      statsByDept[dept] = {
        id: dept.toLowerCase().replace(/\s+/g, '-'),
        departmentName: dept,
        totalRequests: 0,
        approved: 0,
        rejected: 0,
        pending: 0
      };
    });

    // Count by department and status - ONLY for the 6 main departments
    allRecords.forEach(record => {
      const dept = record.department_name || 'Unknown';
      const status = (record.status || '').toLowerCase().trim();
      
      // Only count if it's one of the 6 main departments
      if (statsByDept[dept]) {
        statsByDept[dept].totalRequests++;
        
        // Handle case-insensitive status matching
        if (status === 'approved' || status === 'approve' || status === 'cleared') {
          statsByDept[dept].approved++;
        } else if (status === 'rejected' || status === 'reject') {
          statsByDept[dept].rejected++;
        } else {
          // Everything else counts as pending (including 'pending', 'in_review', etc.)
          statsByDept[dept].pending++;
        }
      } else {
        // Log records that don't match any department
        console.log(`⚠️ Record for unknown department "${dept}" with status "${status}"`);
      }
    });

    // Calculate overall stats
    const overallStats = {
      totalRequests: allRecords.length,
      totalApproved: 0,
      totalRejected: 0,
      totalPending: 0
    };

    Object.values(statsByDept).forEach(dept => {
      overallStats.totalApproved += dept.approved;
      overallStats.totalRejected += dept.rejected;
      overallStats.totalPending += dept.pending;
    });

    // Get only the 5 main departments (no "Unknown")
    const departments = Object.values(statsByDept);

    console.log('✅ Department statistics calculated:');
    console.log('  Overall:', overallStats);
    console.log(`  Found ${departments.length} departments`);
    console.log('  Departments:');
    departments.forEach(d => {
      console.log(`    - ${d.departmentName}: ${d.totalRequests} requests (${d.approved}✓, ${d.rejected}✗, ${d.pending}⏳)`);
    });

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats,
        departments: departments
      }
    });
  } catch (err) {
    console.error('❌ Department Stats Error:', err.message);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch department statistics',
      error: err.message
    });
  }
});

app.get('/api/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    // Fix #6: Escape userDept/userRole for regex safety in unread-count
    const escapedDept = userDept ? userDept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    const escapedRole = userRole ? userRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

    let query = {};
    if (userRole === 'student') {
      query = { recipient_id: userId, is_read: false };
    } else {
      const orConditions = [];
      if (userDept) {
        orConditions.push({ recipient_department: userDept, is_read: false, sender_role: 'student' });
        orConditions.push({ recipient_department: { $regex: `^${escapedDept}$`, $options: 'i' }, is_read: false, sender_role: 'student' });
      }
      if (userRole) {
        orConditions.push({ recipient_department: userRole, is_read: false, sender_role: 'admin', message_type: 'notification' });
        orConditions.push({ recipient_department: { $regex: `^${escapedRole}$`, $options: 'i' }, is_read: false, sender_role: 'admin', message_type: 'notification' });
      }
      // Also count messages sent directly to this user
      orConditions.push({ recipient_id: userId, is_read: false });

      query = orConditions.length > 0 ? { $or: orConditions, is_read: false } : { is_read: false };
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

    // Only show pending requests that are NOT auto-approved
    const pendingRequests = await DepartmentClearance.find({
      department_name: 'Library',
      status: 'Pending',
      isAutoApproved: false
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ createdAt: -1 });

    console.log(`📚 Library - Fetching pending requests: Found ${pendingRequests.length} records (auto-approved excluded)`);

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

    // Get department-specific approvals
    const departmentApprovals = await DepartmentClearance.find({
      department_name: 'Library',
      status: 'Approved'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    // Get completed clearances (approved by all departments) for record
    const completedClearances = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
      certificateGenerated: true
    })
      .populate('student_id', 'full_name email sap')
      .sort({ completedAt: -1 });

    // Format completed clearances to match DepartmentClearance structure
    const formattedCompletedRecords = completedClearances.map(record => ({
      _id: record._id,
      department_name: 'Library',
      status: 'Approved',
      student_id: record.student_id,
      clearance_request_id: record._id,
      approved_at: record.completedAt,
      remarks: 'Fully cleared by all departments',
      isCompletedClearance: true
    }));

    // Combine and sort by date
    const allApprovedRecords = [...departmentApprovals, ...formattedCompletedRecords]
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));

    console.log(`📚 Library - Fetching approved requests: Found ${departmentApprovals.length} department approvals + ${completedClearances.length} completed clearances`);

    res.status(200).json({
      success: true,
      data: allApprovedRecords || []
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

    // Check if request exists and is NOT auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }

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

    console.log(`✅ Library approved clearance for ${departmentClearance.student_name}`);

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

    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }

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

    console.log(`❌ Library rejected clearance for ${departmentClearance.student_name}`);

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
app.get('/api/fee/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'feedepartment') {
      return res.status(403).json({ success: false, message: '❌ Access denied' });
    }

    // Only show pending requests that are NOT auto-approved
    const pendingRequests = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Pending',
      isAutoApproved: false
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ createdAt: -1 });

    console.log(`💰 Fee Department - Fetching pending requests: Found ${pendingRequests.length} records (auto-approved excluded)`);
    res.status(200).json({ success: true, data: pendingRequests || [] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/fee/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'feedepartment') {
      return res.status(403).json({ success: false, message: '❌ Access denied' });
    }

    // Get department-specific approvals
    const departmentApprovals = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Approved'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    // Get completed clearances (approved by all departments) for record
    const completedClearances = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
      certificateGenerated: true
    })
      .populate('student_id', 'full_name email sap')
      .sort({ completedAt: -1 });

    // Format completed clearances to match DepartmentClearance structure
    const formattedCompletedRecords = completedClearances.map(record => ({
      _id: record._id,
      department_name: 'Fee Department',
      status: 'Approved',
      student_id: record.student_id,
      clearance_request_id: record._id,
      approved_at: record.completedAt,
      remarks: 'Fully cleared by all departments',
      isCompletedClearance: true
    }));

    // Combine and sort by date
    const allApprovedRecords = [...departmentApprovals, ...formattedCompletedRecords]
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));

    res.status(200).json({ success: true, data: allApprovedRecords || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch approved requests' });
  }
});

app.get('/api/fee/rejected-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'feedepartment') {
      return res.status(403).json({ success: false, message: '❌ Access denied' });
    }

    const rejectedRequests = await DepartmentClearance.find({
      department_name: 'Fee Department',
      status: 'Rejected'
    })
      .populate('clearance_request_id')
      .populate('student_id', 'full_name email sap')
      .sort({ approved_at: -1 });

    res.status(200).json({ success: true, data: rejectedRequests || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: '❌ Failed to fetch rejected requests' });
  }
});

app.put('/api/fee/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;

    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) {
      return res.status(404).json({ success: false, message: '❌ Request not found' });
    }

    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }

    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    const approvalMessage = new Message({
      conversation_id: `${departmentClearance.sapid}-FeeApproval-${Date.now()}`,
      sender_id: staffId, sender_name: staffName, sender_role: 'feedepartment',
      sender_sapid: req.user.sap, recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id, recipient_department: 'Fee Department',
      subject: '✅ Fee Clearance Approved',
      message: `Your fee clearance has been approved. ${remarks ? `Comment: ${remarks}` : 'No additional remarks.'}`,
      message_type: 'notification'
    });
    await approvalMessage.save();

    res.status(200).json({ success: true, message: '✅ Request approved and student notified' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to approve request' });
  }
});

app.put('/api/fee/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;
    const staffName = req.user.full_name;

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({ success: false, message: '❌ Rejection remarks are required' });
    }

    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) {
      return res.status(404).json({ success: false, message: '❌ Request not found' });
    }

    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }

    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    const rejectionMessage = new Message({
      conversation_id: `${departmentClearance.sapid}-FeeRejection-${Date.now()}`,
      sender_id: staffId, sender_name: staffName, sender_role: 'feedepartment',
      sender_sapid: req.user.sap, recipient_sapid: departmentClearance.sapid,
      recipient_id: departmentClearance.student_id, recipient_department: 'Fee Department',
      subject: '❌ Fee Clearance Rejected',
      message: `Your fee clearance has been rejected. Reason: ${remarks}`,
      message_type: 'notification'
    });
    await rejectionMessage.save();

    res.status(200).json({ success: true, message: '✅ Request rejected and student notified' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to reject request' });
  }
});

// -------------------
// TRANSPORT DEPARTMENT ENDPOINTS
// -------------------
app.get('/api/transport/pending-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'transport') return res.status(403).json({ success: false, message: '❌ Access denied' });
    // Only show pending requests that are NOT auto-approved
    const requests = await DepartmentClearance.find({ department_name: 'Transport', status: 'Pending', isAutoApproved: false })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`🚚 Transport - Fetching pending requests: Found ${requests.length} records (auto-approved excluded)`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Transport Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/transport/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'transport') return res.status(403).json({ success: false, message: '❌ Access denied' });
    
    // Get department-specific approvals
    const departmentApprovals = await DepartmentClearance.find({ department_name: 'Transport', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    
    // Get completed clearances (approved by all departments) for record
    const completedClearances = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
      certificateGenerated: true
    })
      .populate('student_id', 'full_name email sap')
      .sort({ completedAt: -1 });

    // Format completed clearances to match DepartmentClearance structure
    const formattedCompletedRecords = completedClearances.map(record => ({
      _id: record._id,
      department_name: 'Transport',
      status: 'Approved',
      student_id: record.student_id,
      clearance_request_id: record._id,
      approved_at: record.completedAt,
      remarks: 'Fully cleared by all departments',
      isCompletedClearance: true
    }));

    // Combine and sort by date
    const allApprovedRecords = [...departmentApprovals, ...formattedCompletedRecords]
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
    
    res.status(200).json({ success: true, data: allApprovedRecords || [] });
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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
    // Only show pending requests that are NOT auto-approved
    const requests = await DepartmentClearance.find({ department_name: 'Student Service', status: 'Pending', isAutoApproved: false })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`🎓 Student Service - Found ${requests.length} pending requests (auto-approved excluded)`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Student Service Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/studentservice/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'studentservice') return res.status(403).json({ success: false, message: '❌ Access denied' });
    
    // Get department-specific approvals
    const departmentApprovals = await DepartmentClearance.find({ department_name: 'Student Service', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    
    // Get completed clearances (approved by all departments) for record
    const completedClearances = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
      certificateGenerated: true
    })
      .populate('student_id', 'full_name email sap')
      .sort({ completedAt: -1 });

    // Format completed clearances to match DepartmentClearance structure
    const formattedCompletedRecords = completedClearances.map(record => ({
      _id: record._id,
      department_name: 'Student Service',
      status: 'Approved',
      student_id: record.student_id,
      clearance_request_id: record._id,
      approved_at: record.completedAt,
      remarks: 'Fully cleared by all departments',
      isCompletedClearance: true
    }));

    // Combine and sort by date
    const allApprovedRecords = [...departmentApprovals, ...formattedCompletedRecords]
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
    
    res.status(200).json({ success: true, data: allApprovedRecords || [] });
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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
    // Only show pending requests that are NOT auto-approved
    const requests = await DepartmentClearance.find({ department_name: 'Coordination', status: 'Pending', isAutoApproved: false })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ createdAt: -1 });
    console.log(`👥 Coordination - Found ${requests.length} pending requests (auto-approved excluded)`);
    res.status(200).json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Coordination Error:', error);
    res.status(500).json({ success: false, message: '❌ Failed to fetch pending requests' });
  }
});

app.get('/api/coordination/approved-requests', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'coordination') return res.status(403).json({ success: false, message: '❌ Access denied' });
    
    // Get department-specific approvals
    const departmentApprovals = await DepartmentClearance.find({ department_name: 'Coordination', status: 'Approved' })
      .populate('clearance_request_id').populate('student_id', 'full_name email sap').sort({ approved_at: -1 });
    
    // Get completed clearances (approved by all departments) for record
    const completedClearances = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
      certificateGenerated: true
    })
      .populate('student_id', 'full_name email sap')
      .sort({ completedAt: -1 });

    // Format completed clearances to match DepartmentClearance structure
    const formattedCompletedRecords = completedClearances.map(record => ({
      _id: record._id,
      department_name: 'Coordination',
      status: 'Approved',
      student_id: record.student_id,
      clearance_request_id: record._id,
      approved_at: record.completedAt,
      remarks: 'Fully cleared by all departments',
      isCompletedClearance: true
    }));

    // Combine and sort by date
    const allApprovedRecords = [...departmentApprovals, ...formattedCompletedRecords]
      .sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
    
    res.status(200).json({ success: true, data: allApprovedRecords || [] });
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: remarks || '' }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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
    
    // Check if request is auto-approved
    const requestCheck = await DepartmentClearance.findById(id);
    if (!requestCheck) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    if (requestCheck.isAutoApproved) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Auto-approved requests cannot be modified. These were automatically approved as no issues were found.'
      });
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Rejected', approved_by: staffName, approved_at: new Date(), remarks: remarks.trim() }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
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

// ============================================
// CLEARANCE WORKFLOW ROUTES (Sequential 5-Phase)
// ============================================
app.use('/api/clearance', clearanceWorkflowRoutes);

// ============================================
// APPROVED CLEARANCES - UNIFIED API
// ============================================
// GET /api/approved-clearances/:departmentName
// GET /api/approved-clearances/:departmentName/stats
// GET /api/approved-clearances/:departmentName/export
approvedClearancesAPI(app, verifyToken);

// ============================================
// CERTIFICATE EMAIL ENDPOINTS
// ============================================
// POST /api/resend-certificate-email - Student can resend their certificate email
app.post('/api/resend-certificate-email', verifyToken, async (req, res) => {
  try {
    const { validationId } = req.body;
    const userId = req.user?.id;

    console.log('\n📧 RESEND CERTIFICATE EMAIL REQUEST');
    console.log(`   User ID: ${userId}`);
    console.log(`   Validation ID: ${validationId}`);

    if (!userId || !validationId) {
      return res.status(400).json({
        success: false,
        message: "User authentication or validation ID missing"
      });
    }

    // Get the clearance record
    const clearanceRecord = await ComprehensiveClearanceValidation.findOne({
      _id: validationId,
      student_id: userId,
      overallStatus: 'Completed',
      certificateGenerated: true
    });

    if (!clearanceRecord) {
      return res.status(404).json({
        success: false,
        message: "Clearance certificate not found or not authorized"
      });
    }

    // Get student info
    const student = await User.findById(userId);
    if (!student || !student.email) {
      return res.status(400).json({
        success: false,
        message: "Student email not found"
      });
    }

    console.log(`\n📨 Resending certificate to: ${student.email}`);

    // Send the email
    const emailResult = await sendClearanceCertificateEmail({
      studentName: student.full_name || student.name || clearanceRecord.student_name,
      studentEmail: student.email,
      sapId: clearanceRecord.sapid,
      department: student.department || clearanceRecord.departmentStatuses?.[0]?.name || "N/A",
      program: clearanceRecord.program || "N/A",
      qrCode: clearanceRecord.qr_code,
      approvedBy: "Clearance System",
      approvedAt: clearanceRecord.completedAt,
      departments: clearanceRecord.departmentStatuses || []
    });

    if (emailResult.success) {
      console.log(`✅ Certificate email resent to ${student.email}`);
      return res.json({
        success: true,
        message: `Certificate email has been resent to ${student.email}. Please check your inbox and spam folder.`,
        messageId: emailResult.messageId
      });
    } else {
      console.error(`❌ Failed to resend email: ${emailResult.error || emailResult.reason}`);
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${emailResult.error || emailResult.reason}`
      });
    }

  } catch (err) {
    console.error('❌ Resend email error:', err.message);
    res.status(500).json({
      success: false,
      message: "Failed to resend certificate email: " + err.message
    });
  }
});

// GET /api/certificate-email-test - Test email endpoint
app.get('/api/certificate-email-test', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Get student
    const student = await User.findById(userId);
    if (!student || !student.email) {
      return res.status(400).json({
        success: false,
        message: "Student email not configured",
        studentRecord: student ? {
          name: student.full_name,
          email: student.email || "NOT SET",
          sap: student.sap
        } : null
      });
    }

    console.log(`\n🧪 Sending test email to ${student.email}`);

    // Send test email using sendClearanceCertificateEmail function
    const emailResult = await sendClearanceCertificateEmail({
      studentName: student.full_name || student.name || "Student",
      studentEmail: student.email,
      sapId: student.sap || "TEST",
      department: student.department || "N/A",
      program: "Test Email",
      qrCode: "TEST_EMAIL_VERIFICATION",
      approvedBy: "Email Test System",
      approvedAt: new Date(),
      departments: [
        { name: "Email Configuration Test", status: "Testing" }
      ]
    });

    if (emailResult.success) {
      console.log(`✅ Test email sent to ${student.email}`);
      return res.json({
        success: true,
        message: `Test email sent to ${student.email}. Please check your inbox and spam folder.`,
        studentRecord: {
          name: student.full_name,
          email: student.email,
          sap: student.sap,
          department: student.department
        },
        messageId: emailResult.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Test email failed: ${emailResult.error || emailResult.reason}`
      });
    }

  } catch (err) {
    console.error('❌ Test email error:', err.message);
    res.status(500).json({
      success: false,
      message: "Test email failed: " + err.message,
      error: err.message
    });
  }
});

// ============================================
// AUTO-CLEARANCE, ISSUE & RETURN ROUTES
// ============================================
app.use('/api/auto-clearance', autoClearanceRoutes);
app.use('/api/department-issues', issueRoutes);
app.use('/api/department-returns', returnRoutes);

// ============================================
// COMPREHENSIVE APPROVAL/REJECTION ROUTES
// ============================================
app.use('/api', comprehensiveApprovalRoutes);

// ============================================
// ADMIN PANEL ROUTES
// ============================================
app.use('/api/admin', adminRoutes);

// ============================================
// HOD ROUTES
// ============================================
app.use('/api/hod', hodRoutes);

// ============================================
// USER PROFILE ROUTES (with /api/users/ prefix)
// ============================================

// ✅ UPDATE PROFILE - Enhanced version with more fields
app.put('/api/users/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, phone, address, city, department, designation } = req.body;

    console.log('📝 Enhanced Profile Update Request');
    console.log('  User ID from token:', userId);
    console.log('  Req.user object:', req.user);
    console.log('  Request body:', { full_name, email, phone, address, city, department, designation });

    // Validation
    if (!full_name || !email) {
      console.log('❌ Validation failed - missing full_name or email');
      console.log('   full_name:', full_name, 'truthy:', !!full_name);
      console.log('   email:', email, 'truthy:', !!email);
      return res.status(400).json({
        success: false,
        message: 'Full name and email are required'
      });
    }

    console.log('✅ Validation passed');

    // Check if email is already in use by another user
    console.log('🔍 Checking if email exists for another user...');
    const existingUser = await User.findOne({ email: email.trim(), _id: { $ne: userId } });
    if (existingUser) {
      console.log('❌ Email already in use:', email);
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }
    console.log('✅ Email check passed');

    // Build update object with only provided fields
    const updateData = {
      full_name: full_name.trim(),
      email: email.trim()
    };

    // Add optional fields if provided
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (department) updateData.department = department.trim();
    if (designation) updateData.designation = designation.trim();

    console.log('📋 Update data:', updateData);

    // Update user
    console.log('🔄 Calling User.findByIdAndUpdate with userId:', userId);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('❌ User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated successfully for:', email);
    console.log('   Updated user:', updatedUser);

    // Prepare response
    const userResponse = {
      id: updatedUser._id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role?.toLowerCase(),
      sap: updatedUser.sap,
      department: updatedUser.department,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      designation: updatedUser.designation
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });
  } catch (err) {
    console.error('❌ Update Profile Error:', err.message);
    console.error('   Stack:', err.stack);
    console.error('   Name:', err.name);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile: ' + err.message
    });
  }
});

// ✅ CHANGE PASSWORD - Dedicated endpoint
app.post('/api/users/change-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    console.log('🔐 Change Password Request');
    console.log('  User ID:', userId);
    console.log('  Current password provided:', !!current_password);
    console.log('  New password provided:', !!new_password);

    // Validation
    if (!current_password || !new_password) {
      console.log('❌ Validation failed - missing passwords');
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 6) {
      console.log('❌ New password too short');
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password hash
    console.log('🔍 Finding user by ID...');
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    console.log('✅ User found:', user.email);

    // Verify current password
    console.log('🔒 Verifying current password...');
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      console.log('❌ Invalid current password for user:', userId);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    console.log('✅ Current password verified');

    // Check if new password is same as current
    console.log('🔄 Checking if new password is different...');
    const isSamePassword = await bcrypt.compare(new_password, user.password);
    if (isSamePassword) {
      console.log('❌ New password same as current');
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    console.log('✅ New password is different');

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    console.log('💾 Updating password in database...');
    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    console.log('✅ Password changed successfully for user:', userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('❌ Change Password Error:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to change password: ' + err.message
    });
  }
});

// ========== GENERATE CERTIFICATE PDF ==========
app.post('/api/certificates/:certId/generate-pdf', verifyToken, async (req, res) => {
  try {
    const { certId } = req.params;
    const studentId = req.user.id;

    console.log(`\n📄 GENERATING CERTIFICATE PDF`);
    console.log(`   Certificate ID: ${certId}`);
    console.log(`   Student ID: ${studentId}`);

    // Find the certificate
    const certificate = await ComprehensiveClearanceValidation.findOne({
      _id: certId,
      student_id: studentId,
      certificateGenerated: true,
      overallStatus: 'Completed'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or not authorized'
      });
    }

    // Get approved departments only
    const approvedDepartments = certificate.departmentStatuses
      .filter(d => d.status === 'Approved')
      .map(d => d.name);

    console.log(`   ✅ Found certificate for ${certificate.student_name}`);
    console.log(`   Approved departments: ${approvedDepartments.join(', ')}`);

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.student_name,
      sapId: certificate.sapid,
      certificateId: certId,
      departments: approvedDepartments,
      date: certificate.completedAt,
      qrCodeData: certificate.qr_code || certId
    });

    console.log(`   ✅ PDF generated successfully: ${pdfBuffer.length} bytes`);

    // Send PDF to frontend
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Clearance_Certificate_${certificate.sapid}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('❌ PDF Generation Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF: ' + err.message
    });
  }
});

// ========== SEND CERTIFICATE EMAIL ==========
app.post('/api/certificates/:certId/send-email', verifyToken, async (req, res) => {
  try {
    const { certId } = req.params;
    const studentId = req.user.id;

    console.log(`\n📧 SENDING CERTIFICATE EMAIL`);
    console.log(`   Certificate ID: ${certId}`);

    // Find certificate
    const certificate = await ComprehensiveClearanceValidation.findOne({
      _id: certId,
      student_id: studentId,
      certificateGenerated: true,
      overallStatus: 'Completed'
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Get student info
    const student = await User.findById(studentId);
    if (!student || !student.email) {
      return res.status(400).json({
        success: false,
        message: 'Student email not found'
      });
    }

    console.log(`   📧 Student email: ${student.email}`);

    // Generate PDF
    const approvedDepartments = certificate.departmentStatuses
      .filter(d => d.status === 'Approved')
      .map(d => d.name);

    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.student_name,
      sapId: certificate.sapid,
      certificateId: certId,
      departments: approvedDepartments,
      date: certificate.completedAt,
      qrCodeData: certificate.qr_code || certId
    });

    console.log(`   ✅ PDF generated for email: ${pdfBuffer.length} bytes`);

    // Send certificate email
    const emailResult = await sendCertificateEmail({
      studentEmail: student.email,
      studentName: student.full_name || student.name,
      sapId: certificate.sapid,
      pdfBuffer: pdfBuffer,
      certificateId: certId,
      departments: approvedDepartments,
      verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certId}`
    });

    if (emailResult.success) {
      console.log(`   ✅ Certificate email sent successfully`);
      res.json({
        success: true,
        message: 'Certificate email sent successfully',
        messageId: emailResult.messageId
      });
    } else {
      console.error(`   ❌ Email failed: ${emailResult.reason}`);
      res.status(400).json({
        success: false,
        reason: emailResult.reason,
        message: 'Failed to send certificate email'
      });
    }

  } catch (err) {
    console.error('❌ Email Sending Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + err.message
    });
  }
});

// ========== VERIFY CERTIFICATE (Public) ==========
app.get('/api/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    console.log(`\n🔍 VERIFYING CERTIFICATE: ${certificateId}`);

    // Find certificate
    const certificate = await ComprehensiveClearanceValidation.findById(certificateId);

    if (!certificate) {
      console.log(`   ❌ Certificate not found`);
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.overallStatus !== 'Completed') {
      console.log(`   ❌ Certificate not valid (status: ${certificate.overallStatus})`);
      return res.status(400).json({
        success: false,
        message: 'Certificate is not valid'
      });
    }

    const approvedDepartments = certificate.departmentStatuses
      .filter(d => d.status === 'Approved')
      .map(d => d.name);

    console.log(`   ✅ Certificate verified for ${certificate.student_name} (${certificate.sapid})`);
    console.log(`   Approved by: ${approvedDepartments.join(', ')}`);

    res.json({
      success: true,
      verified: true,
      certificate: {
        student_name: certificate.student_name,
        sapid: certificate.sapid,
        departments: approvedDepartments,
        completed_at: certificate.completedAt,
        certificate_id: certificateId,
        qr_code: certificate.qr_code
      }
    });

  } catch (err) {
    console.error('❌ Verification Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate: ' + err.message
    });
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
