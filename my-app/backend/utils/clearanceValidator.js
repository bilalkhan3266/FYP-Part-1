const DepartmentIssue = require("../models/DepartmentIssue");

/**
 * Validates student clearance against ALL departments in one pass
 * 
 * @param {String} sapId - Student's SAP ID
 * @param {Object} studentInfo - Student info {student_name, registration_no, etc.}
 * @returns {Object} Validation result with department statuses and overall status
 */
async function validateStudentClearanceAllDepartments(sapId, studentInfo = {}) {
  console.log(`\n🔍 STARTING SEQUENTIAL CLEARANCE VALIDATION FOR SAP ID: ${sapId}`);
  console.log(`   📌 STRICT SEQUENCE: Will STOP on first rejection`);
  
  // Department sequence (STRICT ORDER)
  const departments = [
    "Coordination",
    "Transport",
    "Library",
    "Fee Department",
    "Student Service"
  ];

  const departmentStatuses = [];
  const pendingDepartments = [];
  const approvedDepartments = [];
  let rejectionFound = false;
  let rejectionDepartment = null;

  // Validate each department sequentially - STOP on first rejection
  for (let index = 0; index < departments.length; index++) {
    const dept = departments[index];
    console.log(`\n  📋 [${index + 1}/5] Checking ${dept}...`);
    
    // If rejection already found, mark remaining as "Not Processed"
    if (rejectionFound) {
      console.log(`    ⏳ NOT PROCESSED (blocking from ${rejectionDepartment})`);
      departmentStatuses.push({
        name: dept,
        status: "Not Processed",
        reason: `Blocked by rejection at ${rejectionDepartment}`,
        pendingItems: [],
        validatedAt: new Date()
      });
      continue;
    }
    
    try {
      // Check if student has ANY uncleared issues in this department
      const unclearedIssues = await DepartmentIssue.find({
        studentId: sapId.toString().trim(),
        departmentName: dept,
        status: { $ne: "Cleared" } // Any status that is NOT "Cleared"
      });

      console.log(`    Found ${unclearedIssues.length} uncleared issue(s)`);

      let status = "Approved";
      let reason = "No outstanding dues or items";
      let pendingItems = [];

      // If uncleared issues exist, department is rejected
      if (unclearedIssues.length > 0) {
        status = "Rejected";
        pendingItems = unclearedIssues.map(issue => {
          const itemDesc = `${issue.itemType}: ${issue.description}`;
          console.log(`      ❌ Pending: ${itemDesc} (Status: ${issue.status})`);
          return itemDesc;
        });
        reason = `Pending items not cleared: ${pendingItems.join(", ")}`;
        pendingDepartments.push(dept);
        
        // Mark rejection found - next departments will be "Not Processed"
        rejectionFound = true;
        rejectionDepartment = dept;
        
        console.log(`\n    🛑 REJECTION FOUND - BLOCKING FURTHER PROCESSING`);
      } else {
        console.log(`    ✅ ${dept} cleared - no pending issues`);
        approvedDepartments.push(dept);
      }

      departmentStatuses.push({
        name: dept,
        status: status,
        reason: reason,
        pendingItems: pendingItems,
        validatedAt: new Date()
      });

    } catch (err) {
      console.error(`    ❌ ERROR checking ${dept}:`, err.message);
      departmentStatuses.push({
        name: dept,
        status: "Rejected",
        reason: `System error during validation: ${err.message}`,
        pendingItems: [],
        validatedAt: new Date()
      });
      pendingDepartments.push(dept);
      
      // Mark rejection found
      rejectionFound = true;
      rejectionDepartment = dept;
    }
  }

  // Determine overall status
  let overallStatus = "Completed";
  let certificateGenerated = false;

  if (pendingDepartments.length > 0) {
    overallStatus = "Rejected";
    certificateGenerated = false;
    console.log(`\n⚠️  OVERALL STATUS: REJECTED AT ${rejectionDepartment}`);
    console.log(`   ❌ Rejected: ${rejectionDepartment}`);
    console.log(`   ⏳ Not Processed: ${departments.slice(departments.indexOf(rejectionDepartment) + 1).join(", ")}`);
  } else {
    overallStatus = "Completed";
    certificateGenerated = true;
    console.log(`\n✅ OVERALL STATUS: COMPLETED`);
    console.log(`   All departments approved!`);
  }

  const validationResult = {
    sapid: sapId.toString().trim(),
    student_name: studentInfo.student_name || "Unknown",
    registration_no: studentInfo.registration_no || sapId,
    father_name: studentInfo.father_name || "",
    program: studentInfo.program || "Unknown",
    semester: studentInfo.semester || "",
    degree_status: studentInfo.degree_status || "",
    
    departmentStatuses: departmentStatuses,
    overallStatus: overallStatus,
    certificateGenerated: certificateGenerated,
    approvedDepartments: approvedDepartments,
    rejectedDepartments: pendingDepartments,
    submissionCount: 1,
    submittedAt: new Date()
  };

  console.log(`\n📊 VALIDATION SUMMARY:`);
  console.log(`   Approved: ${approvedDepartments.length}/5 departments`);
  console.log(`   Rejected: ${pendingDepartments.length}/5 departments`);
  console.log(`   Overall: ${overallStatus}`);
  console.log(`   Certificate: ${certificateGenerated ? "✅ Will be generated" : "❌ Not generated"}`);

  return validationResult;
}

/**
 * Checks if a student can submit a new clearance request
 * 
 * @param {String} sapId - Student's SAP ID
 * @param {Object} ComprehensiveClearanceValidation - Model reference
 * @returns {Object} {canSubmit: boolean, reason: string, existingRecord: object}
 */
async function canStudentSubmitClearance(sapId, ComprehensiveClearanceValidation) {
  try {
    const existingRecord = await ComprehensiveClearanceValidation.findOne({
      sapid: sapId.toString().trim()
    }).sort({ submittedAt: -1 }); // Get latest submission

    if (!existingRecord) {
      return {
        canSubmit: true,
        reason: "No existing clearance record",
        existingRecord: null
      };
    }

    if (existingRecord.overallStatus === "Completed") {
      return {
        canSubmit: false,
        reason: "✅ You have already completed your clearance. Please do not resubmit.",
        existingRecord: existingRecord
      };
    }

    if (existingRecord.overallStatus === "Pending") {
      return {
        canSubmit: false,
        reason: "⏳ Your clearance request is already under process. Please wait for validation.",
        existingRecord: existingRecord
      };
    }

    if (existingRecord.overallStatus === "Rejected") {
      return {
        canSubmit: true,
        reason: "Your previous request was rejected. You can resubmit after fixing the issues.",
        existingRecord: existingRecord,
        isResubmission: true
      };
    }

    // ✅ Allow resubmission when status is "Resubmission"
    if (existingRecord.overallStatus === "Resubmission") {
      return {
        canSubmit: true,
        reason: "Your request is in resubmission state. You can submit again.",
        existingRecord: existingRecord,
        isResubmission: true
      };
    }

    return {
      canSubmit: false,
      reason: "Unable to determine clearance status",
      existingRecord: existingRecord
    };

  } catch (err) {
    console.error("Error checking student clearance eligibility:", err);
    return {
      canSubmit: false,
      reason: "System error during validation",
      existingRecord: null
    };
  }
}

module.exports = {
  validateStudentClearanceAllDepartments,
  canStudentSubmitClearance
};
