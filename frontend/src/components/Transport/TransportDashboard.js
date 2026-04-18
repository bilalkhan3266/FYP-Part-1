import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare, UserPen, LogOut, Inbox, AlertCircle, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import { getApiUrl } from "../../config/apiConfig";

export default function TransportDashboard() {
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
      const apiUrl = getApiUrl();

      // Add cache buster parameter to force fresh data
      const cacheBuster = `?_t=${Date.now()}`;

      const response = await api.get(apiUrl + "/api/clearance/department" + cacheBuster, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
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
      console.log("🔄 Auto-refreshing transport dashboard data...");
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
      const apiUrl = getApiUrl();

      const response = await axios.put(
        apiUrl + `/api/clearance/department/approve-or-reject`,
        {
          requestId: modalRequestId,
          studentSapId: modalStudentSapId,
          departmentName: "Transport",
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
      const apiUrl = getApiUrl();

      const response = await axios.put(
        apiUrl + `/api/clearance/department/approve-or-reject`,
        {
          requestId: modalRequestId,
          studentSapId: modalStudentSapId,
          departmentName: "Transport",
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

  const [stats, setStats] = useState({ approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    const totalRequests = allData.approved.length + allData.rejected.length;
    setStats({
      approved: allData.approved.length,
      rejected: allData.rejected.length,
      total: totalRequests,
    });
  }, [allData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Transport Staff";
  const displaySap = user?.sap || "N/A";

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gradient-to-b from-[#0d3d35] via-[#1a6959] to-[#0f4a3f] text-white p-6 shadow-lg overflow-y-auto">
        {/* Profile Card */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-white">{displayName}</h3>
          <p className="text-sm text-teal-200">{displaySap} • Transport</p>
          <p className="text-xs text-teal-200 mt-1">Riphah International University</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <button
            onClick={() => setActiveTab("approved")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "approved"
                ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
                : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <CheckCircle2 size={18} /> Approved
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "rejected"
                ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white"
                : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <XCircle size={18} /> Rejected
          </button>
          <div className="border-t border-teal-400/30 my-4"></div>
          <button
            onClick={() => navigate("/transport-issue-return")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-white/10 transition-all"
          >
            <Inbox size={18} /> Create Issue
          </button>
          <button
            onClick={() => navigate("/transport-messages")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-white/10 transition-all"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/transport-edit-profile")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-white/10 transition-all"
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-teal-100 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="text-xs text-teal-300 text-center mt-8">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Hero Header */}
        <div className="mb-8 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl">
                <Inbox size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Transport Clearance</h1>
                <p className="text-gray-600 mt-1">Review and manage student transport clearance requests</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                fetchRequests();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Manually refresh the data (auto-refreshes every 5 seconds)"
            >
              <Inbox size={18} className={`${loading ? 'animate-spin' : 'group-hover:animate-spin'}`} /> 
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Requests</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClipboardList size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved Requests</p>
                <p className="text-3xl font-bold text-teal-600 mt-2">{stats.approved}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-xl">
                <CheckCircle2 size={24} className="text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected Requests</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} className="text-teal-600" />
            <span className="text-teal-700">{success}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full"></div>
            <p className="text-gray-600 mt-4">⏳ Loading {activeTab} requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Inbox size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">📭 No {activeTab} requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
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
                  {requests.map((req, idx) => (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-5 py-4 text-gray-600 text-xs font-medium">{idx + 1}</td>
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
      </main>

      {/* Modal */}
      {showRemarksModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowRemarksModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b-4 ${modalAction === "approve" ? "border-teal-500 bg-teal-50" : "border-red-500 bg-red-50"}`}>
              <h2 className={`text-xl font-bold ${modalAction === "approve" ? "text-teal-900" : "text-red-900"}`}>
                {modalAction === "approve" ? "✅ Approve Request" : "❌ Reject Request"}
              </h2>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {modalAction === "approve" ? "Approval Comments" : "Rejection Reason"} {modalAction === "reject" && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={modalAction === "approve" ? "Enter additional comments (optional)..." : "Please explain why this request is being rejected..."}
                className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  modalAction === "approve"
                    ? "border-teal-200 focus:border-teal-500 focus:ring-teal-200"
                    : "border-red-200 focus:border-red-500 focus:ring-red-200"
                }`}
                rows="4"
                disabled={actionLoading}
              />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowRemarksModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={modalAction === "approve" ? handleApprove : handleReject}
                disabled={actionLoading || (modalAction === "reject" && !remarks.trim())}
                className={`px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  modalAction === "approve"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                }`}
              >
                {actionLoading ? "Processing..." : (modalAction === "approve" ? "Approve" : "Reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
