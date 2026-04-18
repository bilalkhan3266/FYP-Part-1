/**
 * NEW: POST /api/clearance-requests (COMPREHENSIVE VALIDATION)
 * 
 * Validates student against ALL departments in ONE comprehensive pass
 * NOT sequential - checks all departments at once using sapId
 * 
 * Features:
 * - Uses sapId to validate against DepartmentIssue collection
 * - Marks each department as Approved/Rejected with specific reasons
 * - Generates certificate ONLY if all departments approved
 * - Enforces submission control (block if already completed)
 * - Allows resubmission only after rejection
 */

const { sendClearanceCertificateEmail } = require("../utils/emailService");

module.exports = function setupClearanceEndpoint(app, verifyToken) {
  app.post('/api/clearance-requests', verifyToken, async (req, res) => {
    try {
      const { student_name, sapid, registration_no, father_name, program, semester, degree_status } = req.body;

      console.log('\n📝 CLEARANCE REQUEST RECEIVED');
      console.log('  Student:', student_name);
      console.log('  SAP ID:', sapid);
      console.log('  Registration No:', registration_no);
      console.log('  User ID:', req.user.id);

      // ==================== VALIDATION ====================
      if (!student_name || student_name.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Student name is required' });
      }

      if (!sapid || sapid.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'SAP ID is required' });
      }

      if (!registration_no || registration_no.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Registration number is required' });
      }

      const regNoFormatted = registration_no.toString().trim().toUpperCase();
      if (!/^[A-Z0-9]+$/.test(regNoFormatted)) {
        return res.status(400).json({
          success: false,
          message: 'Registration number must be alphanumeric (A-Z and 0-9 only)'
        });
      }

      const existingRegNo = await ClearanceRequest.findOne({
        registration_no: regNoFormatted,
        student_id: { $ne: req.user.id }
      });

      if (existingRegNo) {
        return res.status(400).json({
          success: false,
          message: 'This registration number is already in use by another student'
        });
      }

      if (!father_name || father_name.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Father name is required' });
      }

      if (!program || program.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Program is required' });
      }

      if (!semester || semester.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Semester is required' });
      }

      const semesterNum = parseInt(semester.toString().trim());
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Semester must be a number between 1 and 12'
        });
      }

      if (!degree_status || degree_status.toString().trim() === '') {
        return res.status(400).json({ success: false, message: 'Degree status is required' });
      }

      // ==================== SUBMISSION CONTROL ====================
      console.log('\n🔒 CHECKING SUBMISSION CONTROL...');
      
      const submissionCheck = await canStudentSubmitClearance(sapid.toString().trim(), ComprehensiveClearanceValidation);
      
      if (!submissionCheck.canSubmit) {
        console.log(`❌ Cannot submit: ${submissionCheck.reason}`);
        return res.status(409).json({
          success: false,
          message: submissionCheck.reason,
          existingRecord: submissionCheck.existingRecord
        });
      }

      if (submissionCheck.isResubmission) {
        console.log(`🔄 RESUBMISSION ALLOWED - Previous request was rejected`);
        console.log(`   Student can fix issues and resubmit`);
      }

      // ==================== COMPREHENSIVE VALIDATION ====================
      console.log('\n🚀 STARTING COMPREHENSIVE CLEARANCE VALIDATION');
      console.log(`   Technology: Using sapId ${sapid} to check ALL departments at once`);

      const studentInfo = {
        student_name: student_name.toString().trim(),
        registration_no: regNoFormatted,
        father_name: father_name.toString().trim(),
        program: program.toString().trim(),
        semester: semesterNum.toString(),
        degree_status: degree_status.toString().trim()
      };

      const validationResult = await validateStudentClearanceAllDepartments(
        sapid.toString().trim(),
        studentInfo
      );

      // ==================== SAVE VALIDATION RESULT ====================
      console.log('\n💾 SAVING COMPREHENSIVE VALIDATION RESULT...');
      
      const comprehensiveRecord = new ComprehensiveClearanceValidation({
        student_id: req.user.id,
        ...validationResult
      });

      const savedRecord = await comprehensiveRecord.save();
      console.log(`✅ Validation result saved: ${savedRecord._id}`);

      // ==================== GENERATE CERTIFICATE IF APPROVED ====================
      if (validationResult.overallStatus === "Completed") {
        console.log('\n🎓 GENERATING CERTIFICATE...');
        
        const qrCode = `CLEARANCE_${sapid}_${savedRecord._id}`;
        
        await ComprehensiveClearanceValidation.findByIdAndUpdate(savedRecord._id, {
          certificateGenerated: true,
          qr_code: qrCode,
          certificate_generated_at: new Date(),
          completedAt: new Date()
        });

        console.log(`✅ Certificate generated with QR: ${qrCode}`);

        // ==================== SEND CERTIFICATE EMAIL ====================
        console.log('📧 Sending clearance certificate email...');
        try {
          const User = require("../models/User");
          const student = await User.findById(req.user.id);
          console.log(`   Student found: ${student ? 'YES' : 'NO'}`);
          if (student) {
            console.log(`   Student email: ${student.email}`);
            console.log(`   Student full_name: ${student.full_name}`);
            console.log(`   Student department: ${student.department}`);
          }
          
          if (student && student.email) {
            console.log(`\n📨 Calling sendClearanceCertificateEmail for ${sapid}...`);
            const emailResult = await sendClearanceCertificateEmail({
              studentName: student.full_name || student.name || sapid,
              studentEmail: student.email,
              sapId: sapid,
              department: student.department || validationResult.departmentStatuses?.[0]?.name || "N/A",
              program: program || "N/A",
              qrCode: qrCode,
              approvedBy: "All 5 Departments",
              approvedAt: new Date(),
              departments: validationResult.departmentStatuses.map(d => ({
                name: d.name,
                status: d.status
              }))
            });
            
            if (emailResult.success) {
              console.log(`✅ Certificate email sent successfully to ${student.email}`);
            } else {
              console.error(`❌ Certificate email FAILED: ${emailResult.reason || emailResult.error}`);
            }
          } else {
            console.error('❌ Student record or email not found in database');
            if (!student) {
              console.error(`   Could not find user with ID: ${req.user.id}`);
            } else {
              console.error(`   User found but email is empty: ${student.email}`);
            }
          }
        } catch (emailErr) {
          console.error('❌ Error in certificate email process:', emailErr.message);
          console.error('   Stack:', emailErr.stack);
        }
        
        // Send approval notification
        await new Message({
          conversation_id: `${sapid}-clearance-approved-${Date.now()}`,
          sender_id: new mongoose.Types.ObjectId(),
          sender_name: "Clearance System",
          sender_role: "system",
          sender_sapid: "SYSTEM",
          recipient_sapid: sapid,
          recipient_id: req.user.id,
          recipient_department: "System",
          subject: "✅ CLEARANCE APPROVED - Certificate Ready",
          message: `Congratulations! Your clearance request has been APPROVED by all 5 departments. Your certificate is ready for download from your dashboard and has been sent to your email.`,
          message_type: "notification"
        }).save().catch(err => console.error('Error saving notification:', err));
      } else {
        console.log('\n❌ REJECTED - One or more departments have pending dues');
        console.log(`   Rejected departments: ${validationResult.rejectedDepartments.join(", ")}`);
        
        // Send rejection notification with specific reasons
        const reasons = validationResult.departmentStatuses
          .filter(d => d.status === "Rejected")
          .map(d => `${d.name}: ${d.reason}`)
          .join("\n");

        await new Message({
          conversation_id: `${sapid}-clearance-rejected-${Date.now()}`,
          sender_id: new mongoose.Types.ObjectId(),
          sender_name: "Clearance System",
          sender_role: "system",
          sender_sapid: "SYSTEM",
          recipient_sapid: sapid,
          recipient_id: req.user.id,
          recipient_department: "System",
          subject: "⚠️ CLEARANCE REJECTED - Action Required",
          message: `Your clearance request has been rejected due to pending issues:\n\n${reasons}\n\nPlease fix these issues and resubmit your request.`,
          message_type: "notification"
        }).save().catch(err => console.error('Error saving notification:', err));
      }

      // ==================== RESPONSE ====================
      console.log('\n📊 SENDING RESPONSE TO CLIENT');
      
      return res.status(201).json({
        success: true,
        message: validationResult.overallStatus === "Completed" 
          ? "✅ Clearance APPROVED - All departments cleared!"
          : "❌ Clearance REJECTED - Please fix the issues and resubmit",
        validationId: savedRecord._id,
        overallStatus: validationResult.overallStatus,
        certificateGenerated: validationResult.certificateGenerated,
        departmentStatuses: validationResult.departmentStatuses.map(d => ({
          name: d.name,
          status: d.status,
          reason: d.reason
        })),
        approvedDepartments: validationResult.approvedDepartments,
        rejectedDepartments: validationResult.rejectedDepartments,
        isResubmission: submissionCheck.isResubmission || false
      });

    } catch (err) {
      console.error('\n❌ CLEARANCE REQUEST ERROR:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to process clearance request: ' + err.message
      });
    }
  });
};
