import React, { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { Download, Printer, Share2, QrCode, CheckCircle, Loader } from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ProfessionalCertificateDesign({ 
  certificateData, 
  studentName, 
  sapId, 
  departments, 
  date 
}) {
  const certificateRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Generate QR code on mount
  useEffect(() => {
    const certId = certificateData?._id || certificateData?.certificate_id || certificateData?.qr_code;
    if (certId) {
      generateQRCode(certId);
    }
  }, [certificateData]);

  const generateQRCode = async (certId) => {
    try {
      // Get the API URL
      const apiUrl = getApiUrl();
      
      // Build the verification URL - this is what will be encoded in the QR code
      const verificationUrl = `${apiUrl}/api/verify-certificate/${encodeURIComponent(certId)}`;
      
      console.log('📱 QR Code URL:', verificationUrl);
      
      // Call QR server with the full verification URL
      const response = await axios.get(
        `https://api.qrserver.com/v1/generate-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      setQrCodeData(url);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const fetchQRCode = async (value) => {
    // This is now handled by generateQRCode
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // Check if certificate already exists on backend
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();
      const certId = certificateData._id;

      // First try to download existing PDF from backend
      try {
        const response = await axios.get(
          `${apiUrl}/api/certificates/${certId}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob"
          }
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Clearance_Certificate_${sapId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (downloadErr) {
        console.log("Backend PDF not available, generating from HTML...");

        // Fallback: Generate from HTML
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`Clearance_Certificate_${sapId}.pdf`);
      }
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    const windowPrint = window.open("", "", "height=600,width=800");
    windowPrint.document.write(printContent.innerHTML);
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Clearance Certificate",
          text: `Check out my clearance certificate from ${sapId}`,
          url: window.location.href
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      const verificationLink = `${window.location.origin}/verify/${certificateData.certificate_id}`;
      navigator.clipboard.writeText(verificationLink);
      alert("Verification link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 p-4 md:p-8">
      {/* Header Actions */}
      <div className="max-w-5xl mx-auto mb-6 flex gap-3 justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 font-semibold"
        >
          {loading ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
          Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold border border-gray-300"
        >
          <Printer size={20} />
          Print
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-semibold border border-green-300"
        >
          <Share2 size={20} />
          Share
        </button>
      </div>

      {/* Certificate Container */}
      <div className="max-w-5xl mx-auto">
        <div
          ref={certificateRef}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:m-0 print:rounded-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Top Decorative Bar */}
          <div className="h-3 bg-gradient-to-r from-blue-800 via-yellow-500 to-blue-800"></div>
          
          <div className="p-16 text-center">
            {/* University Header */}
            <div className="mb-12">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <img 
                    src="/logo192.png" 
                    alt="Riphah International University" 
                    className="w-32 h-32 object-contain"
                    style={{ filter: 'drop-shadow(0 2px 8px rgba(31, 41, 55, 0.1))' }}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200 opacity-30"></div>
                </div>
              </div>

              {/* Institution Name */}
              <h2 className="text-xs font-bold text-blue-700 tracking-widest uppercase letter-spacing mb-2">
                Riphah International University
              </h2>
              <p className="text-xs text-gray-500 tracking-wider uppercase mb-6">
                Office of the Registrar
              </p>

              {/* Certificate Title */}
              <div className="mb-8">
                <h1 className="text-5xl font-serif text-blue-900 font-bold mb-4" style={{ letterSpacing: '0.1em' }}>
                  CLEARANCE CERTIFICATE
                </h1>
                <div className="flex justify-center gap-2 items-center">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-yellow-500"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-yellow-500"></div>
                </div>
              </div>
            </div>

            {/* Main Body */}
            <div className="text-left space-y-8 max-w-3xl mx-auto">
              {/* Statement */}
              <div className="text-center space-y-4">
                <p className="text-base text-gray-700 font-semibold">
                  This is to certify that the student mentioned below has successfully completed
                </p>
                <p className="text-lg text-blue-900 font-bold italic">
                  all required clearance procedures
                </p>
                <p className="text-base text-gray-700 font-semibold">
                  and has been cleared by all departments to proceed.
                </p>
              </div>

              {/* Student Information Card */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-10 border-2 border-blue-300 shadow-md">
                <p className="text-center text-3xl font-serif text-blue-900 font-bold mb-8">
                  {studentName}
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Student ID
                    </p>
                    <p className="text-base font-mono text-blue-900 font-bold">{sapId}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Issue Date
                    </p>
                    <p className="text-base text-blue-900 font-bold">
                      {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "---"}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Valid Until
                    </p>
                    <p className="text-base text-blue-900 font-bold">Graduation</p>
                  </div>
                </div>
              </div>

              {/* Departments Section */}
              <div className="space-y-6 py-4">
                <div className="border-t-2 border-b-2 border-blue-300 py-6">
                  <p className="font-bold text-blue-900 text-center mb-8 uppercase tracking-wider text-lg">
                    Departmental Clearances
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {departments && departments.length > 0 ? (
                      departments.map((dept, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-400 shadow-sm hover:shadow-md transition"
                        >
                          <CheckCircle size={22} className="text-green-600 flex-shrink-0" />
                          <span className="text-blue-900 font-bold text-sm">
                            {typeof dept === 'string' ? dept : dept.name || 'Department'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                        <p className="text-blue-700 font-bold">All Required Departments</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code & Verification */}
              <div className="flex flex-col items-center space-y-6 py-8 border-t-2 border-blue-300">
                <div>
                  <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">
                    Verify Certificate Authenticity
                  </p>
                  <p className="text-xs text-gray-500">Scan the QR code below using any smartphone</p>
                </div>
                
                {qrCodeData && (
                  <div className="bg-white p-6 rounded-2xl border-4 border-blue-900 shadow-lg">
                    <img src={qrCodeData} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="pt-12 border-t-4 border-blue-900">
                <div className="grid grid-cols-3 gap-12 text-center">
                  <div>
                    <div className="h-24 mb-2 border-b-2 border-gray-600"></div>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Registrar
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Authorized Signature</p>
                  </div>
                  <div className="flex flex-col items-center justify-end pb-2">
                    <div className="w-20 h-20 border-4 border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                      <span className="text-xs text-gray-400 font-bold">SEAL</span>
                    </div>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mt-3">
                      Official Seal
                    </p>
                  </div>
                  <div>
                    <div className="h-24 mb-2 border-b-2 border-gray-600"></div>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      HOD
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Authorized Signature</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-blue-300 pt-8 text-center space-y-2">
                <p className="text-sm text-blue-900 font-bold">
                  Riphah International University
                </p>
                <p className="text-xs text-gray-600">
                  Office of the Registrar | Islamabad, Pakistan
                </p>
                <p className="text-xs text-gray-500 italic mt-4">
                  This certificate signifies that the student has fulfilled all clearance requirements and is eligible to graduate.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Decorative Bar */}
          <div className="h-3 bg-gradient-to-r from-blue-800 via-yellow-500 to-blue-800"></div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:m-0 {
            margin: 0;
          }
          .print\\:rounded-none {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}