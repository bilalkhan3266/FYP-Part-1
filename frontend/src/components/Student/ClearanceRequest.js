import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  UserPen,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle,
  Loader,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  FileText,
  Lock,
  Edit3,
  RefreshCw,
  Lightbulb,
  CreditCard,
  Menu,
} from "lucide-react";
import api from "../../services/api";
import "../../styles/scrollbar.css";

// Program mappings based on department selected during signup
const PROGRAM_BY_DEPARTMENT = {
  "Computer Science": [
    "BS Computer Science",
    "BS Software Engineering",
    "BS Cybersecurity",
    "BS Information Technology"
  ],
  "Media Studies": [
    "BS Media Studies",
    "BA Journalism",
    "BA Mass Communication",
    "BS Digital Media"
  ],
  "Medical Sciences": [
    "Doctor of Medicine (MD)",
    "BS Nursing",
    "BS Allied Health Sciences",
    "PharmD - Doctor of Pharmacy"
  ],
  "Business Administration": [
    "MBA - Master of Business Administration",
    "BS Business Administration",
    "BS Accounting",
    "BS Finance"
  ],
  "Engineering": [
    "BS Civil Engineering",
    "BS Electrical Engineering",
    "BS Mechanical Engineering",
    "BS Software Engineering"
  ],
  "Law": [
    "LLB - Bachelor of Laws",
    "LLM - Master of Laws",
    "BS Law and Business"
  ],
  "Arts & Humanities": [
    "BA English Literature",
    "BA History",
    "BA Islamic Studies",
    "BA Urdu Literature"
  ],
  "Islamic Studies": [
    "BS Islamic Studies",
    "BA Islamic Jurisprudence",
    "MA Islamic Theology"
  ],
  "Other": [
    "Other Program"
  ]
};

