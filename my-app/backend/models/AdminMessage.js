// models/AdminMessage.js
const mongoose = require('mongoose');

const AdminMessageSchema = new mongoose.Schema({
  sender: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String
  },
  messageType: {
    type: String,
    enum: ['department', 'student'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  recipientDepartment: String, // For department messages
  recipientSapId: String, // For student messages
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['sent', 'pending', 'failed'],
    default: 'sent'
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
AdminMessageSchema.index({ messageType: 1, createdAt: -1 });
AdminMessageSchema.index({ recipientDepartment: 1, createdAt: -1 });
AdminMessageSchema.index({ recipientSapId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminMessage', AdminMessageSchema);
