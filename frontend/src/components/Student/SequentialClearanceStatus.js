import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Zap,
  ArrowRight,
  FileText,
  Mail,
  QrCode,
  Award,
  TrendingDown,
} from "lucide-react";
import axios from "axios";

export default function SequentialClearanceStatus() {
  const { user } = useAuthContext();
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);

  // Department sequence (STRICT ORDER)
  const departmentSequence = [
    "Coordination",
    "Transport",
    "Library",
    "Fee Department",
    "Student Service"
  ];

  /**
   * Fetch latest clearance status from ComprehensiveClearanceValidation
   */
  const fetchClearanceStatus = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.get(
        `${apiUrl}/api/clearance-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success && response.data.data) {
        setLatestRecord(response.data.data);
        
        // If fully approved, set certificate URL
        if (response.data.data.certificateGenerated && response.data.data.qr_code) {
          setCertificateUrl(`${apiUrl}/api/verify-certificate/${response.data.data.qr_code}`);
        }
      } else {
        setError("No clearance record found. Submit a request to get started.");
      }
    } catch (err) {
      console.error("Error fetching clearance status:", err);
      if (err.response?.status === 404) {
        setError("No clearance record found. Submit a request to get started.");
      } else {
        setError(err.response?.data?.message || "Failed to load clearance status");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearanceStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClearanceStatus();
    setRefreshing(false);
  };

  /**
   * Get status display for a department
   */
  const getDepartmentStatus = (deptName) => {
    if (!latestRecord?.departmentStatuses) return null;
    return latestRecord.departmentStatuses.find(d => d.name === deptName);
  };

  /**
   * Get status icon and colors
   */
  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return {
          icon: CheckCircle2,
          color: "bg-green-500",
          label: "✅ Approved",
          lightBg: "bg-green-500/10",
          borderColor: "border-green-500/30",
          textColor: "text-green-300"
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "bg-red-500",
          label: "❌ Rejected",
          lightBg: "bg-red-500/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-300"
        };
      default:
        return {
          icon: Clock,
          color: "bg-gray-500",
          label: "⏳ Not Processed",
          lightBg: "bg-gray-500/10",
          borderColor: "border-gray-500/30",
          textColor: "text-gray-300"
        };
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-sm">Loading clearance status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Award className="text-yellow-400" size={32} />
                Sequential Clearance Status
              </h1>
              <p className="text-gray-400">
                Your clearance request progresses department-by-department
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No Active Request</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {latestRecord && (
          <>
            {/* Overall Status Summary */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">Student</p>
                  <p className="text-lg font-semibold text-white">{latestRecord.student_name}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">SAP ID</p>
                  <p className="text-lg font-semibold text-white">{latestRecord.sapid}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">Program</p>
                  <p className="text-lg font-semibold text-white">{latestRecord.program}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">Overall Status</p>
                  <p className={`text-lg font-semibold ${
                    latestRecord.overallStatus === "Completed" ? "text-green-300" :
                    latestRecord.overallStatus === "Rejected" ? "text-red-300" :
                    "text-yellow-300"
                  }`}>
                    {latestRecord.overallStatus === "Completed" && "✅ Completed"}
                    {latestRecord.overallStatus === "Rejected" && "❌ Rejected"}
                    {latestRecord.overallStatus !== "Completed" && latestRecord.overallStatus !== "Rejected" && "⏳ Pending"}
                  </p>
                </div>
              </div>
            </div>

            {/* Department Flow */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <TrendingDown size={24} className="text-blue-400" />
                Clearance Flow (Strict Sequence)
              </h2>

              <div className="space-y-3">
                {departmentSequence.map((deptName, index) => {
                  const deptStatus = getDepartmentStatus(deptName);
                  const statusDisplay = getStatusDisplay(deptStatus?.status);
                  const Icon = statusDisplay.icon;

                  return (
                    <div key={deptName} className="flex items-stretch gap-4">
                      {/* Step Number */}
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${statusDisplay.color}`}>
                          {index + 1}
                        </div>
                        {index < departmentSequence.length - 1 && (
                          <div className="w-1 h-12 bg-gradient-to-b from-slate-600 to-slate-700 my-2"></div>
                        )}
                      </div>

                      {/* Department Card */}
                      <div className={`flex-1 p-4 rounded-lg border ${statusDisplay.lightBg} ${statusDisplay.borderColor} transition-all hover:shadow-lg`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon size={20} className={statusDisplay.textColor} />
                              <h3 className="text-lg font-semibold text-white">{deptName}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusDisplay.textColor} ${statusDisplay.lightBg} border ${statusDisplay.borderColor}`}>
                                {statusDisplay.label}
                              </span>
                            </div>

                            {/* Show reason if rejected or approved */}
                            {deptStatus && (
                              <div className="mt-2 text-sm text-gray-300">
                                <p className="font-semibold mb-1">
                                  {deptStatus.status === "Approved" ? "✔️ Approved" : deptStatus.status === "Rejected" ? "Rejection Reason:" : "Status:"}
                                </p>
                                <p className={`text-sm ${deptStatus.status === "Approved" ? "text-green-300" : deptStatus.status === "Rejected" ? "text-red-300" : "text-gray-400"}`}>
                                  {deptStatus.reason || "No additional information"}
                                </p>

                                {/* Show pending items if any */}
                                {deptStatus.pendingItems && deptStatus.pendingItems.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-600">
                                    <p className="font-semibold text-yellow-300 mb-1">Pending Items:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {deptStatus.pendingItems.map((item, idx) => (
                                        <li key={idx} className="text-yellow-200 text-xs">{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Validation timestamp */}
                                {deptStatus.validatedAt && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Checked: {new Date(deptStatus.validatedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Arrow to next if approved */}
                          {deptStatus?.status === "Approved" && index < departmentSequence.length - 1 && (
                            <ArrowRight size={24} className="text-green-400 ml-4 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rejection Alert */}
            {latestRecord.overallStatus === "Rejected" && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <XCircle size={32} className="text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-red-300 mb-2">Clearance Blocked</h3>
                    <p className="text-red-200 mb-4">
                      Your clearance request was rejected by one or more departments. You must resolve the issues at that department before resubmitting.
                    </p>
                    <div className="bg-red-500/5 p-3 rounded border border-red-500/20">
                      <p className="text-sm text-red-300">
                        <strong>Next Steps:</strong> Contact the rejecting department, resolve any dues or penalties, then resubmit your request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Section */}
            {latestRecord.certificateGenerated && (
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Award size={32} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-300 mb-1">Clearance Approved! 🎉</h3>
                      <p className="text-green-200">
                        All departments have approved your clearance. Your certificate is ready for download.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(certificateUrl, "_blank")}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition font-semibold"
                  >
                    <Download size={20} />
                    Download Certificate
                  </button>
                </div>

                {/* Certificate Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-gray-400">Certificate ID</p>
                    <p className="text-sm font-mono text-green-300 break-all">{latestRecord.qr_code}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-gray-400">Generated</p>
                    <p className="text-sm text-green-300">{new Date(latestRecord.certificate_generated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-gray-400">Expires</p>
                    <p className="text-sm text-green-300">Valid for 2 years</p>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-4">
                  <QrCode size={48} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Verification QR Code</p>
                    <p className="text-xs text-gray-400">Share this QR code to verify your clearance</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Info */}
            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-xs text-gray-400">
                <strong>Submitted:</strong> {new Date(latestRecord.submittedAt).toLocaleString()}
                {latestRecord.completedAt && (
                  <> | <strong>Completed:</strong> {new Date(latestRecord.completedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
