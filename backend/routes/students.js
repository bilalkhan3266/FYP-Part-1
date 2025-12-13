const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const DepartmentClearance = require("../models/DepartmentClearance");
const Message = require("../models/Message");
const verifyToken = require("../verifyToken");

// ====== GET STUDENT DASHBOARD STATS ======
router.get("/stats/:studentId", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get submission stats
    const [pendingSubmissions, approvedSubmissions, rejectedSubmissions] = await Promise.all([
      Submission.countDocuments({ studentId, status: "pending" }),
      Submission.countDocuments({ studentId, status: "approved" }),
      Submission.countDocuments({ studentId, status: "rejected" })
    ]);

    // Get clearance stats
    const clearances = await DepartmentClearance.find({
      studentId: studentId
    });

    const clearanceStats = {
      pending: clearances.filter(c => c.status === "Pending").length,
      approved: clearances.filter(c => c.status === "Approved").length,
      rejected: clearances.filter(c => c.status === "Rejected").length
    };

    // Get unread messages count
    const unreadMessages = await Message.countDocuments({
      senderId: studentId,
      status: "replied"
    });

    res.json({
      success: true,
      data: {
        submissions: {
          pending: pendingSubmissions,
          approved: approvedSubmissions,
          rejected: rejectedSubmissions,
          total: pendingSubmissions + approvedSubmissions + rejectedSubmissions
        },
        clearances: {
          pending: clearanceStats.pending,
          approved: clearanceStats.approved,
          rejected: clearanceStats.rejected,
          total: clearances.length
        },
        unreadMessages
      }
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
});

// ====== GET ALL STUDENT SUBMISSIONS ======
router.get("/submissions/:studentId", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const submissions = await Submission.find({ studentId })
      .sort({ submittedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: submissions
    });
  } catch (err) {
    console.error("Submissions error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions"
    });
  }
});

// ====== GET SUBMISSION BY ID ======
router.get("/submission/:submissionId", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate("approvedBy", "full_name email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission"
    });
  }
});

module.exports = router;
