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
const adminRoutes = require("./routes/adminRoutes");
const hodRoutes = require("./routes/hodRoutes");
const clearanceWorkflowRoutes = require("./routes/clearanceWorkflowRoutes");
const issueRoutes = require("./routes/issueRoutes");
const returnRoutes = require("./routes/returnRoutes");
const autoClearanceRoutes = require("./routes/autoClearanceRoutes");

// Import Models
const User = require("./models/User");
const ClearanceRequest = require("./models/ClearanceRequest");
const DepartmentClearance = require("./models/DepartmentClearance");
const Message = require("./models/Message");
const AdminMessage = require("./models/AdminMessage");
const DepartmentStats = require("./models/DepartmentStats");
const DocumentQRCode = require("./models/DocumentQRCode");
const PendingUser = require("./models/PendingUser");
const { sendClearanceCertificateEmail, sendOtpEmail, sendPasswordResetEmail } = require("./utils/emailService");
const DepartmentIssue = require("./models/DepartmentIssue");
const ComprehensiveClearanceValidation = require("./models/ComprehensiveClearanceValidation");
const { validateStudentClearanceAllDepartments, canStudentSubmitClearance } = require("./utils/clearanceValidator");

// --------------------
// Express app
// --------------------
const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Store CORS options for preflight handlers
const corsOptionsForPreflight = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'],
  credentials: false
};

// Global OPTIONS handler
app.options('*', cors(corsOptionsForPreflight));

// Explicit OPTIONS handlers for main endpoints
app.options('/api/signup', cors(corsOptionsForPreflight));
app.options('/api/login', cors(corsOptionsForPreflight));
app.options('/api/clearance-requests', cors(corsOptionsForPreflight));
app.options('/api/clearance/department', cors(corsOptionsForPreflight));
app.options('/api/department-issues', cors(corsOptionsForPreflight));
app.options('/api/department-returns', cors(corsOptionsForPreflight));
app.options('/api/health', cors(corsOptionsForPreflight));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Health Check Route
// --------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// --------------------
// Department clearance requests (Coordination, Library, etc.)
// Returns pending, approved, rejected split — used by department dashboards
// --------------------
app.get('/api/clearance/department', verifyToken, async (req, res) => {
  try {
    const ccvDeptName = req.user.department;
    console.log('\n🔍 Department staff fetching requests for:', ccvDeptName);

    const allRecords = await ComprehensiveClearanceValidation.find().sort({ createdAt: -1 });

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
        pendingItems: deptStatus ? (deptStatus.pendingItems || []) : [],
        submittedAt: record.submittedAt || record.createdAt,
        completedAt: record.completedAt,
        overallStatus: record.overallStatus,
        isAutoApproved: true,
      };
    };

    // APPROVED: fully completed clearances
    const approvedRecords = allRecords
      .filter(r => r.overallStatus === 'Completed')
      .map(r => transformRecord(r, 'Approved'));

    // REJECTED: this department specifically rejected the student
    const rejectedRecords = allRecords
      .filter(r => {
        const deptStatus = r.departmentStatuses.find(d => d.name === ccvDeptName);
        return deptStatus && deptStatus.status === 'Rejected';
      })
      .map(r => transformRecord(r, 'Rejected'));

    // PENDING: in-progress requests for this department
    const pendingRecords = allRecords
      .filter(r => {
        if (r.overallStatus === 'Completed') return false;
        const deptStatus = r.departmentStatuses.find(d => d.name === ccvDeptName);
        return deptStatus && (deptStatus.status === 'Pending' || deptStatus.status === 'Not Processed');
      })
      .map(r => transformRecord(r, 'Pending'));

    console.log(`  ✅ Approved: ${approvedRecords.length}, ❌ Rejected: ${rejectedRecords.length}, ⏳ Pending: ${pendingRecords.length}`);

    res.json({
      success: true,
      pending: pendingRecords,
      approved: approvedRecords,
      rejected: rejectedRecords,
    });
  } catch (err) {
    console.error('❌ Error fetching department requests:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests: ' + err.message });
  }
});

