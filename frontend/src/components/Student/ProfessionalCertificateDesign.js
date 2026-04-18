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
    const certId = certificateData?._id || certificateData?.certificate_id || certificateData?.qrData;
    if (certId) {
      fetchQRCode(certId);
    }
  }, [certificateData]);

  const fetchQRCode = async (value) => {
    try {
      const response = await axios.get(
        `https://api.qrserver.com/v1/generate-qr-code/?size=200x200&data=${encodeURIComponent(value)}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      setQrCodeData(url);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      {/* Header Actions */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-3 justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
          Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          <Printer size={20} />
          Print
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 transition"
        >
          <Share2 size={20} />
          Share
        </button>
      </div>

      {/* Certificate Container */}
      <div className="max-w-4xl mx-auto">
        <div
          ref={certificateRef}
          className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:m-0 print:rounded-none"
        >
          <div className="relative p-12 text-center bg-gradient-to-b from-blue-50 to-white">
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-yellow-500 to-blue-700"></div>
            
            {/* Header Section */}
            <div className="mb-8">
              {/* Riphah University Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src="/logo192.png" 
                  alt="Riphah International University" 
                  className="w-24 h-24 object-contain drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </div>

              <h3 className="text-xs font-bold text-blue-700 tracking-widest uppercase letter-spacing">
                Office of the Registrar
              </h3>
              <h1 className="text-6xl font-serif text-blue-900 my-4 font-bold tracking-tight" style={{ fontSize: '3.5rem', letterSpacing: '0.05em' }}>
                CLEARANCE CERTIFICATE
              </h1>
              <p className="text-blue-700 text-lg font-semibold">
                Riphah International University
              </p>
              <p className="text-gray-600 text-base">
                Faculty of Engineering & Applied Sciences
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-yellow-500 to-blue-700 mx-auto mt-6"></div>
            </div>

            {/* Main Content */}
            <div className="text-left space-y-8">
              {/* Greeting */}
              <p className="text-center text-gray-700 text-lg">
                This is to certify that
              </p>

              {/* Student Info Card */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-8 border-3 border-blue-700 shadow-md">
                <p className="text-4xl font-serif text-blue-900 font-bold text-center mb-6" style={{ fontSize: '2rem' }}>
                  {studentName}
                </p>

                {/* Student Details Grid */}
                <div className="grid grid-cols-3 gap-8 mt-6">
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Student ID
                    </p>
                    <p className="text-xl font-mono text-blue-900 font-semibold">{sapId}</p>
                  </div>
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Issue Date
                    </p>
                    <p className="text-lg text-blue-900 font-semibold">
                      {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "---"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                      Valid Until
                    </p>
                    <p className="text-lg text-blue-900 font-semibold">Until Graduation</p>
                  </div>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="space-y-6 text-gray-700 leading-relaxed py-8">
                <p className="text-center text-xl text-blue-900 font-semibold italic">
                  has successfully completed all clearance requirements from the University and has been cleared by all departments.
                </p>

                {/* Departments Section */}
                <div className="mt-8 pt-8 border-t-2 border-blue-300">
                  <p className="font-bold text-blue-900 text-center mb-6 uppercase tracking-wider" style={{ fontSize: '1.1rem' }}>
                    ✓ Cleared By the Following Departments
                  </p>

                  <div className="grid grid-cols-2 gap-5">
                    {departments && departments.length > 0 ? (
                      departments.map((dept, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-500 shadow-sm"
                        >
                          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                          <span className="text-blue-900 font-semibold text-lg">
                            {typeof dept === 'string' ? dept : dept.name || 'Department'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 bg-blue-50 rounded border border-blue-200">
                        <p className="text-blue-700 font-semibold">All Required Departments</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="border-t-2 border-blue-300 pt-8 flex flex-col items-center">
                <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-6">
                  Scan to Verify Certificate
                </p>
                {qrCodeData && (
                  <div className="bg-white p-4 rounded-lg border-4 border-blue-700 shadow-lg">
                    <img src={qrCodeData} alt="QR Code" className="w-40 h-40" />
                  </div>
                )}
                {certificateData?.certificate_id ? (
                  <p className="text-xs text-blue-700 font-semibold mt-4 font-mono">
                    Verification ID: {certificateData.certificate_id.substring(0, 12).toUpperCase()}
                  </p>
                ) : (
                  <p className="text-xs text-blue-700 font-semibold mt-4 font-mono">
                    Verification ID: {certificateData._id?.substring(0, 12).toUpperCase() || 'N/A'}
                  </p>
                )}
              </div>

              {/* Signature Section */}
              <div className="border-t-4 border-blue-700 pt-12 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="h-20 mb-1 border-b-2 border-gray-400"></div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mt-2">
                    Registrar
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Authorized Signature</p>
                </div>
                <div>
                  <div className="h-20 mb-1 border-b-2 border-gray-400 flex items-center justify-center">
                    {/* Official Seal Placeholder */}
                  </div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mt-2">
                    Official Seal
                  </p>
                  <p className="text-xs text-gray-600 mt-1">University Stamp</p>
                </div>
                <div>
                  <div className="h-20 mb-1 border-b-2 border-gray-400"></div>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mt-2">
                    Head of Department
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Authorized Signature</p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-blue-300 pt-8 text-center space-y-2">
                <p className="text-sm text-blue-700 font-semibold">
                  Riphah International University
                </p>
                <p className="text-xs text-gray-600">
                  Office of the Registrar | Certificate ID: {certificateData._id?.substring(0, 12)}
                </p>
                <p className="text-xs text-gray-500 italic">
                  This certificate is valid throughout the student's academic career at Riphah International University.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            </div>
            
            {/* Decorative Bottom Border */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-yellow-500 to-blue-700"></div>
        </div>
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