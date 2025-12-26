// routes/hodRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const DocumentQRCode = require('../models/DocumentQRCode');
const User = require('../models/User');
const Message = require('../models/Message');
const ClearanceRequest = require('../models/ClearanceRequest');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_this';

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided',
      error: 'Authorization header missing or malformed'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      error: err.message
    });
  }
};

// Middleware: Verify HOD Role
const verifyHOD = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase() || '';
  
  // Allow flexible HOD role matching: "hod", "head of department", "head of computing department", etc.
  const isHOD = userRole.includes('hod') || userRole.includes('head');
  
  if (!isHOD) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HOD privileges required.',
      userRole: req.user?.role || 'unknown'
    });
  }
  next();
};

// =====================
// DEPARTMENT ROUTES
// =====================

/**
 * GET /api/hod/department-requests
 * Get all clearance requests for HOD's department
 */
router.get('/department-requests', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = {
      departmentName: req.user.department
    };
    
    if (status) filter.status = status;

    const requests = await ClearanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ClearanceRequest.countDocuments(filter);

    const stats = {
      total: total,
      approved: await ClearanceRequest.countDocuments({ ...filter, status: 'approved' }),
      rejected: await ClearanceRequest.countDocuments({ ...filter, status: 'rejected' }),
      pending: await ClearanceRequest.countDocuments({ ...filter, status: 'pending' })
    };

    res.json({
      success: true,
      data: {
        requests,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching department requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department requests'
    });
  }
});

/**
 * GET /api/hod/pending-requests
 * Get all pending clearance requests
 */
router.get('/pending-requests', verifyToken, verifyHOD, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests || []
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
});

/**
 * GET /api/hod/approved-requests
 * Get all approved clearance requests
 */
router.get('/approved-requests', verifyToken, verifyHOD, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'approved' })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests || []
    });
  } catch (error) {
    console.error('Error fetching approved requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved requests'
    });
  }
});

/**
 * GET /api/hod/rejected-requests
 * Get all rejected clearance requests
 */
router.get('/rejected-requests', verifyToken, verifyHOD, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'rejected' })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests || []
    });
  } catch (error) {
    console.error('Error fetching rejected requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rejected requests'
    });
  }
});

/**
 * GET /api/hod/pending-approvals
 * Get all pending clearance approvals for HOD
 */
router.get('/pending-approvals', verifyToken, verifyHOD, async (req, res) => {
  try {
    const approvals = await ClearanceRequest.find({ 
      status: 'pending',
      hodApproved: false 
    })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: approvals || []
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
});

/**
 * PUT /api/hod/requests/:requestId/approve
 * Approve a clearance request
 */
router.put('/requests/:requestId/approve', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;
    
    const request = await ClearanceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'approved',
        hodRemarks: remarks,
        hodApproved: true,
        hodApprovedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      data: request,
      message: 'Request approved successfully'
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request'
    });
  }
});

/**
 * PUT /api/hod/requests/:requestId/reject
 * Reject a clearance request
 */
router.put('/requests/:requestId/reject', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;
    
    const request = await ClearanceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'rejected',
        hodRemarks: remarks,
        hodApproved: false,
        hodRejectedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      data: request,
      message: 'Request rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request'
    });
  }
});

/**
 * PUT /api/hod/approve-clearance/:requestId
 * Approve clearance for a student
 */
router.put('/approve-clearance/:requestId', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;
    
    const request = await ClearanceRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'approved',
        hodApproved: true,
        hodApprovedAt: new Date(),
        remarks: remarks || ''
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found'
      });
    }
    
    res.json({
      success: true,
      data: request,
      message: 'Clearance approved successfully'
    });
  } catch (error) {
    console.error('Error approving clearance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve clearance'
    });
  }
});

// =====================
// QR CODE & DOCUMENT VERIFICATION ROUTES
// =====================

/**
 * POST /api/hod/generate-qr-code
 * Generate QR code for student document
 */
