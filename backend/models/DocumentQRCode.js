// models/DocumentQRCode.js
const mongoose = require('mongoose');

const DocumentQRCodeSchema = new mongoose.Schema({
  // QR Code unique identifier
  qrCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Document information
  documentName: {
    type: String,
    required: true,
    enum: [
      'Fee Clearance',
      'Library Clearance',
      'Laboratory Clearance',
      'Transport Clearance',
      'Coordination Clearance',
      'Student Services Clearance',
      'Degree',
      'Transcript',
      'ID Card',
      'Admission Letter',
      'Other'
    ]
  },
  
  // Student information
  studentName: {
    type: String,
    required: true
  },
  
  studentSapId: {
    type: String,
    required: true,
    index: true
  },
  
  studentDepartment: {
    type: String,
    required: true
  },
  
  // HOD who created the QR code
  createdByHOD: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    department: String
  },
  
  // Document verification details
  originalityStatus: {
    type: String,
    enum: ['verified', 'unverified', 'suspected_fake', 'flagged'],
    default: 'unverified'
  },
  
  originalityNotes: {
    type: String,
    default: ''
  },
  
  // Verification attempts
  verificationAttempts: [
    {
      verifiedBy: {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        email: String,
        role: String
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      result: {
        type: String,
        enum: ['original', 'fake', 'cannot_determine']
      },
      notes: String
    }
  ],
  
  // Document validity
  isValid: {
    type: Boolean,
    default: true
  },
  
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
  },
  
  // Metadata
  documentIssuedDate: Date,
  documentIssuer: String,
  issuerDepartment: String,
  
  // Security
  ipAddressCreated: String,
  ipAddressLastVerified: String,
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  
  revokedReason: String,
  revokedBy: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String
  },
  revokedDate: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for efficient queries
DocumentQRCodeSchema.index({ studentSapId: 1, createdAt: -1 });
DocumentQRCodeSchema.index({ 'createdByHOD.department': 1 });
DocumentQRCodeSchema.index({ documentName: 1 });
DocumentQRCodeSchema.index({ originalityStatus: 1 });
DocumentQRCodeSchema.index({ expiryDate: 1 });
DocumentQRCodeSchema.index({ createdAt: -1 });

// Virtual for QR code URL (can be used to generate actual QR code)
DocumentQRCodeSchema.virtual('qrCodeUrl').get(function() {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${baseUrl}/api/hod/verify-qr/${this.qrCode}`;
});

// Method to verify document authenticity
DocumentQRCodeSchema.methods.verifyDocument = function(verifyingUser, result, notes = '') {
  this.verificationAttempts.push({
    verifiedBy: {
      id: verifyingUser.id,
      name: verifyingUser.name,
      email: verifyingUser.email,
      role: verifyingUser.role
    },
    timestamp: new Date(),
    result,
    notes
  });
  
  // Update originality status based on verification results
  const results = this.verificationAttempts.map(v => v.result);
  const fakeCount = results.filter(r => r === 'fake').length;
  const totalCount = results.length;
  
  if (fakeCount > totalCount / 2) {
    this.originalityStatus = 'suspected_fake';
  } else if (results.some(r => r === 'original')) {
    this.originalityStatus = 'verified';
  }
  
  this.updatedAt = new Date();
};

// Method to check if document is still valid
DocumentQRCodeSchema.methods.isDocumentValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return this.isValid;
};

// Method to get verification summary
DocumentQRCodeSchema.methods.getVerificationSummary = function() {
  const attempts = this.verificationAttempts;
  const originalCount = attempts.filter(a => a.result === 'original').length;
  const fakeCount = attempts.filter(a => a.result === 'fake').length;
  const unknownCount = attempts.filter(a => a.result === 'cannot_determine').length;
  
  return {
    totalVerifications: attempts.length,
    original: originalCount,
    fake: fakeCount,
    unknown: unknownCount,
    status: this.originalityStatus,
    isValid: this.isDocumentValid(),
    lastVerified: attempts.length > 0 ? attempts[attempts.length - 1].timestamp : null
  };
};

module.exports = mongoose.model('DocumentQRCode', DocumentQRCodeSchema);