export default function ClearanceRequest() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    sapid: user?.sap || "",
    student_name: user?.full_name || "",
    father_name: "",
    program: "",
    semester: "",
    degree_status: "Undergraduate",
    department: user?.department || "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStage, setCurrentStage] = useState("");
  const [clearanceHistory, setClearanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [canSubmitNew, setCanSubmitNew] = useState(true);
  const [reasonForResubmit, setReasonForResubmit] = useState("");
  const [allDepartmentsApproved, setAllDepartmentsApproved] = useState(false);
  const [hasRejection, setHasRejection] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [showAlerts, setShowAlerts] = useState(true);

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "SAP ID";
  const displayDept = user?.department || "Department";

  // Get available programs based on selected/user department
  const availablePrograms = PROGRAM_BY_DEPARTMENT[user?.department] || [];

  // Fetch clearance history on component mount
  useEffect(() => {
    const fetchClearanceHistory = async () => {
      try {
        const response = await api.get("/api/clearance-requests");

        if (response.data.success && response.data.data) {
          setClearanceHistory(response.data.data);

          // Check if student can submit new request
          const lastRequest = response.data.data[0];
          if (lastRequest) {
            setCurrentRequest(lastRequest);
            
            // Check department statuses to determine approval/rejection
            const deptStatuses = lastRequest.departmentStatuses || [];
            const allApproved = deptStatuses.length > 0 && deptStatuses.every(dept => dept.status === 'Approved');
            const anyRejected = deptStatuses.some(dept => dept.status === 'Rejected');
            
            setAllDepartmentsApproved(allApproved);
            setHasRejection(anyRejected);
            
            if (lastRequest.status === 'Pending' || lastRequest.status === 'In Progress') {
              setCanSubmitNew(false);
              setReasonForResubmit("You have an active request - wait for it to complete before submitting another.");
            } else if (lastRequest.status === 'Approved' && allApproved) {
              setCanSubmitNew(false);
              setReasonForResubmit("Your request has been approved by all departments. No resubmission needed.");
            } else if (anyRejected) {
              setCanSubmitNew(true);
              setReasonForResubmit("Your request was rejected by one or more departments. You can submit a new request now.");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching clearance history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchClearanceHistory();
  }, []);

  // Auto-hide alerts after 3 seconds when all departments are approved
  useEffect(() => {
    if (allDepartmentsApproved && showAlerts) {
      const timer = setTimeout(() => {
        setShowAlerts(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDepartmentsApproved, showAlerts]);

  // Pre-fill form with previous rejection data
  useEffect(() => {
    if (hasRejection && currentRequest) {
      setFormData({
        sapid: currentRequest.sapid || user?.sap || "",
        student_name: currentRequest.student_name || user?.full_name || "",
        father_name: currentRequest.father_name || "",
        program: currentRequest.program || "",
        semester: currentRequest.semester || "",
        degree_status: currentRequest.degree_status || "Undergraduate",
        department: currentRequest.department || user?.department || "",
      });
    }
  }, [hasRejection, currentRequest, user]);

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ShieldCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation - Check each field with specific messages
    if (!formData.father_name.trim()) {
      setError("❌ Father's name is required");
      return;
    }

    if (!formData.program.trim()) {
      setError("❌ Please select a program from the dropdown");
      return;
    }

    if (!formData.semester.trim()) {
      setError("❌ Semester is required");
      return;
    }

    // Validate semester range
    const semNum = parseInt(formData.semester);
    if (isNaN(semNum) || semNum < 1 || semNum > 12) {
      setError("❌ Semester must be a number between 1 and 12");
      return;
    }

    if (!formData.degree_status.trim()) {
      setError("❌ Degree status is required");
      return;
    }

    if (!formData.sapid.trim()) {
      setError("❌ SAP ID is required");
      return;
    }

    // Check if can submit new request
    if (!canSubmitNew) {
      setError(`⚠️ ${reasonForResubmit}`);
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Submitting clearance request:', formData);

      const response = await api.post(
        "/api/clearance-requests",
        formData
      );

      if (response.data.success) {
        setSubmitted(true);
        setCanSubmitNew(false);
        setCurrentStage(response.data.currentStage || "Stage 1 of 5: Coordination");
        
        // Analyze department statuses from response
        const deptStatuses = response.data.departmentStatuses || [];
        const allApproved = deptStatuses.length > 0 && deptStatuses.every(dept => dept.status === 'Approved');
        const anyRejected = deptStatuses.some(dept => dept.status === 'Rejected');
        
        setAllDepartmentsApproved(allApproved);
        setHasRejection(anyRejected);
        setCurrentRequest(response.data);
        
        setSuccess(`✅ ${response.data.message}\n${response.data.currentStage}`);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/student-clearance-status");
        }, 3000);
      } else {
        setError(response.data.message || "❌ Failed to submit request");
      }
    } catch (err) {
      console.error("Error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 409) {
        setError(`⚠️ ${err.response?.data?.message || "You already have an active request"}`);
        setCanSubmitNew(false);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "❌ Invalid input - please check your details");
      } else {
        setError(err.response?.data?.message || "❌ Failed to submit request");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Mobile Hamburger Button */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-700 shadow-lg border border-slate-600 hover:bg-slate-600 transition-colors duration-200">
        <Menu size={24} className="text-white" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

      {/* Sidebar with Custom Scrollbar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-[280px] shrink-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl overflow-y-auto border-r border-slate-700 scrollbar-blue transition-transform duration-300 z-40 lg:z-auto`}>
        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Riphah</h2>
              <p className="text-xs text-blue-300">Clearance Portal</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-4 mb-8 border border-slate-600">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-lg font-bold text-white mb-3 mx-auto">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-white text-center truncate">{displayName}</h3>
          <p className="text-xs text-gray-300 text-center mt-1 truncate">{displaySap}</p>
          <p className="text-xs text-blue-300 text-center mt-1 truncate">{displayDept}</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <footer className="text-xs text-gray-400 text-center mt-8 pt-4 border-t border-slate-700">
          © 2025 Riphah
        </footer>
      </aside>

      {/* Main Content with Custom Scrollbar */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-blue">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50/10 to-cyan-50/10 rounded-2xl p-8 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl">
              <ClipboardList size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Submit Clearance Request</h1>
              <p className="text-gray-400 mt-1">Fill in your details to submit a new clearance request</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* REJECTION RESUBMISSION MESSAGE - Shows when request has been rejected */}
        {hasRejection && !allDepartmentsApproved && (
          <div className="mb-6 p-5 bg-orange-500/20 border border-orange-500/40 rounded-xl flex items-start gap-4">
            <AlertTriangle size={24} className="text-orange-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-orange-300 font-bold text-lg">Your Clearance Request Was Rejected</p>
              <div className="text-orange-200 text-sm mt-3 space-y-2">
                <p className="flex items-center gap-2"><FileText size={16} className="text-orange-400 flex-shrink-0" /> <strong>The form below has been pre-filled with your previous submission.</strong></p>
                <p className="flex items-center gap-2"><Lock size={16} className="text-orange-400 flex-shrink-0" /> <strong>All fields are locked and cannot be edited.</strong></p>
                <p className="flex items-center gap-2"><Edit3 size={16} className="text-orange-400 flex-shrink-0" /> To resubmit, review the rejected reasons shown below and fix the issues with your department.</p>
                <p className="flex items-center gap-2"><RefreshCw size={16} className="text-orange-400 flex-shrink-0" /> After fixing the issues in your department, click the <strong>"Resubmit Request"</strong> button below.</p>
              </div>
              <div className="mt-4 p-3 bg-black/30 rounded-lg">
                <p className="text-orange-100 text-xs flex items-center gap-2"><Lightbulb size={16} className="text-orange-300 flex-shrink-0" /> <strong>Tip:</strong> Contact the rejected department(s) first to understand what issues need to be fixed before resubmitting.</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message - Cannot Submit or Approval Status */}
        {!canSubmitNew && showAlerts && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-semibold">Submit Button Disabled</p>
              <p className="text-yellow-200 text-sm mt-1">{reasonForResubmit}</p>
              {allDepartmentsApproved && (
                <p className="text-green-300 text-sm mt-2 flex items-center gap-2"><CheckCircle size={16} /> All departments have approved your request!</p>
              )}
              {hasRejection && !allDepartmentsApproved && (
                <p className="text-orange-300 text-sm mt-2 flex items-center gap-2"><AlertTriangle size={16} /> Some departments rejected your request. You can resubmit to fix the issues.</p>
              )}
            </div>
          </div>
        )}

        {/* Status Message - All Approved */}
        {allDepartmentsApproved && showAlerts && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <p className="text-green-300 font-semibold flex items-center gap-2"><CheckCircle size={18} /> Request Fully Approved</p>
              <p className="text-green-200 text-sm mt-1">All departments have approved your clearance request. Your certificate is being generated.</p>
            </div>
          </div>
        )}

        {/* Clearance Request History */}
        {!historyLoading && clearanceHistory.length > 0 && (
          <div className="mb-8 max-w-4xl">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 size={24} className="text-blue-400" />
                Your Clearance History
              </h2>
              <div className="space-y-4">
                {clearanceHistory.map((request, idx) => (
                  <div key={request._id} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-400">Request #{idx + 1}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'Approved' ? 'bg-green-500/20 text-green-300' :
                            request.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            request.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                            request.status === 'Rejected' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                          <span className="text-gray-300 font-semibold">SAP:</span> {request.sapid}
                        </p>
                        <p className="text-sm text-gray-400 mb-1">
                          <span className="text-gray-300 font-semibold">Program:</span> {request.program}
                        </p>
                        <p className="text-sm text-gray-400 mb-2">
                          <span className="text-gray-300 font-semibold">Submitted:</span> {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : 'N/A'}
                        </p>
                        
                        {/* Department Status */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                          {['Coordination', 'Transport', 'Library', 'Fee Department', 'Student Service'].map((dept, dIdx) => {
                            const deptStatus = request.departmentStatuses?.[dIdx] || { status: 'Pending' };
                            return (
                              <div key={dept} className={`p-2 rounded text-xs font-semibold text-center ${
                                deptStatus.status === 'Approved' ? 'bg-green-500/20 text-green-300' :
                                deptStatus.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                deptStatus.status === 'Rejected' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                <div className="truncate">{dept.split(' ')[0]}</div>
                                <div className="text-xs mt-1">{deptStatus.status}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="max-w-4xl bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen size={24} className="text-blue-400" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Student Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={true}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-not-allowed"
                  />
                </div>

                {/* SAP ID */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    SAP ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="sapid"
                    value={formData.sapid}
                    onChange={handleChange}
                    placeholder="Your SAP ID"
                    disabled={true}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-gray-400 placeholder-gray-600 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Father's Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    placeholder="Enter your father's name"
                    disabled={loading || !canSubmitNew || hasRejection}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Program - Dropdown based on department */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Program <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    disabled={loading || !canSubmitNew || hasRejection}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Program for {user?.department || "Your Department"} --</option>
                    {availablePrograms.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                  {!availablePrograms.length && (
                    <small className="text-yellow-400 block mt-2">
                      Please update your profile with a valid department in Edit Profile
                    </small>
                  )}
                </div>

                {/* Semester - Dropdown 1-12 */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    disabled={loading || !canSubmitNew || hasRejection}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Semester --</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Degree Status */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Degree Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="degree_status"
                    value={formData.degree_status}
                    onChange={handleChange}
                    disabled={loading || !canSubmitNew || hasRejection}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Your department"
                    disabled={true}
                    className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2"><ClipboardList size={16} /> Sequential Approval Process</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li className="flex items-start gap-2"><ClipboardList size={14} className="text-blue-400 flex-shrink-0 mt-0.5" /> <span>Stage 1: Coordination → Stage 2: Transport → Stage 3: Library</span></li>
                <li className="flex items-start gap-2"><CreditCard size={14} className="text-blue-400 flex-shrink-0 mt-0.5" /> <span>Stage 4: Fee Department → Stage 5: Student Service</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" /> <span>Each department approves before the next one receives your request</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" /> <span>You'll receive notifications as your request progresses through each stage</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" /> <span>After all 5 departments approve, your certificate will be generated and sent</span></li>
                <li className="flex items-start gap-2"><AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" /> <span>You can ONLY submit ONE request at a time</span></li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-700">
              <button
                type="button"
                onClick={() => navigate("/student-dashboard")}
                disabled={loading || submitted}
                className="flex-1 px-6 py-3 border border-slate-600 text-gray-300 rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back to Dashboard
              </button>

              {/* SUBMIT BUTTON - Hidden if there's a rejection */}
              {!hasRejection && (
                <button
                  type="submit"
                  disabled={loading || allDepartmentsApproved || (submitted && !hasRejection) || !canSubmitNew}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {allDepartmentsApproved ? (
                    <>
                      <CheckCircle size={20} />
                      All Approved
                    </>
                  ) : submitted && !hasRejection ? (
                    <>
                      <CheckCircle size={20} />
                      Request Submitted
                    </>
                  ) : !canSubmitNew && !hasRejection ? (
                    <>
                      <AlertTriangle size={20} />
                      Cannot Submit Yet
                    </>
                  ) : loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Submit Request
                    </>
                  )}
                </button>
              )}

              {/* RESUBMIT BUTTON - Shows only if there's a rejection */}
              {hasRejection && (
                <button
                  type="submit"
                  disabled={loading || allDepartmentsApproved}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  title={allDepartmentsApproved ? "Request is fully approved" : "Resubmit after rejection"}
                >
                  {allDepartmentsApproved ? (
                    <>
                      <CheckCircle size={20} />
                      Approved ✓
                    </>
                  ) : loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} />
                      Resubmit Request
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}