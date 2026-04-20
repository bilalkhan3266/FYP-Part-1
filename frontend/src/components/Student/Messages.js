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
  ShieldCheck,
  ChevronRight,
  Send,
  Inbox,
  AlertTriangle,
  CheckCircle,
  History,
  Reply,
  GraduationCap,
  Loader,
  Clock,
  Menu,
} from "lucide-react";
import api from "../../services/api";

export default function StudentMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("received");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const [sendFormData, setSendFormData] = useState({
    recipient_department: "",
    subject: "",
    message: ""
  });

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "Department";

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ShieldCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  // ✅ FETCH RECEIVED MESSAGES
  const fetchReceivedMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/my-messages");

      if (response.data.success) {
        setReceivedMessages(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.response?.data?.message || "❌ Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH SENT MESSAGES
  const fetchSentMessages = async () => {
    try {
      setSentLoading(true);
      setError("");

      const response = await api.get("/api/student/sent-messages");

      if (response.data.success) {
        setSentMessages(response.data.data || []);
        setError("");
      } else {
        setError(response.data.message || "❌ Failed to load sent messages");
      }
    } catch (err) {
      console.error("Error fetching sent messages:", err);
      setError(err.response?.data?.message || "❌ Failed to load sent messages");
    } finally {
      setSentLoading(false);
    }
  };

  // ✅ HANDLE REPLY
  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      setError("❌ Reply cannot be empty");
      return;
    }

    setReplyLoading(true);
    try {
      const response = await api.post(
        `/api/messages/reply/${messageId}`,
        { message: replyText.trim() }
      );

      if (response.data.success) {
        setSuccess("✅ Reply sent successfully!");
        setReplyingTo(null);
        setReplyText("");
        setTimeout(() => setSuccess(""), 2000);
        fetchReceivedMessages();
      } else {
        setError(response.data.message || "❌ Failed to send reply");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      setError(err.response?.data?.message || "❌ Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  // ✅ SEND MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!sendFormData.recipient_department.trim() || !sendFormData.subject.trim() || !sendFormData.message.trim()) {
      setError("❌ All fields are required");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/api/send-message",
        {
          recipient_department: sendFormData.recipient_department.trim(),
          subject: sendFormData.subject.trim(),
          message: sendFormData.message.trim()
        }
      );

      if (response.data.success) {
        setSuccess("✅ Message sent successfully!");
        setSendFormData({
          recipient_department: "",
          subject: "",
          message: ""
        });
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(response.data.message || "❌ Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.response?.data?.message || "❌ Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOAD MESSAGES ON TAB CHANGE
  useEffect(() => {
    if (activeTab === "received") {
      fetchReceivedMessages();
    } else if (activeTab === "sent") {
      fetchSentMessages();
    }
  }, [activeTab]);

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

      {/* Sidebar */}
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
          <h3 className="font-bold text-white text-center">{displayName}</h3>
          <p className="text-xs text-gray-300 text-center mt-1">{displaySap}</p>
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="text-xs text-gray-400 text-center mt-8 pt-4 border-t border-slate-700">
          © 2025 Riphah
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50/10 to-cyan-50/10 rounded-2xl p-8 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl">
              <MessageSquare size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Messages</h1>
              <p className="text-gray-400 mt-1">Send and receive clearance-related communications</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex items-center gap-2 bg-slate-800 rounded-lg p-1 overflow-x-auto border border-slate-700">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "received"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Inbox size={16} /> Received ({receivedMessages.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "sent"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Send size={16} /> Sent ({sentMessages.length})
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "send"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Send size={16} /> Send Message
          </button>
        </div>

        {/* RECEIVED MESSAGES TAB */}
        {activeTab === "received" && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Loader size={40} className="animate-spin mb-4 text-blue-400" />
                <p className="text-sm font-medium">Loading messages...</p>
              </div>
            ) : receivedMessages.length === 0 ? (
              <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
                <Inbox size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedMessages.map(msg => (
                  <div key={msg._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{msg.subject}</h3>
                        <p className="text-sm text-gray-400">From: {msg.sender_name || "Department"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        msg.is_read ? "bg-slate-700 text-gray-300" : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {msg.is_read ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">{msg.message}</p>

                    {msg.remarks && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm font-semibold text-blue-300">💬 Your Reply:</p>
                        <p className="text-sm text-blue-200 mt-1">{msg.remarks}</p>
                      </div>
                    )}

                    {replyingTo !== msg._id && !msg.remarks && (
                      <button
                        onClick={() => setReplyingTo(msg._id)}
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Reply size={16} /> Reply
                      </button>
                    )}

                    {replyingTo === msg._id && (
                      <div className="mt-4 space-y-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          rows="3"
                          className="w-full px-3 py-2 border border-blue-500/30 rounded-lg bg-slate-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={replyLoading}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(msg._id)}
                            disabled={replyLoading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Send size={16} />
                            {replyLoading ? "Sending..." : "Send Reply"}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            disabled={replyLoading}
                            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SENT MESSAGES TAB */}
        {activeTab === "sent" && (
          <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 p-6">
            {sentLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading sent messages...</div>
              </div>
            ) : sentMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No sent messages yet
              </div>
            ) : (
              <div className="space-y-4">
                {sentMessages.map((message) => (
                  <div
                    key={message._id}
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-blue-300">
                          To: <span className="text-white">{message.recipient_department}</span>
                        </p>
                        <p className="text-sm text-gray-300">
                          {message.subject || "No Subject"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap">
                      {message.message}
                    </p>
                    {message.read && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Read by department
                      </div>
                    )}
                    {!message.read && (
                      <div className="text-xs text-yellow-400 flex items-center gap-1">
                        <Clock size={14} />
                        Pending response
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEND MESSAGE TAB */}
        {activeTab === "send" && (
          <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 p-8 max-w-2xl">
            <form onSubmit={handleSendMessage} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={sendFormData.recipient_department}
                  onChange={(e) => setSendFormData({...sendFormData, recipient_department: e.target.value})}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  <option value="">Select a department</option>
                  <option value="Library">📚 Library</option>
                  <option value="Transport">🚌 Transport</option>
                  <option value="Laboratory">🔬 Laboratory</option>
                  <option value="Student Service">🤝 Student Service</option>
                  <option value="Fee Department">💳 Fee Department</option>
                  <option value="Coordination">✓ Coordination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={sendFormData.subject}
                  onChange={(e) => setSendFormData({...sendFormData, subject: e.target.value})}
                  placeholder="Enter message subject"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={sendFormData.message}
                  onChange={(e) => setSendFormData({...sendFormData, message: e.target.value})}
                  placeholder="Enter your message..."
                  rows="6"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-slate-700 bg-slate-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => navigate("/student-dashboard")}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-slate-600 text-gray-300 rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={20} />
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SENT MESSAGES TAB - DISABLED FOR STUDENTS */}
        {/* Students do not have a sent messages feature - messages flow from departments to students */}
      </main>
    </div>
  );
}