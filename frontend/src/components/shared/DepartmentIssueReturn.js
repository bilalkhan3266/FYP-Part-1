import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import {
  Plus, RotateCcw, Search, X, FileText, Package,
  CheckCircle2, AlertTriangle, RefreshCw, Trash2,
} from "lucide-react";

/**
 * Reusable Issue/Return management panel for any department.
 * Props:
 *   departmentName — one of: Coordination, Library, Transport, Fee Department, Student Service
 */
export default function DepartmentIssueReturn({ departmentName }) {
  const [activeTab, setActiveTab] = useState("issues");
  const [issues, setIssues] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchSap, setSearchSap] = useState("");

  // Issue form state
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ studentId: "", itemType: "", description: "" });
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchSap) params.append("studentId", searchSap.trim());
      // Add cache buster to force fresh data
      params.append("_t", Date.now());
      // Let the api instance handle authorization headers via interceptor
      const res = await api.get(`/api/department-issues?${params}`);
      if (res.data.success) setIssues(res.data.data);
    } catch (err) {
      console.error("Fetch issues error:", err);
    }
  }, [searchSap]);

  const fetchReturns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchSap) params.append("studentId", searchSap.trim());
      // Add cache buster to force fresh data
      params.append("_t", Date.now());
      // Let the api instance handle authorization headers via interceptor
      const res = await api.get(`/api/department-returns?${params}`);
      if (res.data.success) setReturns(res.data.data);
    } catch (err) {
      console.error("Fetch returns error:", err);
    }
  }, [searchSap]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchIssues(), fetchReturns()]);
      setLoading(false);
    };
    load();
  }, [fetchIssues, fetchReturns]);

  const clearMessages = () => { setError(""); setSuccess(""); };

  /* ── Create Issue ── */
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    clearMessages();
    setIssueSubmitting(true);
    try {
      // Let the api instance handle authorization headers via interceptor
      const res = await api.post(`/api/department-issues`, {
        ...issueForm,
        departmentName,
      });
      if (res.data.success) {
        setSuccess("Issue record created successfully");
        setShowIssueForm(false);
        setIssueForm({ studentId: "", itemType: "", description: "" });
        fetchIssues();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create issue");
    } finally {
      setIssueSubmitting(false);
    }
  };

  /* ── Process Return ── */
  const handleProcessReturn = async () => {
    clearMessages();
    setReturnSubmitting(true);
    try {
      // Let the api instance handle authorization headers via interceptor
      const res = await api.post(`/api/department-returns`, {
        studentId: selectedIssue.studentId,
        departmentName,
        referenceIssueId: selectedIssue._id,
      });
      if (res.data.success) {
        setSuccess("Return processed — issue marked as Cleared");
        setShowReturnModal(false);
        setSelectedIssue(null);
        fetchIssues();
        fetchReturns();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process return");
    } finally {
      setReturnSubmitting(false);
    }
  };

  /* ── Delete Issue ── */
  const handleDeleteIssue = async (id) => {
    if (!window.confirm("Delete this issue record?")) return;
    clearMessages();
    try {
      // Let the api instance handle authorization headers via interceptor
      await api.delete(`/api/department-issues/${id}`);
      setSuccess("Issue deleted");
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete issue");
    }
  };

  const unclearedIssues = issues.filter((i) => i.status !== "Cleared");
  const clearedIssues = issues.filter((i) => i.status === "Cleared");

  // Item type suggestions per department
  const ITEM_SUGGESTIONS = {
    Library: ["Book", "Journal", "Magazine", "Equipment", "Library Card"],
    Transport: ["Transport Fee", "Bus Card", "Transport Dues"],
    "Fee Department": ["Tuition Fee", "Exam Fee", "Lab Fee", "Hostel Fee", "Fine"],
    Coordination: ["Document", "Form", "ID Card", "NOC", "Transcript"],
    "Student Service": ["Sports Equipment", "Locker Key", "Uniform", "ID Badge", "Certificate"],
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Issue & Return Management</h2>
              <p className="text-sm text-gray-600 mt-0.5">{departmentName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS ── */}
      <div className="bg-white px-6 pt-5">
        {error && (
          <div className="flex items-start gap-3 mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-[fadeIn_0.3s_ease]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={clearMessages} className="text-red-700 hover:text-red-900 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-[fadeIn_0.3s_ease]">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{success}</span>
            <button onClick={clearMessages} className="text-emerald-700 hover:text-emerald-900 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="border-b border-gray-200 px-6 py-5 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("issues")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "issues"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900 bg-transparent"
              }`}
            >
              <Package size={16} /> Issues ({unclearedIssues.length})
            </button>
            <button
              onClick={() => setActiveTab("cleared")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "cleared"
                  ? "bg-white text-green-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900 bg-transparent"
              }`}
            >
              <CheckCircle2 size={16} /> Cleared ({clearedIssues.length})
            </button>
            <button
              onClick={() => setActiveTab("returns")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "returns"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900 bg-transparent"
              }`}
            >
              <RotateCcw size={16} /> Returns ({returns.length})
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SAP ID..."
                value={searchSap}
                onChange={(e) => setSearchSap(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => { setShowIssueForm(true); clearMessages(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={16} /> New Issue
            </button>
          </div>
        </div>
      </div>

      {/* ── CREATE ISSUE MODAL ── */}
      {showIssueForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setShowIssueForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Plus size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Create New Issue</h3>
              </div>
              <button onClick={() => setShowIssueForm(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateIssue} className="p-6 space-y-5">
              {/* Student SAP ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student SAP ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12345"
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm((p) => ({ ...p, studentId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item Type *</label>
                <select
                  required
                  value={issueForm.itemType}
                  onChange={(e) => setIssueForm((p) => ({ ...p, itemType: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">Select Type</option>
                  {(ITEM_SUGGESTIONS[departmentName] || ["Other"]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details about the issued item or obligation..."
                  value={issueForm.description}
                  onChange={(e) => setIssueForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowIssueForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {issueSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create Issue</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RETURN CONFIRMATION MODAL ── */}
      {showReturnModal && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={() => setShowReturnModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <RotateCcw size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Process Return</h3>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-700">Mark this issue as <strong>returned/cleared</strong>?</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedIssue.studentId}</p>
                  </div>
                </div>
                <hr className="border-blue-100" />
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Item</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedIssue.itemType}</p>
                  </div>
                </div>
                <hr className="border-blue-100" />
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Details</p>
                    <p className="text-sm text-gray-700">{selectedIssue.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                disabled={returnSubmitting}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={returnSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {returnSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : <><CheckCircle2 size={14} /> Confirm Return</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white">
          <div className="animate-spin mb-4">
            <Package size={32} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium">Loading records...</p>
        </div>
      ) : (
        <>
          {activeTab === "issues" && (
            <div className="overflow-x-auto bg-white">
              {unclearedIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <Package size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-500">No uncleared issues</p>
                  <p className="text-sm text-gray-400 mt-1">All issued items are accounted for</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SAP ID</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Type</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unclearedIssues.map((issue) => (
                      <tr key={issue._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        <td className="px-5 py-4 text-gray-900 font-semibold text-sm">{issue.studentId}</td>
                        <td className="px-5 py-4 text-gray-700">{issue.itemType}</td>
                        <td className="px-5 py-4 text-gray-600 max-w-xs truncate">{issue.description}</td>
                        <td className="px-5 py-4 text-gray-500 text-sm whitespace-nowrap">{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setSelectedIssue(issue); setShowReturnModal(true); clearMessages(); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition-all duration-200"
                              title="Process Return"
                            >
                              <RotateCcw size={13} /> Return
                            </button>
                            <button
                              onClick={() => handleDeleteIssue(issue._id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "cleared" && (
            <div className="overflow-x-auto bg-white">
              {clearedIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <CheckCircle2 size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-500">No cleared issues yet</p>
                  <p className="text-sm text-gray-400 mt-1">Issues will appear here once returned</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SAP ID</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Type</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clearedIssues.map((issue) => (
                      <tr key={issue._id} className="hover:bg-emerald-50/30 transition-colors duration-150">
                        <td className="px-5 py-4 text-gray-900 font-semibold text-sm">{issue.studentId}</td>
                        <td className="px-5 py-4 text-gray-700">{issue.itemType}</td>
                        <td className="px-5 py-4 text-gray-600 max-w-xs truncate">{issue.description}</td>
                        <td className="px-5 py-4 text-gray-500 text-sm whitespace-nowrap">{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Cleared
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "returns" && (
            <div className="overflow-x-auto bg-white">
              {returns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <RotateCcw size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-500">No return records found</p>
                  <p className="text-sm text-gray-400 mt-1">Returned items will appear here</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">SAP ID</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Item</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Processed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returns.map((ret) => (
                      <tr key={ret._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        <td className="px-5 py-4 text-gray-900 font-semibold text-sm">{ret.studentId}</td>
                        <td className="px-5 py-4 text-gray-700">{ret.referenceIssueId?.itemType || "—"} — {ret.referenceIssueId?.description || ""}</td>
                        <td className="px-5 py-4 text-gray-500 text-sm whitespace-nowrap">{new Date(ret.returnDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {ret.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{ret.processedByName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
