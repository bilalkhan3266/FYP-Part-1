const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ClearanceWorkflow = require("../models/ClearanceWorkflow");
const DepartmentClearance = require("../models/DepartmentClearance");
const Message = require("../models/Message");
const User = require("../models/User");
const { generateQRCode, generateCertificatePDF, CERTIFICATES_DIR } = require("../utils/certificateGenerator");
const { sendClearanceCertificateEmail } = require("../utils/emailService");
const { verifyToken } = require("../middleware/authMiddleware");
const path = require("path");

// Phase order — department role values map to phase names
const PHASE_ORDER = [
  "Coordination",
  "Library",
  "Transport",
  "Fee Department",
  "Student Service",
];

// Map user roles to phase names
const ROLE_TO_PHASE = {
  coordination: "Coordination",
  library: "Library",
  transport: "Transport",
  feedepartment: "Fee Department",
  studentservice: "Student Service",
};

// Map department column values to phase names (DB may store different strings)
const DEPT_NAME_TO_PHASE = {
  "Coordination": "Coordination",
  "Coordination Office": "Coordination",
  "Library": "Library",
  "Transport": "Transport",
  "Fee Department": "Fee Department",
  "Fee & Dues": "Fee Department",
  "Student Service": "Student Service",
  "Student Services": "Student Service",
};

// ─────────────────────────────────────────
// 1. POST /clearance — Student submits request
// ─────────────────────────────────────────
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      student_name, sapid, registration_no, father_name,
      program, semester, degree_status, department,
    } = req.body;

    // Validation
    const requiredFields = { student_name, sapid, registration_no, father_name, program, semester, degree_status };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === "") {
        return res.status(400).json({
          success: false,
          message: `${field.replace(/_/g, " ")} is required`,
        });
      }
    }

    // Check for existing active workflow
    const existing = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
      overallStatus: { $in: ["Pending", "In Progress"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have an active clearance request. Please wait for it to be reviewed.",
      });
    }

    // Create workflow with all phases initialized
    const workflow = new ClearanceWorkflow({
      studentId: req.user.id,
      sapid: sapid.toString().trim(),
      studentName: student_name.toString().trim(),
      registrationNo: registration_no.toString().trim(),
      fatherName: father_name.toString().trim(),
      program: program.toString().trim(),
      semester: semester.toString().trim(),
      degreeStatus: degree_status.toString().trim(),
      department: department || "",
      overallStatus: "In Progress",
      currentPhase: 0,
      // phases auto-initialized by schema default
    });

    await workflow.save();

    console.log(`✅ Clearance workflow created: ${workflow._id} for ${sapid}`);

    res.status(201).json({
      success: true,
      message: "Clearance request submitted successfully. It will proceed through departments sequentially.",
      requestId: workflow._id,
      currentPhase: PHASE_ORDER[0],
      details: {
        student: sapid,
        phases: PHASE_ORDER.length,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error("❌ Clearance Submit Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit clearance request: " + err.message,
    });
  }
});

// ─────────────────────────────────────────
// 2. GET /clearance/student — Student views their status
// ─────────────────────────────────────────
router.get("/student", verifyToken, async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findOne({
      studentId: req.user.id,
    }).sort({ createdAt: -1 });

    if (!workflow) {
      return res.json({
        success: true,
        data: null,
        message: "No clearance request found",
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    console.error("❌ Student status error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch clearance status" });
  }
});

