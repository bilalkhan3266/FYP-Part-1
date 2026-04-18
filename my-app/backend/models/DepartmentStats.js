// models/DepartmentStats.js
const mongoose = require('mongoose');

const DepartmentStatsSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true,
    enum: ['Library', 'Transport', 'Laboratory', 'Fee Department', 'Coordination', 'Student Services']
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  approvedRequests: {
    type: Number,
    default: 0
  },
  rejectedRequests: {
    type: Number,
    default: 0
  },
  pendingRequests: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String
  },
  notes: String
}, { timestamps: true });

// Method to calculate progress percentage
DepartmentStatsSchema.methods.getProgressPercentage = function() {
  if (this.totalRequests === 0) return 0;
  return Math.round((this.approvedRequests / this.totalRequests) * 100);
};

// Method to get stats summary
DepartmentStatsSchema.methods.getSummary = function() {
  return {
    departmentName: this.departmentName,
    totalRequests: this.totalRequests,
    approved: this.approvedRequests,
    rejected: this.rejectedRequests,
    pending: this.pendingRequests,
    progressPercentage: this.getProgressPercentage(),
    lastUpdated: this.lastUpdated
  };
};

// Indexes for efficient queries
DepartmentStatsSchema.index({ departmentName: 1 });
DepartmentStatsSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('DepartmentStats', DepartmentStatsSchema);
