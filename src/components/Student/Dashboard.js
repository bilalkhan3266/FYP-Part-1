import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Mail,
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
import "./Dashboard.css";

/* ═══════════════════════════════════════
   REUSABLE SUB-COMPONENTS
═══════════════════════════════════════ */

function Sidebar({ displayName, displaySap, displayDept, unreadCount, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-auto-clearance", icon: ClipboardCheck, label: "Auto Clearance" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  return (
    <aside className="sd-sidebar">
      <div className="sd-sidebar-top">
        <div className="sd-brand">
          <div className="sd-brand-icon">
            <GraduationCap size={22} />
          </div>
          <span className="sd-brand-text">Riphah Clearance</span>
        </div>

        <div className="sd-profile">
          <div className="sd-avatar">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="sd-profile-info">
            <h3 className="sd-name">{displayName}</h3>
            <p className="sd-meta">{displaySap}</p>
            <p className="sd-meta">{displayDept}</p>
          </div>
        </div>

        <nav className="sd-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`sd-nav-btn${isActive ? " active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="sd-badge">{item.badge}</span>}
                {isActive && <span className="sd-active-indicator" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sd-sidebar-bottom">
        <button className="sd-nav-btn sd-logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
        <footer className="sd-footer">© 2025 Riphah International University</footer>
      </div>
    </aside>
  );
}

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className={`sd-stat-card sd-stat-${color}`}>
      <div className="sd-stat-icon-wrap">
        <Icon size={20} />
      </div>
      <div className="sd-stat-info">
        <span className="sd-stat-value">{value}</span>
        <span className="sd-stat-label">{label}</span>
        {subtitle && <span className="sd-stat-sub">{subtitle}</span>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="sd-skeleton-card">
      <div className="sk-line sk-w60" />
      <div className="sk-line sk-w80" />
      <div className="sk-line sk-w40" />
    </div>
  );
}

function EmptyState({ onSubmit }) {
  return (
    <div className="sd-empty-state">
      <div className="sd-empty-icon">
        <Inbox size={56} strokeWidth={1.2} />
      </div>
      <h3>No Clearance Request Found</h3>
      <p>You haven't submitted a clearance request yet. Get started by submitting your first request to begin the clearance process.</p>
      <button className="sd-btn sd-btn-primary" onClick={onSubmit}>
        <PlusCircle size={18} />
        Submit Clearance Request
      </button>
    </div>
  );
}

/* Department icon mapping */
const deptIcons = {
  Coordination: Handshake,
  Library: BookOpen,
  Transport: Bus,
  "Fee Department": CreditCard,
  "Student Service": Users,
};

const phaseColors = {
  Approved: { bg: "#dcfce7", border: "#16a34a", text: "#15803d", icon: CheckCircle2 },
  Pending: { bg: "#fef9c3", border: "#ca8a04", text: "#a16207", icon: Clock },
  Rejected: { bg: "#fee2e2", border: "#dc2626", text: "#b91c1c", icon: AlertCircle },
};

