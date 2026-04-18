const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

/**
 * Generate a professional clearance certificate PDF
 * @param {Object} data - Certificate data
 * @param {String} data.studentName - Student's full name
 * @param {String} data.sapId - Student SAP ID
 * @param {String} data.certificateId - Certificate ID
 * @param {Array} data.departments - Array of cleared departments
 * @param {Date} data.date - Completion date
 * @param {String} data.qrCodeData - QR code data string
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateCertificatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("\n📄 GENERATING CERTIFICATE PDF");
      console.log(`   Student: ${data.studentName}`);
      console.log(`   SAP ID: ${data.sapId}`);

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true
      });

      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log(`   ✅ PDF generated: ${pdfBuffer.length} bytes`);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Set fonts
      const titleFont = "Helvetica-Bold";
      const bodyFont = "Helvetica";
      const smallFont = "Helvetica-Oblique";

      // ========== HEADER ==========
      // Top border line
      doc.strokeColor("#FFD700").lineWidth(3);
      doc.moveTo(50, 50).lineTo(545, 50).stroke();

      // University logo (circle)
      doc.fillColor("#1E40AF").circle(297.5, 100, 30).fill();
      doc.fillColor("#FFFFFF").font(titleFont, 24).text("R", 277.5, 85);

      // Title section
      doc.fillColor("#333333")
        .font("Helvetica", 10)
        .text("OFFICE OF THE REGISTRAR", {
          align: "center",
          lineGap: 2
        });

      doc.font(titleFont, 40).text("CLEARANCE", {
        align: "center",
        lineGap: 0
      });

      doc.font(titleFont, 40).text("CERTIFICATE", {
        align: "center",
        lineGap: 5
      });

      doc.font("Helvetica", 12).fillColor("#666666").text(
        "Faculty of Engineering & Applied Sciences",
        {
          align: "center",
          lineGap: 3
        }
      );

      // Gold accent line
      doc.moveTo(150, 220).lineTo(445, 220).strokeColor("#FFD700").lineWidth(2).stroke();

      // ========== MAIN CONTENT ==========
      doc.moveDown(2);
      doc.font(bodyFont, 12)
        .fillColor("#333333")
        .text("This is to certify that", {
          align: "center",
          lineGap: 5
        });

      doc.moveDown(0.5);

      // Student name box
      doc.rect(70, doc.y, 455, 50).strokeColor("#2563EB").lineWidth(2).stroke();
      doc.fillColor("#EFF6FF");
      doc.rect(70, doc.y - 50, 455, 50).fill();

      doc.font(titleFont, 28)
        .fillColor("#1E40AF")
        .text(data.studentName.toUpperCase(), 75, doc.y - 40, {
          align: "left",
          width: 445
        });

      doc.moveDown(3);

      // Student details
      doc.font(bodyFont, 11).fillColor("#333333");

      // Left column
      doc.font("Helvetica", 9)
        .fillColor("#666666")
        .text("STUDENT ID (SAP)", 80, doc.y, { width: 200 });
      doc.font(titleFont, 11)
        .fillColor("#333333")
        .text(data.sapId, 80, doc.y, { width: 200 });

      // Right column
      doc.font("Helvetica", 9)
        .fillColor("#666666")
        .text("DATE OF COMPLETION", 300, doc.y - 35, { width: 200 });
      const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.font(titleFont, 11)
        .fillColor("#333333")
        .text(formattedDate, 300, doc.y, { width: 200 });

      doc.moveDown(3);

      // Certificate body text
      doc.font(bodyFont, 11)
        .fillColor("#333333")
        .text(
          "has successfully completed all clearance requirements and has been cleared by all departments.",
          {
            align: "center",
            lineGap: 4
          }
        );

      doc.moveDown(2);

      // Departments section
      doc.font("Helvetica", 9)
        .fillColor("#666666")
        .text("CLEARED BY THE FOLLOWING DEPARTMENTS", {
          align: "center",
          lineGap: 2
        });

      doc.moveDown(0.8);

      // Department grid (2 columns)
      const deptBoxWidth = 180;
      const deptBoxHeight = 30;
      const startX = 80;
      const startY = doc.y;
      const columnGap = 200;

      data.departments.forEach((dept, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = startX + col * columnGap;
        const y = startY + row * (deptBoxHeight + 10);

        // Draw box
        doc.fillColor("#ECFDF5");
        doc.rect(x, y, deptBoxWidth, deptBoxHeight).fill();
        doc.strokeColor("#10B981").lineWidth(1.5);
        doc.rect(x, y, deptBoxWidth, deptBoxHeight).stroke();

        // Department name
        doc.font(bodyFont, 10)
          .fillColor("#059669")
          .text("✓ " + dept, x + 5, y + 8, {
            width: deptBoxWidth - 10
          });
      });

      const deptRows = Math.ceil(data.departments.length / 2);
      doc.moveDown(deptRows * 2.5 + 1);

      // ========== QR CODE SECTION ==========
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor("#CCCCCC").lineWidth(1).stroke();
      doc.moveDown(1.5);

      doc.font("Helvetica", 9)
        .fillColor("#666666")
        .text("SCAN TO VERIFY CERTIFICATE", {
          align: "center"
        });

      doc.moveDown(0.8);

      // Generate QR code
      const qrCodeImageData = await QRCode.toDataURL(data.qrCodeData || data.certificateId, {
        width: 200,
        color: {
          dark: "#1E40AF",
          light: "#FFFFFF"
        }
      });

      // Add QR code to PDF
      const qrImageBuffer = Buffer.from(qrCodeImageData.split(",")[1], "base64");
      doc.image(qrImageBuffer, 245, doc.y, {
        width: 100,
        height: 100,
        align: "center"
      });

      doc.moveDown(6);

      doc.font("Helvetica", 8)
        .fillColor("#999999")
        .text(`ID: ${data.certificateId.substring(0, 16)}...`, {
          align: "center"
        });

      doc.moveDown(1);

      // ========== SIGNATURE SECTION ==========
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor("#CCCCCC").lineWidth(1).stroke();
      doc.moveDown(1.5);

      // Signature boxes
      const sigBoxX = [80, 245, 410];
      const sigBoxY = doc.y;
      const sigBoxWidth = 140;
      const sigBoxHeight = 80;

      sigBoxX.forEach((x) => {
        // Signature line
        doc.moveTo(x, sigBoxY + sigBoxHeight - 5)
          .lineTo(x + sigBoxWidth, sigBoxY + sigBoxHeight - 5)
          .strokeColor("#333333")
          .lineWidth(1)
          .stroke();

        // Label
        doc.font("Helvetica", 8)
          .fillColor("#666666")
          .text("Signature", x, sigBoxY + sigBoxHeight + 2, {
            width: sigBoxWidth,
            align: "center"
          });
      });

      // Signature titles
      doc.font(titleFont, 9)
        .fillColor("#333333")
        .text("REGISTRAR", 80, sigBoxY + sigBoxHeight + 15, {
          width: sigBoxWidth,
          align: "center"
        });

      doc.font(titleFont, 9)
        .fillColor("#333333")
        .text("HEAD OF DEPT", 245, sigBoxY + sigBoxHeight + 15, {
          width: sigBoxWidth,
          align: "center"
        });

      doc.font("Helvetica", 18)
        .fillColor("#FFD700")
        .text("🔖", 410, sigBoxY + 25, {
          width: sigBoxWidth,
          align: "center"
        });

      doc.moveDown(5);

      // ========== FOOTER ==========
      doc.moveTo(50, doc.page.height - 100).lineTo(545, doc.page.height - 100)
        .strokeColor("#FFD700")
        .lineWidth(2)
        .stroke();

      doc.font("Helvetica", 8)
        .fillColor("#666666")
        .text(
          "This certificate is issued by the Office of the Registrar",
          { align: "center" }
        );

      doc.font("Helvetica", 8)
        .fillColor("#666666")
        .text(
          "Riphah International University, Islamabad",
          { align: "center" }
        );

      doc.font("Helvetica", 7)
        .fillColor("#999999")
        .text(
          `Generated on ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}`,
          { align: "center" }
        );

      doc.font("Helvetica", 7)
        .fillColor("#AAAAAA")
        .text(
          `Certificate ID: ${data.certificateId}`,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      console.error("❌ PDF Generation Error:", error);
      reject(error);
    }
  });
}

module.exports = {
  generateCertificatePDF
};
