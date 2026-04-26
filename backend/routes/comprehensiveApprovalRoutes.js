/**
 * COMPREHENSIVE DEPARTMENT APPROVAL/REJECTION HANDLER
 * 
 * Handles approvals/rejections for departments and properly tracks:
 * 1. Rejected requests in the department's rejected tab
 * 2. Resubmissions after rejections
 * 3. Auto-transitions to approved when student fixes issues and resubmits
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
 * 
 * Works across all departments: Coordination, Library, Transport, Fee Department, Student Service
 */
router.put('/clearance/department/approve-or-reject', verifyToken, async (req, res) => {
  try {
    const { requestId, studentSapId, departmentName, action, remarks } = req.body;
    const staffDepartment = req.user.department;

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

    // Verify the student SAP ID matches
    if (ccvRecord.sapid !== studentSapId.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student SAP ID does not match the request'
      });
    }

    // Find the department status entry
    const deptStatusIndex = ccvRecord.departmentStatuses.findIndex(d => d.name === departmentName);

    if (deptStatusIndex === -1) {
      console.log(`  ❌ Department "${departmentName}" not found. Available departments:`);
      ccvRecord.departmentStatuses.forEach(d => console.log(`    - ${d.name}: ${d.status}`));
      return res.status(400).json({
        success: false,
        message: `Department "${departmentName}" not found in this clearance request`
      });
    }

    console.log(`  ✅ Found department at index ${deptStatusIndex}: ${departmentName} (current status: ${ccvRecord.departmentStatuses[deptStatusIndex].status})`);

    const status = action.toUpperCase() === 'APPROVE' ? 'Approved' : 'Rejected';

    // Update the specific department status
    ccvRecord.departmentStatuses[deptStatusIndex].status = status;
    ccvRecord.departmentStatuses[deptStatusIndex].reason = remarks || '';
    ccvRecord.departmentStatuses[deptStatusIndex].validatedAt = new Date();
    ccvRecord.updatedAt = new Date();
    
    console.log(`  📝 Updated ${departmentName} status to: ${status}`);
    console.log(`  📝 Reason: ${remarks || '(none)}'}`);

    // Check if all departments are now approved
    const allApproved = ccvRecord.departmentStatuses.every(d => d.status === 'Approved');
    const anyRejected = ccvRecord.departmentStatuses.some(d => d.status === 'Rejected');

    // Update overall status
    if (allApproved && ccvRecord.overallStatus !== 'Completed') {
      ccvRecord.overallStatus = 'Completed';
      ccvRecord.completedAt = new Date();
      console.log(`✅ ALL DEPARTMENTS APPROVED! Overall status → COMPLETED`);
    } else if (anyRejected && ccvRecord.overallStatus !== 'Rejected' && ccvRecord.overallStatus !== 'Resubmission') {
      ccvRecord.overallStatus = 'Rejected';
      console.log(`❌ REQUEST REJECTED BY ${departmentName}! Overall status → REJECTED`);
    }

    // Save the updated record
    const savedRecord = await ccvRecord.save();
    
    console.log(`  💾 Record saved successfully`);
    console.log(`  Verifying saved data:`);
    console.log(`    - Request ID: ${savedRecord._id}`);
    console.log(`    - Student SAP: ${savedRecord.sapid}`);
    console.log(`    - Department Statuses:`);
    savedRecord.departmentStatuses.forEach(d => {
      const marker = d.name === departmentName ? '📍' : '  ';
      console.log(`      ${marker} ${d.name}: ${d.status} (reason: ${d.reason || 'none'})`);
    });
    console.log(`    - Overall Status: ${savedRecord.overallStatus}`);

    // ✅ SYNC TO DepartmentClearance for dashboard queries
    const DepartmentClearance = require('../models/DepartmentClearance');
    console.log(`\n📊 Syncing to DepartmentClearance...`);
    
    const syncResult = await DepartmentClearance.updateMany(
      { clearance_request_id: requestId },
      {
        $set: {
          status: status,
          remarks: remarks || (status === 'Approved' ? 'Approved by ' + departmentName : ''),
          approved_by: req.user.email || req.user.full_name,
          approved_at: status === 'Approved' ? new Date() : null
        }
      }
    );
    
    console.log(`   Updated ${syncResult.modifiedCount} DepartmentClearance records`);
    console.log(`   Status in DepartmentClearance: ${status}\n`);

    // Send notification to student
    const notificationMessage = status === 'Approved'
      ? `Your clearance request has been APPROVED by ${departmentName} department.`
      : `Your clearance request has been REJECTED by ${departmentName} department.\n\nReason: ${remarks || 'See remarks from department staff'}\n\nYou can resubmit your request after addressing the concerns.`;

    const notification = new Message({
      sender_id: new mongoose.Types.ObjectId(),
      sender_name: 'System',
      sender_role: 'system',
      sender_sapid: 'SYSTEM',
      recipient_sapid: studentSapId.toString().trim(),
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
 * Student resubmits after rejection and system sets status back to Pending for department review
 */
router.post('/clearance/department/resubmit', verifyToken, async (req, res) => {
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

    // Verify it belongs to this student
    if (ccvRecord.sapid !== studentSapId.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'You do not have permission to resubmit this request'
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

    // Reset department status to Pending for re-review
    ccvRecord.departmentStatuses[deptStatusIndex].status = 'Pending';
    ccvRecord.departmentStatuses[deptStatusIndex].validatedAt = new Date();
    ccvRecord.departmentStatuses[deptStatusIndex].reason = 'Resubmitted by student';

    // Track resubmission
    ccvRecord.submissionCount = (ccvRecord.submissionCount || 1) + 1;

    // Archive current state before update
    if (!ccvRecord.previousSubmissions) {
      ccvRecord.previousSubmissions = [];
    }
    ccvRecord.previousSubmissions.push({
      submissionDate: new Date(),
      overallStatus: ccvRecord.overallStatus,
      departmentStatuses: ccvRecord.departmentStatuses.map(d => ({
        name: d.name,
        status: d.status,
        reason: d.reason
      }))
    });

    // Update overall status
    const anyRejected = ccvRecord.departmentStatuses.some(d => d.status === 'Rejected');
    const allApproved = ccvRecord.departmentStatuses.every(d => d.status === 'Approved');

    if (allApproved) {
      ccvRecord.overallStatus = 'Completed';
      ccvRecord.completedAt = new Date();
      console.log(`✅ ALL DEPARTMENTS NOW APPROVED!\n`);
    } else if (!anyRejected && ccvRecord.overallStatus === 'Rejected') {
      // No more rejections, but not all approved yet → move to Resubmission
      ccvRecord.overallStatus = 'Resubmission';
      console.log(`🔄 Status changed to RESUBMISSION - awaiting department review\n`);
    }

    ccvRecord.updatedAt = new Date();
    await ccvRecord.save();

    // Send notification to student
    const notificationMessage = `You have successfully resubmitted your clearance request for ${department} department. Your request is now pending review.`;
    const notification = new Message({
      sender_id: new mongoose.Types.ObjectId(),
      sender_name: 'System',
      sender_role: 'system',
      sender_sapid: 'SYSTEM',
      recipient_sapid: studentSapId.toString().trim(),
      recipient_id: ccvRecord.student_id,
      recipient_department: 'System',
      subject: `🔄 Clearance Resubmitted - ${department}`,
      message: notificationMessage,
      message_type: 'notification',
      is_read: false,
      createdAt: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: `Request resubmitted to ${department}. Status changed to Pending for re-review.`,
      data: {
        requestId: requestId,
        department: department,
        newStatus: 'Pending',
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