// ─────────────────────────────────────────
// 3. GET /clearance/department — Department sees requests for their phase
// ─────────────────────────────────────────
router.get("/department", verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    // Determine which phase this department handles
    let phaseName = ROLE_TO_PHASE[userRole];
    if (!phaseName && userDept) {
      phaseName = DEPT_NAME_TO_PHASE[userDept];
    }

    if (!phaseName) {
      return res.status(403).json({
        success: false,
        message: "Your role is not associated with any clearance phase",
      });
    }

    const phaseIndex = PHASE_ORDER.indexOf(phaseName);

    // ── Old ClearanceWorkflow records ──
    const rejected = await ClearanceWorkflow.find({
      overallStatus: "Rejected",
      [`phases.${phaseIndex}.status`]: "Rejected",
    }).sort({ updatedAt: -1 }).limit(50);

    const approved = await ClearanceWorkflow.find({
      [`phases.${phaseIndex}.status`]: "Approved",
    }).sort({ updatedAt: -1 }).limit(50);

    // ── New DepartmentClearance records (ComprehensiveClearanceValidation system) ──
    const deptApproved = await DepartmentClearance.find({
      department_name: phaseName,
      status: 'Approved'
    }).sort({ createdAt: -1 }).limit(100);

    const deptRejected = await DepartmentClearance.find({
      department_name: phaseName,
      status: 'Rejected'
    }).sort({ createdAt: -1 }).limit(100);

    const formatDeptClearance = (dc) => ({
      _id: dc._id,
      studentName: dc.student_name || "Unknown Student",
      sapid: dc.sapid,
      program: dc.program,
      semester: dc.semester,
      overallStatus: dc.status,
      currentPhase: phaseIndex,
      phaseStatus: dc.status,
      phaseRemarks: dc.remarks || "",
      phaseApprovedBy: dc.approved_by || "",
      phaseApprovedAt: dc.approved_at,
      submittedAt: dc.createdAt,
      source: "comprehensive"
    });

    res.json({
      success: true,
      phaseName,
      phaseIndex,
      pending: [],
      rejected: [
        ...rejected.map((w) => formatWorkflowForDepartment(w, phaseIndex)),
        ...deptRejected.map(formatDeptClearance)
      ],
      approved: [
        ...approved.map((w) => formatWorkflowForDepartment(w, phaseIndex)),
        ...deptApproved.map(formatDeptClearance)
      ],
    });
  } catch (err) {
    console.error("❌ Department fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch department requests" });
  }
});

function formatWorkflowForDepartment(workflow, phaseIndex) {
  const phase = workflow.phases[phaseIndex];
  return {
    _id: workflow._id,
    studentName: workflow.studentName,
    sapid: workflow.sapid,
    registrationNo: workflow.registrationNo,
    fatherName: workflow.fatherName,
    program: workflow.program,
    semester: workflow.semester,
    degreeStatus: workflow.degreeStatus,
    department: workflow.department,
    overallStatus: workflow.overallStatus,
    currentPhase: workflow.currentPhase,
    phaseStatus: phase?.status || "Pending",
    phaseRemarks: phase?.remarks || "",
    phaseApprovedBy: phase?.approverName || "",
    phaseApprovedAt: phase?.approvedAt,
    submittedAt: workflow.submittedAt,
    phases: workflow.phases,
  };
}

