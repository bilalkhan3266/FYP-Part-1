/**
 * COMPREHENSIVE DEPARTMENT APPROVAL/REJECTION HANDLER
 * 
 * Handles approvals/rejections for departments and properly tracks:
 * 1. Rejected requests in the department's rejected tab
 * 2. Resubmissions after rejections
 * 3 Auto-transitions to approved when student fixes issues and resubmits
 * 4. Overall clearance status (Pending → Rejected → Resubmission → Completed)
 */

const express = require('express');
const router = express.Router();
const ComprehensiveClearanceValidation = require('../models/ComprehensiveClearanceValidation');
const DepartmentIssue = require('../models/DepartmentIssue');
const Message = require('../models/Message');
const verifyToken = require('../verifyToken');
const mongoose = require('mongoose');

/**
 * PUT /api/clearance/department/approve-or-reject
 * Department staff uses this to approve or reject a student's request for their specific department
 */
router.put('/department/approve-or-reject', verifyToken, async (req, res) => {
  try {
    const { requestId, studentSapId, departmentName, action, remarks } = req.body;
    const staffDepartment = req.user.department; // Department of the staff member approving

    // Validate inputs
    if (!requestId || !studentSapId || !departmentName || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: requestId, studentSapId, departmentName, action'
      });
    }

    if (!['approve', 'reject'].includes(action.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 DEPARTMENT APPROVAL/REJECTION`);
    console.log(`${'='.repeat(70)}`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Student SAP: ${studentSapId}`);
    console.log(`  Department: ${departmentName}`);
    console.log(`  Action: ${action.toUpperCase()}`);
    console.log(`  Remarks: ${remarks || 'None'}`);
    console.log(`${'='.repeat(70)}\n`);

    // Find the clearance validation record
    const ccvRecord = await ComprehensiveClearanceValidation.findById(requestId);

    if (!ccvRecord) {
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found'
      });
    }

    // Find the department status entry
    const deptStatusIndex = ccvRecord.departmentStatuses.findIndex(d => d.name === departmentName);

    if (deptStatusIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Department "${departmentName}" not found in this clearance request`
      });
    }

    const status = action.toUpperCase() === 'APPROVE' ? 'Approved' : 'Rejected';

    // Update the specific department status
    ccvRecord.departmentStatuses[deptStatusIndex].status = status;
    ccvRecord.departmentStatuses[deptStatusIndex].reason = remarks || '';
    ccvRecord.departmentStatuses[deptStatusIndex].validatedAt = new Date();
    ccvRecord.updatedAt = new Date();

    // Check if all departments are now approved
    const allApproved = ccvRecord.departmentStatuses.every(d => d.status === 'Approved');
    const anyRejected = ccvRecord.departmentStatuses.some(d => d.status === 'Rejected');

    // Update overall status
    if (allApproved && ccvRecord.overallStatus !== 'Completed') {
      ccvRecord.overallStatus = 'Completed';
      ccvRecord.completedAt = new Date();
      console.log(`✅ ALL DEPARTMENTS APPROVED! Overall status → COMPLETED`);
    } else if (anyRejected && ccvRecord.overallStatus === 'Pending') {
      ccvRecord.overallStatus = 'Rejected';
      console.log(`❌ REQUEST REJECTED! Overall status → REJECTED`);
    }

    // Save the updated record
    await ccvRecord.save();

    console.log(`✅ Updated department status: ${departmentName} → ${status}`);
    console.log(`   Overall Status: ${ccvRecord.overallStatus}`);

    // Send notification to student
    const notificationMessage = status === 'Approved'
      ? `Your clearance request has been APPROVED by ${departmentName} department.`
      : `Your clearance request has been REJECTED by ${departmentName} department.\n\nReason: ${remarks || 'See remarks from department staff'}\n\nYou can resubmit your request after addressing the concerns.`;

    const notification = new Message({
      sender_id: new mongoose.Types.ObjectId(),
      sender_name: 'System',
      sender_role: 'system',
      sender_sapid: 'SYSTEM',
      recipient_sapid: studentSapId,
      recipient_id: ccvRecord.student_id,
      recipient_department: 'System',
      subject: `${status === 'Approved' ? '✅ APPROVED' : '❌ REJECTED'} - ${departmentName}`,
      message: notificationMessage,
      message_type: 'notification',
      is_read: false,
      createdAt: new Date()
    });

    await notification.save();
    console.log(`📨 Notification sent to student\n`);

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} for ${departmentName}`,
      data: {
        requestId: requestId,
        department: departmentName,
        status: status,
        overallStatus: ccvRecord.overallStatus,
        departmentStatuses: ccvRecord.departmentStatuses
      }
    });

  } catch (error) {
    console.error('❌ Error in approval/rejection:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval/rejection',
      error: error.message
    });
  }
});