// --------------------
// Email Diagnostic (Admin only — no auth to allow early testing)
// --------------------
app.get('/api/test-email', async (req, res) => {
  const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  if (!emailConfigured) {
    return res.status(500).json({
      success: false,
      message: 'Email not configured: EMAIL_USER or EMAIL_PASS missing from Railway environment variables',
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'MISSING'
    });
  }
  try {
    const result = await sendOtpEmail({
      userName: 'Test User',
      userEmail: process.env.EMAIL_USER, // send to self
      otp: '123456',
      expiresInMinutes: 5
    });
    res.json({
      success: result.success,
      message: result.success ? 'Test OTP email sent successfully!' : 'Email send failed',
      detail: result.error || result.reason || result.messageId,
      EMAIL_USER: process.env.EMAIL_USER
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Email test threw error', error: err.message });
  }
});
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/role_based_system';

console.log('🔄 Attempting to connect to MongoDB...');
console.log(`📍 Connection String: ${MONGO_URI}`);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
})
  .then(async () => {
    console.log('\n✅ MongoDB connected successfully!');
    console.log(`📊 Database: role_based_system`);
    
    // Backfill missing program/semester in DepartmentClearance records
    try {
      console.log('\n🔄 Backfilling missing program/semester in DepartmentClearance records...');
      const missingRecords = await DepartmentClearance.find({
        $or: [
          { program: { $in: [null, '', 'N/A', undefined] } },
          { semester: { $in: [null, '', 'N/A', undefined] } }
        ]
      }).select('sapid program semester');
      
      console.log(`   Found ${missingRecords.length} records with missing program/semester`);
      
      let updatedCount = 0;
      for (const record of missingRecords) {
        const comprehensiveRecord = await ComprehensiveClearanceValidation.findOne({
          sapid: record.sapid
        }).select('program semester').lean();
        
        if (comprehensiveRecord) {
          await DepartmentClearance.findByIdAndUpdate(record._id, {
            program: comprehensiveRecord.program || 'N/A',
            semester: comprehensiveRecord.semester || 'N/A'
          });
          updatedCount++;
        }
      }
      
      console.log(`✅ Updated ${updatedCount} DepartmentClearance records with missing data\n`);
    } catch (backfillErr) {
      console.error('⚠️  Backfill error (non-fatal):', backfillErr.message);
    }
    
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
// OPTIONS HANDLERS (CORS Preflight)
// --------------------
// Global OPTIONS handler for all requests
app.options('*', cors());

// Specific OPTIONS handlers
app.options('/api/signup', cors());
app.options('/api/auth/verify-otp', cors());
app.options('/api/auth/resend-otp', cors());
app.options('/api/login', cors());
app.options('/api/clearance-requests', cors());
app.options('/api/health', cors());

// --------------------
// AUTHENTICATION ROUTES
// --------------------
// Signup (Step 1: Validate + Send OTP)
app.post('/api/signup', async (req, res) => {
  try {
    const { full_name, email, password, role, sap, department } = req.body;

    console.log('📝 Signup Request:', { full_name, email, role, has_sap: !!sap, has_department: !!department });

    // VALIDATION

    // 1. Check all required fields
    if (!full_name || !email || !password || !sap || !department) {
      return res.status(400).json({ success: false, message: 'Full name, email, password, SAP ID, and department are required' });
    }

    // 2. Validate Full Name
    if (!/^[A-Za-z ]{3,}$/.test(full_name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must be at least 3 letters and contain only alphabets' });
    }

    // 3. Validate SAP ID
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

    // 6. Validate Password
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

    // Upsert into PendingUser
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
    }).then(result => {
      if (result.success) {
        console.log(`✅ OTP email successfully sent to ${normalizedEmail}`);
      } else {
        console.warn(`⚠️ OTP email failed: ${result.reason || result.error}`);
      }
    }).catch(err => {
      console.error(`❌ OTP email error for ${normalizedEmail}:`, err.message);
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

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
    if (!pendingUser) {
      return res.status(404).json({ success: false, message: 'No pending registration found' });
    }

    // Check OTP match
    if (pendingUser.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check OTP expiry
    if (new Date() > pendingUser.otpExpiry) {
      await PendingUser.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please signup again' });
    }

    // Check if user was already created (shouldn't happen but just in case)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await PendingUser.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'User already registered' });
    }

    // Create actual user from pending
    const newUser = new User({
      full_name: pendingUser.full_name,
      email: normalizedEmail,
      password: pendingUser.password,
      sap: pendingUser.sap,
      department: pendingUser.department,
      role: 'student'
    });

    await newUser.save();

    // Delete pending user record
    await PendingUser.deleteOne({ email: normalizedEmail });

    console.log(`✅ User ${normalizedEmail} successfully verified and created`);

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, full_name: newUser.full_name, role: newUser.role, sap: newUser.sap, department: newUser.department },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const userResponse = {
      id: newUser._id,
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      sap: newUser.sap,
      department: newUser.department
    };

    res.status(200).json({
      success: true,
      message: 'Email verified and account created successfully',
      token,
      user: userResponse
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

    // Send email (asynchronously)
    sendOtpEmail({
      userName: pendingUser.full_name,
      userEmail: normalizedEmail,
      otp,
      expiresInMinutes: 5
    }).then(result => {
      if (result.success) {
        console.log(`✅ Resend OTP email successfully sent to ${normalizedEmail}`);
      } else {
        console.warn(`⚠️ Resend OTP email failed: ${result.reason || result.error}`);
      }
    }).catch(err => {
      console.error(`❌ Resend OTP email error:`, err.message);
    });

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
    console.error('❌ Forgot Password Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to process request: ' + err.message
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

    // Clean up the code after successful verification
    resetCodes.delete(normalizedEmail);

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
    console.log('\n📝 CLEARANCE REQUEST RECEIVED');
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    const student_name = req.body?.student_name;
    const sapid = req.body?.sapid;
    const father_name = req.body?.father_name;
    const program = req.body?.program;
    const semester = req.body?.semester;
    const degree_status = req.body?.degree_status;

    console.log('\n  Extracted values:');
    console.log('    student_name:', student_name, '(type:', typeof student_name, ')');
    console.log('    sapid:', sapid, '(type:', typeof sapid, ')');
    console.log('    father_name:', father_name, '(type:', typeof father_name, ')');
    console.log('    program:', program, '(type:', typeof program, ')');
    console.log('    semester:', semester, '(type:', typeof semester, ')');
    console.log('    degree_status:', degree_status, '(type:', typeof degree_status, ')');

    // ==================== COMPREHENSIVE VALIDATION ====================
    // STEP 1: Check all fields exist and are not undefined/null
    const requiredFields = { student_name, sapid, father_name, program, semester, degree_status };
    const missingFields = [];
    
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null) {
        missingFields.push(`${fieldName} (received: ${value})`);
      }
    }
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `❌ Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // STEP 2: Now safe to convert to string and trim
    let student_name_str, sapid_str, father_name_str, program_str, semester_str, degree_status_str;
    
    try {
      student_name_str = String(student_name).trim();
      sapid_str = String(sapid).trim();
      father_name_str = String(father_name).trim();
      program_str = String(program).trim();
      semester_str = String(semester).trim();
      degree_status_str = String(degree_status).trim();
    } catch (conversionErr) {
      console.error('❌ Field conversion error:', conversionErr.message);
      return res.status(400).json({ 
        success: false, 
        message: '❌ Error processing form fields: ' + conversionErr.message
      });
    }

    console.log('\n  Converted string values:');
    console.log('    student_name:', student_name_str);
    console.log('    sapid:', sapid_str);
    console.log('    father_name:', father_name_str);
    console.log('    program:', program_str);
    console.log('    semester:', semester_str);
    console.log('    degree_status:', degree_status_str);

    // Validate all required fields present
    if (!student_name_str) return res.status(400).json({ success: false, message: '❌ Student name cannot be empty' });
    if (!sapid_str) return res.status(400).json({ success: false, message: '❌ SAP ID cannot be empty' });
    if (!father_name_str) return res.status(400).json({ success: false, message: '❌ Father name cannot be empty' });
    if (!program_str) return res.status(400).json({ success: false, message: '❌ Program cannot be empty' });
    if (!semester_str) return res.status(400).json({ success: false, message: '❌ Semester cannot be empty' });
    if (!degree_status_str) return res.status(400).json({ success: false, message: '❌ Degree status cannot be empty' });

    const semesterNum = parseInt(semester_str);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 12) {
      return res.status(400).json({ success: false, message: '❌ Semester must be a number between 1 and 12' });
    }

    // Check if SAPID exists in DepartmentIssue
    const issueRecord = await DepartmentIssue.findOne({ studentId: sapid_str });
    if (!issueRecord) {
      return res.status(404).json({
        success: false,
        message: 'The Record Is Not Found Against This sapid',
        errorCode: 'SAPID_NOT_FOUND'
      });
    }

    // Check submission eligibility via ComprehensiveClearanceValidation
    const submissionCheck = await canStudentSubmitClearance(sapid_str, ComprehensiveClearanceValidation);
    if (!submissionCheck.canSubmit) {
      return res.status(409).json({
        success: false,
        message: submissionCheck.reason,
        existingRecord: submissionCheck.existingRecord
      });
    }

    // Run full comprehensive validation
    const studentInfo = {
      student_name: student_name_str,
      father_name: father_name_str,
      program: program_str,
      semester: semesterNum.toString(),
      degree_status: degree_status_str
    };
    const validationResult = await validateStudentClearanceAllDepartments(sapid_str, studentInfo);

    // Save ComprehensiveClearanceValidation record
    const comprehensiveRecord = new ComprehensiveClearanceValidation({
      student_id: req.user.id,
      ...validationResult
    });
    const savedRecord = await comprehensiveRecord.save();
    console.log(`✅ Validation saved: ${savedRecord._id}, status: ${validationResult.overallStatus}`);

    // Create DepartmentClearance records (for department dashboards)
    try {
      const deptRecords = validationResult.departmentStatuses.map(dept => ({
        clearance_request_id: savedRecord._id,
        student_id: req.user.id,
        sapid: sapid_str,
        student_name: student_name_str,
        father_name: father_name_str,
        program: program_str,
        semester: semester_str,
        degree_status: degree_status_str,
        registration_no: issueRecord.registration_no || '',
        department_name: dept.name,
        status: dept.status === 'Approved' ? 'Approved' : dept.status === 'Rejected' ? 'Rejected' : 'Pending',
        remarks: dept.status === 'Rejected'
          ? (dept.reason || 'Auto-rejected: pending items not cleared')
          : validationResult.certificateGenerated
            ? '✅ Certificate generated - All departments cleared'
            : 'Auto-validated by comprehensive clearance system',
        submittedAt: new Date(),
        approvedAt: dept.status === 'Approved' ? new Date() : null
      }));
      await DepartmentClearance.insertMany(deptRecords);
      console.log(`✅ Created ${deptRecords.length} DepartmentClearance records`);
    } catch (deptErr) {
      console.error('❌ Error creating DepartmentClearance records:', deptErr.message);
    }

    // Send notification
    const notifMsg = validationResult.overallStatus === 'Completed'
      ? 'Congratulations! Your clearance has been APPROVED by all departments.'
      : `Your clearance was rejected. Reasons: ${validationResult.departmentStatuses.filter(d => d.status === 'Rejected').map(d => `${d.name}: ${d.reason}`).join('; ')}`;
    new Message({
      conversation_id: `${sapid_str}-clearance-${Date.now()}`,
      sender_id: new mongoose.Types.ObjectId(),
      sender_name: 'Clearance System',
      sender_role: 'system',
      sender_sapid: 'SYSTEM',
      recipient_sapid: sapid_str,
      recipient_id: req.user.id,
      recipient_department: 'System',
      subject: validationResult.overallStatus === 'Completed' ? '✅ CLEARANCE APPROVED' : '⚠️ CLEARANCE REJECTED',
      message: notifMsg,
      message_type: 'notification'
    }).save().catch(e => console.error('Notification save error:', e));

    // Send certificate email when all departments approve (non-blocking)
    if (validationResult.overallStatus === 'Completed') {
      try {
        const studentUser = await User.findById(req.user.id);
        if (studentUser && studentUser.email) {
          const departments = validationResult.departmentStatuses.map(d => ({
            name: d.name,
            status: d.status
          }));
          sendClearanceCertificateEmail({
            studentName: student_name_str,
            studentEmail: studentUser.email,
            sapId: sapid_str,
            department: studentUser.department || '',
            program: program_str,
            qrCode: savedRecord.qr_code || '',
            approvedBy: 'All Departments',
            approvedAt: new Date(),
            departments,
          }).then(emailResult => {
            if (emailResult.success) {
              console.log(`✅ Certificate email sent to ${studentUser.email}`);
            } else {
              console.warn(`⚠️ Certificate email failed: ${emailResult.reason || emailResult.error}`);
            }
          }).catch(err => console.error('Certificate email error:', err.message));
        } else {
          console.warn('⚠️ Could not find student email for certificate notification');
        }
      } catch (emailLookupErr) {
        console.error('Certificate email lookup error:', emailLookupErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: validationResult.overallStatus === 'Completed'
        ? '✅ Clearance APPROVED - All departments cleared!'
        : '❌ Clearance REJECTED - Please fix the issues and resubmit',
      validationId: savedRecord._id,
      overallStatus: validationResult.overallStatus,
      certificateGenerated: validationResult.certificateGenerated,
      departmentStatuses: validationResult.departmentStatuses.map(d => ({ name: d.name, status: d.status, reason: d.reason })),
      approvedDepartments: validationResult.approvedDepartments,
      rejectedDepartments: validationResult.rejectedDepartments
    });
  } catch (err) {
    console.error('❌ Clearance Request Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process clearance request: ' + err.message });
  }
});

// --------------------
// Get Clearance Certificate Data (Student)
// --------------------
app.get('/api/clearance-certificate', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentSap = req.user.sap;

    // Find a completed ComprehensiveClearanceValidation record
    let validationRecord = await ComprehensiveClearanceValidation.findOne({
      student_id: studentId,
      overallStatus: 'Completed'
    }).sort({ submittedAt: -1 });

    // Sapid fallback
    if (!validationRecord && studentSap) {
      validationRecord = await ComprehensiveClearanceValidation.findOne({
        sapid: studentSap.toString().trim(),
        overallStatus: 'Completed'
      }).sort({ submittedAt: -1 });
    }

    if (!validationRecord) {
      return res.status(400).json({
        success: false,
        message: 'No approved clearance found. All departments must clear you first.'
      });
    }

    const student = await User.findById(studentId);

    res.json({
      success: true,
      certificate: {
        student_name: validationRecord.student_name || student?.full_name,
        sapid: validationRecord.sapid || student?.sap,
        father_name: validationRecord.father_name,
        program: validationRecord.program,
        semester: validationRecord.semester,
        degree_status: validationRecord.degree_status,
        qr_code: validationRecord.qr_code,
        submitted_at: validationRecord.submittedAt,
        departments: (validationRecord.departmentStatuses || []).map(d => ({
          name: d.name,
          status: d.status,
          approved_at: d.validatedAt
        }))
      }
    });
  } catch (err) {
    console.error('Certificate Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate data' });
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

    // Try student_id first, fall back to sapid
    let validationRecord = await ComprehensiveClearanceValidation.findOne({ student_id: studentId }).sort({ submittedAt: -1 });
    if (!validationRecord && studentSap) {
      console.log('⚠️ Not found by student_id, trying sapid fallback:', studentSap);
      validationRecord = await ComprehensiveClearanceValidation.findOne({ sapid: studentSap.toString().trim() }).sort({ submittedAt: -1 });
      if (validationRecord) {
        await ComprehensiveClearanceValidation.findByIdAndUpdate(validationRecord._id, { student_id: studentId });
      }
    }

    if (!validationRecord) {
      return res.json({
        success: true,
        data: null,
        summary: { total: 5, cleared: 0, rejected: 0, pending: 0, notStarted: 5, progressPercentage: 0 },
        departmentStatuses: [],
        message: 'No clearance request submitted yet'
      });
    }

    const mappedDepartmentStatuses = validationRecord.departmentStatuses.map(d => ({
      name: d.name, status: d.status, reason: d.reason, pendingItems: d.pendingItems || [], validatedAt: d.validatedAt
    }));
    const clearedCount = mappedDepartmentStatuses.filter(d => d.status === 'Approved').length;
    const rejectedCount = mappedDepartmentStatuses.filter(d => d.status === 'Rejected').length;

    res.json({
      success: true,
      data: validationRecord,
      departmentStatuses: mappedDepartmentStatuses,
      summary: {
        total: 5,
        cleared: clearedCount,
        rejected: rejectedCount,
        pending: 0,
        notStarted: 0,
        progressPercentage: Math.round((clearedCount / 5) * 100)
      },
      overallStatus: validationRecord.overallStatus,
      certificateGenerated: validationRecord.certificateGenerated,
      qrCode: validationRecord.qr_code || null
    });
  } catch (err) {
    console.error('❌ Clearance Status Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch clearance status: ' + err.message });
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
        
        // Update all records to mark them as ready for HOD and update remarks to show certificate generated
        await DepartmentClearance.updateMany(
          { clearance_request_id: clearanceRequestId },
          { 
            ready_for_hod: true,
            remarks: '✅ Certificate generated - All departments cleared'
          }
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

// Get Student's Existing Clearance Requests
app.get('/api/clearance-requests', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentSap = req.user.sap;
    console.log('📋 Fetching clearance request history for student:', studentSap || studentId);

    // Try student_id first, fall back to sapid
    let validationRecords = await ComprehensiveClearanceValidation.find({ student_id: studentId }).sort({ submittedAt: -1 });
    if ((!validationRecords || validationRecords.length === 0) && studentSap) {
      validationRecords = await ComprehensiveClearanceValidation.find({ sapid: studentSap.toString().trim() }).sort({ submittedAt: -1 });
      if (validationRecords.length > 0) {
        await ComprehensiveClearanceValidation.updateMany(
          { sapid: studentSap.toString().trim(), student_id: { $exists: false } },
          { $set: { student_id: studentId } }
        );
      }
    }

    if (!validationRecords || validationRecords.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const statusMap = { 'Completed': 'Approved', 'Pending': 'Pending', 'Rejected': 'Rejected', 'Resubmission': 'Resubmission' };
    const transformedRecords = validationRecords.map(record => ({
      _id: record._id,
      student_id: record.student_id,
      sapid: record.sapid,
      student_name: record.student_name,
      father_name: record.father_name,
      program: record.program,
      semester: record.semester,
      submitted_at: record.submittedAt,
      overallStatus: record.overallStatus,
      status: statusMap[record.overallStatus] || record.overallStatus,
      certificateGenerated: record.certificateGenerated,
      departmentStatuses: record.departmentStatuses.map(d => ({
        name: d.name, status: d.status, reason: d.reason, pendingItems: d.pendingItems || [], validatedAt: d.validatedAt
      }))
    }));

    res.json({ success: true, data: transformedRecords, count: transformedRecords.length });
  } catch (err) {
    console.error('❌ Fetch Requests Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch requests: ' + err.message });
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
// Re-run validation for a rejected clearance request (student resubmit)
// --------------------
app.post('/api/clearance-requests/:id/resubmit', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const studentSap = req.user.sap;
    console.log('\n🔄 RESUBMIT VALIDATION for record:', id, 'student:', studentSap || studentId);

    // Find the existing rejected record belonging to this student
    let existingRecord = await ComprehensiveClearanceValidation.findOne({ _id: id, student_id: studentId });
    if (!existingRecord && studentSap) {
      existingRecord = await ComprehensiveClearanceValidation.findOne({ _id: id, sapid: studentSap.toString().trim() });
    }
    if (!existingRecord) {
      return res.status(404).json({ success: false, message: 'Clearance record not found' });
    }
    if (existingRecord.overallStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'This clearance request is already completed' });
    }

    // Archive current state before overwriting
    const snapshot = {
      submissionDate: new Date(),
      overallStatus: existingRecord.overallStatus,
      departmentStatuses: existingRecord.departmentStatuses.map(d => ({
        name: d.name, status: d.status, reason: d.reason
      }))
    };

    // Re-run the full validation
    const studentInfo = {
      student_name: existingRecord.student_name,
      father_name: existingRecord.father_name,
      program: existingRecord.program,
      semester: existingRecord.semester,
      degree_status: existingRecord.degree_status || 'Final'
    };
    const sapid = existingRecord.sapid;
    const validationResult = await validateStudentClearanceAllDepartments(sapid, studentInfo);
    console.log(`  New overall status: ${validationResult.overallStatus}`);

    // Update the record with fresh validation results
    const updatedRecord = await ComprehensiveClearanceValidation.findByIdAndUpdate(
      id,
      {
        $set: {
          overallStatus: validationResult.overallStatus,
          departmentStatuses: validationResult.departmentStatuses,
          approvedDepartments: validationResult.approvedDepartments,
          rejectedDepartments: validationResult.rejectedDepartments,
          pendingDepartments: validationResult.pendingDepartments,
          certificateGenerated: validationResult.certificateGenerated,
          submissionCount: (existingRecord.submissionCount || 1) + 1,
          updatedAt: new Date(),
          ...(validationResult.overallStatus === 'Completed' ? { completedAt: new Date() } : {})
        },
        $push: { previousSubmissions: snapshot }
      },
      { new: true }
    );

    // Sync DepartmentClearance records for department dashboards
    for (const dept of validationResult.departmentStatuses) {
      const newStatus = dept.status === 'Approved' ? 'Approved' : (dept.status === 'Not Processed' ? 'Pending' : 'Pending');
      await DepartmentClearance.findOneAndUpdate(
        { clearance_request_id: id, department_name: dept.name },
        {
          $set: {
            status: newStatus,
            remarks: dept.status === 'Approved' ? 'Re-validated: Approved' : (dept.reason || 'Resubmitted'),
            approved_at: dept.status === 'Approved' ? new Date() : null
          }
        }
      );
    }

    // Send certificate email if now completed
    if (validationResult.overallStatus === 'Completed') {
      try {
        const studentUser = await User.findById(studentId);
        if (studentUser && studentUser.email) {
          sendClearanceCertificateEmail({
            studentName: existingRecord.student_name,
            studentEmail: studentUser.email,
            sapId: sapid,
            department: studentUser.department || '',
            program: existingRecord.program,
            qrCode: updatedRecord.qr_code || '',
            approvedBy: 'All Departments',
            approvedAt: new Date(),
            departments: validationResult.departmentStatuses.map(d => ({ name: d.name, status: d.status }))
          }).then(r => {
            if (r.success) console.log(`✅ Certificate email sent to ${studentUser.email}`);
            else console.warn(`⚠️ Certificate email failed: ${r.reason || r.error}`);
          }).catch(e => console.error('Certificate email error:', e.message));
        }
      } catch (emailErr) {
        console.error('Certificate email lookup error:', emailErr.message);
      }

      // Notification to student
      new Message({
        conversation_id: `${sapid}-resubmit-complete-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: 'Clearance System',
        sender_role: 'system',
        sender_sapid: 'SYSTEM',
        recipient_sapid: sapid,
        recipient_id: studentId,
        recipient_department: 'System',
        subject: '✅ CLEARANCE APPROVED',
        message: 'Congratulations! Your resubmitted clearance request has been APPROVED by all departments.',
        message_type: 'notification'
      }).save().catch(e => console.error('Notification error:', e));
    }

    // Build transformed response (same shape as GET /api/clearance-requests)
    const statusMap = { 'Completed': 'Approved', 'Pending': 'Pending', 'Rejected': 'Rejected', 'Resubmission': 'Resubmission' };
    const responseRecord = {
      _id: updatedRecord._id,
      overallStatus: updatedRecord.overallStatus,
      status: statusMap[updatedRecord.overallStatus] || updatedRecord.overallStatus,
      departmentStatuses: updatedRecord.departmentStatuses.map(d => ({
        name: d.name, status: d.status, reason: d.reason, pendingItems: d.pendingItems || [], validatedAt: d.validatedAt
      }))
    };

    res.json({
      success: true,
      message: validationResult.overallStatus === 'Completed'
        ? '✅ Clearance APPROVED - All departments cleared!'
        : '⚠️ Resubmitted. Some departments still have pending issues.',
      record: responseRecord
    });
  } catch (err) {
    console.error('❌ Resubmit Validation Error:', err);
    res.status(500).json({ success: false, message: 'Failed to resubmit: ' + err.message });
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

// Update Profile
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

// ✅ REPLY TO A SPECIFIC MESSAGE BY MESSAGE ID (for student & department replies)
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
    console.error('Stack trace:', err.stack);
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

// Get unread message count
// ========== GET ALL MESSAGES FOR STUDENT ==========
app.get('/api/my-messages', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const userDept = req.user.department;

    console.log('🔍 User Info:');
    console.log('  - ID:', userId);
    console.log('  - Role:', userRole);
    console.log('  - Department:', userDept);

    let query = {};
    
    if (userRole === 'student') {
      // Students see both messages they sent AND received
      query = {
        $or: [
          { sender_id: userId },        // Messages they sent
          { recipient_id: userId }       // Messages they received
        ]
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
    console.log('📨 Query:', JSON.stringify(query, null, 2));
    
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100).lean().exec();
    console.log(`✅ Found ${messages.length} messages`);

    // Log sample messages for debugging
    if (messages.length > 0) {
      console.log('📨 Sample messages:');
      messages.slice(0, 3).forEach(msg => {
        console.log(`  - ID: ${msg._id}, From: ${msg.sender_role} (${msg.sender_name}), To Dept: ${msg.recipient_department}, To ID: ${msg.recipient_id}`);
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

    console.log('✓ Marking message as read:', messageId, 'by user:', userId);

    // Find the message
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

    // Update is_read to true
    message.is_read = true;
    message.read_at = new Date();
    await message.save();

    console.log('✅ Message marked as read');

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

    console.log('📨 Fetching sent messages for staff:');
    console.log('  - User ID from token:', userId);
    console.log('  - User ID type:', typeof userId);
    console.log('  - User Role:', userRole);

    // Only staff can view their sent messages
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

    // Get all department clearance records
    const allRecords = await DepartmentClearance.find({}).lean().exec();
    
    console.log(`📊 Total clearance records: ${allRecords.length}`);
    
    // Log sample records to see actual data structure
    if (allRecords.length > 0) {
      console.log('📋 Sample record:', JSON.stringify(allRecords[0], null, 2));
      console.log('🔍 Unique status values:', [...new Set(allRecords.map(r => r.status))]);
      console.log('🔍 Unique department names:', [...new Set(allRecords.map(r => r.department_name))]);
    }

    // Define the 6 main departments
    const mainDepartments = ['Library', 'Transport', 'Laboratory', 'Fee Department', 'Coordination', 'Student Service'];
    
    // Initialize all 6 departments with 0 counts
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

    // Get only the 6 main departments (no "Unknown")
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

    let query = {};
    if (userRole === 'student') {
      query = { recipient_id: userId, is_read: false };
    } else {
      // Staff see unread messages from:
      // 1. Messages directed to their department (from students)
      // 2. Admin messages directed to their role
      query = {
        $or: [
          { recipient_department: userDept, is_read: false, sender_role: 'student' },
          { recipient_department: { $regex: `^${userDept}$`, $options: 'i' }, is_read: false, sender_role: 'student' },
          { recipient_department: userRole, is_read: false, sender_role: 'admin', message_type: 'notification' },
          { recipient_department: { $regex: `^${userRole}$`, $options: 'i' }, is_read: false, sender_role: 'admin', message_type: 'notification' }
        ],
        is_read: false
      };
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

    // Fetch the record first to get sapid
    const fetchRecord = await DepartmentClearance.findById(id);
    if (!fetchRecord) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Check if all departments are approved
    const allDepartments = ['Library', 'Transport', 'Fee Department', 'Student Service', 'Coordination'];
    const deptStatus = await Promise.all(
      allDepartments.map(dept => 
        DepartmentClearance.findOne({ sapid: fetchRecord.sapid, department_name: dept }).lean()
      )
    );
    
    const allApprovedExceptCurrent = deptStatus
      .filter((_, idx) => allDepartments[idx] !== 'Library')
      .every(d => d && d.status === 'Approved');

    // Add certificate generated message if all will be approved
    let finalRemarks = remarks || '';
    if (allApprovedExceptCurrent) {
      finalRemarks = remarks ? `${remarks}\n🎉 Certificate Generated - All departments cleared!` : '🎉 Certificate Generated - All departments cleared!';
    }

    // Update DepartmentClearance record
    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        approved_by: librarianName,
        approved_at: new Date(),
        remarks: finalRemarks
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    console.log(`✅ Library approved clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Approved by: ${librarianName}`);
    console.log(`   Remarks: ${finalRemarks || 'None'}`);

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
      message: `Your library clearance has been approved. ${allApprovedExceptCurrent ? '🎉 All departments have cleared your request - Certificate ready!' : ''}${remarks ? `\nComment: ${remarks}` : ''}`,
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

    // Fetch the record first to get sapid
    const fetchRecord = await DepartmentClearance.findById(id);
    if (!fetchRecord) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Check if all departments are approved
    const allDepartments = ['Library', 'Transport', 'Fee Department', 'Student Service', 'Coordination'];
    const deptStatus = await Promise.all(
      allDepartments.map(dept => 
        DepartmentClearance.findOne({ sapid: fetchRecord.sapid, department_name: dept }).lean()
      )
    );
    
    const allApprovedExceptCurrent = deptStatus
      .filter((_, idx) => allDepartments[idx] !== 'Fee Department')
      .every(d => d && d.status === 'Approved');

    // Add certificate generated message if all will be approved
    let finalRemarks = remarks || '';
    if (allApprovedExceptCurrent) {
      finalRemarks = remarks ? `${remarks}\n🎉 Certificate Generated - All departments cleared!` : '🎉 Certificate Generated - All departments cleared!';
    }

    const departmentClearance = await DepartmentClearance.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        approved_by: staffName,
        approved_at: new Date(),
        remarks: finalRemarks
      },
      { new: true }
    ).populate('clearance_request_id').populate('student_id', 'full_name sap');

    console.log(`✅ Fee Department approved clearance`);
    console.log(`   Student: ${departmentClearance.student_name} (SAP ID: ${departmentClearance.sapid})`);
    console.log(`   Approved by: ${staffName}`);
    console.log(`   Remarks: ${finalRemarks || 'None'}`);

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
      message: `Your fee clearance has been approved. ${allApprovedExceptCurrent ? '🎉 All departments have cleared your request - Certificate ready!' : ''}${remarks ? `\nComment: ${remarks}` : ''}`,
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
// GET DEPARTMENTS LIST
// --------------------
app.get('/api/departments', (req, res) => {
  try {
    const departments = [
      'Library',
      'Transport',
      'Laboratory',
      'Student Service',
      'Fee Department',
      'Coordination',
      'HOD'
    ];

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (err) {
    console.error('❌ Error fetching departments:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
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
    
    // Fetch the record first to get sapid
    const fetchRecord = await DepartmentClearance.findById(id);
    if (!fetchRecord) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    // Check if all departments are approved
    const allDepartments = ['Library', 'Transport', 'Fee Department', 'Student Service', 'Coordination'];
    const deptStatus = await Promise.all(
      allDepartments.map(dept => 
        DepartmentClearance.findOne({ sapid: fetchRecord.sapid, department_name: dept }).lean()
      )
    );
    
    const allApprovedExceptCurrent = deptStatus
      .filter((_, idx) => allDepartments[idx] !== 'Transport')
      .every(d => d && d.status === 'Approved');
    
    // Add certificate generated message if all will be approved
    let finalRemarks = remarks || '';
    if (allApprovedExceptCurrent) {
      finalRemarks = remarks ? `${remarks}\n🎉 Certificate Generated - All departments cleared!` : '🎉 Certificate Generated - All departments cleared!';
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: finalRemarks }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    const message = new Message({ conversation_id: `${record.sapid}-Transport-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'transport', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Transport', subject: '✅ Transport Clearance Approved', message: `Your transport clearance has been approved. ${allApprovedExceptCurrent ? '🎉 All departments have cleared your request - Certificate ready!' : ''}${remarks ? `\nComment: ${remarks}` : ''}`, message_type: 'notification' });
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
    
    // Fetch the record first to get sapid
    const fetchRecord = await DepartmentClearance.findById(id);
    if (!fetchRecord) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    // Check if all departments are approved
    const allDepartments = ['Library', 'Transport', 'Fee Department', 'Student Service', 'Coordination'];
    const deptStatus = await Promise.all(
      allDepartments.map(dept => 
        DepartmentClearance.findOne({ sapid: fetchRecord.sapid, department_name: dept }).lean()
      )
    );
    
    const allApprovedExceptCurrent = deptStatus
      .filter((_, idx) => allDepartments[idx] !== 'Student Service')
      .every(d => d && d.status === 'Approved');
    
    // Add certificate generated message if all will be approved
    let finalRemarks = remarks || '';
    if (allApprovedExceptCurrent) {
      finalRemarks = remarks ? `${remarks}\n🎉 Certificate Generated - All departments cleared!` : '🎉 Certificate Generated - All departments cleared!';
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: finalRemarks }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    const message = new Message({ conversation_id: `${record.sapid}-StudentService-approval-${Date.now()}`, sender_id: staffId, sender_name: staffName, sender_role: 'studentservice', sender_sapid: req.user.sap, recipient_sapid: record.sapid, recipient_id: record.student_id, recipient_department: 'Student Service', subject: '✅ Student Service Clearance Approved', message: `Your student service clearance has been approved. ${allApprovedExceptCurrent ? '🎉 All departments have cleared your request - Certificate ready!' : ''}${remarks ? `\nComment: ${remarks}` : ''}`, message_type: 'notification' });
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
    
    // First, fetch the record to get sapid
    const fetchRecord = await DepartmentClearance.findById(id);
    if (!fetchRecord) return res.status(404).json({ success: false, message: '❌ Request not found' });
    
    // Check if all departments are approved
    const allDepartments = ['Library', 'Transport', 'Fee Department', 'Student Service', 'Coordination'];
    const deptStatus = await Promise.all(
      allDepartments.map(dept => 
        DepartmentClearance.findOne({ sapid: fetchRecord.sapid, department_name: dept }).lean()
      )
    );
    
    const allApprovedExceptCurrent = deptStatus
      .filter((_, idx) => allDepartments[idx] !== 'Coordination')
      .every(d => d && d.status === 'Approved');
    
    // Add certificate generated message if all will be approved
    let finalRemarks = remarks || '';
    if (allApprovedExceptCurrent) {
      finalRemarks = remarks ? `${remarks}\n🎉 Certificate Generated - All departments cleared!` : '🎉 Certificate Generated - All departments cleared!';
    }
    
    const record = await DepartmentClearance.findByIdAndUpdate(id, { status: 'Approved', approved_by: staffName, approved_at: new Date(), remarks: finalRemarks }, { new: true })
      .populate('clearance_request_id').populate('student_id', 'full_name sap');
    
    const message = new Message({ 
      conversation_id: `${record.sapid}-Coordination-approval-${Date.now()}`, 
      sender_id: staffId, 
      sender_name: staffName, 
      sender_role: 'coordination', 
      sender_sapid: req.user.sap, 
      recipient_sapid: record.sapid, 
      recipient_id: record.student_id, 
      recipient_department: 'Coordination', 
      subject: '✅ Coordination Clearance Approved', 
      message: `Your coordination clearance has been approved. ${allApprovedExceptCurrent ? '🎉 All departments have cleared your request - Certificate ready!' : ''}${remarks ? `\nComment: ${remarks}` : ''}`, 
      message_type: 'notification' 
    });
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

// ============================================
// CLEARANCE WORKFLOW ROUTES (Sequential 5-Phase)
// ============================================
app.use('/api/clearance', clearanceWorkflowRoutes);

// ============================================
// AUTO-CLEARANCE, ISSUE & RETURN ROUTES
// ============================================
app.use('/api/auto-clearance', autoClearanceRoutes);
app.use('/api/department-issues', issueRoutes);
app.use('/api/department-returns', returnRoutes);

// ============================================
// ADMIN PANEL ROUTES
// ============================================
app.use('/api/admin', adminRoutes);

// ============================================
// HOD ROUTES
// ============================================
app.use('/api/hod', hodRoutes);

// Start Server
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database: MongoDB`);
  
  // Email configuration status
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`📧 Email: ${process.env.EMAIL_SERVICE || 'gmail'} (${process.env.EMAIL_USER})`);
  } else {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not configured - OTP emails will not be sent');
  }
  
  console.log('='.repeat(60) + '\n');
});

module.exports = app;
