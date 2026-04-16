import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut, GraduationCap, ShieldCheck } from "lucide-react";
import "./ClearanceRequest.css";
import "./Dashboard.css";
import axios from "axios";

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

export default function ClearanceRequest() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingWorkflow, setExistingWorkflow] = useState(null);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  const PHASE_ORDER = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

  // Fetch existing clearance workflow for the student
  useEffect(() => {
    const fetchExistingWorkflow = async () => {
      try {
        setFetchingRequests(true);
        const token = localStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

        if (!token) {
          setFetchingRequests(false);
          return;
        }

        const response = await axios.get(apiUrl + "/api/auto-clearance/student", {
          headers: { Authorization: "Bearer " + token },
        });

        if (response.data.success && response.data.data) {
          setExistingWorkflow(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching existing workflow:", err);
        setExistingWorkflow(null);
      } finally {
        setFetchingRequests(false);
      }
    };

    fetchExistingWorkflow();
  }, []);

  const hasActiveRequest = existingWorkflow && 
    (existingWorkflow.overallStatus === "In Progress" || existingWorkflow.overallStatus === "Pending" || existingWorkflow.overallStatus === "Completed");
  const isRejected = existingWorkflow?.overallStatus === "Rejected";
  const isCompleted = existingWorkflow?.overallStatus === "Completed";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleResubmit = async () => {
    if (!existingWorkflow) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      if (!token) {
        setError("❌ No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        apiUrl + "/api/auto-clearance/recheck",
        {},
        { headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setSuccess("✅ " + response.data.message);
        // Refresh workflow
        const updated = await axios.get(apiUrl + "/api/auto-clearance/student", {
          headers: { Authorization: "Bearer " + token },
        });
        if (updated.data.success && updated.data.data) setExistingWorkflow(updated.data.data);
        setTimeout(() => navigate("/student-clearance-status"), 2000);
      } else {
        setError(response.data.message || "❌ Resubmit failed.");
      }
    } catch (err) {
      console.error("Resubmit Error:", err);
      if (err.response?.status === 401) {
        setError("❌ Invalid or expired token. Please login again.");
      } else {
        setError("❌ " + (err.response?.data?.message || err.message || "Failed to resubmit."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if there's already an active request
    if (hasActiveRequest) {
      setError("❌ You already have an active clearance request. You cannot submit another one.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (
      !formData.registration_no.trim() ||
      !formData.father_name.trim() ||
      !formData.program.trim() ||
      !formData.semester.trim() ||
      !formData.degree_status.trim()
    ) {
      setError("❌ Please fill all required fields.");
      setLoading(false);
      return;
    }

    // Also validate that sapid and student_name exist
    if (!formData.sapid.trim() || !formData.student_name.trim()) {
      setError("❌ Student information is missing. Please logout and login again.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      // Check if token exists
      if (!token) {
        setError("❌ No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      console.log('📝 Submitting form data:', {
        sapid: formData.sapid,
        student_name: formData.student_name,
        registration_no: formData.registration_no,
        father_name: formData.father_name,
        program: formData.program,
        semester: formData.semester,
        degree_status: formData.degree_status,
      });

      // Submit clearance request — auto-verification checks all departments
      const response = await axios.post(
        apiUrl + "/api/auto-clearance",
        {
          sapid: formData.sapid,
          student_name: formData.student_name,
          registration_no: formData.registration_no.trim(),
          father_name: formData.father_name.trim(),
          program: formData.program.trim(),
          semester: formData.semester.trim(),
          degree_status: formData.degree_status.trim(),
          department: formData.department,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        if (response.data.overallStatus === "Completed") {
          setSuccess("✅ All departments cleared! Your clearance certificate has been generated.");
        } else {
          setSuccess("⚠️ Clearance submitted. Rejected by: " + (response.data.rejectedDepartments || []).join(", ") + ". Resolve pending items and re-check.");
        }

        // Reset form
        setFormData({
          sapid: user?.sap || "",
          student_name: user?.full_name || "",
          registration_no: "",
          father_name: "",
          program: "",
          semester: "",
          degree_status: "",
          department: user?.department || "",
        });

        // Refresh workflow state
        const updatedResponse = await axios.get(apiUrl + "/api/auto-clearance/student", {
          headers: { Authorization: "Bearer " + token },
        });

        if (updatedResponse.data.success && updatedResponse.data.data) {
          setExistingWorkflow(updatedResponse.data.data);
        }

        // Redirect to clearance status after 2 seconds
        setTimeout(() => {
          navigate("/student-clearance-status");
        }, 2000);
      } else {
        setError(
          response.data.message || "❌ Submission failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Clearance Request Error:", err);
      
      // Log full error details
      console.error("Error Response:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 401) {
        setError("❌ Invalid or expired token. Please login again.");
      } else if (err.response?.status === 400) {
        setError("❌ " + (err.response?.data?.message || "Invalid form data. Please check all fields."));
      } else if (err.response?.status === 500) {
        setError("❌ Server error: " + (err.response?.data?.message || "Failed to submit request."));
      } else if (err.response?.data?.message) {
        setError("❌ " + err.response.data.message);
      } else {
        setError(
          "❌ Unable to submit request: " + (err.message || "Unknown error")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  return (
    <div className="student-dashboard-page">
      <StudentSidebar displayName={displayName} displaySap={displaySap} displayDept={displayDept} onLogout={handleLogout} />

      <main className="sd-main">
        <header className="sd-header">
          <h1>Submit Clearance Request</h1>
          <p>Fill in your details below to submit a clearance request to all departments</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="clearance-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>SAP ID *</label>
              <input
                type="text"
                name="sapid"
                value={formData.sapid}
                onChange={handleChange}
                required
                disabled
              />
            </div>

            <div className="form-group">
              <label>Student Name *</label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                required
                disabled
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Registration Number *</label>
              <input
                type="text"
                name="registration_no"
                value={formData.registration_no}
                onChange={handleChange}
                placeholder="Enter your registration number"
                required
              />
            </div>

            <div className="form-group">
              <label>Father Name *</label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                placeholder="Enter father's name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Program *</label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="e.g., BSCS, BBA, BE"
                required
              />
            </div>

            <div className="form-group">
              <label>Semester *</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g., 8th"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Degree Status *</label>
              <select
                name="degree_status"
                value={formData.degree_status}
                onChange={handleChange}
                required
              >
                <option value="">Select Status</option>
                <option value="Final Year">Final Year</option>
                <option value="Final Semester">Final Semester</option>
                <option value="Completed">Completed</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || hasActiveRequest || fetchingRequests}
            title={hasActiveRequest ? "You already have an active clearance request" : ""}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : hasActiveRequest ? (
              "🔒 Request Already Submitted (In Progress)"
            ) : fetchingRequests ? (
              "Loading..."
            ) : (
              "✅ Submit Clearance Request"
            )}
          </button>

          {isRejected && existingWorkflow && (
            <div className="resubmit-section">
              <h3>🔄 Resubmit Rejected Request</h3>
              <p className="resubmit-info">
                Your clearance was rejected at <strong>{existingWorkflow.phases.find(p => p.status === "Rejected")?.name || "a department"}</strong>.
                {existingWorkflow.phases.find(p => p.status === "Rejected")?.remarks && (
                  <> Reason: <em>{existingWorkflow.phases.find(p => p.status === "Rejected").remarks}</em></>
                )}
              </p>
              <div className="resubmit-buttons">
                <button
                  type="button"
                  className="resubmit-btn"
                  onClick={handleResubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Resubmitting...
                    </>
                  ) : (
                    "🔄 Resubmit for Review"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="info-box">
          <h3>📢 Important Information</h3>
          {existingWorkflow ? (
            <>
              <p><strong>Your Current Workflow Status: {existingWorkflow.overallStatus}</strong></p>
              <p style={{marginTop: '8px', fontSize: '0.95em'}}>Sequential clearance progress:</p>
              <ul>
                {existingWorkflow.phases.map((phase, idx) => (
                  <li key={idx}>
                    {idx + 1}. {phase.name}: <span className={`status-${phase.status.toLowerCase()}`}>
                      {phase.status === "Approved" ? "✅" : phase.status === "Rejected" ? "❌" : idx === existingWorkflow.currentPhase ? "⏳" : "⬜"} {phase.status}
                    </span>
                    {idx === existingWorkflow.currentPhase && existingWorkflow.overallStatus === "In Progress" && " ← Current"}
                  </li>
                ))}
              </ul>
              <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                ℹ️ Your request moves through departments one at a time. Each department must approve before the next can review.
              </p>
            </>
          ) : (
            <>
              <p>Your clearance request will proceed through departments <strong>sequentially</strong>:</p>
              <ul>
                {PHASE_ORDER.map((phase, i) => (
                  <li key={i}>{i + 1}. {phase}</li>
                ))}
              </ul>
              <p>Each department reviews and approves in order. A certificate is generated once all departments approve.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
