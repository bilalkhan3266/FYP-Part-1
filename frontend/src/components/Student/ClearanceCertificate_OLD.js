import React, { useState, useEffect, useRef, useCallback } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut, GraduationCap, ShieldCheck } from "lucide-react";
import axios from "axios";
import "./ClearanceCertificate.css";
import "./Dashboard.css";

/* Shared Sidebar Component */
function StudentSidebar({ displayName, displaySap, displayDept, onLogout, className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ShieldCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];
  return (
    <aside className={`sd-sidebar${className ? " " + className : ""}`}>
      <div className="sd-sidebar-top">
        <div className="sd-brand"><div className="sd-brand-icon"><GraduationCap size={22} /></div><span className="sd-brand-text">Riphah Clearance</span></div>
        <div className="sd-profile"><div className="sd-avatar">{displayName ? displayName.charAt(0).toUpperCase() : "?"}</div><div className="sd-profile-info"><h3 className="sd-name">{displayName}</h3><p className="sd-meta">{displaySap}</p><p className="sd-meta">{displayDept}</p></div></div>
        <nav className="sd-nav">
          {navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path; return (
            <button key={item.path} className={`sd-nav-btn${isActive ? " active" : ""}`} onClick={() => navigate(item.path)}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} /><span>{item.label}</span>{isActive && <span className="sd-active-indicator" />}
            </button>
          ); })}
        </nav>
      </div>
      <div className="sd-sidebar-bottom">
        <button className="sd-nav-btn sd-logout-btn" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
        <footer className="sd-footer">© 2025 Riphah International University</footer>
      </div>
    </aside>
  );
}

