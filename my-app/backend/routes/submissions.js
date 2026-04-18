const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
// eslint-disable-next-line no-unused-vars
const User = require("../models/User");
const verifyToken = require("../verifyToken");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ====== STUDENT: UPLOAD SUBMISSION ======
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const { department, submissionType, description, fileName, fileBase64 } = req.body;

    if (!department || !fileName || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: "Department, file name, and file data are required"
      });
    }

    const studentId = req.user._id || req.user.id;
    const studentSapId = req.user.sap;
    const studentName = req.user.full_name;

    // Decode base64 and save file
    const buffer = Buffer.from(fileBase64, "base64");
    const fileName_sanitized = Date.now() + "_" + fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadsDir, fileName_sanitized);

    fs.writeFileSync(filePath, buffer);

    // Create submission record
    const submission = new Submission({
      studentId,
      studentSapId,
      studentName,
      department,
      submissionType: submissionType || "document",
      fileName: fileName_sanitized,
      fileUrl: `/uploads/${fileName_sanitized}`,
      fileSize: buffer.length,
      description,
      status: "pending"
    });

    await submission.save();

    console.log(`✅ File uploaded: ${fileName_sanitized} for ${department}`);

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        submissionId: submission._id,
        status: submission.status,
        department: submission.department
      }
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      success: false,
      message: "File upload failed"
    });
  }
});

// ====== STUDENT: GET SUBMISSION HISTORY ======
router.get("/history/:studentId", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const submissions = await Submission.find({ studentId })
      .sort({ submittedAt: -1 });

    // Group by department
    const grouped = {};
    submissions.forEach(sub => {
      if (!grouped[sub.department]) {
        grouped[sub.department] = [];
      }
      grouped[sub.department].push({
        _id: sub._id,
        fileName: sub.fileName,
        status: sub.status,
        submissionType: sub.submissionType,
        description: sub.description,
        comments: sub.comments,
        rejectionReason: sub.rejectionReason,
        submittedAt: sub.submittedAt,
        approvedAt: sub.approvedAt,
        rejectionCount: sub.rejectionCount
      });
    });

    res.json({
      success: true,
      data: grouped,
      totalSubmissions: submissions.length
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission history"
    });
  }
});

// ====== STUDENT: GET SUBMISSION STATS ======
router.get("/stats/:studentId", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const [pending, approved, rejected] = await Promise.all([
      Submission.countDocuments({ studentId, status: "pending" }),
      Submission.countDocuments({ studentId, status: "approved" }),
      Submission.countDocuments({ studentId, status: "rejected" })
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      }
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
});

// ====== STAFF: GET PENDING SUBMISSIONS FOR DEPARTMENT ======
router.get("/department/:department/pending", verifyToken, async (req, res) => {
  try {
    const { department } = req.params;

    const submissions = await Submission.find({
      department,
      status: { $in: ["pending", "in_review"] }
    })
      .populate("studentId", "full_name sap email")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (err) {
    console.error("Pending submissions error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending submissions"
    });
  }
});

// ====== STAFF: APPROVE SUBMISSION ======
router.put("/:submissionId/approve", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { comments } = req.body;

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        status: "approved",
        approvedBy: req.user._id || req.user.id,
        approvedAt: new Date(),
        comments
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    console.log(`✅ Submission approved: ${submissionId}`);

    res.json({
      success: true,
      message: "Submission approved",
      data: submission
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to approve submission"
    });
  }
});

// ====== STAFF: REJECT SUBMISSION ======
router.put("/:submissionId/reject", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        status: "rejected",
        rejectionReason,
        rejectionCount: (await Submission.findById(submissionId)).rejectionCount + 1
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    console.log(`❌ Submission rejected: ${submissionId}`);

    res.json({
      success: true,
      message: "Submission rejected",
      data: submission
    });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reject submission"
    });
  }
});

// ====== STUDENT: RESUBMIT AFTER REJECTION ======
router.post("/resubmit/:submissionId", verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { fileName, fileBase64 } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: "File name and data are required"
      });
    }

    const oldSubmission = await Submission.findById(submissionId);
    if (!oldSubmission) {
      return res.status(404).json({
        success: false,
        message: "Original submission not found"
      });
    }

    // Delete old file
    const oldPath = path.join(__dirname, "../uploads", oldSubmission.fileName);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    // Save new file
    const buffer = Buffer.from(fileBase64, "base64");
    const fileName_sanitized = Date.now() + "_" + fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadsDir, fileName_sanitized);
    fs.writeFileSync(filePath, buffer);

    // Update submission
    oldSubmission.fileName = fileName_sanitized;
    oldSubmission.fileUrl = `/uploads/${fileName_sanitized}`;
    oldSubmission.fileSize = buffer.length;
    oldSubmission.status = "pending";
    oldSubmission.resubmittedAt = new Date();
    await oldSubmission.save();

    res.json({
      success: true,
      message: "File resubmitted successfully",
      data: oldSubmission
    });
  } catch (err) {
    console.error("Resubmit error:", err);
    res.status(500).json({
      success: false,
      message: "Resubmission failed"
    });
  }
});

module.exports = router;
