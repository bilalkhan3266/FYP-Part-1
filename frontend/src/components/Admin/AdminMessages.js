import React, { useState } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import {
  FiGrid, FiUsers, FiMessageSquare, FiEdit, FiLogOut, FiShield, FiSend,
  FiInbox, FiMail, FiX, FiAlertCircle, FiCheckCircle, FiChevronRight,
  FiArrowLeft, FiFilter, FiLoader, FiInfo
} from "react-icons/fi";
import {
  FaBook, FaBus, FaFlask, FaMoneyBillWave, FaClipboardList, FaUserFriends,
  FaBuilding, FaBullhorn, FaUserGraduate
} from "react-icons/fa";
import "./AdminDashboard.css";

export default function AdminMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuthContext();
  const apiUrl = getApiUrl();
  const axiosConfig = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

  const messageType = searchParams.get("type") || "department";
  const deptParam = searchParams.get("dept");

  const [formData, setFormData] = useState({
    messageType: messageType,
    targetType: deptParam ? "specific" : "all",
    department: deptParam || "",
    studentSapId: "",
    roleTarget: "",
    subject: "",
    message: "",
    priority: "normal"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMessageLog, setShowMessageLog] = useState(false);
  const [messageLog, setMessageLog] = useState([]);
  const [messageFilter, setMessageFilter] = useState("all");

  const departments = [
    "Library",
    "Transport",
    "Laboratory",
    "Fee Department",
    "Coordination",
    "Student Services"
  ];

  const departmentRoles = [
    { label: "Library", value: "library", icon: <FaBook /> },
    { label: "Transport", value: "transport", icon: <FaBus /> },
    { label: "Laboratory", value: "laboratory", icon: <FaFlask /> },
    { label: "Fee Department", value: "feedepartment", icon: <FaMoneyBillWave /> },
    { label: "Coordination", value: "coordination", icon: <FaClipboardList /> },
    { label: "Student Services", value: "studentservice", icon: <FaUserFriends /> }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Subject and message are required");
      return;
    }
    if (formData.messageType === "student" && !formData.studentSapId.trim()) {
      setError("Student SAP ID is required");
      return;
    }
    if (formData.messageType === "department" && !formData.department && formData.targetType === "specific") {
      setError("Please select a department");
      return;
    }
    if (formData.messageType === "role" && !formData.roleTarget) {
      setError("Please select a role to broadcast to");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        messageType: formData.messageType,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        priority: formData.priority
      };

      if (formData.messageType === "department") {
        payload.targetType = formData.targetType;
        if (formData.targetType === "specific") {
          payload.department = formData.department;
        }
      } else if (formData.messageType === "student") {
        payload.studentSapId = formData.studentSapId.trim();
      } else if (formData.messageType === "role") {
        payload.roleTarget = formData.roleTarget;
      }

      const response = await axios.post(
        `${apiUrl}/api/admin/send-message`,
        payload,
        axiosConfig
      );

      if (response.data.success) {
        setSuccess(response.data.message || "Message sent successfully!");
        setFormData({
          messageType: formData.messageType,
          targetType: deptParam ? "specific" : "all",
          department: deptParam || "",
          studentSapId: "",
          roleTarget: "",
          subject: "",
          message: "",
          priority: "normal"
        });
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageLog = async () => {
    try {
      const response = await axios.get(apiUrl + "/api/admin/message-log", axiosConfig);
      if (response.data.success) {
        setMessageLog(response.data.data || []);
        setShowMessageLog(true);
        setError("");
      } else {
        setError(response.data.message || "Failed to load message log");
      }
    } catch (err) {
      console.error("Error fetching message log:", err);
      if (err.response?.status === 404) {
        setError("Message log endpoint not found. Make sure the backend is updated.");
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else {
        setError(err.response?.data?.message || "Failed to load message log. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Admin";

  // Preview helpers
  const getTargetLabel = () => {
    if (formData.messageType === "department") {
      return formData.targetType === "all"
        ? "All Departments"
        : formData.department || "Not selected";
    }
    if (formData.messageType === "role") {
      const found = departmentRoles.find(r => r.value === formData.roleTarget);
      return found ? found.label + " Staff" : "Not selected";
    }
    if (formData.messageType === "student") {
      return formData.studentSapId || "Not entered";
    }
    return "—";
  };

  const priorityConfig = {
    low:    { label: "Low",    color: "bg-gray-100 text-gray-600 border-gray-200" },
    normal: { label: "Normal", color: "bg-blue-50 text-blue-700 border-blue-200" },
    high:   { label: "High",   color: "bg-red-50 text-red-600 border-red-200" },
    urgent: { label: "Urgent", color: "bg-orange-50 text-orange-600 border-orange-200" }
  };

  const messageTypeCards = [
    {
      value: "department",
      icon: <FaBuilding className="text-xl" />,
      title: "Send to Department",
      desc: "Send reminders or notices to departments"
    },
    {
      value: "role",
      icon: <FaBullhorn className="text-xl" />,
      title: "Broadcast to Staff",
      desc: "Broadcast a message to all staff in a role"
    },
    {
      value: "student",
      icon: <FaUserGraduate className="text-xl" />,
      title: "Send to Student",
      desc: "Send a direct message by SAP ID"
    }
  ];

  return (
    <div className="admin-dashboard">
      {/* ── Sidebar (shared CSS from AdminDashboard.css) ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon"><FiShield size={32} /></div>
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-profile">
          <div className="admin-avatar">{displayName.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="admin-name">{displayName}</h3>
            <p className="admin-role">System Administrator</p>
          </div>
        </div>
        <nav className="admin-nav">
          <button className="admin-nav-btn" onClick={() => navigate("/admin-dashboard")}>
            <FiGrid style={{ marginRight: 10 }} /> Dashboard
          </button>
          <button className="admin-nav-btn" onClick={() => navigate("/admin-users")}>
            <FiUsers style={{ marginRight: 10 }} /> User Management
          </button>
          <button className="admin-nav-btn active">
            <FiMessageSquare style={{ marginRight: 10 }} /> Messages
          </button>
          <button className="admin-nav-btn" onClick={() => navigate("/admin-edit-profile")}>
            <FiEdit style={{ marginRight: 10 }} /> Edit Profile
          </button>
        </nav>
        <button className="admin-nav-btn logout" onClick={handleLogout}>
          <FiLogOut style={{ marginRight: 10 }} /> Logout
        </button>
        <footer className="admin-footer">© 2025 Riphah University</footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="admin-main" style={{ background: "#f8fafc" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600">
                <FiSend size={20} />
              </span>
              Send Messages
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Communicate with departments and faculty members</p>
          </div>
          <button
            onClick={fetchMessageLog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-indigo-200 bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
          >
            <FiInbox size={16} /> View Messages
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" style={{ animation: "fadeIn 0.3s ease" }}>
            <FiAlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><FiX size={16} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm" style={{ animation: "fadeIn 0.3s ease" }}>
            <FiCheckCircle size={18} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT: Message Form (2/3 width) ── */}
          <div className="xl:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

              {/* Section: Message Type */}
              <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Message Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {messageTypeCards.map(card => {
                    const isActive = formData.messageType === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, messageType: card.value }))}
                        className={`group relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg mb-2 transition-colors ${
                          isActive ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-500"
                        }`}>
                          {card.icon}
                        </div>
                        <span className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-gray-700"}`}>{card.title}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{card.desc}</span>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Target Selection */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  {formData.messageType === "department" && "Department Target"}
                  {formData.messageType === "role" && "Staff Role"}
                  {formData.messageType === "student" && "Student Information"}
                </h3>

                {/* Department */}
                {formData.messageType === "department" && (
                  <>
                    <div className="flex gap-3 mb-4">
                      {[
                        { val: "all", label: "All Departments", icon: <FaBullhorn size={13} /> },
                        { val: "specific", label: "Specific Department", icon: <FaBuilding size={13} /> }
                      ].map(opt => {
                        const sel = formData.targetType === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, targetType: opt.val }))}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                              sel
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {formData.targetType === "specific" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Department <span className="text-red-400">*</span></label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                          <option value="">Choose department...</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Role */}
                {formData.messageType === "role" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff Role <span className="text-red-400">*</span></label>
                    <select
                      name="roleTarget"
                      value={formData.roleTarget}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      <option value="">Select role...</option>
                      {departmentRoles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg bg-sky-50 border border-sky-100">
                      <FiInfo size={15} className="text-sky-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-sky-700">This will broadcast the message to all staff members with the selected role.</span>
                    </div>
                  </div>
                )}

                {/* Student */}
                {formData.messageType === "student" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Student SAP ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      name="studentSapId"
                      value={formData.studentSapId}
                      onChange={handleChange}
                      placeholder="e.g., BCS-123456"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Section: Message Content */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Message Content</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter message subject"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={
                      formData.messageType === "department"
                        ? "Write a progress update reminder or instructions..."
                        : "Write your message or notification..."
                    }
                    rows="7"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-700 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{formData.message.length} characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(priorityConfig).map(([key, cfg]) => {
                      const sel = formData.priority === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            sel
                              ? cfg.color + " border-current shadow-sm"
                              : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 px-6 py-5 bg-gray-50">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><FiLoader size={16} className="animate-spin" /> Sending...</>
                  ) : (
                    <><FiSend size={16} /> Send Message</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-medium text-sm bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <FiArrowLeft size={15} /> Back
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Preview Panel (1/3 width) ── */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-6">
              {/* Preview Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <FiMail size={15} /> Message Preview
                </h3>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Type */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    {formData.messageType === "department" && <><FaBuilding className="text-indigo-400" /> Department</>}
                    {formData.messageType === "role" && <><FaBullhorn className="text-indigo-400" /> Role Broadcast</>}
                    {formData.messageType === "student" && <><FaUserGraduate className="text-indigo-400" /> Student</>}
                  </p>
                </div>

                {/* Target */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Target</p>
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <FiChevronRight size={14} className="text-gray-300" />
                    {getTargetLabel()}
                  </p>
                </div>

                {/* Priority */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig[formData.priority]?.color || ""}`}>
                    {priorityConfig[formData.priority]?.label || formData.priority}
                  </span>
                </div>

                {/* Subject Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm text-gray-700">{formData.subject || <span className="text-gray-300 italic">Not entered yet</span>}</p>
                </div>

                {/* Message Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Message</p>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {formData.message || <span className="text-gray-300 italic">Start typing your message...</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Message Log Modal ── */}
        {showMessageLog && (
          <div
            className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowMessageLog(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
              style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl flex-wrap gap-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiInbox size={18} className="text-indigo-500" /> Message Log
                </h2>
                <div className="flex items-center gap-2">
                  {[
                    { key: "all", label: "All", icon: <FiFilter size={13} /> },
                    { key: "sent", label: "Sent", icon: <FiSend size={13} /> },
                    { key: "received", label: "Received", icon: <FiInbox size={13} /> }
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setMessageFilter(f.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        messageFilter === f.key
                          ? "bg-indigo-500 text-white shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowMessageLog(false)}
                    className="ml-2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messageLog.filter(msg => {
                  if (messageFilter === "all") return true;
                  if (messageFilter === "sent") return msg.sender_type === "admin";
                  if (messageFilter === "received") return msg.sender_type !== "admin";
                  return true;
                }).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FiInbox size={40} className="mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No messages in this filter</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messageLog.filter(msg => {
                      if (messageFilter === "all") return true;
                      if (messageFilter === "sent") return msg.sender_type === "admin";
                      if (messageFilter === "received") return msg.sender_type !== "admin";
                      return true;
                    }).map((msg, idx) => {
                      const isSent = msg.sender_type === "admin";
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-md ${
                            isSent
                              ? "border-l-emerald-400 bg-emerald-50/50"
                              : "border-l-sky-400 bg-sky-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-gray-800">{msg.subject}</span>
                            <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed mb-2">{msg.message}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isSent ? "text-emerald-600" : "text-sky-600"}`}>
                            {isSent ? <FiSend size={11} /> : <FiInbox size={11} />}
                            {isSent ? "Sent to" : "From"}: {msg.recipient || "System"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}