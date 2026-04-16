import React, { useState, useEffect } from "react";
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
  Power,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart3,
  Settings,
  Bell,
  Shield,
  Download,
} from "lucide-react";
import axios from "axios";
import "../../styles/scrollbar.css";

export default function AutoClearanceDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    approvalRate: 0,
  });

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "SAP ID";
  const displayDept = user?.department || "Department";

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ShieldCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages" },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  const fetchAutoClearanceData = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        apiUrl + "/api/auto-clearance/status",
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setIsEnabled(response.data.data?.enabled || false);
        setStats(response.data.data?.stats || stats);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to load auto clearance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoClearanceData();
  }, []);

  const handleToggleAutoClearance = async () => {
    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/auto-clearance/toggle",
        { enabled: !isEnabled },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setIsEnabled(!isEnabled);
        setSuccess(
          !isEnabled
            ? "✅ Auto Clearance enabled successfully!"
            : "✅ Auto Clearance disabled successfully!"
        );
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to update auto clearance status");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl overflow-y-auto border-r border-slate-700 scrollbar-blue">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-blue">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50/10 to-cyan-50/10 rounded-2xl p-8 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Auto Clearance Dashboard</h1>
                <p className="text-gray-400 mt-1">Automated clearance request processing</p>
              </div>
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

        {/* Master Enable/Disable Card */}
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <Zap size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Auto Clearance</h2>
                <p className="text-gray-400">
                  {isEnabled
                    ? "✅ Enabled - Your requests are being automatically processed"
                    : "⚠️ Disabled - Enable to use automatic clearance processing"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAutoClearance}
              disabled={loading}
              className={`p-4 rounded-2xl transition-all ${
                isEnabled
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 hover:shadow-lg"
                  : "bg-gradient-to-br from-gray-600 to-gray-700 hover:bg-gray-700"
              } disabled:opacity-50`}
            >
              <Power size={32} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Requests */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-semibold">Total Requests</h3>
                <ClipboardList size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalRequests || 0}</p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>

            {/* Approved */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-semibold">Approved</h3>
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.approvedCount || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Successfully cleared</p>
            </div>

            {/* Pending */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-semibold">Pending</h3>
                <Clock size={20} className="text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.pendingCount || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
            </div>

            {/* Approval Rate */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-semibold">Approval Rate</h3>
                <TrendingUp size={20} className="text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.approvalRate || 0}%</p>
              <p className="text-xs text-gray-500 mt-2">Success rate</p>
            </div>
          </div>
        )}

        {/* Info Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* How it Works */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={24} className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">How It Works</h2>
            </div>
            <div className="space-y-4">
              {[
                { num: "1", title: "Submit Request", desc: "Create a new clearance request" },
                { num: "2", title: "Auto Processing", desc: "System submits to all departments" },
                { num: "3", title: "Track Status", desc: "Monitor approval progress" },
                { num: "4", title: "Get Certificate", desc: "Download clearance after approval" },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} className="text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Key Benefits</h2>
            </div>
            <div className="space-y-3">
              {[
                "⚡ Fast Processing - Automatic submission to departments",
                "✅ Real-time Updates - Instant notifications on approvals",
                "📊 Complete Dashboard - Track all requests at a glance",
                "🔐 Secure - End-to-end encryption for your data",
                "📱 Mobile Friendly - Access from any device",
                "💼 Professional - Certified by educational authority",
              ].map((benefit, idx) => (
                <p key={idx} className="text-gray-300 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></span>
                  {benefit}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/student-clearance-request")}
            className="px-6 py-4 bg-slate-800 border border-slate-700 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <ClipboardList size={20} />
            Submit New Request
          </button>
          <button
            onClick={() => navigate("/student-clearance-status")}
            className="px-6 py-4 bg-slate-800 border border-slate-700 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <BarChart3 size={20} />
            View Status
          </button>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={20} />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
