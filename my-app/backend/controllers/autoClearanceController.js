const DepartmentIssue = require("../models/DepartmentIssue");
const ClearanceWorkflow = require("../models/ClearanceWorkflow");
const User = require("../models/User");
const Message = require("../models/Message");
const mongoose = require("mongoose");
const { generateQRCode, generateCertificatePDF } = require("../utils/certificateGenerator");
const { sendClearanceCertificateEmail } = require("../utils/emailService");

const DEPARTMENTS = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

/**
 * Check a single department for uncleared issues.
 * Returns "Approved" if no pending issues, "Rejected" otherwise.
 */
async function checkDepartment(sapId, deptName) {
  const unclearedCount = await DepartmentIssue.countDocuments({
    studentId: sapId,
    departmentName: deptName,
    status: { $nin: ["Cleared", "Returned"] },
  });

  return {
    name: deptName,
    status: unclearedCount > 0 ? "Rejected" : "Approved",
    unclearedCount,
  };
}

/**
 * Run automatic clearance check for a student across all departments.
 * @param {string} sapId - Student SAP ID
 * @returns {{ phases: Array, overallStatus: string, rejectedDepartments: string[] }}
 */
async function runAutoClearanceCheck(sapId) {
  const results = await Promise.all(
    DEPARTMENTS.map((dept) => checkDepartment(sapId, dept))
  );

  const phases = results.map((r) => ({
    name: r.name,
    status: r.status,
    remarks: r.status === "Rejected" ? `${r.unclearedCount} uncleared issue(s) found` : "",
    approvedAt: r.status === "Approved" ? new Date() : null,
    approverName: r.status === "Approved" ? "Auto-Verification System" : "",
  }));

  const rejectedDepartments = results.filter((r) => r.status === "Rejected").map((r) => r.name);
  const overallStatus = rejectedDepartments.length > 0 ? "Rejected" : "Completed";

  return { phases, overallStatus, rejectedDepartments };
}

/**
 * POST /api/auto-clearance
 * Student submits clearance request — system auto-checks all departments
 */
