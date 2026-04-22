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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  RotateCw,
  Archive,
  FileText,
  Calendar,
  User,
  Zap,
  TrendingUp,
  Award,
  Download,
  MapPin,
  BookOpen,
  AlertTriangle,
  Checkmark,
  Menu,
  Bus,
  Users,
  CreditCard,
} from "lucide-react";
import api from "../../services/api";
import "../../styles/scrollbar.css";

export default function ClearanceStatus() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchRequests = async () => {
    try {
      setError("");
      const response = await api.get("/api/clearance-requests");

      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        setError("Failed to load requests");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to load clearance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="text-green-400" size={20} />;
      case "pending":
        return <Clock className="text-yellow-400" size={20} />;
      case "rejected":
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClass = "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border";
    switch (status?.toLowerCase()) {
      case "approved":
        return `${baseClass} bg-green-500/20 text-green-300 border-green-500/40 shadow-lg shadow-green-500/20`;
      case "pending":
        return `${baseClass} bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-lg shadow-yellow-500/20`;
      case "rejected":
        return `${baseClass} bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-500/20`;
      default:
        return `${baseClass} bg-gray-500/20 text-gray-300 border-gray-500/40`;
    }
  };

  const filteredRequests = filter === "all" 
    ? requests 
    : requests.filter(req => req.status?.toLowerCase() === filter.toLowerCase());

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
        <div className="mb-8 bg-gradient-to-r from-blue-50/10 via-cyan-50/5 to-blue-50/10 rounded-2xl p-8 border border-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl shadow-xl">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Clearance Status</h1>
                <p className="text-gray-400 mt-1">Monitor your approval progress across all departments</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl hover:shadow-xl hover:from-blue-600 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg"
            >
              <RotateCw size={24} className={`text-white ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 backdrop-blur-sm">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 font-medium">{error}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {["all", "approved", "pending", "rejected"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all text-sm ${
                filter === status
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full animate-spin mx-auto mb-4 shadow-lg"></div>
              <p className="text-gray-400 text-lg">Loading your clearance requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-12 text-center shadow-lg">
            <Archive size={56} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Clearance Requests</h3>
            <p className="text-gray-400 mb-8">You haven't submitted any clearance requests yet.</p>
            <button
              onClick={() => navigate("/student-clearance-request")}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-xl transition-all"
            >
              Submit Your First Request
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request, index) => {
              const deptStatuses = request.departmentStatuses || [];
              const approvedCount = deptStatuses.filter(d => d.status?.toLowerCase() === "approved").length;
              const totalDepts = deptStatuses.length || 5;
              const approvalPercentage = totalDepts > 0 ? Math.round((approvedCount / totalDepts) * 100) : 0;
              const isFullyApproved = request.status?.toLowerCase() === "approved" || approvalPercentage === 100;

              return (
                <div
                  key={request._id || index}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/40 hover:shadow-xl transition-all shadow-md"
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-700">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${isFullyApproved ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30" : "bg-slate-700"}`}>
                        <FileText size={28} className={isFullyApproved ? "text-green-400" : "text-blue-400"} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {request.student_name}
                          {isFullyApproved && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30 font-semibold">
                              <CheckCircle size={14} />
                              Complete
                            </span>
                          )}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <FileText size={16} className="text-blue-400" />
                            <span><span className="text-gray-500">Reg:</span> {request.registration_no}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <User size={16} className="text-cyan-400" />
                            <span><span className="text-gray-500">Father:</span> {request.father_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <BookOpen size={16} className="text-purple-400" />
                            <span><span className="text-gray-500">Program:</span> {request.program}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <TrendingUp size={16} className="text-orange-400" />
                            <span><span className="text-gray-500">Sem:</span> {request.semester}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={getStatusBadge(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="font-semibold">{request.status || "Unknown"}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest">Approval Progress</h4>
                      <span className="text-sm font-bold text-white bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                        {approvedCount} of {totalDepts} Departments
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${approvalPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 flex justify-between">
                      <span>Progress</span>
                      <span className="font-bold text-cyan-400">{approvalPercentage}%</span>
                    </div>
                  </div>

                  {/* Department Approvals - Dashboard Style */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Users size={24} />
                      Required Clearance Departments
                    </h4>
                    {(() => {
                      // Define all required departments with colors and icons
                      const allDepartments = [
                        { name: "Coordination", id: "coordination", icon: CheckCircle2, color: "from-green-400 to-green-600" },
                        { name: "Transport", id: "transport", icon: Bus, color: "from-purple-400 to-purple-600" },
                        { name: "Library", id: "library", icon: BookOpen, color: "from-blue-400 to-blue-600" },
                        { name: "Fee Department", id: "fee-department", icon: CreditCard, color: "from-red-400 to-red-600" },
                        { name: "Student Service", id: "student-service", icon: Users, color: "from-cyan-400 to-cyan-600" }
                      ];

                      // Create a map of existing department statuses
                      const deptMap = {};
                      if (deptStatuses && deptStatuses.length > 0) {
                        deptStatuses.forEach(dept => {
                          deptMap[dept.name?.toLowerCase() || ""] = dept;
                        });
                      }

                      // Build complete department list with waiting status for missing ones
                      const completeDeptList = allDepartments.map(allDept => {
                        const matchedDept = Object.values(deptMap).find(
                          d => d.name?.toLowerCase() === allDept.name.toLowerCase()
                        );
                        return { ...allDept, ...matchedDept } || { ...allDept, status: "waiting" };
                      });

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {completeDeptList.map((dept, idx) => {
                            const DeptIcon = dept.icon;
                            const isApproved = dept.status?.toLowerCase() === "approved";
                            const isPending = dept.status?.toLowerCase() === "pending";
                            const isRejected = dept.status?.toLowerCase() === "rejected";
                            const isWaiting = dept.status?.toLowerCase() === "waiting";

                            const statusConfig = {
                              approved: { label: 'Approved', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/50', icon: CheckCircle2 },
                              pending: { label: 'Pending', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/50', icon: Clock },
                              rejected: { label: 'Rejected', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/50', icon: AlertCircle },
                              waiting: { label: 'Waiting', bgColor: 'bg-slate-600/20', textColor: 'text-gray-400', borderColor: 'border-slate-600/50', icon: Clock },
                            };
                            
                            const statusKey = isApproved ? 'approved' : isPending ? 'pending' : isRejected ? 'rejected' : 'waiting';
                            const sc = statusConfig[statusKey];
                            const StatusIcon = sc.icon;

                            return (
                              <div
                                key={idx}
                                className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border ${sc.borderColor} hover:shadow-lg transition-all group cursor-pointer ${isRejected ? 'border-l-4' : ''}`}
                                style={isRejected ? { borderLeftColor: '#ef4444', borderLeftWidth: '4px' } : {}}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${dept.color}`}>
                                    <DeptIcon size={24} className="text-white" />
                                  </div>
                                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bgColor} ${sc.textColor}`}>
                                    <StatusIcon size={14} />
                                    {sc.label}
                                  </span>
                                </div>
                                
                                <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-all mb-2">
                                  {dept.name}
                                </h3>
                                
                                {isRejected && (dept.reason || dept.remarks) ? (
                                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <p className="text-xs text-red-300 font-bold mb-2 flex items-center gap-1">
                                      <AlertTriangle size={14} />
                                      Rejection Reason:
                                    </p>
                                    <p className="text-sm text-red-100 mb-0">
                                      {dept.reason || dept.remarks}
                                    </p>
                                    {dept.pendingItems && dept.pendingItems.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-red-500/30">
                                        <p className="text-xs text-red-300 font-bold mb-1">Pending Items:</p>
                                        <ul className="text-xs text-red-100 space-y-1">
                                          {dept.pendingItems.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                              <span className="text-red-400 mt-1">•</span>
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm mt-2">
                                    {dept.isAutoApproved ? 'Auto-approved by system' : 
                                     isApproved ? `Approved by ${dept.approverName || 'department'}` :
                                     isPending ? 'Under review' :
                                     'Waiting for previous department'}
                                  </p>
                                )}
                                
                                {dept.approvedAt && (
                                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(dept.approvedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Timeline and Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-700">
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><Calendar size={14} /> Submitted</p>
                      <p className="text-white font-bold text-sm">
                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><RotateCw size={14} /> Last Update</p>
                      <p className="text-white font-bold text-sm">
                        {isFullyApproved && request.completed_at 
                          ? new Date(request.completed_at).toLocaleDateString() 
                          : "In Progress"}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><FileText size={14} /> SAP ID</p>
                      <p className="text-white font-mono text-sm font-bold">{request.sapid || "N/A"}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><User size={14} /> Father's Name</p>
                      <p className="text-white font-bold text-sm">{request.father_name || "N/A"}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><BookOpen size={14} /> Program</p>
                      <p className="text-white font-bold text-sm truncate">{request.program || "N/A"}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-2"><TrendingUp size={14} /> Semester</p>
                      <p className="text-white font-bold text-sm">{request.semester ? `Semester ${request.semester}` : "N/A"}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isFullyApproved && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <button
                        onClick={() => navigate("/student-certificate")}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={20} />
                        Download Certificate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}