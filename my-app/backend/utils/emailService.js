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
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 CLEARANCE CERTIFICATE EMAIL SERVICE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Student Name: ${studentName}`);
  console.log(`Student Email: ${studentEmail}`);
  console.log(`SAP ID: ${sapId}`);
  console.log(`Email User Configured: ${!!process.env.EMAIL_USER}`);
  console.log(`Email Pass Configured: ${!!process.env.EMAIL_PASS}`);
  console.log('═══════════════════════════════════════════════════════');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL CONFIGURATION ERROR: EMAIL_USER or EMAIL_PASS missing in .env");
    console.error(`   EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.error(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***SET***' : 'NOT SET'}`);
    return { success: false, reason: "Email credentials not configured in .env" };
  }

  if (!studentEmail || !studentEmail.includes('@')) {
    console.error(`❌ INVALID EMAIL: ${studentEmail}`);
    return { success: false, reason: "Invalid student email address" };
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const certificateLink = `${frontendUrl}/student-certificate`;
  
  // Create verification URL for QR code
  const verificationUrl = `${apiUrl}/api/verify-certificate/${encodeURIComponent(qrCode)}`;
  
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
    <div style="background:linear-gradient(135deg,#1a3a52,#2c3e50);padding:40px 40px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-family:'Georgia','serif'">🎓 RIPHAH INTERNATIONAL UNIVERSITY</h1>
      <p style="color:#d4a574;margin:8px 0 0;font-size:13px;letter-spacing:1px;font-weight:600">OFFICE OF THE REGISTRAR</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f8f9fa">
      <h2 style="color:#1a3a52;margin:0 0 8px;font-size:24px;font-family:'Georgia','serif';font-weight:bold;letter-spacing:0.5px">✅ Clearance Certificate Approved</h2>
      <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px">
        Dear <strong>${studentName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
        Congratulations! Your clearance process has been <strong style="color:#27ae60">successfully completed</strong> 
        and approved by all five departments. Your official clearance certificate is now ready for download and printing.
      </p>

      <!-- Student Details -->
      <div style="background:linear-gradient(135deg,rgba(212,165,116,0.05),rgba(212,165,116,0.1));border:2px solid #d4a574;border-radius:8px;padding:20px 24px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.8">
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600;width:160px">Student Name:</td><td style="padding:6px 0;color:#2c3e50">${studentName}</td></tr>
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600">SAP ID:</td><td style="padding:6px 0;color:#2c3e50">${sapId}</td></tr>
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600">Department:</td><td style="padding:6px 0;color:#2c3e50">${department || "N/A"}</td></tr>
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600">Program:</td><td style="padding:6px 0;color:#2c3e50">${program || "N/A"}</td></tr>
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600">Approved By:</td><td style="padding:6px 0;color:#2c3e50">${approvedBy}</td></tr>
          <tr><td style="padding:6px 0;color:#1a3a52;font-weight:600">Certificate Date:</td><td style="padding:6px 0;color:#2c3e50;font-weight:bold">${formattedDate}</td></tr>
        </table>
      </div>

      <!-- Department Clearance Table -->
      ${
        departments && departments.length > 0
          ? `<h3 style="color:#1a3a52;font-size:17px;margin:28px 0 14px;font-weight:bold;border-bottom:2px solid #d4a574;padding-bottom:8px">Department Clearance Status</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <thead>
            <tr style="background:#2c3e50;color:#fff">
              <th style="padding:12px 12px;text-align:center;font-weight:bold">#</th>
              <th style="padding:12px 12px;text-align:left;font-weight:bold">Department</th>
              <th style="padding:12px 12px;text-align:center;font-weight:bold">Status</th>
            </tr>
          </thead>
          <tbody>${deptRows}</tbody>
        </table>`
          : ""
      }

      <!-- Certificate Link -->
      <div style="text-align:center;margin:28px 0">
        <a href="${certificateLink}" 
           style="display:inline-block;background:linear-gradient(135deg,#1a3a52,#2c3e50);color:#fff;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(26,58,82,0.2);transition:transform 0.2s">
          📄 Download & Print Certificate
        </a>
      </div>

      <p style="color:#555;font-size:14px;line-height:1.6;text-align:center;margin:10px 0">
        Or visit your dashboard: <a href="${certificateLink}" style="color:#1a3a52;text-decoration:underline">${certificateLink}</a>
      </p>

      <!-- QR Code Section -->
      ${
        qrCode
          ? `<div style="background:linear-gradient(135deg,#f8f9fa,#fff);border:2px solid #d4a574;border-radius:12px;padding:24px;margin:30px 0;text-align:center">
          <p style="margin:0 0 12px;color:#1a3a52;font-size:16px;font-weight:bold">🔐 Verify Certificate Authenticity</p>
          <div style="display:inline-block;padding:15px;background:#fff;border:2px solid #2c3e50;border-radius:8px">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}" alt="Certificate QR Code" style="width:200px;height:200px;display:block;margin-bottom:12px;border-radius:4px">
            <p style="margin:0 0 8px;color:#666;font-size:12px"><strong>Verify at:</strong></p>
            <p style="margin:0;color:#1a3a52;font-size:11px;font-family:'Courier New',monospace;word-break:break-all;background:#f0f0f0;padding:8px;border-radius:4px">${verificationUrl}</p>
          </div>
          <p style="margin:12px 0 0;color:#666;font-size:13px">Scan this QR code with your phone camera to verify the authenticity of your clearance certificate online.</p>
        </div>`
          : ""
      }

      <!-- Footer -->
      <div style="border-top:2px solid #d4a574;padding-top:20px;margin-top:32px;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 8px">Riphah International University</p>
        <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 8px">
          Office of the Registrar<br>
          <strong>Certificate Verification:</strong> Scan the QR code above with any smartphone camera to instantly verify this certificate online.<br>
          This is an official document issued by Riphah International University.
        </p>
        <p style="color:#999;font-size:11px;margin:0">© ${new Date().getFullYear()} Riphah International University. All rights reserved.</p>
      </div>
    </div>
  </div>
  `;

  try {
    console.log('📨 Creating email transporter...');
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "Riphah Clearance System",
        address: process.env.EMAIL_USER
      },
      to: studentEmail,
      subject: "✅ Your Clearance Certificate is Ready - Riphah University",
      html: htmlContent,
      reply_to: process.env.EMAIL_USER,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Riphah-Clearance-System/1.0',
        'Importance': 'high',
        'X-Originating-IP': '[127.0.0.1]'
      }
    };

    console.log('📨 Sending email with options:');
    console.log(`   From: ${mailOptions.from.name} <${mailOptions.from.address}>`);
    console.log(`   To: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}`);

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Clearance email SENT to ${studentEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ FAILED to send clearance email to ${studentEmail}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
    return { success: false, error: err.message };
  }
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
    console.warn("⚠️ Email not configured (EMAIL_USER / EMAIL_PASS missing). Skipping password reset email.");
    return { success: false, reason: "Email not configured" };
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 PASSWORD RESET EMAIL SERVICE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Email User: ${process.env.EMAIL_USER}`);
  console.log(`Email Pass Length: ${process.env.EMAIL_PASS.length} characters`);
  console.log(`Recipient: ${userEmail}`);
  console.log('═══════════════════════════════════════════════════════');

  const htmlContent = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a3a52,#2c3e50);padding:40px 40px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-family:'Georgia','serif'">🔐 Password Reset</h1>
      <p style="color:#d4a574;margin:8px 0 0;font-size:13px;letter-spacing:1px;font-weight:600">RIPHAH CLEARANCE PORTAL</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;background:#f8f9fa">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
        Hello ${userName || 'User'},
      </p>
      <p style="color:#555;font-size:15px;line-height:1.8;margin:0 0 24px">
        We received a request to reset your password. Use the code below to create a new password.
      </p>

      <!-- Reset Code Box -->
      <div style="background:linear-gradient(135deg,rgba(26,58,82,0.05),rgba(212,165,116,0.1));border:3px solid #d4a574;border-radius:12px;padding:30px;margin:30px 0;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 12px;letter-spacing:1px">YOUR RESET CODE</p>
        <div style="background:#1a3a52;color:#d4a574;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;padding:20px;border-radius:8px;letter-spacing:3px;margin-bottom:16px;word-spacing:8px">
          ${resetCode}
        </div>
        <p style="color:#666;font-size:13px;margin:0">
          This code will expire in <strong>${expiresInMinutes} minutes</strong>
        </p>
      </div>

      <!-- Instructions -->
      <div style="background:#fff;border-left:4px solid #2c3e50;padding:16px 20px;margin:20px 0;border-radius:4px">
        <p style="color:#1a3a52;font-size:14px;font-weight:bold;margin:0 0 8px">How to reset your password:</p>
        <ol style="color:#555;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
          <li>Enter your email address on the password reset page</li>
          <li>Paste the code above into the verification field</li>
          <li>Create and confirm your new password</li>
          <li>Sign in with your new password</li>
        </ol>
      </div>

      <!-- Security Warning -->
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="color:#856404;font-size:13px;margin:0">
          <strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email or contact support immediately. Your account is secure until you reset your password.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top:2px solid #d4a574;padding-top:20px;margin-top:32px;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 8px">Riphah International University</p>
        <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 8px">
          Student Clearance Portal<br>
          <strong>Email:</strong> support@riphah.edu.pk
        </p>
        <p style="color:#999;font-size:11px;margin:0">© ${new Date().getFullYear()} Riphah International University. All rights reserved.</p>
      </div>
    </div>
  </div>
  `;

  try {
    console.log('📨 Creating transporter...');
    const transporter = createTransporter();

    console.log('📨 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"Riphah Clearance System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🔐 Password Reset Code - Riphah Clearance Portal",
      html: htmlContent,
    };

    console.log('📨 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${userEmail}`);
    console.log('═══════════════════════════════════════════════════════\n');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('═══════════════════════════════════════════════════════');
    console.error(`❌ FAILED TO SEND PASSWORD RESET EMAIL`);
    console.error(`Error: ${err.message}`);
    console.error(`Error Code: ${err.code}`);
    console.error(`Stack: ${err.stack}`);
    console.error('═══════════════════════════════════════════════════════\n');
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

  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 OTP VERIFICATION EMAIL SERVICE');
  console.log(`   Recipient: ${userEmail}`);
  console.log('═══════════════════════════════════════════════════════');

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
          <strong>⚠️ Security Notice:</strong> If you did not request this verification, please ignore this email.
        </p>
      </div>
      <div style="border-top:2px solid #d4a574;padding-top:20px;margin-top:32px;text-align:center">
        <p style="color:#1a3a52;font-size:13px;font-weight:bold;margin:0 0 8px">Riphah International University</p>
        <p style="color:#999;font-size:11px;margin:0">&copy; ${new Date().getFullYear()} Riphah International University. All rights reserved.</p>
      </div>
    </div>
  </div>
  `;

  try {
    console.log(`📨 Creating email transporter for: ${process.env.EMAIL_SERVICE}`);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Riphah Clearance System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🔐 Your Verification Code - Riphah Clearance Portal",
      html: htmlContent,
    };

    console.log(`📬 Sending OTP email via ${process.env.EMAIL_SERVICE} to ${userEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP email successfully sent to ${userEmail} | Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ FAILED to send OTP email to ${userEmail}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Full error:`, err);
    return { success: false, error: err.message };
  }
};

module.exports = { 
  sendClearanceCertificateEmail,
  sendPasswordResetEmail,
  sendOtpEmail
};
