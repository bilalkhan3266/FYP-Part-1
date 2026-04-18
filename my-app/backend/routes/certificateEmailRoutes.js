// backend/routes/certificateEmailRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ComprehensiveClearanceValidation = require("../models/ComprehensiveClearanceValidation");
const { sendClearanceCertificateEmail } = require("../utils/emailService");

/**
 * POST /api/resend-certificate-email
 * Student can resend their clearance certificate email
 */
router.post("/resend-certificate-email", async (req, res) => {
  try {
    const { validationId } = req.body;
    const userId = req.user?.id;
    const sapId = req.user?.sap;

    console.log('\n📧 RESEND CERTIFICATE EMAIL REQUEST');
    console.log(`   User ID: ${userId}`);
    console.log(`   SAP ID: ${sapId}`);
    console.log(`   Validation ID: ${validationId}`);

    if (!userId || !validationId) {
      return res.status(400).json({
        success: false,
        message: "User authentication or validation ID missing"
      });
    }

    // Get the clearance record
    const clearanceRecord = await ComprehensiveClearanceValidation.findOne({
      _id: validationId,
      student_id: userId,
      overallStatus: 'Completed',
      certificateGenerated: true
    });

    if (!clearanceRecord) {
      return res.status(404).json({
        success: false,
        message: "Clearance certificate not found or not authorized"
      });
    }

    // Get student info
    const student = await User.findById(userId);
    if (!student || !student.email) {
      return res.status(400).json({
        success: false,
        message: "Student email not found"
      });
    }

    console.log(`\n📨 Resending certificate to: ${student.email}`);

    // Send the email
    const emailResult = await sendClearanceCertificateEmail({
      studentName: student.full_name || student.name || clearanceRecord.student_name,
      studentEmail: student.email,
      sapId: clearanceRecord.sapid,
      department: student.department || clearanceRecord.departmentStatuses?.[0]?.name || "N/A",
      program: clearanceRecord.program || "N/A",
      qrCode: clearanceRecord.qr_code,
      approvedBy: "Clearance System",
      approvedAt: clearanceRecord.completedAt,
      departments: clearanceRecord.departmentStatuses || []
    });

    if (emailResult.success) {
      console.log(`✅ Certificate email resent to ${student.email}`);
      return res.json({
        success: true,
        message: `Certificate email has been resent to ${student.email}. Please check your inbox and spam folder.`,
        messageId: emailResult.messageId
      });
    } else {
      console.error(`❌ Failed to resend email: ${emailResult.error || emailResult.reason}`);
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${emailResult.error || emailResult.reason}`
      });
    }

  } catch (err) {
    console.error('❌ Resend email error:', err.message);
    res.status(500).json({
      success: false,
      message: "Failed to resend certificate email: " + err.message
    });
  }
});

/**
 * GET /api/certificate-email-test
 * Test endpoint to send a test email to student
 */
router.get("/certificate-email-test", async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Get student
    const student = await User.findById(userId);
    if (!student || !student.email) {
      return res.status(400).json({
        success: false,
        message: "Student email not configured",
        studentRecord: student ? {
          name: student.full_name,
          email: student.email || "NOT SET",
          sap: student.sap
        } : null
      });
    }

    console.log(`\n🧪 Sending test email to ${student.email}`);

    // Send test email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const testEmail = {
      from: {
        name: "Riphah Clearance System",
        address: process.env.EMAIL_USER
      },
      to: student.email,
      subject: "🧪 Test Email - Clearance System Configuration Check",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff">
          <div style="background:linear-gradient(135deg,#1a3a52,#2c3e50);padding:40px 40px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:28px">🧪 Test Email</h1>
            <p style="color:#d4a574;margin:8px 0 0">Email Configuration Check</p>
          </div>

          <div style="padding:40px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f8f9fa">
            <h2 style="color:#1a3a52;margin:0 0 20px">✅ Email Configuration is Working!</h2>
            
            <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
              Dear ${student.full_name || "Student"},
            </p>

            <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
              If you received this email, your email address is correctly configured in the system and you should receive certificate emails when your clearance is approved.
            </p>

            <div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px 20px;margin:20px 0;border-radius:4px">
              <p style="color:#2e7d32;font-weight:bold;margin:0 0 8px">Sender Details:</p>
              <p style="color:#333;margin:0;font-size:13px">
                <strong>From:</strong> Riphah Clearance System<br>
                <strong>Email Service:</strong> Gmail<br>
                <strong>Configuration:</strong> ${process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}<br>
                <strong>Test Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>

            <p style="color:#666;font-size:13px;line-height:1.6;margin:20px 0">
              <strong>Note:</strong> If you don't see certificate emails in your inbox, please check:
              <ol style="margin:8px 0;padding-left:20px">
                <li>Spam/Junk folder</li>
                <li>Promotions tab (if using Gmail)</li>
                <li>Email filters or rules</li>
              </ol>
            </p>

            <div style="border-top:2px solid #d4a574;padding-top:20px;margin-top:32px;text-align:center">
              <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 8px">Riphah International University</p>
              <p style="color:#666;font-size:12px;margin:0">Student Clearance Portal<br>© ${new Date().getFullYear()} All rights reserved</p>
            </div>
          </div>
        </div>
      `,
      reply_to: process.env.EMAIL_USER,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Riphah-Clearance-System/1.0'
      }
    };

    const info = await transporter.sendMail(testEmail);

    console.log(`✅ Test email sent to ${student.email}`);
    console.log(`   Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      message: `Test email sent to ${student.email}`,
      studentRecord: {
        name: student.full_name,
        email: student.email,
        sap: student.sap,
        department: student.department
      },
      messageId: info.messageId
    });

  } catch (err) {
    console.error('❌ Test email error:', err.message);
    res.status(500).json({
      success: false,
      message: "Test email failed: " + err.message,
      error: err.message
    });
  }
});

module.exports = router;
