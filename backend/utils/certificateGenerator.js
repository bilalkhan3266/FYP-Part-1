const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const CERTIFICATES_DIR = path.join(__dirname, "..", "certificates");

// Ensure certificates directory exists
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

/**
 * Generate a QR code data URL.
 * @param {Object} data - { studentId, clearanceId, verificationUrl }
 * @returns {Promise<string>} base64 data URL
 */
async function generateQRCode(data) {
  const payload = JSON.stringify(data);
  return QRCode.toDataURL(payload, { width: 200, margin: 1 });
}

/**
 * Generate a clearance certificate PDF.
 * @param {Object} workflow - ClearanceWorkflow document
 * @param {string} qrDataUrl - QR code as base64 data URL
 * @returns {Promise<string>} file path of the generated certificate
 */
async function generateCertificatePDF(workflow, qrDataUrl) {
  return new Promise((resolve, reject) => {
    const fileName = `certificate_${workflow.sapid}_${Date.now()}.pdf`;
    const filePath = path.join(CERTIFICATES_DIR, fileName);
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- Header ---
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#0a1e3d")
      .text("RIPHAH INTERNATIONAL UNIVERSITY", { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#444")
      .text("Office of the Registrar", { align: "center" });

    doc.moveDown(0.5);
    doc
      .strokeColor("#0a1e3d")
      .lineWidth(2)
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .stroke();

    doc.moveDown(1);

    // --- Title ---
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#0a1e3d")
      .text("CLEARANCE CERTIFICATE", { align: "center" });

    doc.moveDown(1.5);

    // --- Student Info ---
    const infoStartY = doc.y;
    doc.fontSize(11).font("Helvetica").fillColor("#333");

    const fields = [
      ["Student Name", workflow.studentName],
      ["SAP ID", workflow.sapid],
      ["Registration No", workflow.registrationNo],
      ["Father's Name", workflow.fatherName],
      ["Program", workflow.program],
      ["Semester", workflow.semester],
      ["Degree Status", workflow.degreeStatus],
    ];

    fields.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .text(`${label}: `, { continued: true })
        .font("Helvetica")
        .text(value || "N/A");
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // --- Department Clearance Table ---
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#0a1e3d")
      .text("Department Clearance Status", { align: "center" });

    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 60;
    const col2 = 200;
    const col3 = 320;
    const col4 = 430;
    const rowHeight = 22;

    // Table header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#fff")
      .rect(col1, tableTop, 475, rowHeight)
      .fill("#0a1e3d");

    doc.fillColor("#fff");
    doc.text("Phase", col1 + 5, tableTop + 6, { width: 30 });
    doc.text("Department", col2 - 60, tableTop + 6, { width: 120 });
    doc.text("Status", col3 - 20, tableTop + 6, { width: 100 });
    doc.text("Approved By", col4 - 20, tableTop + 6, { width: 120 });

    // Table rows
    workflow.phases.forEach((phase, i) => {
      const y = tableTop + rowHeight * (i + 1);
      const bg = i % 2 === 0 ? "#f8f9fa" : "#ffffff";

      doc.rect(col1, y, 475, rowHeight).fill(bg);
      doc.fontSize(9).font("Helvetica").fillColor("#333");
      doc.text(`${i + 1}`, col1 + 5, y + 6, { width: 30 });
      doc.text(phase.name, col2 - 60, y + 6, { width: 120 });

      const statusColor = phase.status === "Approved" ? "#16a34a" : "#ef4444";
      doc.fillColor(statusColor).text(phase.status, col3 - 20, y + 6, { width: 100 });

      doc
        .fillColor("#333")
        .text(phase.approverName || "—", col4 - 20, y + 6, { width: 120 });
    });

    doc.moveDown(3);
    doc.y = tableTop + rowHeight * (workflow.phases.length + 1) + 20;

    // --- Completion Date ---
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#333")
      .text(
        `Date of Completion: ${
          workflow.completedAt
            ? new Date(workflow.completedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "N/A"
        }`,
        { align: "center" }
      );

    doc.moveDown(1);

    // --- QR Code ---
    if (qrDataUrl) {
      const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
      doc.image(qrBuffer, doc.page.width / 2 - 60, doc.y, {
        width: 120,
        height: 120,
      });
      doc.y += 130;
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#888")
        .text("Scan QR code to verify certificate authenticity", {
          align: "center",
        });
    }

    doc.moveDown(2);

    // --- Footer ---
    doc
      .fontSize(8)
      .fillColor("#999")
      .text(
        "This is a system-generated certificate. No signature is required.",
        { align: "center" }
      );
    doc.text(
      `Certificate ID: ${workflow._id} | Generated: ${new Date().toISOString()}`,
      { align: "center" }
    );

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

module.exports = { generateQRCode, generateCertificatePDF, CERTIFICATES_DIR };