function PhaseCard({ phase, index, isCurrent, total }) {
  const cfg = phaseColors[phase.status] || phaseColors.Pending;
  const Icon = deptIcons[phase.name] || ClipboardCheck;
  const StatusIcon = cfg.icon;

  return (
    <div className={`sd-phase-card${isCurrent ? " sd-phase-card-active" : ""}${phase.status === "Approved" ? " sd-phase-card-done" : ""}${phase.status === "Rejected" ? " sd-phase-card-rejected" : ""}`}>
      {/* Step number ribbon */}
      <div className="sd-phase-step" style={{ backgroundColor: cfg.border }}>
        {phase.status === "Approved" ? <CheckCircle2 size={14} /> : index + 1}
      </div>

      {/* Icon circle */}
      <div className="sd-phase-icon" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
        <Icon size={24} style={{ color: cfg.text }} />
      </div>

      {/* Phase name */}
      <h4 className="sd-phase-name">{phase.name}</h4>

      {/* Status badge */}
      <div className="sd-phase-status-badge" style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}>
        <StatusIcon size={13} />
        <span>{phase.status}{isCurrent && phase.status === "Pending" ? " — Current" : ""}</span>
      </div>

      {/* Approver info */}
      {phase.approverName && (
        <p className="sd-phase-approver">Approved by {phase.approverName}</p>
      )}
      {phase.approvedAt && (
        <p className="sd-phase-date">{new Date(phase.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      )}
      {phase.remarks && phase.status === "Rejected" && (
        <p className="sd-phase-remarks">"{phase.remarks}"</p>
      )}

      {/* Connector arrow (except last) */}
      {index < total - 1 && (
        <div className={`sd-phase-connector${phase.status === "Approved" ? " sd-connector-done" : ""}`}>
          <ChevronRight size={18} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════ */

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // { type: "success"|"error", message }
  const [emailSending, setEmailSending] = useState(false);

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "N/A";
  const displayDept = user?.department || "N/A";

  /* ── Fetch clearance workflow ── */
  const fetchWorkflow = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      setIsRefreshing(true);

      const response = await axios.get(apiUrl + "/api/clearance/student", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        timeout: 8000,
      });

      if (response.data.success) {
        setWorkflow(response.data.data);
        setLastUpdated(new Date());
        setError("");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clearance status");
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /* ── Fetch unread count ── */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      if (!token) return;

      const response = await axios.get(apiUrl + "/api/unread-count", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      });
      if (response.data.success) setUnreadCount(response.data.unreadCount || 0);
    } catch (_) { /* silent */ }
  }, []);

  /* ── Auto-refresh ── */
  useEffect(() => {
    fetchWorkflow();
    fetchUnreadCount();

    const statusInterval = setInterval(fetchWorkflow, 3000);
    const unreadInterval = setInterval(fetchUnreadCount, 5000);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchWorkflow();
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(statusInterval);
      clearInterval(unreadInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchWorkflow, fetchUnreadCount]);

  /* ── Computed values ── */
  const { progress, cleared, pending, rejected } = useMemo(() => {
    if (!workflow || !workflow.phases) return { progress: 0, cleared: 0, pending: 0, rejected: 0 };
    const phases = workflow.phases;
    const clr = phases.filter((p) => p.status === "Approved").length;
    const pnd = phases.filter((p) => p.status === "Pending").length;
    const rej = phases.filter((p) => p.status === "Rejected").length;
    return { progress: Math.round((clr / phases.length) * 100), cleared: clr, pending: pnd, rejected: rej };
  }, [workflow]);

  const allCleared = workflow?.overallStatus === "Completed";

  const getProgressColor = (pct) => {
    if (pct <= 25) return "#ef4444";
    if (pct <= 50) return "#f59e0b";
    if (pct <= 75) return "#3b82f6";
    return "#10b981";
  };

  const handleMessageDept = (deptKey) => navigate("/student-messages", { state: { dept: deptKey } });
  const handleLogout = () => { logout(); navigate("/login"); };
  const handleRefresh = () => { fetchWorkflow(); fetchUnreadCount(); };

  const handleEmailCertificate = async () => {
    try {
      setEmailSending(true);
      setEmailStatus(null);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(
        apiUrl + "/api/auto-clearance/email-certificate",
        {},
        { headers: { Authorization: "Bearer " + token } }
      );
      if (response.data.success) {
        setEmailStatus({ type: "success", message: response.data.message });
      } else {
        setEmailStatus({ type: "error", message: response.data.message || "Failed to send email" });
      }
    } catch (err) {
      setEmailStatus({ type: "error", message: err.response?.data?.message || "Failed to send certificate email. Please try again." });
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailStatus(null), 6000);
    }
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="sd-layout">
      <Sidebar
        displayName={displayName}
        displaySap={displaySap}
        displayDept={displayDept}
        unreadCount={unreadCount}
        onLogout={handleLogout}
      />

      <main className="sd-main">
        {/* ── HEADER ── */}
        <header className="sd-header">
          <div className="sd-header-left">
            <h1 className="sd-page-title">
              Welcome back, <span className="sd-highlight">{displayName}</span>
            </h1>
            <p className="sd-page-subtitle">
              Track your department clearance progress in real time.
            </p>
          </div>

          <div className="sd-header-right">
            <span className="sd-last-updated">
              <Clock size={13} />
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              className={`sd-btn sd-btn-secondary${isRefreshing ? " sd-spinning" : ""}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} />
              {isRefreshing ? "Updating…" : "Refresh"}
            </button>
            <button className="sd-btn sd-btn-primary" onClick={() => navigate("/student-clearance-request")}>
              <PlusCircle size={16} />
              Submit Request
            </button>
          </div>
        </header>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="sd-alert sd-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── LOADING SKELETONS ── */}
        {loading && (
          <div className="sd-skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && !workflow && !error && (
          <EmptyState onSubmit={() => navigate("/student-clearance-request")} />
        )}

        {/* ── STATS ROW ── */}
        {!loading && workflow && (
          <>
            <section className="sd-stats-row">
              <StatCard icon={TrendingUp} label="Overall Progress" value={`${progress}%`} color="indigo" subtitle={`${cleared} of ${workflow.phases.length} cleared`} />
              <StatCard icon={CheckCircle2} label="Cleared" value={cleared} color="green" />
              <StatCard icon={Clock} label="Pending" value={pending} color="amber" />
              <StatCard icon={AlertCircle} label="Rejected" value={rejected} color="red" />
            </section>

            {/* ── PROGRESS BAR CARD ── */}
            <section className="sd-progress-section">
              <div className="sd-progress-card">
                <div className="sd-progress-header">
                  <div>
                    <h3>Clearance Progress</h3>
                    <p className="sd-progress-subtitle">
                      {allCleared
                        ? "All departments have cleared your request!"
                        : workflow.overallStatus === "Rejected"
                        ? "Your request was rejected. You may resubmit."
                        : `Currently at: ${workflow.phases[workflow.currentPhase]?.name || "Unknown"}`}
                    </p>
                  </div>
                  <div className={`sd-overall-badge ${allCleared ? "sd-badge-cleared" : workflow.overallStatus === "Rejected" ? "sd-badge-rejected" : "sd-badge-pending"}`}>
                    {allCleared ? (
                      <><CheckCircle2 size={15} /> Completed</>
                    ) : workflow.overallStatus === "Rejected" ? (
                      <><AlertCircle size={15} /> Rejected</>
                    ) : (
                      <><Clock size={15} /> In Progress</>
                    )}
                  </div>
                </div>

                <div className="sd-progress-track">
                  <div
                    className="sd-progress-fill"
                    style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }}
                  />
                </div>

                <div className="sd-progress-labels">
                  <span>0%</span>
                  <span className="sd-progress-pct" style={{ color: getProgressColor(progress) }}>{progress}%</span>
                  <span>100%</span>
                </div>

                {/* ── Circular Progress ── */}
                <div className="sd-circle-wrap">
                  <svg className="sd-circle-svg" viewBox="0 0 120 120">
                    <circle className="sd-circle-bg" cx="60" cy="60" r="52" />
                    <circle
                      className="sd-circle-fg"
                      cx="60"
                      cy="60"
                      r="52"
                      stroke={getProgressColor(progress)}
                      style={{ strokeDashoffset: 326.726 - (326.726 * progress) / 100 }}
                    />
                    <text x="60" y="56" textAnchor="middle" className="sd-circle-text">{progress}%</text>
                    <text x="60" y="72" textAnchor="middle" className="sd-circle-label">complete</text>
                  </svg>
                </div>
              </div>

              {/* ── Quick Actions Card ── */}
              <div className="sd-quick-card">
                <h3>Quick Actions</h3>
                <div className="sd-quick-actions">
                  <button className="sd-action-btn" onClick={() => navigate("/student-clearance-status")}>
                    <ClipboardCheck size={20} />
                    <span>View Full Status</span>
                    <ChevronRight size={16} className="sd-action-chevron" />
                  </button>
                  <button className="sd-action-btn" onClick={() => navigate("/student-messages")}>
                    <MessageSquare size={20} />
                    <span>Messages</span>
                    {unreadCount > 0 && <span className="sd-action-badge">{unreadCount}</span>}
                    <ChevronRight size={16} className="sd-action-chevron" />
                  </button>
                  <button className="sd-action-btn" onClick={() => window.print()}>
                    <Printer size={20} />
                    <span>Print Page</span>
                    <ChevronRight size={16} className="sd-action-chevron" />
                  </button>
                  <button className="sd-action-btn" onClick={() => navigate("/student-edit-profile")}>
                    <UserPen size={20} />
                    <span>Edit Profile</span>
                    <ChevronRight size={16} className="sd-action-chevron" />
                  </button>
                </div>
              </div>
            </section>

            {/* ── SEQUENTIAL PHASE CARDS ── */}
            <section className="sd-departments">
              <div className="sd-section-header">
                <h2>Sequential Clearance Phases</h2>
                <span className="sd-dept-count">{workflow.phases.length} phases</span>
              </div>
              <div className="sd-phase-cards-row">
                {workflow.phases.map((phase, idx) => (
                  <PhaseCard
                    key={idx}
                    phase={phase}
                    index={idx}
                    isCurrent={idx === workflow.currentPhase && workflow.overallStatus === "In Progress"}
                    total={workflow.phases.length}
                  />
                ))}
              </div>
            </section>

            {/* ── CERTIFICATE ── */}
            {allCleared && (
              <section className="sd-certificate">
                {emailStatus && (
                  <div className={`sd-alert ${emailStatus.type === "success" ? "sd-alert-success" : "sd-alert-error"}`}>
                    {emailStatus.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}
                <div className="sd-cert-card">
                  <div className="sd-cert-icon">
                    <Award size={40} strokeWidth={1.5} />
                  </div>
                  <div className="sd-cert-info">
                    <h3>Digital Clearance Certificate</h3>
                    <p>
                      Congratulations! All departments have cleared your request.
                      <br />
                      <strong>{displayName}</strong> — SAP ID: <strong>{displaySap}</strong>
                    </p>
                  </div>
                  <div className="sd-cert-actions">
                    <button className="sd-btn sd-btn-primary" onClick={() => navigate("/student-certificate")}>
                      <Printer size={16} />
                      Print Certificate
                    </button>
                    <button
                      className="sd-btn sd-btn-secondary"
                      onClick={handleEmailCertificate}
                      disabled={emailSending}
                    >
                      <Mail size={16} />
                      {emailSending ? "Sending…" : "Email Certificate"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
