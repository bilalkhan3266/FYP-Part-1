const express = require('express');
const router = express.Router();
const verifyToken = require('../verifyToken');
const ClearanceRequest = require('../models/ClearanceRequest');
const Message = require('../models/Message');

// ============================================
// GET PENDING REQUESTS
// ============================================
router.get('/library/pending-requests', verifyToken, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'Pending' })
      .populate('sapid', 'full_name email')
      .sort({ submitted_at: -1 });

    res.status(200).json({
      success: true,
      data: requests.map(req => ({
        id: req._id,
        sapid: req.sapid?._id || req.sapid,
        student_name: req.sapid?.full_name || req.student_name,
        registration_no: req.registration_no,
        father_name: req.father_name,
        program: req.program,
        semester: req.semester,
        department: req.department,
        submitted_at: req.submitted_at,
        status: req.status
      })),
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch pending requests',
      error: error.message
    });
  }
});

// ============================================
// GET APPROVED REQUESTS
// ============================================
router.get('/library/approved-requests', verifyToken, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'Approved', department: 'library' })
      .populate('sapid', 'full_name email')
      .sort({ submitted_at: -1 });

    res.status(200).json({
      success: true,
      data: requests.map(req => ({
        id: req._id,
        sapid: req.sapid?._id || req.sapid,
        student_name: req.sapid?.full_name || req.student_name,
        registration_no: req.registration_no,
        program: req.program,
        semester: req.semester,
        submitted_at: req.submitted_at,
        status: req.status
      })),
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching approved requests:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch approved requests',
      error: error.message
    });
  }
});

// ============================================
// GET REJECTED REQUESTS
// ============================================
router.get('/library/rejected-requests', verifyToken, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({ status: 'Rejected', department: 'library' })
      .populate('sapid', 'full_name email')
      .sort({ submitted_at: -1 });

    res.status(200).json({
      success: true,
      data: requests.map(req => ({
        id: req._id,
        sapid: req.sapid?._id || req.sapid,
        student_name: req.sapid?.full_name || req.student_name,
        registration_no: req.registration_no,
        program: req.program,
        semester: req.semester,
        submitted_at: req.submitted_at,
        status: req.status
      })),
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching rejected requests:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to fetch rejected requests',
      error: error.message
    });
  }
});

// ============================================
// APPROVE REQUEST
// ============================================
router.put('/library/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const request = await ClearanceRequest.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    ).populate('sapid', 'full_name email _id');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Send message to student
    const messageData = {
      studentId: request.sapid?._id || request.sapid,
      subject: '✅ Library Clearance Approved',
      message: `Your library clearance has been approved. ${remarks ? `Remarks: ${remarks}` : ''}`,
      sender: 'Library',
      createdAt: new Date()
    };

    await Message.create(messageData);

    res.status(200).json({
      success: true,
      message: '✅ Request approved and student notified',
      data: request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to approve request',
      error: error.message
    });
  }
});

// ============================================
// REJECT REQUEST
// ============================================
router.put('/library/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const request = await ClearanceRequest.findByIdAndUpdate(
      id,
      { status: 'Rejected' },
      { new: true }
    ).populate('sapid', 'full_name email _id');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '❌ Request not found'
      });
    }

    // Send message to student
    const messageData = {
      studentId: request.sapid?._id || request.sapid,
      subject: '❌ Library Clearance Rejected',
      message: `Your library clearance has been rejected. ${remarks ? `Reason: ${remarks}` : ''}`,
      sender: 'Library',
      createdAt: new Date()
    };

    await Message.create(messageData);

    res.status(200).json({
      success: true,
      message: '✅ Request rejected and student notified',
      data: request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: '❌ Failed to reject request',
      error: error.message
    });
  }
});

module.exports = router;

module.exports = router;