// ─────────────────────────────────────────
// 4. PUT /clearance/:id/approve — Approve current phase
// ─────────────────────────────────────────
router.put("/:id/approve", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const workflow = await ClearanceWorkflow.findById(id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Clearance request not found" });
    }

    if (workflow.overallStatus !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve — workflow status is "${workflow.overallStatus}"`,
      });
    }

    // Verify the user's department matches the current phase
    const currentPhaseName = PHASE_ORDER[workflow.currentPhase];
    const userPhaseName = ROLE_TO_PHASE[req.user.role] || DEPT_NAME_TO_PHASE[req.user.department];

    if (userPhaseName !== currentPhaseName) {
      return res.status(403).json({
        success: false,
        message: `Only ${currentPhaseName} can approve at this stage. Your department: ${userPhaseName || req.user.role}`,
      });
    }

    // Update current phase
    workflow.phases[workflow.currentPhase].status = "Approved";
    workflow.phases[workflow.currentPhase].approvedBy = req.user.id;
    workflow.phases[workflow.currentPhase].approverName = req.user.full_name || req.user.email;
    workflow.phases[workflow.currentPhase].remarks = remarks || "";
    workflow.phases[workflow.currentPhase].approvedAt = new Date();

    const isLastPhase = workflow.currentPhase >= PHASE_ORDER.length - 1;

    if (isLastPhase) {
      // === FINAL PHASE APPROVED ===
      workflow.overallStatus = "Completed";
      workflow.completedAt = new Date();

      // Generate QR code
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${workflow._id}`;
      const qrData = {
        studentId: workflow.sapid,
        clearanceId: workflow._id.toString(),
        verificationUrl,
      };
      const qrDataUrl = await generateQRCode(qrData);
      workflow.qrCode = qrDataUrl;

      // Generate PDF certificate
      const certPath = await generateCertificatePDF(workflow, qrDataUrl);
      workflow.certificateUrl = `/api/clearance/certificate/download/${workflow._id}`;

      await workflow.save();

      // Send notification message
      await new Message({
        conversation_id: `${workflow.sapid}-clearance-complete-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "System",
        sender_role: "system",
        recipient_sapid: workflow.sapid,
        recipient_id: workflow.studentId,
        recipient_department: "System",
        subject: "🎉 Clearance Completed — Certificate Ready!",
        message: `Congratulations! All departments have approved your clearance. Your certificate is now ready for download.`,
        message_type: "notification",
      }).save();

      // Send email (async, don't block response)
      const student = await User.findById(workflow.studentId);
      if (student?.email) {
        sendClearanceCertificateEmail({
          studentName: workflow.studentName,
          studentEmail: student.email,
          sapId: workflow.sapid,
          department: workflow.department,
          program: workflow.program,
          qrCode: workflow._id.toString(),
          approvedBy: req.user.full_name || req.user.email,
          approvedAt: new Date(),
          departments: workflow.phases.map((p) => ({ name: p.name, status: p.status })),
        }).catch((e) => console.error("Email error:", e));
      }

      console.log(`🎉 Clearance COMPLETED for ${workflow.sapid}`);

      return res.json({
        success: true,
        message: "Final phase approved! Clearance is now complete. Certificate generated.",
        workflow,
        completed: true,
      });
    } else {
      // Move to next phase
      workflow.currentPhase += 1;
      await workflow.save();

      // Send notification about phase advancement
      await new Message({
        conversation_id: `${workflow.sapid}-phase-${workflow.currentPhase}-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "System",
        sender_role: "system",
        recipient_sapid: workflow.sapid,
        recipient_id: workflow.studentId,
        recipient_department: "System",
        subject: `✅ ${currentPhaseName} Approved — Now at ${PHASE_ORDER[workflow.currentPhase]}`,
        message: `Your clearance has been approved by ${currentPhaseName}. It is now pending review at ${PHASE_ORDER[workflow.currentPhase]}.`,
        message_type: "notification",
      }).save();

      console.log(`✅ Phase ${currentPhaseName} approved for ${workflow.sapid}, moving to ${PHASE_ORDER[workflow.currentPhase]}`);

      return res.json({
        success: true,
        message: `${currentPhaseName} approved. Moving to ${PHASE_ORDER[workflow.currentPhase]}.`,
        workflow,
        completed: false,
        nextPhase: PHASE_ORDER[workflow.currentPhase],
      });
    }
  } catch (err) {
    console.error("❌ Approve error:", err);
    res.status(500).json({ success: false, message: "Failed to approve: " + err.message });
  }
});