export default function ClearanceCertificate() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrReady, setQrReady] = useState(false);
  const certificateRef = useRef(null);
  const qrRef = useRef(null);

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      const response = await axios.get(apiUrl + "/api/clearance/student", {
        headers: { Authorization: "Bearer " + token },
      });

      if (response.data.success && response.data.data) {
        const wf = response.data.data;
        if (wf.overallStatus !== "Completed") {
          setError("Your clearance is not yet completed. All phases must be approved.");
          return;
        }
        // Map workflow data to certificate format
        setCertificate({
          student_name: wf.studentName,
          sapid: wf.sapid,
         
          father_name: wf.fatherName,
          program: wf.program,
          department: wf.department,
          semester: wf.semester,
          degree_status: wf.degreeStatus,
          qr_code: wf._id,
          verification_url: `${apiUrl}/api/clearance/verify/${wf._id}`,
          completed_at: wf.completedAt,
          workflow_id: wf._id,
          certificateUrl: wf.certificateUrl,
          departments: wf.phases.map((p) => ({
            name: p.name,
            status: p.status,
            approved_by: p.approverName,
            approved_at: p.approvedAt,
          })),
        });
      } else {
        setError("No clearance request found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load certificate data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificate?.workflow_id) return;
    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();
      
      const response = await axios.get(
        apiUrl + "/api/clearance/certificate/download/" + certificate.workflow_id,
        { headers: { Authorization: "Bearer " + token }, responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Clearance_Certificate_" + certificate.sapid + ".pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download certificate PDF: " + (err.response?.data?.message || err.message));
    }
  };

  // Called when QR canvas has rendered
  const onQrReady = useCallback(() => {
    setQrReady(true);
  }, []);

  // Wait for QR to render then mark ready
  useEffect(() => {
    if (!certificate?.qr_code) return;
    const timer = setTimeout(() => setQrReady(true), 500);
    return () => clearTimeout(timer);
  }, [certificate]);

  const handlePrint = () => {
    if (!qrReady) {
      alert("Please wait for the QR code to load before printing.");
      return;
    }

    // Convert QR canvas to image for print reliability
    const qrCanvas = document.querySelector("#certificate-area canvas");
    if (qrCanvas) {
      const qrImage = document.createElement("img");
      qrImage.src = qrCanvas.toDataURL("image/png");
      qrImage.className = "qr-print-image";
      qrImage.style.width = qrCanvas.style.width || "150px";
      qrImage.style.height = qrCanvas.style.height || "150px";
      const qrContainer = qrCanvas.parentNode;
      qrContainer.insertBefore(qrImage, qrCanvas);
      qrCanvas.classList.add("qr-canvas-hide");
    }

    window.print();

    // Restore canvas after printing
    setTimeout(() => {
      const printImg = document.querySelector(".qr-print-image");
      if (printImg) printImg.remove();
      const hiddenCanvas = document.querySelector(".qr-canvas-hide");
      if (hiddenCanvas) hiddenCanvas.classList.remove("qr-canvas-hide");
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="loading-container">
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">
      {/* SIDEBAR - hidden on print */}
      <StudentSidebar displayName={displayName} displaySap={displaySap} displayDept={displayDept} onLogout={handleLogout} className="no-print" />

      {/* MAIN */}
      <main className="sd-main">
        {/* Header - hidden on print */}
        <header className="sd-header no-print">
          <h1>Clearance Certificate</h1>
          <p>Your official clearance certificate for printing</p>
        </header>

        {error && (
          <div className="cert-error no-print">
            <p>{error}</p>
            <button onClick={() => navigate("/student-dashboard")}>
              Back to Dashboard
            </button>
          </div>
        )}

        {certificate && (
          <>
            {/* Print / Download Actions */}
            <div className="cert-toolbar no-print">
              <button className="btn-print" onClick={handlePrint} disabled={!qrReady}>
                {qrReady ? "🖨 Print Certificate" : "⏳ Loading QR..."}
              </button>
              <button className="btn-print" onClick={handleDownloadPDF} style={{ background: "#6366f1" }}>
                📥 Download PDF
              </button>
              <button
                className="btn-back"
                onClick={() => navigate("/student-dashboard")}
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* ===== PRINTABLE CERTIFICATE ===== */}
            <div id="certificate-area" ref={certificateRef}>
              <div className="certificate-container" style={{ padding: '40px', fontFamily: 'serif', maxWidth: '850px', margin: '0 auto', border: '3px solid #1e3a8a', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                {/* Top Decorative Bar */}
                <div style={{ height: '4px', background: 'linear-gradient(to right, #1e3a8a 0%, #fbbf24 50%, #1e3a8a 100%)', marginBottom: '30px' }}></div>

                {/* Header with Logo and Text */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  {/* Riphah Logo */}
                  <div style={{ marginBottom: '20px' }}>
                    <img 
                      src="/logo192.png" 
                      alt="Riphah International University" 
                      style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }}
                    />
                  </div>

                  {/* University Name */}
                  <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 5px 0', letterSpacing: '0.05em' }}>
                    RIPHAH INTERNATIONAL UNIVERSITY
                  </h1>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 20px 0', letterSpacing: '0.1em', fontWeight: '500' }}>
                    OFFICE OF THE REGISTRAR
                  </p>

                  {/* Certificate Title */}
                  <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a8a', margin: '10px 0 20px 0', letterSpacing: '0.08em', fontFamily: 'Georgia, serif' }}>
                    CLEARANCE CERTIFICATE
                  </h2>

                  {/* Decorative divider */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ width: '40px', height: '1px', backgroundColor: '#fbbf24' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#fbbf24', borderRadius: '50%' }}></div>
                    <div style={{ width: '40px', height: '1px', backgroundColor: '#fbbf24' }}></div>
                  </div>
                </div>

                {/* Certificate Body Text */}
                <div style={{ textAlign: 'center', marginBottom: '30px', lineHeight: '1.8' }}>
                  <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 15px 0' }}>
                    This is to certify that the student mentioned below has successfully completed
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', fontStyle: 'italic', margin: '0 0 15px 0' }}>
                    all required clearance procedures
                  </p>
                  <p style={{ fontSize: '14px', color: '#374151', margin: '0' }}>
                    and has been cleared by all departments to proceed.
                  </p>
                </div>

                {/* Student Information Card */}
                <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', border: '2px solid #93c5fd', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', margin: '0 0 20px 0', fontFamily: 'Georgia, serif' }}>
                    {certificate.student_name}
                  </h3>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                        Student ID
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', margin: '0', fontFamily: 'monospace' }}>
                        {certificate.sapid}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                        Issue Date
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', margin: '0' }}>
                        {formatDate(certificate.completed_at || new Date())}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                        Program
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', margin: '0' }}>
                        {certificate.program || 'N/A'}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #dbeafe', borderRadius: '8px', padding: '15px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                        Valid Until
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', margin: '0' }}>
                        Graduation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Departments Section */}
                <div style={{ borderTop: '2px solid #93c5fd', borderBottom: '2px solid #93c5fd', padding: '25px 0', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.1em' }}>
                    Departmental Clearances
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {certificate.departments && certificate.departments.length > 0 ? (
                      certificate.departments.map((dept, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)', padding: '12px', borderRadius: '8px', border: '2px solid #22c55e' }}>
                          <span style={{ fontSize: '18px', color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '500' }}>
                            {dept.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#1e3a8a', fontWeight: '500' }}>
                        All Required Departments
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                <div style={{ textAlign: 'center', marginBottom: '30px', paddingTop: '20px', borderTop: '2px solid #93c5fd' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>
                    Verify Certificate Authenticity
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '15px' }}>
                    Scan the QR code below using any smartphone
                  </p>
                  <div className="cert-qr-block" ref={qrRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f9fafb', border: '3px solid #1e3a8a', borderRadius: '12px', padding: '15px' }}>
                    {certificate.qr_code ? (
                      <>
                        <QRCodeCanvas
                          value={certificate.verification_url || certificate.qr_code}
                          size={180}
                          level="M"
                          includeMargin={true}
                          onLoad={onQrReady}
                        />
                        <p style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginTop: '10px', marginBottom: '0', fontFamily: 'monospace' }}>
                          {certificate.qr_code}
                        </p>
                      </>
                    ) : (
                      <div style={{ padding: '20px', color: '#6b7280' }}>
                        <p>QR verification pending</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', textAlign: 'center', paddingTop: '40px', borderTop: '3px solid #1e3a8a', marginTop: '30px' }}>
                  <div>
                    <div style={{ height: '70px', borderBottom: '2px solid #374151', marginBottom: '8px' }}></div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0', letterSpacing: '0.05em' }}>
                      Registrar
                    </p>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0 0' }}>
                      Authorized Signature
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ width: '60px', height: '60px', border: '3px solid #9ca3af', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', background: '#f3f4f6' }}>
                      <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold' }}>SEAL</span>
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0', letterSpacing: '0.05em' }}>
                      Official Seal
                    </p>
                  </div>
                  <div>
                    <div style={{ height: '70px', borderBottom: '2px solid #374151', marginBottom: '8px' }}></div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0', letterSpacing: '0.05em' }}>
                      HOD
                    </p>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0 0' }}>
                      Authorized Signature
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #93c5fd' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 5px 0' }}>
                    Riphah International University
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 10px 0' }}>
                    Office of the Registrar | Islamabad, Pakistan
                  </p>
                  <p style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic', margin: '0' }}>
                    This certificate signifies that the student has fulfilled all clearance requirements and is eligible to graduate.
                  </p>
                </div>

                {/* Bottom Decorative Bar */}
                <div style={{ height: '4px', background: 'linear-gradient(to right, #1e3a8a 0%, #fbbf24 50%, #1e3a8a 100%)', marginTop: '30px' }}></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}