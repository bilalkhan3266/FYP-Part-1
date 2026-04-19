const nodemailer = require("nodemailer");

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send clearance certificate email to student
 */
const sendClearanceCertificateEmail = async ({
  studentName,
  studentEmail,
  sapId,
  department,
  program,
  qrCode,
  approvedBy,
  approvedAt,
  departments,
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email not configured (EMAIL_USER / EMAIL_PASS missing). Skipping email.");
    return { success: false, reason: "Email not configured" };
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const certificateLink = `${frontendUrl}/student-certificate`;
  const formattedDate = new Date(approvedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deptRows = (departments || [])
    .map(
      (d, i) =>
        `<tr>
          <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:8px 12px;border:1px solid #ddd">${d.name}</td>
          <td style="padding:8px 12px;border:1px solid #ddd;color:#16a34a;font-weight:600">✓ ${d.status}</td>
        </tr>`
    )
    .join("");

  const htmlContent = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#003366,#00509e);padding:30px 40px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:1px">🎓 Riphah International University</h1>
      <p style="color:#cfd8dc;margin:8px 0 0;font-size:14px">Student Clearance System</p>
    </div>

    <!-- Body -->
    <div style="padding:30px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <h2 style="color:#003366;margin:0 0 8px;font-size:20px">✅ Clearance Certificate Approved</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
        Congratulations! Your clearance process has been <strong>successfully completed</strong> 
        and approved by all departments. Your clearance certificate is now ready.
      </p>

      <!-- Student Details -->
      <div style="background:#f0f4f9;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 0;color:#666;width:140px">Student Name:</td><td style="padding:4px 0;font-weight:600">${studentName}</td></tr>
          <tr><td style="padding:4px 0;color:#666">SAP ID:</td><td style="padding:4px 0;font-weight:600">${sapId}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Department:</td><td style="padding:4px 0;font-weight:600">${department || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Program:</td><td style="padding:4px 0;font-weight:600">${program || "N/A"}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Approved By:</td><td style="padding:4px 0;font-weight:600">${approvedBy}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Date:</td><td style="padding:4px 0;font-weight:600">${formattedDate}</td></tr>
        </table>
      </div>

      <!-- Department Clearance Table -->
      ${
        departments && departments.length > 0
          ? `<h3 style="color:#003366;font-size:15px;margin:20px 0 10px">Department Clearance Status</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <thead>
            <tr style="background:#003366;color:#fff">
              <th style="padding:8px 12px;text-align:center">#</th>
              <th style="padding:8px 12px;text-align:left">Department</th>
              <th style="padding:8px 12px;text-align:left">Status</th>
            </tr>
          </thead>
          <tbody>${deptRows}</tbody>
        </table>`
          : ""
      }

      <!-- Certificate Link -->
      <div style="text-align:center;margin:24px 0">
        <a href="${certificateLink}" 
           style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:0.5px">
          📄 View & Print Certificate
        </a>
      </div>

      <p style="color:#555;font-size:14px;line-height:1.6;text-align:center">
        Or copy this link: <a href="${certificateLink}" style="color:#667eea">${certificateLink}</a>
      </p>

      <!-- QR Info -->
      ${
        qrCode
          ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
          <p style="margin:0 0 6px;color:#333;font-size:14px;font-weight:600">🔐 Verification QR Code</p>
          <p style="margin:0;color:#666;font-size:13px">Your certificate contains a QR code for authenticity verification.</p>
          <p style="margin:8px 0 0;color:#999;font-size:12px">Code: <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px">${qrCode}</code></p>
        </div>`
          : ""
      }

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;text-align:center;color:#999;font-size:12px">
        <p style="margin:0 0 4px">This is an automated email from the Student Clearance System.</p>
        <p style="margin:0 0 4px">Please do not reply to this email.</p>
        <p style="margin:0">© ${new Date().getFullYear()} Riphah International University</p>
      </div>
    </div>
  </div>
  `;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Student Clearance System" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: "✅ Student Clearance Certificate Approved",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Clearance email sent to ${studentEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send clearance email to ${studentEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { 
  sendClearanceCertificateEmail,
  sendPasswordResetEmail,
  sendOtpEmail
};

/**
 * Send password reset code to user email
 */
const sendPasswordResetEmail = async ({
  userName,
  userEmail,
  resetCode,
  expiresInMinutes = 15
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email not configured. Skipping password reset email.");
    return { success: false, reason: "Email not configured" };
  }

  const htmlContent = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:linear-gradient(135deg,#1a3a52,#2c3e50);padding:40px 40px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-family:'Georgia','serif'">🔐 Password Reset</h1>
      <p style="color:#d4a574;margin:8px 0 0;font-size:13px;letter-spacing:1px;font-weight:600">RIPHAH CLEARANCE PORTAL</p>
    </div>
    <div style="padding:40px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f8f9fa">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
        Hello ${userName || 'User'},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
        We received a request to reset your password. Use the code below to create a new password.
      </p>
      <div style="background:linear-gradient(135deg,rgba(26,58,82,0.05),rgba(212,165,116,0.1));border:3px solid #d4a574;border-radius:12px;padding:30px;margin:30px 0;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 12px;letter-spacing:1px">YOUR RESET CODE</p>
        <div style="background:#1a3a52;color:#d4a574;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;padding:20px;border-radius:8px;letter-spacing:3px;margin-bottom:16px;word-spacing:8px">
          ${resetCode}
        </div>
        <p style="color:#666;font-size:13px;margin:0">
          This code will expire in <strong>${expiresInMinutes} minutes</strong>
        </p>
      </div>
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="color:#856404;font-size:13px;margin:0">
          <strong>⚠️ Security Notice:</strong> If you did not request this, ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Riphah Clearance System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🔐 Password Reset Code - Riphah Clearance Portal",
      html: htmlContent,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${userEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send password reset email: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Send OTP verification email for signup
 */
const sendOtpEmail = async ({ userName, userEmail, otp, expiresInMinutes = 5 }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email not configured. Skipping OTP email.");
    return { success: false, reason: "Email not configured" };
  }

  const htmlContent = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:linear-gradient(135deg,#1a3a52,#2c3e50);padding:40px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-family:'Georgia','serif'">🎓 Email Verification</h1>
      <p style="color:#d4a574;margin:8px 0 0;font-size:13px;letter-spacing:1px;font-weight:600">RIPHAH CLEARANCE PORTAL</p>
    </div>
    <div style="padding:40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f8f9fa">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
        Hello <strong>${userName || 'Student'}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
        Thank you for signing up! Please use the verification code below to complete your registration.
      </p>
      <div style="background:linear-gradient(135deg,rgba(26,58,82,0.05),rgba(212,165,116,0.1));border:3px solid #d4a574;border-radius:12px;padding:30px;margin:30px 0;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 12px;letter-spacing:1px">YOUR VERIFICATION CODE</p>
        <div style="background:#1a3a52;color:#d4a574;font-family:'Courier New',monospace;font-size:36px;font-weight:bold;padding:20px;border-radius:8px;letter-spacing:8px;margin-bottom:16px">
          ${otp}
        </div>
        <p style="color:#666;font-size:13px;margin:0">
          This code will expire in <strong>${expiresInMinutes} minutes</strong>
        </p>
      </div>
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="color:#856404;font-size:13px;margin:0">
          <strong>⚠️ Security Notice:</strong> If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Riphah Clearance System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🔐 Your Verification Code - Riphah Clearance Portal",
      html: htmlContent,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${userEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send OTP email: ${err.message}`);
    return { success: false, error: err.message };
  }
};