// ─────────────────────────────────────────
// 5. PUT /clearance/:id/reject — Reject and stop workflow
// ─────────────────────────────────────────
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || remarks.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Remarks are required when rejecting a clearance request",
      });
    }

    const workflow = await ClearanceWorkflow.findById(id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Clearance request not found" });
    }

    if (workflow.overallStatus !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject — workflow status is "${workflow.overallStatus}"`,
      });
    }

    // Verify department
    const currentPhaseName = PHASE_ORDER[workflow.currentPhase];
    const userPhaseName = ROLE_TO_PHASE[req.user.role] || DEPT_NAME_TO_PHASE[req.user.department];

    if (userPhaseName !== currentPhaseName) {
      return res.status(403).json({
        success: false,
        message: `Only ${currentPhaseName} can reject at this stage.`,
      });
    }

    // Update phase and overall status
    workflow.phases[workflow.currentPhase].status = "Rejected";
    workflow.phases[workflow.currentPhase].approvedBy = req.user.id;
    workflow.phases[workflow.currentPhase].approverName = req.user.full_name || req.user.email;
    workflow.phases[workflow.currentPhase].remarks = remarks.trim();
    workflow.phases[workflow.currentPhase].approvedAt = new Date();
    workflow.overallStatus = "Rejected";

    await workflow.save();

    // Send notification
    await new Message({
      conversation_id: `${workflow.sapid}-rejected-${Date.now()}`,
      sender_id: new mongoose.Types.ObjectId(),
      sender_name: "System",
      sender_role: "system",
      recipient_sapid: workflow.sapid,
      recipient_id: workflow.studentId,
      recipient_department: "System",
      subject: `❌ Clearance Rejected by ${currentPhaseName}`,
      message: `Your clearance request has been rejected by ${currentPhaseName}. Reason: ${remarks.trim()}`,
      message_type: "notification",
    }).save();

    console.log(`❌ Clearance REJECTED for ${workflow.sapid} at ${currentPhaseName}`);

    res.json({
      success: true,
      message: `Clearance rejected by ${currentPhaseName}.`,
      workflow,
    });
  } catch (err) {
    console.error("❌ Reject error:", err);
    res.status(500).json({ success: false, message: "Failed to reject: " + err.message });
  }
});

// ─────────────────────────────────────────
// 6. POST /clearance/:id/resubmit — Student resubmits after rejection
// ─────────────────────────────────────────
router.post("/:id/resubmit", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await ClearanceWorkflow.findById(id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Clearance request not found" });
    }

    if (workflow.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your clearance request" });
    }

    if (workflow.overallStatus !== "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Can only resubmit rejected requests",
      });
    }

    // Find the rejected phase and reset it (and all after it)
    const rejectedIndex = workflow.phases.findIndex((p) => p.status === "Rejected");
    if (rejectedIndex === -1) {
      return res.status(400).json({ success: false, message: "No rejected phase found" });
    }

    // Reset the rejected phase and any subsequent ones
    for (let i = rejectedIndex; i < workflow.phases.length; i++) {
      workflow.phases[i].status = "Pending";
      workflow.phases[i].approvedBy = null;
      workflow.phases[i].approverName = "";
      workflow.phases[i].remarks = "";
      workflow.phases[i].approvedAt = null;
    }

    workflow.currentPhase = rejectedIndex;
    workflow.overallStatus = "In Progress";

    await workflow.save();

    console.log(`🔄 Clearance resubmitted for ${workflow.sapid} at phase ${rejectedIndex}`);

    res.json({
      success: true,
      message: `Clearance resubmitted. It will be reviewed again at ${PHASE_ORDER[rejectedIndex]}.`,
      workflow,
    });
  } catch (err) {
    console.error("❌ Resubmit error:", err);
    res.status(500).json({ success: false, message: "Failed to resubmit: " + err.message });
  }
});

// ─────────────────────────────────────────
// 7. GET /clearance/certificate/download/:id — Download PDF certificate
// ─────────────────────────────────────────
router.get("/certificate/download/:id", verifyToken, async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: "Clearance not found" });
    }

    if (workflow.overallStatus !== "Completed") {
      return res.status(400).json({ success: false, message: "Clearance not yet completed" });
    }

    // Find certificate file
    const fs = require("fs");
    const files = fs.readdirSync(CERTIFICATES_DIR).filter((f) => f.includes(workflow.sapid));

    if (files.length === 0) {
      // Regenerate if missing
      const qrDataUrl = workflow.qrCode;
      const certPath = await generateCertificatePDF(workflow, qrDataUrl);
      return res.download(certPath, `Clearance_Certificate_${workflow.sapid}.pdf`);
    }

    // Return the most recent
    const latestFile = files.sort().pop();
    const certPath = path.join(CERTIFICATES_DIR, latestFile);
    res.download(certPath, `Clearance_Certificate_${workflow.sapid}.pdf`);
  } catch (err) {
    console.error("❌ Certificate download error:", err);
    res.status(500).json({ success: false, message: "Failed to download certificate" });
  }
});

// ─────────────────────────────────────────
// 8. GET /clearance/verify/:id — Public verification endpoint
// ─────────────────────────────────────────
router.get("/verify/:id", async (req, res) => {
  try {
    const workflow = await ClearanceWorkflow.findById(req.params.id);
    if (!workflow || workflow.overallStatus !== "Completed") {
      return res.json({ success: false, verified: false, message: "Invalid or incomplete clearance" });
    }

    res.json({
      success: true,
      verified: true,
      data: {
        studentName: workflow.studentName,
        sapid: workflow.sapid,
        program: workflow.program,
        completedAt: workflow.completedAt,
        phases: workflow.phases.map((p) => ({ name: p.name, status: p.status, approvedAt: p.approvedAt })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

module.exports = router;
