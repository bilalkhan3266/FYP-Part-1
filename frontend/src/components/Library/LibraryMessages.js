import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  LayoutDashboard, MessageSquare, UserPen, LogOut, Send, Inbox, 
  AlertTriangle, CheckCircle, History, Megaphone, Reply, X, 
  Paperclip, ThumbsDown, AlertCircle, Search, Filter, Download,
  Clock, User, Phone, Mail, Eye, EyeOff, Plus, Archive, Trash2,
  Star, Pin, Share2
} from "lucide-react";
import axios from "axios";

export default function LibraryMessages() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("received");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    recipient_sapid: "",
    subject: "",
    message: "",
    message_type: "info"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file attachment
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Fetch messages
  const fetchReceivedMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/my-messages", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
      });

      if (response.data.success) {
        const studentMessages = response.data.data.filter(msg => msg.sender_role === 'student');
        setReceivedMessages(studentMessages);
      } else {
        setError(response.data.message || "Failed to load messages");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/staff/sent-messages", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
      });

      if (response.data.success) {
        setSentMessages(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to load sent messages");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sent messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminBroadcasts = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(apiUrl + "/api/my-messages", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
      });

      if (response.data.success) {
        const broadcasts = response.data.data.filter(msg => msg.messageType === 'admin-broadcast' || msg.message_type === 'admin-broadcast');
        setAdminBroadcasts(broadcasts);
      } else {
        setError(response.data.message || "Failed to load broadcasts");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "received") fetchReceivedMessages();
    else if (activeTab === "history") fetchSentMessages();
    else if (activeTab === "broadcasts") fetchAdminBroadcasts();
  }, [activeTab]);

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      setError("Reply message cannot be empty");
      return;
    }

    setReplyLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + `/api/messages/reply/${messageId}`,
        { message: replyText.trim() },
        { headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setSuccess("Reply sent successfully!");
        setReplyingTo(null);
        setReplyText("");
        setTimeout(() => setSuccess(""), 2000);
        fetchReceivedMessages();
      } else {
        setError(response.data.message || "Failed to send reply");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.recipient_sapid.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send-message",
        {
          recipient_sapid: formData.recipient_sapid.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.message_type
        },
        { headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setSuccess("Message sent successfully!");
        setFormData({ recipient_sapid: "", subject: "", message: "", message_type: "info" });
        setAttachments([]);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredReceived = receivedMessages.filter(msg =>
    msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSent = sentMessages.filter(msg =>
    msg.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = user?.full_name || "Library Staff";
  const displaySap = user?.sap || "N/A";

  // Message status badge
  const getStatusBadge = (type) => {
    const badges = {
      success: { bg: "bg-emerald-100", text: "text-emerald-800", label: "✅ Approved", icon: "📝" },
      error: { bg: "bg-red-100", text: "text-red-800", label: "❌ Rejection", icon: "⚠️" },
      warning: { bg: "bg-amber-100", text: "text-amber-800", label: "⚠️ Warning", icon: "🔔" },
      info: { bg: "bg-blue-100", text: "text-blue-800", label: "ℹ️ Info", icon: "📢" }
    };
    return badges[type] || badges.info;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] flex flex-col bg-gradient-to-b from-[#0a0f24] via-[#1b2a56] to-[#182848] text-white py-6 px-4 shadow-2xl overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <MessageSquare size={22} />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Messages Hub</h1>
        </div>

        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <p className="text-[11px] text-gray-300 truncate">{displaySap} • Library</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <button onClick={() => navigate("/library-dashboard")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <MessageSquare size={18} /> Messages
          </button>
          <button onClick={() => navigate("/library-edit-profile")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            <UserPen size={18} /> Edit Profile
          </button>
          <button onClick={() => navigate("/library-dashboard")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            <ThumbsDown size={18} /> Reject
          </button>
          <button onClick={() => navigate("/library-issue-return")} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all">
            <AlertCircle size={18} /> Create Issue
          </button>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all mt-4">
          <LogOut size={18} /> Logout
        </button>

        <footer className="text-[11px] text-gray-500 text-center pt-4 mt-4 border-t border-white/10">© 2025 Riphah</footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Hero Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
              <p className="text-gray-600 mt-1">Professional communication hub for your department</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600"><strong>{receivedMessages.length}</strong> new messages</p>
            <p className="text-xs text-gray-500 mt-1">Last updated just now</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 animate-pulse">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
            <CheckCircle size={18} className="shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto"><X size={16} /></button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
          <button
            onClick={() => { setActiveTab("received"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "received"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Inbox size={16} /> Received ({filteredReceived.length})
          </button>
          <button
            onClick={() => { setActiveTab("send"); setSearchQuery(""); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "send"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Send size={16} /> Send Message
          </button>
          <button
            onClick={() => { setActiveTab("history"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "history"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <History size={16} /> Sent ({filteredSent.length})
          </button>
          <button
            onClick={() => { setActiveTab("broadcasts"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "broadcasts"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Megaphone size={16} /> Broadcasts ({adminBroadcasts.length})
          </button>
          
          {(activeTab === "received" || activeTab === "history") && (
            <div className="ml-auto flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm py-1 focus:outline-none w-40"
              />
            </div>
          )}
        </div>

        {/* ── RECEIVED MESSAGES TAB ── */}
        {activeTab === "received" && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin mb-4"><MessageSquare size={32} className="text-blue-400" /></div>
                <p className="text-gray-600 font-medium">Loading messages...</p>
              </div>
            ) : filteredReceived.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Inbox size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Messages from students will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReceived.map((msg) => {
                  const badge = getStatusBadge(msg.message_type);
                  return (
                    <div key={msg._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4 gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {msg.sender_name?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-900">{msg.sender_name}</h3>
                                <p className="text-xs text-gray-500">{msg.sender_sapid}</p>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mt-2 break-words">{msg.subject}</h4>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge.bg} ${badge.text} border`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 text-sm bg-gray-50 p-3 rounded-lg">{msg.message}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Star size={16} /></button>
                            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded transition"><Share2 size={16} /></button>
                          </div>
                        </div>

                        <button
                          onClick={() => setReplyingTo(replyingTo === msg._id ? null : msg._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition"
                        >
                          <Reply size={14} /> {replyingTo === msg._id ? "Cancel" : "Reply"}
                        </button>

                        {replyingTo === msg._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply..."
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={4}
                            />
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={() => handleReply(msg._id)}
                                disabled={replyLoading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {replyLoading ? "Sending..." : <>✅ Send Reply</>}
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SEND MESSAGE TAB ── */}
        {activeTab === "send" && (
          <form onSubmit={handleSubmit} className="max-w-3xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student SAP ID *</label>
                  <input
                    type="text"
                    name="recipient_sapid"
                    value={formData.recipient_sapid}
                    onChange={handleChange}
                    placeholder="e.g., 12345"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type *</label>
                  <select
                    name="message_type"
                    value={formData.message_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">📢 Information</option>
                    <option value="success">✅ Approved</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="error">❌ Rejection</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter message subject"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  required
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Attachments */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Attachments</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition text-center"
                >
                  <Paperclip size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDFs, images, documents up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
                >
                  <Send size={18} /> Send Message
                </button>
                <button
                  type="button"
                  onClick={() => { setFormData({ recipient_sapid: "", subject: "", message: "", message_type: "info" }); setAttachments([]); }}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── SENT MESSAGES TAB ── */}
        {activeTab === "history" && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin mb-4"><MessageSquare size={32} className="text-purple-400" /></div>
                <p className="text-gray-600 font-medium">Loading sent messages...</p>
              </div>
            ) : filteredSent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <History size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-500">No sent messages</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSent.map((msg) => {
                  const badge = getStatusBadge(msg.message_type);
                  return (
                    <div key={msg._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-3 gap-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{msg.subject}</h4>
                          <p className="text-sm text-gray-600 mt-1">To: {msg.recipient_sapid}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg mb-3">{msg.message}</p>
                      <p className="text-xs text-gray-500">Sent: {new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BROADCASTS TAB ── */}
        {activeTab === "broadcasts" && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin mb-4"><Megaphone size={32} className="text-amber-400" /></div>
                <p className="text-gray-600 font-medium">Loading broadcasts...</p>
              </div>
            ) : adminBroadcasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Megaphone size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-500">No broadcasts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminBroadcasts.map((msg) => (
                  <div key={msg._id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0">
                        <Megaphone size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">{msg.subject}</h4>
                        <p className="text-sm text-gray-700 mt-2">{msg.message}</p>
                        <p className="text-xs text-gray-600 mt-3">📅 {new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