/**
 * POST /api/clearance/department/resubmit
 * Student resubmits after rejection and system automatically approves if issues are resolved
 */
router.post('/department/resubmit', verifyToken, async (req, res) => {
  try {
    const { requestId, department } = req.body;
    const studentSapId = req.user.sap;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 RESUBMISSION AFTER REJECTION`);
    console.log(`${'='.repeat(70)}`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Department: ${department}`);
    console.log(`  Student SAP: ${studentSapId}`);
    console.log(`${'='.repeat(70)}\n`);

    // Find the clearance validation record
    const ccvRecord = await ComprehensiveClearanceValidation.findById(requestId);

    if (!ccvRecord) {
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found'
      });
    }

    // Find the department status
    const deptStatusIndex = ccvRecord.departmentStatuses.findIndex(d => d.name === department);

    if (deptStatusIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Department "${department}" not found in this clearance request`
      });
    }

    const currentStatus = ccvRecord.departmentStatuses[deptStatusIndex].status;

    if (currentStatus !== 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `Cannot resubmit for ${department} - current status is ${currentStatus}, not Rejected`
      });
    }

    // Check if the student has resolved the issues (check DepartmentIssue records)
    const outstandingIssues = await DepartmentIssue.find({
      sapid: studentSapId,
      department: department,
      status: { $ne: 'Resolved' }
    });

    let resubmitStatus = 'Pending'; // Default: need to review again
    let message = `Request resubmitted to ${department} for review.`;

    if (outstandingIssues.length === 0) {
      // All issues resolved! Auto-approve
      resubmitStatus = 'Approved';
      message = `🎉 All issues resolved! Request automatically APPROVED for ${department}`;
      console.log(`✅ Auto-approved: All issues resolved!\n`);
    } else {
      console.log(`⏳ Resubmitted for review: ${outstandingIssues.length} issues still pending\n`);
    }

    // Update department status
    ccvRecord.departmentStatuses[deptStatusIndex].status = resubmitStatus;
    ccvRecord.departmentStatuses[deptStatusIndex].validatedAt = new Date();

    // Track resubmission
    ccvRecord.submissionCount = (ccvRecord.submissionCount || 1) + 1;
    ccvRecord.overallStatus = 'Resubmission';

    // Check if all departments are now approved after resubmission
    const allApproved = ccvRecord.departmentStatuses.every(d => d.status === 'Approved');
    if (allApproved) {
      ccvRecord.overallStatus = 'Completed';
      ccvRecord.completedAt = new Date();
      console.log(`✅ ALL DEPARTMENTS NOW APPROVED!\n`);
    }

    await ccvRecord.save();

    res.json({
      success: true,
      message: message,
      data: {
        requestId: requestId,
        department: department,
        newStatus: resubmitStatus,
        overallStatus: ccvRecord.overallStatus,
        submissionCount: ccvRecord.submissionCount,
        departmentStatuses: ccvRecord.departmentStatuses
      }
    });

  } catch (error) {
    console.error('❌ Error in resubmission:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process resubmission',
      error: error.message
    });
  }
});

module.exports = router;