router.post('/generate-qr-code', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { 
      studentName, 
      studentSapId, 
      documentName, 
      documentIssuedDate, 
      documentIssuer,
      notes 
    } = req.body;

    // Validation
    if (!studentName || !studentSapId || !documentName) {
      return res.status(400).json({
        success: false,
        message: 'Student name, SAP ID, and document name are required'
      });
    }

    // Generate unique QR code
    const uniqueCode = crypto.randomBytes(16).toString('hex');
    const qrCodeData = {
      code: uniqueCode,
      studentSapId,
      documentName,
      timestamp: new Date().toISOString()
    };

    // Create QR code image data
    const qrCodeUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/hod/verify-qr/${uniqueCode}`;
    const qrImage = await QRCode.toDataURL(qrCodeUrl);

    // Save to database
    const documentQR = new DocumentQRCode({
      qrCode: uniqueCode,
      documentName,
      studentName,
      studentSapId,
      studentDepartment: req.user.department,
      createdByHOD: {
        id: req.user.id,
        name: req.user.full_name,
        email: req.user.email,
        department: req.user.department
      },
      documentIssuedDate,
      documentIssuer,
      originalityNotes: notes || '',
      documentIssuedDate: documentIssuedDate ? new Date(documentIssuedDate) : new Date()
    });

    await documentQR.save();

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCode: uniqueCode,
        qrImage, // Base64 encoded QR code image
        qrUrl: qrCodeUrl,
        documentId: documentQR._id,
        studentName,
        studentSapId,
        documentName,
        createdAt: documentQR.createdAt,
        expiryDate: documentQR.expiryDate
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
});

/**
 * GET /api/hod/verify-qr/:qrCode
 * Verify QR code and check document authenticity (Public endpoint - no auth required for scanning)
 */
router.get('/verify-qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    const documentQR = await DocumentQRCode.findOne({ qrCode });

    if (!documentQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found',
        status: 'invalid'
      });
    }

    const summary = documentQR.getVerificationSummary();

    res.json({
      success: true,
      data: {
        qrCode: documentQR.qrCode,
        documentName: documentQR.documentName,
        studentName: documentQR.studentName,
        studentSapId: documentQR.studentSapId,
        studentDepartment: documentQR.studentDepartment,
        status: documentQR.status,
        originalityStatus: documentQR.originalityStatus,
        isValid: documentQR.isDocumentValid(),
        verificationSummary: summary,
        issuer: documentQR.documentIssuer,
        issuedDate: documentQR.documentIssuedDate,
        expiryDate: documentQR.expiryDate,
        createdBy: {
          name: documentQR.createdByHOD.name,
          department: documentQR.createdByHOD.department
        },
        lastVerified: summary.lastVerified
      }
    });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code'
    });
  }
});

/**
 * POST /api/hod/verify-document/:qrCode
 * Mark document as verified (original or fake)
 */
router.post('/verify-document/:qrCode', verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.params;
    const { result, notes } = req.body; // result: 'original', 'fake', 'cannot_determine'

    if (!['original', 'fake', 'cannot_determine'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification result. Must be: original, fake, or cannot_determine'
      });
    }

    const documentQR = await DocumentQRCode.findOne({ qrCode });

    if (!documentQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // Add verification attempt
    documentQR.verifyDocument(
      {
        id: req.user.id,
        name: req.user.full_name,
        email: req.user.email,
        role: req.user.role
      },
      result,
      notes || ''
    );

    await documentQR.save();

    const summary = documentQR.getVerificationSummary();

    res.json({
      success: true,
      message: 'Document verification recorded',
      data: {
        qrCode: documentQR.qrCode,
        originalityStatus: documentQR.originalityStatus,
        verificationSummary: summary,
        lastVerification: documentQR.verificationAttempts[documentQR.verificationAttempts.length - 1]
      }
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document'
    });
  }
});

/**
 * GET /api/hod/qr-codes
 * Get all QR codes created by this HOD
 */
router.get('/qr-codes', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, documentName } = req.query;

    const filter = {
      'createdByHOD.id': req.user.id
    };

    if (status) filter.status = status;
    if (documentName) filter.documentName = documentName;

    const qrCodes = await DocumentQRCode.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DocumentQRCode.countDocuments(filter);

    // Enhance with summary data
    const enhanced = qrCodes.map(qr => ({
      ...qr.toObject(),
      verificationSummary: qr.getVerificationSummary()
    }));

    res.json({
      success: true,
      data: {
        qrCodes: enhanced,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQRCodes: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QR codes'
    });
  }
});

/**
 * GET /api/hod/qr-codes/:qrCode
 * Get details of a specific QR code
 */
router.get('/qr-codes/:qrCode', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { qrCode } = req.params;

    const documentQR = await DocumentQRCode.findOne({ 
      qrCode,
      'createdByHOD.id': req.user.id // Ensure user owns this QR code
    });

    if (!documentQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...documentQR.toObject(),
        verificationSummary: documentQR.getVerificationSummary()
      }
    });
  } catch (error) {
    console.error('Error fetching QR code details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QR code details'
    });
  }
});

/**
 * PUT /api/hod/qr-codes/:qrCode
 * Update QR code status (revoke, expire, etc.)
 */
router.put('/qr-codes/:qrCode', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { qrCode } = req.params;
    const { status, revokedReason, notes } = req.body;

    const documentQR = await DocumentQRCode.findOne({
      qrCode,
      'createdByHOD.id': req.user.id
    });

    if (!documentQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    if (status && ['active', 'revoked', 'expired'].includes(status)) {
      documentQR.status = status;
    }

    if (status === 'revoked') {
      documentQR.revokedReason = revokedReason || '';
      documentQR.revokedBy = {
        id: req.user.id,
        name: req.user.full_name,
        email: req.user.email
      };
      documentQR.revokedDate = new Date();
    }

    if (notes) {
      documentQR.originalityNotes = notes;
    }

    documentQR.updatedAt = new Date();
    await documentQR.save();

    res.json({
      success: true,
      message: 'QR code updated successfully',
      data: documentQR.toObject()
    });
  } catch (error) {
    console.error('Error updating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update QR code'
    });
  }
});

// =====================
// MESSAGING ROUTES
// =====================

/**
 * POST /api/hod/send-message
 * Send message to students in department
 */
router.post('/send-message', verifyToken, verifyHOD, async (req, res) => {
  try {
    const { studentSapId, subject, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (studentSapId) {
      // Send to specific student
      const student = await User.findOne({ sap: studentSapId });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const newMessage = new Message({
        sender: {
          id: req.user.id,
          name: req.user.full_name,
          email: req.user.email,
          role: req.user.role
        },
        recipient: {
          id: student._id,
          name: student.full_name,
          email: student.email,
          role: student.role
        },
        subject,
        message,
        priority: priority || 'normal',
        messageType: 'hod-to-student',
        read: false
      });

      await newMessage.save();

      res.json({
        success: true,
        message: 'Message sent to student',
        data: { messageId: newMessage._id }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Student SAP ID is required'
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

module.exports = router;