exports.submitAutoClearance = async (req, res) => {
  try {
    const {
      student_name, sapid, father_name,
      program, semester, degree_status, department,
    } = req.body;

    // Validation
    const requiredFields = { student_name, sapid, father_name, program, semester, degree_status };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === "") {
        return res.status(400).json({
          success: false,
          message: `${field.replace(/_/g, " ")} is required`,
        });
      }
    }

    const sapId = sapid.toString().trim();

    // Check for existing active workflow
    const existing = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
      overallStatus: { $in: ["Pending", "In Progress"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have an active clearance request. Please wait for it to be processed.",
      });
    }

    // ======= AUTO CLEARANCE CHECK =======
    console.log(`🔄 Running auto-clearance check for SAP: ${sapId}`);
    const { phases, overallStatus, rejectedDepartments } = await runAutoClearanceCheck(sapId);
    console.log(`📋 Auto-check result: ${overallStatus} | Rejected: ${rejectedDepartments.join(", ") || "None"}`);

    // Build the workflow
    const workflow = new ClearanceWorkflow({
      studentId: req.user.id,
      sapid: sapId,
      studentName: student_name.toString().trim(),
      fatherName: father_name.toString().trim(),
      program: program.toString().trim(),
      semester: semester.toString().trim(),
      degreeStatus: degree_status.toString().trim(),
      department: department || "",
      overallStatus,
      currentPhase: overallStatus === "Completed" ? DEPARTMENTS.length - 1 : 0,
      phases,
    });

    // If ALL approved → generate QR + PDF + send email
    if (overallStatus === "Completed") {
      workflow.completedAt = new Date();

      // Generate QR Code
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${workflow._id}`;
      const qrData = {
        studentId: sapId,
        clearanceId: workflow._id.toString(),
        verificationUrl,
      };
      const qrDataUrl = await generateQRCode(qrData);
      workflow.qrCode = qrDataUrl;

      // Generate PDF Certificate
      await generateCertificatePDF(workflow, qrDataUrl);
      workflow.certificateUrl = `/api/clearance/certificate/download/${workflow._id}`;
    }

    await workflow.save();

    // Send notification message
    if (overallStatus === "Completed") {
      await new Message({
        conversation_id: `${sapId}-auto-clearance-complete-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "Auto-Clearance System",
        sender_role: "system",
        recipient_sapid: sapId,
        recipient_id: req.user.id,
        recipient_department: "System",
        subject: "🎉 Clearance Approved — Certificate Ready!",
        message: "Congratulations! The automatic clearance verification found no pending issues across all departments. Your clearance certificate is ready for download.",
        message_type: "notification",
      }).save();

      // Send email
      const student = await User.findById(req.user.id);
      if (student?.email) {
        sendClearanceCertificateEmail({
          studentName: workflow.studentName,
          studentEmail: student.email,
          sapId: sapId,
          department: workflow.department,
          program: workflow.program,
          qrCode: workflow._id.toString(),
          approvedBy: "Auto-Verification System",
          approvedAt: new Date(),
          departments: phases.map((p) => ({ name: p.name, status: p.status })),
        }).catch((e) => console.error("Email error:", e));
      }

      console.log(`🎉 Auto-clearance COMPLETED for ${sapId}`);

      return res.status(201).json({
        success: true,
        message: "All departments cleared! Your clearance certificate has been generated.",
        overallStatus: "Completed",
        requestId: workflow._id,
        phases,
        qrCode: workflow.qrCode,
        certificateUrl: workflow.certificateUrl,
      });
    } else {
      // Some departments rejected
      await new Message({
        conversation_id: `${sapId}-auto-clearance-rejected-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "Auto-Clearance System",
        sender_role: "system",
        recipient_sapid: sapId,
        recipient_id: req.user.id,
        recipient_department: "System",
        subject: "❌ Clearance Rejected — Pending Items Found",
        message: `Your clearance request was rejected due to pending items in: ${rejectedDepartments.join(", ")}. Please clear these issues and resubmit.`,
        message_type: "notification",
      }).save();

      console.log(`❌ Auto-clearance REJECTED for ${sapId}: ${rejectedDepartments.join(", ")}`);

      return res.status(201).json({
        success: true,
        message: `Clearance rejected due to pending items in: ${rejectedDepartments.join(", ")}`,
        overallStatus: "Rejected",
        requestId: workflow._id,
        phases,
        rejectedDepartments,
      });
    }
  } catch (err) {
    console.error("❌ Auto-Clearance Error:", err);
    res.status(500).json({ success: false, message: "Failed to process clearance: " + err.message });
  }
};

/**
 * GET /api/auto-clearance/student
 * Get the latest auto-clearance result for the logged-in student
 */
exports.getStudentClearance = async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!workflow) {
      return res.json({ success: true, data: null, message: "No clearance request found" });
    }

    res.json({ success: true, data: workflow });
  } catch (err) {
    console.error("❌ Get Student Clearance Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch clearance status" });
  }
};

/**
 * POST /api/auto-clearance/recheck
 * Re-run the auto-clearance check on an existing rejected workflow
 */
exports.recheckClearance = async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
      overallStatus: "Rejected",
    }).sort({ createdAt: -1 });

    if (!workflow) {
      return res.status(404).json({ success: false, message: "No rejected clearance request found to re-check" });
    }

    const sapId = workflow.sapid;
    console.log(`🔄 Re-checking clearance for SAP: ${sapId}`);

    const { phases, overallStatus, rejectedDepartments } = await runAutoClearanceCheck(sapId);

    workflow.phases = phases;
    workflow.overallStatus = overallStatus;

    if (overallStatus === "Completed") {
      workflow.completedAt = new Date();

      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${workflow._id}`;
      const qrData = { studentId: sapId, clearanceId: workflow._id.toString(), verificationUrl };
      const qrDataUrl = await generateQRCode(qrData);
      workflow.qrCode = qrDataUrl;

      await generateCertificatePDF(workflow, qrDataUrl);
      workflow.certificateUrl = `/api/clearance/certificate/download/${workflow._id}`;

      // Send completion notification
      await new Message({
        conversation_id: `${sapId}-recheck-complete-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "Auto-Clearance System",
        sender_role: "system",
        recipient_sapid: sapId,
        recipient_id: req.user.id,
        recipient_department: "System",
        subject: "🎉 Clearance Re-check Passed — Certificate Ready!",
        message: "Your clearance re-check passed! All issues have been resolved. Your certificate is now ready for download.",
        message_type: "notification",
      }).save();

      // Send email
      const student = await User.findById(req.user.id);
      if (student?.email) {
        sendClearanceCertificateEmail({
          studentName: workflow.studentName,
          studentEmail: student.email,
          sapId,
          department: workflow.department,
          program: workflow.program,
          qrCode: workflow._id.toString(),
          approvedBy: "Auto-Verification System",
          approvedAt: new Date(),
          departments: phases.map((p) => ({ name: p.name, status: p.status })),
        }).catch((e) => console.error("Email error:", e));
      }
    }

    await workflow.save();

    res.json({
      success: true,
      message: overallStatus === "Completed"
        ? "All departments cleared! Certificate generated."
        : `Still rejected: ${rejectedDepartments.join(", ")}`,
      overallStatus,
      phases,
      rejectedDepartments: rejectedDepartments || [],
      qrCode: workflow.qrCode || null,
      certificateUrl: workflow.certificateUrl || null,
    });
  } catch (err) {
    console.error("❌ Recheck Clearance Error:", err);
    res.status(500).json({ success: false, message: "Failed to recheck clearance: " + err.message });
  }
};

/**
 * GET /api/auto-clearance/preview
 * Preview auto-clearance result without creating a workflow (dry run)
 */
exports.previewClearance = async (req, res) => {
  try {
    const sapId = req.user.sap || req.query.sapid;
    if (!sapId) {
      return res.status(400).json({ success: false, message: "SAP ID required" });
    }

    const { phases, overallStatus, rejectedDepartments } = await runAutoClearanceCheck(sapId);

    // Also fetch the detailed pending issues for each rejected department
    const pendingDetails = {};
    for (const dept of rejectedDepartments) {
      pendingDetails[dept] = await DepartmentIssue.find({
        studentId: sapId,
        departmentName: dept,
        status: { $nin: ["Cleared", "Returned"] },
      }).select("itemType description issueDate status");
    }

    res.json({
      success: true,
      overallStatus,
      phases,
      rejectedDepartments,
      pendingDetails,
    });
  } catch (err) {
    console.error("❌ Preview Clearance Error:", err);
    res.status(500).json({ success: false, message: "Failed to preview clearance: " + err.message });
  }
};

/**
 * POST /api/auto-clearance/email-certificate
 * Resend the clearance certificate email to the logged-in student
 */
exports.emailCertificate = async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
      overallStatus: "Completed",
    }).sort({ createdAt: -1 });

    if (!workflow) {
      return res.status(404).json({ success: false, message: "No completed clearance found" });
    }

    const student = await User.findById(req.user.id);
    if (!student?.email) {
      return res.status(400).json({ success: false, message: "No email address found on your profile. Please update your email in Edit Profile." });
    }

    const result = await sendClearanceCertificateEmail({
      studentName: workflow.studentName,
      studentEmail: student.email,
      sapId: workflow.sapid,
      department: workflow.department,
      program: workflow.program,
      qrCode: workflow._id.toString(),
      approvedBy: "Auto-Verification System",
      approvedAt: workflow.completedAt || workflow.updatedAt,
      departments: workflow.phases.map((p) => ({ name: p.name, status: p.status })),
    });

    if (result.success) {
      return res.json({ success: true, message: `Certificate sent to ${student.email}` });
    } else {
      return res.status(500).json({ success: false, message: result.reason || "Failed to send email. Please try again." });
    }
  } catch (err) {
    console.error("❌ Email Certificate Error:", err);
    res.status(500).json({ success: false, message: "Failed to send certificate email" });
  }
};

/**
 * GET /api/auto-clearance/status
 * Get the auto-clearance status and statistics for the logged-in student
 */
exports.getAutoClearanceStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get clearance statistics
    const totalRequests = await ClearanceWorkflow.countDocuments({ studentId: req.user.id });
    const completedRequests = await ClearanceWorkflow.countDocuments({
      studentId: req.user.id,
      overallStatus: "Completed",
    });
    const pendingRequests = await ClearanceWorkflow.countDocuments({
      studentId: req.user.id,
      overallStatus: "Pending",
    });
    const rejectedRequests = await ClearanceWorkflow.countDocuments({
      studentId: req.user.id,
      overallStatus: "Rejected",
    });

    const approvalRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    res.json({
      success: true,
      data: {
        enabled: user.autoClearanceEnabled || false,
        stats: {
          totalRequests,
          approvedCount: completedRequests,
          pendingCount: pendingRequests,
          rejectedCount: rejectedRequests,
          approvalRate,
        },
      },
    });
  } catch (err) {
    console.error("❌ Get Auto-Clearance Status Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch auto-clearance status" });
  }
};

/**
 * POST /api/auto-clearance/toggle
 * Toggle auto-clearance feature on/off for the logged-in student
 */
exports.toggleAutoClearance = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "enabled must be a boolean" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { autoClearanceEnabled: enabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const action = enabled ? "enabled" : "disabled";
    console.log(`✅ Auto-clearance ${action} for user: ${user.email}`);

    res.json({
      success: true,
      message: `Auto-clearance ${action} successfully`,
      data: {
        enabled: user.autoClearanceEnabled,
      },
    });
  } catch (err) {
    console.error("❌ Toggle Auto-Clearance Error:", err);
    res.status(500).json({ success: false, message: "Failed to toggle auto-clearance" });
  }
};
