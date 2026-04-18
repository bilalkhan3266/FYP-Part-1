import React, { useState, useMemo, useEffect, useCallback } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import axios from "axios";
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  UserPen,
  LogOut,
  RefreshCw,
  PlusCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Printer,
  Award,
  AlertCircle,
  BookOpen,
  CreditCard,
  Bus,
  Users,
  Handshake,
  GraduationCap,
  ClipboardCheck,
  Inbox,
} from "lucide-react";

export default function StudentDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearanceStatus, setClearanceStatus] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "SAP ID";
  const displayDept = user?.department || "Department";

  // ✅ FETCH CLEARANCE STATUS
  const fetchClearanceStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      const response = await axios.get(apiUrl + "/api/clearance-status", {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        setClearanceStatus(response.data.summary);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching clearance status:", err);
    }
  }, []);

  // ✅ FETCH UNREAD MESSAGES
  const fetchUnreadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiUrl();

      const response = await axios.get(apiUrl + "/api/my-messages", {
        headers: { Authorization: "Bearer " + token }
      });

      if (response.data.success) {
        const unread = response.data.data.filter(msg => !msg.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, []);

  useEffect(() => {
    fetchClearanceStatus();
    fetchUnreadMessages();
    setLoading(false);
  }, [fetchClearanceStatus, fetchUnreadMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClearanceStatus();
    await fetchUnreadMessages();
    setRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ClipboardCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  const departments = [
    { name: "Library", icon: BookOpen, color: "from-blue-400 to-blue-600" },
    { name: "Transport", icon: Bus, color: "from-green-400 to-green-600" },
    { name: "Laboratory", icon: Users, color: "from-purple-400 to-purple-600" },
    { name: "Student Service", icon: Handshake, color: "from-orange-400 to-orange-600" },
    { name: "Fee Department", icon: CreditCard, color: "from-red-400 to-red-600" },
    { name: "Coordination", icon: CheckCircle2, color: "from-pink-400 to-pink-600" },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <GraduationCap size={48} className="text-blue-400" />
          </div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl overflow-y-auto border-r border-slate-700">
        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
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
          <p className="text-xs text-blue-300 text-center mt-1">{displayDept}</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <footer className="text-xs text-gray-400 text-center mt-8 pt-4 border-t border-slate-700">
          © 2025 Riphah International University
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {displayName}! 👋</h1>
            <p className="text-gray-400">Track your clearance progress and manage your requests</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={24} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Clearances Needed</h3>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ClipboardList size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clearanceStatus?.total || 0}</p>
            <p className="text-sm text-gray-400 mt-2">Total departments</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Approved</h3>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clearanceStatus?.cleared || 0}</p>
            <p className="text-sm text-gray-400 mt-2">Clearances approved</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Pending</h3>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock size={20} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clearanceStatus?.pending || 0}</p>
            <p className="text-sm text-gray-400 mt-2">Awaiting review</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Rejected</h3>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{clearanceStatus?.rejected || 0}</p>
            <p className="text-sm text-gray-400 mt-2">Need resubmission</p>
          </div>
        </div>

        {/* Progress Bar */}
        {clearanceStatus && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-400" />
                Clearance Progress
              </h3>
              <span className="text-2xl font-bold text-blue-400">
                {clearanceStatus.progressPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${clearanceStatus.progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {clearanceStatus.cleared} out of {clearanceStatus.total} departments approved
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate("/student-clearance-request")}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">New Clearance Request</h3>
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/40 transition-all">
                <PlusCircle size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">Submit a new clearance request to all departments</p>
            <div className="flex items-center gap-2 mt-4 text-blue-400 group-hover:gap-3 transition-all">
              <span className="text-sm font-medium">Submit Request</span>
              <ChevronRight size={16} />
            </div>
          </button>

          <button
            onClick={() => navigate("/student-clearance-status")}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Check Status</h3>
              <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/40 transition-all">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">View detailed status of your clearance requests</p>
            <div className="flex items-center gap-2 mt-4 text-green-400 group-hover:gap-3 transition-all">
              <span className="text-sm font-medium">View Status</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>

        {/* Department Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users size={24} />
            Clearance Department List
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div
                key={dept.name}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-opacity-100 hover:shadow-lg transition-all group"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${dept.color} mb-4`}>
                  <dept.icon size={24} className="text-white" />
                </div>
                <h3 className="text-white font-semibold group-hover:text-blue-400 transition-all">
                  {dept.name}
                </h3>
                <p className="text-gray-400 text-sm mt-2">
                  Clearance status and requirements
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Preview */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Inbox size={24} className="text-blue-400" />
              Recent Messages
            </h2>
            <button
              onClick={() => navigate("/student-messages")}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          {unreadCount > 0 ? (
            <p className="text-gray-400">
              You have <span className="font-bold text-blue-400">{unreadCount}</span> unread messages
            </p>
          ) : (
            <p className="text-gray-400">No new messages. You're all caught up! 🎉</p>
          )}
        </div>
      </main>
    </div>
  );
}