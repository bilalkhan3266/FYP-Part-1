import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import "./ClearanceRequest.css";
import axios from "axios";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Submit clearance request - will create records in all department tables
      const response = await axios.post(
        apiUrl + "/api/clearance-requests",
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
        setSuccess("✅ Clearance Request Submitted Successfully to All Departments!");

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
      <aside className="sd-sidebar">
        <div className="sd-profile">
          <div className="sd-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-small">{displaySap} • {displayDept}</p>
            <p className="sd-small">Riphah International University</p>
          </div>
        </div>

        <nav className="sd-nav">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="sd-nav-btn"
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => navigate("/student-clearance-request")}
            className="sd-nav-btn active"
          >
            📋 Submit Request
          </button>
          <button
            onClick={() => navigate("/student-clearance-status")}
            className="sd-nav-btn"
          >
            ✅ Clearance Status
          </button>
          <button
            onClick={() => navigate("/student-messages")}
            className="sd-nav-btn"
          >
            💬 Messages
          </button>
          <button
            onClick={() => navigate("/student-edit-profile")}
            className="sd-nav-btn"
          >
            📝 Edit Profile
          </button>
          <button onClick={handleLogout} className="sd-nav-btn logout">
            🚪 Logout
          </button>
        </nav>

        <footer className="sd-footer">© 2025 Riphah</footer>
      </aside>

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

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              "✅ Submit Clearance Request"
            )}
          </button>
        </form>

        <div className="info-box">
          <h3>📢 Important Information</h3>
          <p>Your clearance request will be sent to all departments:</p>
          <ul>
            <li>📚 Library Department</li>
            <li>🚌 Transport Department</li>
            <li>🔬 Laboratory Department</li>
            <li>👥 Student Service Department</li>
            <li>💰 Fee Department</li>
            <li>📋 Coordination Office</li>
            <li>👨‍💼 HOD (Head of Department)</li>
          </ul>
          <p>Each department will review and approve/reject your request independently.</p>
        </div>
      </main>
    </div>
  );
}
