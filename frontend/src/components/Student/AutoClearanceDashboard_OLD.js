import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare,
  UserPen, LogOut, GraduationCap, ShieldCheck, RefreshCw,
  Download, XCircle, AlertTriangle, BookOpen, CreditCard,
  Bus, Users, Handshake, QrCode,
} from "lucide-react";
import axios from "axios";
import "./Dashboard.css";
import "./AutoClearanceDashboard.css";

const API_URL = getApiUrl();

const DEPT_ICONS = {
  Coordination: Handshake,
  Library: BookOpen,
  Transport: Bus,
  "Fee Department": CreditCard,
  "Student Service": Users,
};

/* Shared Sidebar */
function StudentSidebar({ displayName, displaySap, displayDept, onLogout }) {
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
    <aside className="sd-sidebar">
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

/* Department Status Card */
function DeptCard({ phase }) {
  const Icon = DEPT_ICONS[phase.name] || Users;
  const approved = phase.status === "Approved";
  return (
    <div className={`ac-dept-card ${approved ? "ac-dept-approved" : "ac-dept-rejected"}`}>
      <div className="ac-dept-icon-wrap">
        <Icon size={28} />
      </div>
      <div className="ac-dept-info">
        <h4>{phase.name}</h4>
        <span className={`ac-dept-badge ${approved ? "badge-green" : "badge-red"}`}>
          {approved ? <><CheckCircle2 size={14} /> Approved</> : <><XCircle size={14} /> Rejected</>}
        </span>
        {phase.remarks && <p className="ac-dept-remarks">{phase.remarks}</p>}
      </div>
    </div>
  );
}

export default function AutoClearanceDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    sapid: user?.sap || "",
    student_name: user?.full_name || "",
    registration_no: "",
    father_name: "",
    program: "",
    semester: "",
    degree_status: "",
    department: user?.department || "",
  });

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "";
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetchExistingWorkflow();
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExistingWorkflow = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auto-clearance/student`, { headers });
      if (res.data.success && res.data.data) {
        setWorkflow(res.data.data);
      }
    } catch (err) {
      console.error("Fetch workflow error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auto-clearance/preview`, { headers });
      if (res.data.success) {
        setPreview(res.data);
      }
    } catch (err) {
      console.error("Preview error:", err);
    }
  };

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${API_URL}/api/auto-clearance`, formData, { headers });
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchExistingWorkflow();
        fetchPreview();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit clearance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecheck = async () => {
    setRechecking(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${API_URL}/api/auto-clearance/recheck`, {}, { headers });
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchExistingWorkflow();
        fetchPreview();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Re-check failed");
    } finally {
      setRechecking(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const hasActiveWorkflow = workflow && ["Pending", "In Progress", "Completed", "Rejected"].includes(workflow.overallStatus);
  const isCompleted = workflow?.overallStatus === "Completed";
  const isRejected = workflow?.overallStatus === "Rejected";

  if (loading) {
    return (
      <div className="sd-layout">
        <StudentSidebar displayName={displayName} displaySap={displaySap} displayDept={displayDept} onLogout={handleLogout} />
        <main className="sd-main"><div className="ac-loading">Loading auto-clearance data...</div></main>
      </div>
    );
  }

  return (
    <div className="sd-layout">
      <StudentSidebar displayName={displayName} displaySap={displaySap} displayDept={displayDept} onLogout={handleLogout} />
      <main className="sd-main">
        <div className="ac-container">
          <div className="ac-header">
            <ShieldCheck size={28} />
            <div>
              <h1>Automatic Clearance Verification</h1>
              <p>System auto-checks all departments for pending issues</p>
            </div>
          </div>

          {error && <div className="ac-alert ac-alert-error"><AlertTriangle size={18} />{error}</div>}
          {success && <div className="ac-alert ac-alert-success"><CheckCircle2 size={18} />{success}</div>}

          {/* ── PREVIEW SECTION ── */}
          {preview && !hasActiveWorkflow && (
            <div className="ac-preview-section">
              <h3>Pre-Check Status (Preview)</h3>
              <p className="ac-preview-desc">This shows your current standing before submitting. Submit below to make it official.</p>
              <div className="ac-dept-grid">
                {preview.phases.map((p) => <DeptCard key={p.name} phase={p} />)}
              </div>
              {preview.rejectedDepartments?.length > 0 && (
                <div className="ac-preview-warning">
                  <AlertTriangle size={16} />
                  <span>You have pending items in: <strong>{preview.rejectedDepartments.join(", ")}</strong>. Clear them before submitting for best results.</span>
                </div>
              )}
            </div>
          )}

          {/* ── SUBMIT FORM (only if no active workflow) ── */}
          {!hasActiveWorkflow && (
            <form className="ac-form" onSubmit={handleSubmit}>
              <h3>Submit Auto-Clearance Request</h3>
              <div className="ac-form-grid">
                <div className="ac-field">
                  <label>SAP ID</label>
                  <input name="sapid" value={formData.sapid} onChange={handleChange} required placeholder="e.g. 12345" />
                </div>
                <div className="ac-field">
                  <label>Full Name</label>
                  <input name="student_name" value={formData.student_name} onChange={handleChange} required />
                </div>
                <div className="ac-field">
                  <label>Registration No</label>
                  <input name="registration_no" value={formData.registration_no} onChange={handleChange} required placeholder="e.g. FA20-BSE-001" />
                </div>
                <div className="ac-field">
                  <label>Father's Name</label>
                  <input name="father_name" value={formData.father_name} onChange={handleChange} required />
                </div>
                <div className="ac-field">
                  <label>Program</label>
                  <input name="program" value={formData.program} onChange={handleChange} required placeholder="e.g. BS Software Engineering" />
                </div>
                <div className="ac-field">
                  <label>Semester</label>
                  <input name="semester" value={formData.semester} onChange={handleChange} required placeholder="e.g. 8th" />
                </div>
                <div className="ac-field">
                  <label>Degree Status</label>
                  <select name="degree_status" value={formData.degree_status} onChange={handleChange} required>
                    <option value="">Select Status</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
                <div className="ac-field">
                  <label>Department</label>
                  <input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. CS" />
                </div>
              </div>
              <button type="submit" className="ac-submit-btn" disabled={submitting}>
                {submitting ? <><RefreshCw size={16} className="spin" /> Processing...</> : <><ShieldCheck size={16} /> Submit & Auto-Verify</>}
              </button>
            </form>
          )}

          {/* ── RESULT VIEW (when workflow exists) ── */}
          {hasActiveWorkflow && (
            <div className="ac-result-section">
              <div className={`ac-overall-banner ${isCompleted ? "banner-green" : isRejected ? "banner-red" : "banner-yellow"}`}>
                {isCompleted ? <CheckCircle2 size={24} /> : isRejected ? <XCircle size={24} /> : <RefreshCw size={24} />}
                <div>
                  <h2>{isCompleted ? "Clearance Approved!" : isRejected ? "Clearance Rejected" : "Processing..."}</h2>
                  <p>{isCompleted
                    ? "All departments have cleared you. Download your certificate below."
                    : isRejected
                    ? `Rejected due to pending items in: ${workflow.phases.filter(p => p.status === "Rejected").map(p => p.name).join(", ")}`
                    : "Your clearance is being processed."}</p>
                </div>
              </div>

              <h3>Department-wise Status</h3>
              <div className="ac-dept-grid">
                {workflow.phases.map((p) => <DeptCard key={p.name} phase={p} />)}
              </div>

              {/* QR Code & Certificate for completed */}
              {isCompleted && (
                <div className="ac-certificate-section">
                  {workflow.qrCode && (
                    <div className="ac-qr-box">
                      <h4><QrCode size={18} /> Verification QR Code</h4>
                      <img src={workflow.qrCode} alt="QR Code" className="ac-qr-img" />
                    </div>
                  )}
                  <div className="ac-cert-actions">
                    <button className="ac-download-btn" onClick={() => navigate("/student-certificate")}>
                      <Download size={16} /> View / Download Certificate
                    </button>
                  </div>
                </div>
              )}

              {/* Recheck button for rejected */}
              {isRejected && (
                <div className="ac-recheck-section">
                  <p>Once you've resolved your pending issues, click below to re-verify:</p>
                  <button className="ac-recheck-btn" onClick={handleRecheck} disabled={rechecking}>
                    {rechecking ? <><RefreshCw size={16} className="spin" /> Re-checking...</> : <><RefreshCw size={16} /> Re-check Clearance</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}