import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  ClipboardList, CheckCircle2, XCircle, MessageSquare, UserPen, LogOut,
  GitCompare, AlertCircle, CheckCircle, Inbox, AlertTriangle
} from "lucide-react";
import axios from "axios";

export default function CoordinationDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("approved");
  const [allData, setAllData] = useState({ approved: [], rejected: [] });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [modalAction, setModalAction] = useState("");
  const [modalRequestId, setModalRequestId] = useState(null);
  const [modalStudentSapId, setModalStudentSapId] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      // Add cache buster parameter to force fresh data
      const cacheBuster = `?_t=${Date.now()}`;

      const response = await axios.get(apiUrl + "/api/clearance/department" + cacheBuster, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        }
      });

      if (response.data.success) {
        // Store all data
        const allTabsData = {
          approved: (response.data.approved || []).map(r => ({
            _id: r._id,
            student_name: r.studentName || "Unknown Student",
            sapid: r.sapid,
            program: r.program,
            semester: r.semester,
            status: r.phaseStatus,
            remarks: r.phaseRemarks,
            createdAt: r.submittedAt,
            completedAt: r.completedAt,
            overallStatus: r.overallStatus,
            currentPhase: r.currentPhase,
            phases: r.phases,
          })),
          rejected: (response.data.rejected || []).map(r => ({
            _id: r._id,
            student_name: r.studentName || "Unknown Student",
            sapid: r.sapid,
            program: r.program,
            semester: r.semester,
            status: r.phaseStatus,
            remarks: r.phaseRemarks,
            createdAt: r.submittedAt,
            completedAt: r.completedAt,
            overallStatus: r.overallStatus,
            currentPhase: r.currentPhase,
            phases: r.phases,
          })),
        };
        setAllData(allTabsData);
      } else {
        setError(response.data.message || "❌ Failed to fetch requests");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  // Set requests based on active tab from cached allData
  useEffect(() => {
    setRequests(allData[activeTab] || []);
  }, [activeTab, allData]);

  // Fetch all data only on mount and set up auto-refresh
  useEffect(() => {
    fetchRequests();

    // Set up auto-refresh every 5 seconds to update rejected tab when students resubmit
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing coordination dashboard data...");
      fetchRequests();
    }, 5000); // Refresh every 5 seconds

    setRefreshInterval(interval);

    // Cleanup interval on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handleOpenRemarksModal = (requestId, action, sapId) => {
    setModalRequestId(requestId);
    setModalStudentSapId(sapId);
    setModalAction(action);
    setRemarks("");
    setShowRemarksModal(true);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/clearance/department/approve-or-reject`,
        {
          requestId: modalRequestId,
          studentSapId: modalStudentSapId,
          departmentName: "Coordination",
          action: "approve",
          remarks: remarks.trim()
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request approved successfully!");
        setShowRemarksModal(false);
        setRemarks("");
        setTimeout(() => {
          fetchRequests();
          setSuccess("");
        }, 1500);
      } else {
        setError(response.data.message || "❌ Failed to approve request");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      setError("❌ Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.put(
        apiUrl + `/api/clearance/department/approve-or-reject`,
        {
          requestId: modalRequestId,
          studentSapId: modalStudentSapId,
          departmentName: "Coordination",
          action: "reject",
          remarks: remarks.trim()
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("✅ Request rejected successfully!");
        setShowRemarksModal(false);
        setRemarks("");
        setTimeout(() => {
          fetchRequests();
          setSuccess("");
        }, 1500);
      } else {
        setError(response.data.message || "❌ Failed to reject request");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "❌ Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Coordination Staff";
  const displaySap = user?.sap || "N/A";

  // Calculate statistics from all data (not just current tab)
  const [stats, setStats] = useState({ approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    const totalRequests = allData.approved.length + allData.rejected.length;
    setStats({
      approved: allData.approved.length,
      rejected: allData.rejected.length,
      total: totalRequests,
    });
  }, [allData]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] flex flex-col bg-gradient-to-b from-[#1a0e3e] via-[#2d1b69] to-[#1f1450] text-white py-6 px-4 shadow-xl overflow-y-auto shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white shadow-lg">
            <GitCompare size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">Coordination</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-purple-500/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <p className="text-[11px] text-gray-300 truncate">{displaySap} • Coordination</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "approved" ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
          >
            <CheckCircle2 size={18} /> Approved
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "rejected" ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
          >
            <XCircle size={18} /> Rejected
          </button>
          <div className="my-2 border-t border-white/10" />
          <button
            onClick={() => navigate("/coordination-issue-return")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <Inbox size={18} /> Create Issue
          </button>
          <button
            onClick={() => navigate("/coordination-messages")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/coordination-edit-profile")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <UserPen size={18} /> Edit Profile
          </button>
        </nav>

        {/* Logout Button */}
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4">
          <LogOut size={18} /> Logout
        </button>

        {/* Footer */}
        <footer className="text-[11px] text-gray-500 text-center pt-4 mt-4 border-t border-white/10">© 2025 Riphah</footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Hero Header Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <ClipboardList size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Coordination Office</h1>
                <p className="text-gray-600 mt-1">Review and manage student clearance requests</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                fetchRequests();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Manually refresh the data (auto-refreshes every 5 seconds)"
            >
              <ClipboardList size={18} className={`${loading ? 'animate-spin' : 'group-hover:animate-spin'}`} /> 
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <ClipboardList size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-[fadeIn_0.3s_ease]">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Requests Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="animate-spin mb-4"><ClipboardList size={32} className="text-purple-400" /></div>
            <p className="text-sm font-medium">Loading {activeTab} requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Inbox size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-semibold text-gray-500">No {activeTab} requests</p>
            <p className="text-sm text-gray-400 mt-1">There are no {activeTab} requests at this time</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SAP ID</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req, index) => (
                    <tr key={req._id || req.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-5 py-4 text-gray-600 text-xs font-medium">{index + 1}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{req.student_name || "N/A"}</td>
                      <td className="px-5 py-4 text-gray-600 font-mono text-xs">{req.sapid || "N/A"}</td>
                      <td className="px-5 py-4 text-gray-600">{req.program || "N/A"}</td>
                      <td className="px-5 py-4 text-gray-600 text-center">{req.semester || "N/A"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          req.overallStatus === "Completed" ? "bg-gradient-to-r from-green-400 to-emerald-600 text-white border border-emerald-400 shadow-sm shadow-emerald-500/30" :
                          (req.status || "pending").toLowerCase() === "pending" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          (req.status || "").toLowerCase() === "approved" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                          "bg-red-100 text-red-700 border border-red-200"
                        }`}>
                          {req.overallStatus === "Completed" ? "✓ Completed" : (req.status || "Pending")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs max-w-[250px]">
                        {req.overallStatus === "Completed" ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-emerald-700">✓ Certificate Generated</span>
                            <span className="text-xs text-gray-500">
                              {req.completedAt ? `on ${new Date(req.completedAt).toLocaleDateString()}` : "Date unavailable"}
                            </span>
                          </div>
                        ) : (
                          req.remarks || req.message || "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {(() => {
                          try {
                            const dateStr = req.overallStatus === "Completed" && req.completedAt
                              ? req.completedAt
                              : (req.createdAt || req.submittedAt);
                            if (!dateStr) return "—";
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return "Invalid Date";
                            return date.toLocaleDateString();
                          } catch (e) { return "—"; }
                        })()}
                      </td>
                      <td className="px-5 py-4 text-center flex items-center justify-center gap-2">
                        {(req.status || "").toLowerCase() === "pending" && req.overallStatus !== "Completed" ? (
                          <>
                            <button
                              onClick={() => handleOpenRemarksModal(req._id, "approve", req.sapid)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleOpenRemarksModal(req._id, "reject", req.sapid)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              ✕ Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Remarks Modal */}
        {showRemarksModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 animate-[fadeIn_0.3s_ease]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {modalAction === "approve" ? "✅ Approve Request" : "❌ Reject Request"}
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {modalAction === "approve" ? "Approval Comments" : "Rejection Reason *"}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    modalAction === "approve"
                      ? "Add optional approval comments..."
                      : "Explain why this request is being rejected..."
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder:text-gray-400 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRemarksModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={modalAction === "approve" ? handleApprove : handleReject}
                  disabled={actionLoading || (modalAction === "reject" && !remarks.trim())}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    modalAction === "approve"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/30 shadow-emerald-500/20"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30 shadow-red-500/20"
                  }`}
                >
                  {actionLoading ? "Processing..." : (modalAction === "approve" ? "✅ Approve" : "❌ Reject")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
