const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ClearanceWorkflow = require("../models/ClearanceWorkflow");
const ComprehensiveClearanceValidation = require("../models/ComprehensiveClearanceValidation");
const Message = require("../models/Message");
const User = require("../models/User");
const DepartmentIssue = require("../models/DepartmentIssue");
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

// ═══════════════════════════════════════════════════════════════
// AUTO-APPROVAL HELPER FUNCTION
// ═══════════════════════════════════════════════════════════════
async function autoApproveWorkflow(workflowId) {
  try {
    const workflow = await ClearanceWorkflow.findById(workflowId);
    if (!workflow) {
      console.error(`❌ Workflow not found: ${workflowId}`);
      return { success: false, message: "Workflow not found" };
    }

    // ✅ VERIFY SAPID EXISTS IN DEPARTMENT ISSUES BEFORE AUTO-APPROVAL
    const issueRecord = await DepartmentIssue.findOne({ studentId: workflow.sapid.toString() });
    if (!issueRecord) {
      console.error(`❌ AUTO-APPROVAL BLOCKED: SAPID ${workflow.sapid} not found in DepartmentIssue records`);
      workflow.overallStatus = "Rejected";
      workflow.completedAt = new Date();
      await workflow.save();
      
      // Send rejection message to student
      await new Message({
        conversation_id: `${workflow.sapid}-clearance-rejected-${Date.now()}`,
        sender_id: new mongoose.Types.ObjectId(),
        sender_name: "System",
        sender_role: "system",
        recipient_sapid: workflow.sapid,
        recipient_id: workflow.studentId,
        recipient_department: "System",
        subject: "❌ Clearance Request Rejected",
        message: `Your clearance request has been rejected. The Record Is Not Found Against This sapid. Please contact the administration office.`,
        message_type: "notification",
        is_read: false,
        createdAt: new Date()
      }).catch(err => console.error("Error sending rejection message:", err));

      return { success: false, message: "SAPID record not found in system" };
    }

    console.log(`🤖 AUTO-APPROVING workflow for ${workflow.sapid}...`);
    console.log(`✅ SAPID ${workflow.sapid} verified in DepartmentIssue records`);

    // Approve all phases automatically
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      workflow.phases[i].status = "Approved";
      workflow.phases[i].approvedBy = null;
      workflow.phases[i].approverName = "Auto-Approval System";
      workflow.phases[i].remarks = "Auto-approved";
      workflow.phases[i].approvedAt = new Date();
      console.log(`   ✅ Phase ${i + 1}/${PHASE_ORDER.length}: ${PHASE_ORDER[i]} approved`);
    }

    // Mark as completed
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

    console.log(`🎉 AUTO-APPROVAL COMPLETE for ${workflow.sapid}`);
    console.log(`   📜 Certificate generated: ${workflow.certificateUrl}`);

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
      message: `Your clearance has been approved by all departments. Your certificate is now ready for download.`,
      message_type: "notification",
    }).save();

    // Send email
    const student = await User.findById(workflow.studentId);
    if (student?.email) {
      sendClearanceCertificateEmail({
        studentName: workflow.studentName,
        studentEmail: student.email,
        sapId: workflow.sapid,
        department: workflow.department,
        program: workflow.program,
        qrCode: workflow._id.toString(),
        approvedBy: "Auto-Approval System",
        approvedAt: new Date(),
        departments: workflow.phases.map((p) => ({ name: p.name, status: p.status })),
      }).catch((e) => console.error("Email error:", e));
    }

    return { success: true, message: "Workflow auto-approved", workflow };
  } catch (err) {
    console.error("❌ Auto-approval error:", err);
    return { success: false, message: err.message };
  }
}

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

    // ✅ CHECK IF SAPID EXISTS IN DEPARTMENT ISSUES
    const sapidStr = sapid.toString().trim();
    const issueRecord = await DepartmentIssue.findOne({ studentId: sapidStr });

    console.log(`\n🔍 SAPID VALIDATION CHECK:`);
    console.log(`   📌 SAPID from form: "${sapidStr}"`);
    console.log(`   🔎 Searching in DepartmentIssue collection...`);

    if (!issueRecord) {
      console.error(`❌ VALIDATION FAILED: SAPID "${sapidStr}" NOT FOUND in DepartmentIssue records`);
      return res.status(404).json({
        success: false,
        message: "The Record Is Not Found Against This sapid",
        errorCode: "SAPID_NOT_FOUND",
        details: {
          sapid: sapidStr,
          reason: "This SAPID is not registered in the system for clearance processing"
        }
      });
    }

    console.log(`✅ VALIDATION PASSED: SAPID "${sapidStr}" found in DepartmentIssue`);
    console.log(`   Department: ${issueRecord.departmentName}`);
    console.log(`   Status: ${issueRecord.status}\n`);

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

    // 🤖 AUTO-APPROVE WORKFLOW
    const approvalResult = await autoApproveWorkflow(workflow._id);

    // ✅ CHECK IF AUTO-APPROVAL FAILED
    if (!approvalResult.success) {
      console.error(`❌ AUTO-APPROVAL FAILED for SAPID ${sapid}: ${approvalResult.message}`);
      return res.status(404).json({
        success: false,
        message: "The Record Is Not Found Against This sapid",
        errorCode: "SAPID_NOT_FOUND",
        requestId: workflow._id,
        details: {
          sapid: sapid,
          reason: "This SAPID is not registered in the system for clearance processing",
          timestamp: new Date()
        }
      });
    }

    // ✅ AUTO-APPROVAL SUCCESSFUL
    res.status(201).json({
      success: true,
      message: "✅ Clearance request submitted and automatically approved through all departments!",
      requestId: workflow._id,
      currentPhase: PHASE_ORDER.length,
      autoApproved: true,
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

    // Fetch all workflows where this department is the current phase (pending)
    const workflows = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      currentPhase: phaseIndex,
    }).sort({ createdAt: -1 });

    // Also fetch rejected ones for this phase (so dept can see history)
    const rejected = await ClearanceWorkflow.find({
      overallStatus: "Rejected",
      [`phases.${phaseIndex}.status`]: "Rejected",
    }).sort({ updatedAt: -1 }).limit(50);

    // Fetch approved records:
    // 1. All COMPLETED clearances (for record-keeping) - visible to all departments
    // 2. Workflows where this specific department's phase is Approved
    const approvedCompleted = await ClearanceWorkflow.find({
      overallStatus: "Completed",
    }).sort({ completedAt: -1 }).limit(100);

    const approvedThisPhase = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      [`phases.${phaseIndex}.status`]: "Approved",
    }).sort({ updatedAt: -1 }).limit(50);

    // Combine and deduplicate
    const approvedMap = new Map();
    approvedCompleted.forEach(w => approvedMap.set(w._id.toString(), w));
    approvedThisPhase.forEach(w => approvedMap.set(w._id.toString(), w));
    const approved = Array.from(approvedMap.values());

    // Also include ComprehensiveClearanceValidation completed records
    // (students cleared via the comprehensive auto-validation system)
    const ccvCompleted = await ComprehensiveClearanceValidation.find({
      overallStatus: 'Completed',
    }).sort({ completedAt: -1 }).limit(100);

    const ccvFormatted = ccvCompleted.map(record => ({
      _id: record._id,
      studentName: record.student_name || 'Unknown Student',
      sapid: record.sapid,
      registrationNo: record.registration_no,
      fatherName: record.father_name,
      program: record.program,
      semester: record.semester,
      degreeStatus: record.degree_status,
      department: '',
      overallStatus: record.overallStatus,
      currentPhase: PHASE_ORDER.length - 1,
      phaseStatus: 'Approved',
      phaseRemarks: 'Cleared by all departments (auto-validated)',
      phaseApprovedBy: 'Auto-System',
      phaseApprovedAt: record.completedAt || record.certificate_generated_at || record.submittedAt || record.createdAt,
      submittedAt: record.submittedAt || record.createdAt,
      completedAt: record.completedAt || record.certificate_generated_at || record.submittedAt || record.createdAt,
      phases: PHASE_ORDER.map(name => ({
        name,
        status: 'Approved',
        approverName: 'Auto-System',
        remarks: 'Auto-validated',
        approvedAt: record.completedAt || record.certificate_generated_at || record.submittedAt || record.createdAt,
      })),
    }));

    // Merge CCV records (avoid duplicates by sapid+completedAt)
    const existingSapIds = new Set(approved.map(w => `${w.sapid}_${w.completedAt}`));
    ccvFormatted.forEach(r => {
      const key = `${r.sapid}_${r.completedAt}`;
      if (!existingSapIds.has(key)) {
        approved.push(r);
      }
    });

    console.log(`📋 Department ${phaseName} (${req.user.email}):`);
    console.log(`   📌 Pending: ${workflows.length} | 🚫 Rejected: ${rejected.length} | ✅ Approved: ${approved.length}`);
    console.log(`   ├─ Completed workflows: ${approvedCompleted.length}`);
    console.log(`   ├─ This phase approved: ${approvedThisPhase.length}`);
    console.log(`   └─ CCV completed: ${ccvCompleted.length}`);
    console.log("");

    const formattedApproved = approved.map((w) => {
      // CCV records are already formatted (plain objects with studentName)
      if (w.studentName && !w.toObject) return w;
      return formatWorkflowForDepartment(w, phaseIndex);
    });

    // Prevent caching to force fresh data
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    res.json({
      success: true,
      phaseName,
      phaseIndex,
      pending: workflows.map((w) => formatWorkflowForDepartment(w, phaseIndex)),
      rejected: rejected.map((w) => formatWorkflowForDepartment(w, phaseIndex)),
      approved: formattedApproved,
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
    completedAt: workflow.completedAt,
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

    console.log(`🔍 Approve request - ID: ${id}, User: ${req.user.sap || req.user.email}, Department: ${req.user.department}`);

    const workflow = await ClearanceWorkflow.findById(id);
    if (!workflow) {
      console.log(`❌ Workflow not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: "Clearance request not found" });
    }

    console.log(`✅ Found workflow for ${workflow.sapid}, Status: ${workflow.overallStatus}, Current Phase: ${workflow.currentPhase}`);

    if (workflow.overallStatus !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve — workflow status is "${workflow.overallStatus}"`,
      });
    }

    // Verify the user's department matches the current phase
    const currentPhaseName = PHASE_ORDER[workflow.currentPhase];
    const userPhaseName = ROLE_TO_PHASE[req.user.role] || DEPT_NAME_TO_PHASE[req.user.department];

    console.log(`🔐 Phase check - Current: ${currentPhaseName}, User: ${userPhaseName}, Role: ${req.user.role}`);

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

    console.log(`🔍 Reject request - ID: ${id}, User: ${req.user.sap || req.user.email}, Department: ${req.user.department}`);

    const workflow = await ClearanceWorkflow.findById(id);
    if (!workflow) {
      console.log(`❌ Workflow not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: "Clearance request not found" });
    }

    console.log(`✅ Found workflow for ${workflow.sapid}, Status: ${workflow.overallStatus}, Current Phase: ${workflow.currentPhase}`);

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

// ─────────────────────────────────────────
// DEBUG: GET /clearance/test/approved — Test approved records (no auth required)
// ─────────────────────────────────────────
router.get("/test/approved", async (req, res) => {
  try {
    console.log("\n🧪 TEST ENDPOINT: /clearance/test/approved");
    
    const completed = await ClearanceWorkflow.find({
      overallStatus: "Completed",
    }).sort({ completedAt: -1 }).limit(10);
    
    console.log(`✅ Found ${completed.length} completed clearances\n`);
    
    const formatted = completed.map(w => ({
      _id: w._id,
      sapid: w.sapid,
      studentName: w.studentName,
      overallStatus: w.overallStatus,
      completedAt: w.completedAt,
      phases: w.phases.map(p => ({ name: p.name, status: p.status })),
    }));
    
    res.json({
      success: true,
      count: completed.length,
      message: "These should appear in Approved tab for ALL departments",
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Test error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: POST /clearance/bulk-auto-approve — Auto-approve all pending workflows
// ─────────────────────────────────────────
router.post("/bulk-auto-approve", verifyToken, async (req, res) => {
  try {
    console.log(`\n🤖 BULK AUTO-APPROVAL started by ${req.user.email}`);

    // Get all pending workflows
    const pendingWorkflows = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
    }).sort({ createdAt: 1 });

    console.log(`📋 Found ${pendingWorkflows.length} pending workflows to auto-approve\n`);

    if (pendingWorkflows.length === 0) {
      return res.json({
        success: true,
        message: "No pending workflows found",
        approved: 0,
      });
    }

    let approved = 0;
    let failed = 0;
    const results = [];

    // Auto-approve each workflow
    for (const workflow of pendingWorkflows) {
      const result = await autoApproveWorkflow(workflow._id);
      if (result.success) {
        approved++;
        results.push({
          sapid: workflow.sapid,
          studentName: workflow.studentName,
          status: "✅ Approved",
        });
      } else {
        failed++;
        results.push({
          sapid: workflow.sapid,
          studentName: workflow.studentName,
          status: "❌ Failed",
          error: result.message,
        });
      }
    }

    console.log(`\n✨ BULK AUTO-APPROVAL COMPLETE`);
    console.log(`   ✅ Approved: ${approved}`);
    console.log(`   ❌ Failed: ${failed}\n`);

    res.json({
      success: true,
      message: `Auto-approved ${approved}/${pendingWorkflows.length} workflows`,
      approved,
      failed,
      results,
    });
  } catch (err) {
    console.error("❌ Bulk auto-approval error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────
// DIAGNOSTIC: GET /clearance/debug — Show database state
// ─────────────────────────────────────────
router.get("/debug/database-state", verifyToken, async (req, res) => {
  try {
    console.log("\n🔍 DATABASE STATE DIAGNOSTIC\n");

    // Total count
    const totalCount = await ClearanceWorkflow.countDocuments();
    console.log(`Total workflows: ${totalCount}`);

    // Get all workflows
    const allWorkflows = await ClearanceWorkflow.find({}).lean();
    console.log(`\nAll workflows by status:`);
    
    const byStatus = {};
    allWorkflows.forEach(w => {
      if (!byStatus[w.overallStatus]) byStatus[w.overallStatus] = [];
      byStatus[w.overallStatus].push({
        sapid: w.sapid,
        studentName: w.studentName,
        currentPhase: w.currentPhase,
        _id: w._id.toString(),
      });
    });

    Object.entries(byStatus).forEach(([status, docs]) => {
      console.log(`  ${status}: ${docs.length}`);
      docs.slice(0, 2).forEach(d => {
        console.log(`    • ${d.sapid} - ${d.studentName}`);
      });
    });

    // Get pending for Library (phase 1)
    const phaseIndex = 1; // Library
    const libraryPending = await ClearanceWorkflow.find({
      overallStatus: "In Progress",
      currentPhase: phaseIndex,
    }).lean();

    console.log(`\nLibrary pending (phase ${phaseIndex}): ${libraryPending.length}`);
    libraryPending.forEach(p => {
      console.log(`  • SAP: ${p.sapid}, _id: ${p._id}`);
    });

    // Return as JSON
    res.json({
      success: true,
      totalWorkflows: totalCount,
      byStatus: Object.entries(byStatus).reduce((acc, [status, docs]) => {
        acc[status] = {
          count: docs.length,
          samples: docs.slice(0, 3),
        };
        return acc;
      }, {}),
      libraryPending: {
        count: libraryPending.length,
        records: libraryPending.map(p => ({
          _id: p._id.toString(),
          sapid: p.sapid,
          studentName: p.studentName,
        })),
      },
    });
  } catch (err) {
    console.error("❌ Diagnostic error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
