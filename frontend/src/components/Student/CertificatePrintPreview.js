import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { X, Printer, Download } from "lucide-react";
import "../../styles/print-certificate-a4-clean.css";

/**
 * CertificatePrintPreview Component
 * Displays certificate in a print-friendly format with proper A4 layout
 */
export const CertificatePrintPreview = ({ certificate, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!certificate) return null;

  const certData = certificate.certificate || certificate.data || {};
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const studentName = certData.student_name || certData.studentName || "Student Name";
  const sapId = certData.sapid || certData.sapId || "SAP ID";
  const regNo = certData.registration_no || certData.registrationNo || "Registration Number";
  const program = certData.program || "Program";
  const qrCode = certData.qr_code || `CLEARANCE_${sapId}_${Date.now()}`;

  let apiUrl = getApiUrl();
  if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : ":5000";
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      apiUrl = `http://${hostname}${port}`;
    }
  }

  const verificationUrl = `${apiUrl}/api/verify-certificate/${encodeURIComponent(qrCode)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    verificationUrl
  )}`;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handleDownload = () => {
    const element = document.getElementById("cert-print-container");
    if (!element) {
      alert("Certificate element not found");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Clearance Certificate - ${sapId}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }
          ${element.innerHTML}
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Clearance_Certificate_${sapId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* A4 Print Container - Hidden on screen, visible only when printing */}
      <div id="cert-print-container" className="a4-print-container" style={{ display: 'none' }}>
        {/* Certificate for printing */}
        <div className="certificate-page">
          <div className="certificate-container">
            <div className="certificate">
              {/* Header */}
              <div className="cert-header">
                <div className="cert-logo">🎓</div>
                <div className="cert-univ-name">RIPHAH INTERNATIONAL UNIVERSITY</div>
                <div className="cert-univ-subtitle">OFFICE OF THE REGISTRAR</div>
              </div>

              <div className="cert-divider"></div>

              {/* Certificate Title */}
              <div className="cert-title">CLEARANCE CERTIFICATE</div>

              {/* Opening Text */}
              <div className="cert-text">
                This is to certify that the student mentioned below has successfully completed
                <br />
                all required clearance procedures and has been duly cleared to proceed.
              </div>

              {/* Student Information */}
              <div className="cert-info-box">
                <div className="cert-info-row">
                  <span className="cert-label">Student Name:</span>
                  <span className="cert-value">{studentName}</span>
                </div>
                <div className="cert-info-row">
                  <span className="cert-label">SAP ID:</span>
                  <span className="cert-value">{sapId}</span>
                </div>
                <div className="cert-info-row">
                  <span className="cert-label">Registration Number:</span>
                  <span className="cert-value">{regNo}</span>
                </div>
                <div className="cert-info-row">
                  <span className="cert-label">Program:</span>
                  <span className="cert-value">{program}</span>
                </div>
                <div className="cert-info-row">
                  <span className="cert-label">Issue Date:</span>
                  <span className="cert-value">{formattedDate}</span>
                </div>
              </div>

              {/* Departments Section */}
              <div className="cert-depts-section">
                <div className="cert-depts-title">APPROVED BY ALL DEPARTMENTS</div>
                <div className="cert-depts-grid">
                  <div className="cert-dept-item">Coordination</div>
                  <div className="cert-dept-item">Transport</div>
                  <div className="cert-dept-item">Library</div>
                  <div className="cert-dept-item">Fee Department</div>
                  <div className="cert-dept-item">Student Service</div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="cert-qr-section">
                <div className="cert-qr-label">🔐 Verify Certificate Authenticity</div>
                <div className="cert-qr-content">
                  <img src={qrCodeUrl} alt="QR Code" className="cert-qr-code" />
                  <div className="cert-qr-info">
                    <strong>Certificate ID:</strong><br />
                    <span className="cert-qr-text">{qrCode}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="cert-signatures">
                <div className="cert-sig-box">
                  <div className="cert-sig-line"></div>
                  <div className="cert-sig-title">Registrar</div>
                  <div className="cert-sig-subtitle">Riphah International University</div>
                </div>
                <div className="cert-sig-box">
                  <div className="cert-sig-line"></div>
                  <div className="cert-sig-title">HOD</div>
                  <div className="cert-sig-subtitle">Department of Student Affairs</div>
                </div>
                <div className="cert-sig-box">
                  <div className="cert-sig-line"></div>
                  <div className="cert-sig-title">Official Stamp</div>
                  <div className="cert-sig-subtitle">Dated: {formattedDate}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="cert-footer">
                <p>This certificate is valid and has been officially issued by Riphah International University.</p>
                <p>For verification, scan the QR code above or contact the Office of the Registrar.</p>
                <div className="cert-footer-id">Document Reference: {qrCode}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Preview - Visible on screen, hidden when printing */}
      <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto no-print">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto my-8 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Clearance Certificate Preview</h2>
              <p className="text-blue-100 mt-1">SAP ID: {sapId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              title="Close preview"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-100 px-8 py-4 border-b border-slate-200 flex gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Printer size={18} />
              {isPrinting ? "Preparing..." : "Print Certificate (A4)"}
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              Download HTML
            </button>
          </div>

          {/* Certificate Preview (Screen display) */}
          <div className="p-8 bg-gray-50 overflow-auto max-h-[calc(100vh-300px)]">
            <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: "800px", aspectRatio: "210/297" }}>
              <div className="p-12 h-full flex flex-col justify-between text-center text-sm">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">RIPHAH INTERNATIONAL UNIVERSITY</h1>
                  <p className="text-gray-600 mb-8">OFFICE OF THE REGISTRAR</p>
                  <h2 className="text-3xl font-bold italic text-slate-900 mb-4">CLEARANCE CERTIFICATE</h2>
                  <p className="text-gray-700 mb-8">
                    This is to certify that the student mentioned below has successfully completed
                    <br />
                    all required clearance procedures and has been duly cleared to proceed.
                  </p>
                </div>

                <div className="border-t-2 border-b-2 border-slate-900 py-6 my-6">
                  <div className="grid grid-cols-2 gap-4 text-left text-xs">
                    <div>
                      <p className="font-bold">Student Name:</p>
                      <p>{studentName}</p>
                    </div>
                    <div>
                      <p className="font-bold">SAP ID:</p>
                      <p className="font-mono">{sapId}</p>
                    </div>
                    <div>
                      <p className="font-bold">Registration No:</p>
                      <p>{regNo}</p>
                    </div>
                    <div>
                      <p className="font-bold">Program:</p>
                      <p>{program}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold mb-2">APPROVED BY ALL DEPARTMENTS</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-6">
                    {["Coordination", "Transport", "Library", "Fee Department", "Student Service"].map((dept) => (
                      <div key={dept} className="border border-green-600 text-green-600 py-1">
                        ✓ {dept}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">{formattedDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificatePrintPreview;