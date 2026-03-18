import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Plus, RotateCcw, Search, X, FileText, Package,
  CheckCircle2, AlertTriangle, RefreshCw, Trash2,
} from "lucide-react";
import "./DepartmentIssueReturn.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" });

  const fetchIssues = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchSap) params.append("studentId", searchSap.trim());
      const authHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
      const res = await axios.get(`${API_URL}/api/department-issues?${params}`, { headers: authHeaders });
      if (res.data.success) setIssues(res.data.data);
    } catch (err) {
      console.error("Fetch issues error:", err);
    }
  }, [searchSap]);

  const fetchReturns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchSap) params.append("studentId", searchSap.trim());
      const authHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
      const res = await axios.get(`${API_URL}/api/department-returns?${params}`, { headers: authHeaders });
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
      const res = await axios.post(`${API_URL}/api/department-issues`, {
        ...issueForm,
        departmentName,
      }, { headers: getHeaders() });
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
      const res = await axios.post(`${API_URL}/api/department-returns`, {
        studentId: selectedIssue.studentId,
        departmentName,
        referenceIssueId: selectedIssue._id,
      }, { headers: getHeaders() });
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
      await axios.delete(`${API_URL}/api/department-issues/${id}`, { headers: getHeaders() });
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
    <div className="dir-panel">
      <div className="dir-panel-header">
        <h2><FileText size={22} /> Issue & Return Management</h2>
        <p className="dir-dept-label">{departmentName}</p>
      </div>

      {error && <div className="dir-alert dir-alert-error"><AlertTriangle size={16} />{error}<button onClick={clearMessages}><X size={14} /></button></div>}
      {success && <div className="dir-alert dir-alert-success"><CheckCircle2 size={16} />{success}<button onClick={clearMessages}><X size={14} /></button></div>}

      {/* Toolbar */}
      <div className="dir-toolbar">
        <div className="dir-tabs">
          <button className={`dir-tab ${activeTab === "issues" ? "active" : ""}`} onClick={() => setActiveTab("issues")}>
            <Package size={16} /> Issues ({unclearedIssues.length})
          </button>
          <button className={`dir-tab ${activeTab === "cleared" ? "active" : ""}`} onClick={() => setActiveTab("cleared")}>
            <CheckCircle2 size={16} /> Cleared ({clearedIssues.length})
          </button>
          <button className={`dir-tab ${activeTab === "returns" ? "active" : ""}`} onClick={() => setActiveTab("returns")}>
            <RotateCcw size={16} /> Returns ({returns.length})
          </button>
        </div>
        <div className="dir-toolbar-right">
          <div className="dir-search">
            <Search size={16} />
            <input placeholder="Search by SAP ID" value={searchSap} onChange={(e) => setSearchSap(e.target.value)} />
          </div>
          <button className="dir-add-btn" onClick={() => { setShowIssueForm(true); clearMessages(); }}>
            <Plus size={16} /> New Issue
          </button>
        </div>
      </div>

      {/* Issue Form Modal */}
      {showIssueForm && (
        <div className="dir-modal-overlay" onClick={() => setShowIssueForm(false)}>
          <div className="dir-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dir-modal-header">
              <h3>Create New Issue</h3>
              <button onClick={() => setShowIssueForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateIssue}>
              <div className="dir-modal-body">
                <div className="dir-form-group">
                  <label>Student SAP ID *</label>
                  <input
                    required
                    placeholder="e.g. 12345"
                    value={issueForm.studentId}
                    onChange={(e) => setIssueForm((p) => ({ ...p, studentId: e.target.value }))}
                  />
                </div>
                <div className="dir-form-group">
                  <label>Item Type *</label>
                  <select
                    required
                    value={issueForm.itemType}
                    onChange={(e) => setIssueForm((p) => ({ ...p, itemType: e.target.value }))}
                  >
                    <option value="">Select Type</option>
                    {(ITEM_SUGGESTIONS[departmentName] || ["Other"]).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="dir-form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Details about the issued item or obligation..."
                    value={issueForm.description}
                    onChange={(e) => setIssueForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="dir-modal-footer">
                <button type="button" className="dir-btn-cancel" onClick={() => setShowIssueForm(false)}>Cancel</button>
                <button type="submit" className="dir-btn-primary" disabled={issueSubmitting}>
                  {issueSubmitting ? <><RefreshCw size={14} className="spin" /> Creating...</> : <><Plus size={14} /> Create Issue</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Confirm Modal */}
      {showReturnModal && selectedIssue && (
        <div className="dir-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="dir-modal dir-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="dir-modal-header">
              <h3>Process Return</h3>
              <button onClick={() => setShowReturnModal(false)}><X size={18} /></button>
            </div>
            <div className="dir-modal-body">
              <p>Mark this issue as <strong>returned/cleared</strong>?</p>
              <div className="dir-return-detail">
                <div><strong>Student:</strong> {selectedIssue.studentId}</div>
                <div><strong>Item:</strong> {selectedIssue.itemType}</div>
                <div><strong>Description:</strong> {selectedIssue.description}</div>
              </div>
            </div>
            <div className="dir-modal-footer">
              <button className="dir-btn-cancel" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="dir-btn-success" onClick={handleProcessReturn} disabled={returnSubmitting}>
                {returnSubmitting ? <><RefreshCw size={14} className="spin" /> Processing...</> : <><CheckCircle2 size={14} /> Confirm Return</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="dir-loading">Loading records...</div>
      ) : (
        <>
          {activeTab === "issues" && (
            <div className="dir-table-wrap">
              {unclearedIssues.length === 0 ? (
                <div className="dir-empty"><Package size={36} /><p>No uncleared issues found</p></div>
              ) : (
                <table className="dir-table">
                  <thead>
                    <tr>
                      <th>SAP ID</th>
                      <th>Item Type</th>
                      <th>Description</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unclearedIssues.map((issue) => (
                      <tr key={issue._id}>
                        <td className="dir-td-sap">{issue.studentId}</td>
                        <td>{issue.itemType}</td>
                        <td className="dir-td-desc">{issue.description}</td>
                        <td>{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td><span className={`dir-status-badge status-${issue.status.toLowerCase()}`}>{issue.status}</span></td>
                        <td className="dir-td-actions">
                          <button
                            className="dir-action-btn dir-action-return"
                            title="Process Return"
                            onClick={() => { setSelectedIssue(issue); setShowReturnModal(true); clearMessages(); }}
                          >
                            <RotateCcw size={14} /> Return
                          </button>
                          <button
                            className="dir-action-btn dir-action-delete"
                            title="Delete"
                            onClick={() => handleDeleteIssue(issue._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "cleared" && (
            <div className="dir-table-wrap">
              {clearedIssues.length === 0 ? (
                <div className="dir-empty"><CheckCircle2 size={36} /><p>No cleared issues yet</p></div>
              ) : (
                <table className="dir-table">
                  <thead>
                    <tr>
                      <th>SAP ID</th>
                      <th>Item Type</th>
                      <th>Description</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clearedIssues.map((issue) => (
                      <tr key={issue._id}>
                        <td className="dir-td-sap">{issue.studentId}</td>
                        <td>{issue.itemType}</td>
                        <td className="dir-td-desc">{issue.description}</td>
                        <td>{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td><span className="dir-status-badge status-cleared">Cleared</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "returns" && (
            <div className="dir-table-wrap">
              {returns.length === 0 ? (
                <div className="dir-empty"><RotateCcw size={36} /><p>No return records found</p></div>
              ) : (
                <table className="dir-table">
                  <thead>
                    <tr>
                      <th>SAP ID</th>
                      <th>Original Item</th>
                      <th>Return Date</th>
                      <th>Status</th>
                      <th>Processed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret) => (
                      <tr key={ret._id}>
                        <td className="dir-td-sap">{ret.studentId}</td>
                        <td>{ret.referenceIssueId?.itemType || "—"} — {ret.referenceIssueId?.description || ""}</td>
                        <td>{new Date(ret.returnDate).toLocaleDateString()}</td>
                        <td><span className="dir-status-badge status-cleared">{ret.status}</span></td>
                        <td>{ret.processedByName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
