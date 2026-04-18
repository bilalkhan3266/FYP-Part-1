const nodemailer = require("nodemailer");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "your-email@gmail.com",
    pass: process.env.GMAIL_PASSWORD || "your-app-password"
  }
});

/**
 * Send clearance certificate via email
 * @param {Object} data - Email data
 * @param {String} data.studentEmail - Student's email address
 * @param {String} data.studentName - Student's full name
 * @param {String} data.sapId - Student SAP ID
 * @param {Buffer} data.pdfBuffer - PDF file buffer
 * @param {String} data.certificateId - Certificate ID
 * @param {Array} data.departments - Cleared departments
 * @param {String} data.verificationLink - Link to verify certificate
 * @returns {Promise<Object>} Email result
 */
async function sendCertificateEmail(data) {
  try {
    console.log("\n📧 SENDING CERTIFICATE EMAIL");
    console.log(`   To: ${data.studentEmail}`);
    console.log(`   Student: ${data.studentName}`);

    // Build department list for email
    const departmentList = data.departments
      .map(dept => `• ${dept}`)
      .join("\n");

    // Build verification link
    const verificationLink = data.verificationLink || `verified-certificate/${data.certificateId}`;

    // Email HTML template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
            }
            .email-content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #667eea;
              padding-bottom: 20px;
            }
            .logo {
              display: inline-block;
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 50%;
              line-height: 60px;
              text-align: center;
              color: white;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 10px;
            }
            h1 {
              color: #1a202c;
              margin: 0;
              font-size: 28px;
            }
            .subtitle {
              color: #667eea;
              font-size: 14px;
              margin-top: 5px;
            }
            .main-content {
              margin: 25px 0;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 15px;
              color: #2d3748;
            }
            .student-info {
              background: #f7fafc;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              color: #4a5568;
            }
            .info-value {
              color: #2d3748;
            }
            .departments-section {
              margin: 25px 0;
              background: #f0fff4;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #9ae6b4;
            }
            .departments-title {
              font-weight: bold;
              color: #22543d;
              margin-bottom: 10px;
            }
            .dept-list {
              color: #2d3748;
              white-space: pre-wrap;
              margin-left: 10px;
            }
            .button-section {
              text-align: center;
              margin: 30px 0;
            }
            .verify-button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              font-size: 16px;
              transition: transform 0.2s;
            }
            .verify-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
            }
            .download-info {
              background: #fef5e7;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #f39c12;
              margin: 25px 0;
              color: #7d6608;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #718096;
              font-size: 12px;
            }
            .certificate-id {
              background: #edf2f7;
              padding: 8px 12px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 11px;
              color: #2d3748;
              margin-top: 10px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              <div class="header">
                <div class="logo">R</div>
                <h1>🎓 Clearance Approved!</h1>
                <p class="subtitle">Your Clearance Certificate is Ready</p>
              </div>

              <div class="main-content">
                <p class="greeting">
                  Dear <strong>${data.studentName}</strong>,
                </p>

                <p>
                  Congratulations! Your clearance request has been <strong>successfully approved</strong> by all departments.
                  Your clearance certificate is attached to this email and is also available for download from your dashboard.
                </p>

                <div class="student-info">
                  <div class="info-row">
                    <span class="info-label">Student ID (SAP):</span>
                    <span class="info-value">${data.sapId}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Certificate ID:</span>
                    <span class="info-value">${data.certificateId.substring(0, 16)}...</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Approval Date:</span>
                    <span class="info-value">${new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div class="departments-section">
                  <div class="departments-title">✓ Cleared by All Departments:</div>
                  <div class="dept-list">${departmentList}</div>
                </div>

                <p>
                  You can now proceed with your registration and other academic processes that required clearance.
                </p>

                <div class="download-info">
                  <strong>📥 Certificate Attached:</strong> Your official clearance certificate (PDF) is attached to this email.
                  You can also download it from your student dashboard.
                </div>

                <div class="button-section">
                  <a href="${verificationLink}" class="verify-button">
                    Verify Your Certificate
                  </a>
                </div>

                <div class="certificate-id">
                  <strong>Certificate ID:</strong> ${data.certificateId}
                </div>

                <p style="margin-top: 30px; color: #718096;">
                  If you have any questions or concerns, please contact the Office of the Registrar.
                </p>
              </div>

              <div class="footer">
                <p>
                  <strong>Riphah International University</strong><br/>
                  Office of the Registrar<br/>
                  Islamabad, Pakistan<br/>
                  <br/>
                  This is an automated email. Please do not reply to this address.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email with attachment
    const mailOptions = {
      from: process.env.GMAIL_USER || "your-email@gmail.com",
      to: data.studentEmail,
      subject: "🎓 Your Clearance Certificate - Approved",
      html: emailHTML,
      attachments: [
        {
          filename: `Clearance_Certificate_${data.sapId}.pdf`,
          content: data.pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    };

    // Send the email
    const result = await transporter.sendMail(mailOptions);
    console.log(`   ✅ Email sent successfully`);
    console.log(`   Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
      email: data.studentEmail
    };
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    return {
      success: false,
      error: error.message,
      reason: "Failed to send certificate email"
    };
  }
}

/**
 * Send rejection notification email
 * @param {Object} data - Email data
 * @returns {Promise<Object>} Email result
 */
async function sendRejectionEmail(data) {
  try {
    console.log("\n📧 SENDING REJECTION NOTIFICATION");
    console.log(`   To: ${data.studentEmail}`);
    console.log(`   Student: ${data.studentName}`);

    // Build rejection reasons
    const reasonsList = data.rejectionReasons
      .map(reason => `• ${reason}`)
      .join("\n");

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border-radius: 10px;
            }
            .email-content {
              background: white;
              padding: 30px;
              border-radius: 8px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #f5576c;
              padding-bottom: 20px;
            }
            .alert {
              background: #fff5f5;
              border-left: 4px solid #f5576c;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              color: #742a2a;
            }
            .action-button {
              display: inline-block;
              padding: 12px 30px;
              background: #f5576c;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              <div class="header">
                <h1>⚠️ Clearance Request- Action Required</h1>
              </div>

              <p>Dear <strong>${data.studentName}</strong>,</p>

              <p>
                Your clearance request has been <strong>rejected</strong> due to pending issues that need to be resolved.
              </p>

              <div class="alert">
                <strong>Reasons for Rejection:</strong><br/>
                <div style="margin-top: 10px; white-space: pre-wrap;">${reasonsList}</div>
              </div>

              <p>
                <strong>What you need to do:</strong>
              </p>
              <ul>
                <li>Review the issues listed above</li>
                <li>Contact the respective departments to clear the pending items</li>
                <li>Once resolved, resubmit your clearance request</li>
              </ul>

              <p>
                You can resubmit your request from your student dashboard once you have cleared all pending issues.
              </p>

              <center>
                <a href="${data.dashboardLink}" class="action-button">
                  View Dashboard
                </a>
              </center>

              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 12px;">
                <p>
                  <strong>Riphah International University</strong><br/>
                  Office of the Registrar<br/>
                  Need help? Contact us at registrar@riphah.edu.pk
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER || "your-email@gmail.com",
      to: data.studentEmail,
      subject: "⚠️ Clearance Request - Action Required",
      html: emailHTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`   ✅ Rejection email sent successfully`);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error("❌ Rejection Email Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendCertificateEmail,
  sendRejectionEmail
};
