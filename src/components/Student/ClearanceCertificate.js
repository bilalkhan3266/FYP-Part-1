import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut, GraduationCap } from "lucide-react";
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
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
          registration_no: wf.registrationNo,
          father_name: wf.fatherName,
          program: wf.program,
          department: wf.department,
          semester: wf.semester,
          degree_status: wf.degreeStatus,
          qr_code: wf.qrCode || wf._id,
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
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      
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
              <div className="certificate-container">
                {/* Header */}
                <div className="cert-header">
                  <div className="cert-logo">
                    <div className="cert-logo-icon">🎓</div>
                  </div>
                  <div className="cert-title-block">
                    <h1 className="cert-university">
                      Riphah International University
                    </h1>
                    <h2 className="cert-doc-title">
                      Student Clearance Certificate
                    </h2>
                    <p className="cert-subtitle">
                      Office of the Registrar
                    </p>
                  </div>
                </div>

                <div className="cert-divider"></div>

                {/* Certificate Number & Date */}
                <div className="cert-meta-row">
                  <span>
                    <strong>Certificate No:</strong>{" "}
                    {certificate.qr_code || "N/A"}
                  </span>
                  <span>
                    <strong>Date:</strong> {formatDate(certificate.completed_at || new Date())}
                  </span>
                </div>

                {/* Body */}
                <div className="cert-body">
                  <p className="cert-intro">
                    This is to certify that the following student has obtained
                    clearance from all departments of the university and has no
                    outstanding dues or obligations.
                  </p>

                  {/* Student Details Table */}
                  <table className="cert-details-table">
                    <tbody>
                      <tr>
                        <td className="label">Student Name</td>
                        <td className="value">{certificate.student_name}</td>
                      </tr>
                      <tr>
                        <td className="label">SAP ID</td>
                        <td className="value">{certificate.sapid}</td>
                      </tr>
                      {certificate.registration_no && (
                        <tr>
                          <td className="label">Registration No</td>
                          <td className="value">
                            {certificate.registration_no}
                          </td>
                        </tr>
                      )}
                      {certificate.father_name && (
                        <tr>
                          <td className="label">Father's Name</td>
                          <td className="value">{certificate.father_name}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="label">Program</td>
                        <td className="value">
                          {certificate.program || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Department</td>
                        <td className="value">
                          {certificate.department || "N/A"}
                        </td>
                      </tr>
                      {certificate.semester && (
                        <tr>
                          <td className="label">Semester</td>
                          <td className="value">{certificate.semester}</td>
                        </tr>
                      )}
                      {certificate.degree_status && (
                        <tr>
                          <td className="label">Degree Status</td>
                          <td className="value">
                            {certificate.degree_status}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Department Clearance Table */}
                  <h3 className="dept-table-title">
                    Department Clearance Status
                  </h3>
                  <table className="cert-dept-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Approved By</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificate.departments.map((dept, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{dept.name}</td>
                          <td className="status-approved">✓ {dept.status}</td>
                          <td>{dept.approved_by || "—"}</td>
                          <td>{formatDate(dept.approved_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer with QR Code and Signatures */}
                <div className="cert-footer-section">
                  <div className="cert-qr-block" ref={qrRef}>
                    {certificate.qr_code ? (
                      <>
                        <QRCodeCanvas
                          value={certificate.qr_code}
                          size={150}
                          level="H"
                          includeMargin={true}
                          onLoad={onQrReady}
                        />
                        <p className="qr-label">Scan to Verify</p>
                        <p className="qr-id">{certificate.qr_code}</p>
                      </>
                    ) : (
                      <div className="no-qr">
                        <p>QR verification pending</p>
                      </div>
                    )}
                  </div>

                  <div className="cert-signatures">
                    <div className="signature-box">
                      <div className="sig-line"></div>
                      <p className="sig-title">Student Service</p>
                      <p className="sig-name">
                        {certificate.departments?.[4]?.approved_by || "________________"}
                      </p>
                    </div>
                    <div className="signature-box">
                      <div className="sig-line"></div>
                      <p className="sig-title">Registrar</p>
                      <p className="sig-name">________________</p>
                    </div>
                  </div>
                </div>

                <div className="cert-bottom-note">
                  <p>
                    This is a computer-generated certificate. Verify authenticity
                    by scanning the QR code above.
                  </p>
                  <p>
                    Generated on: {formatDate(new Date())} | Riphah
                    International University
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
