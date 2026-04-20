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
  Award,
  Download,
  Printer,
  Share2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  FileText,
  Loader,
  ArrowLeft,
  Menu,
} from "lucide-react";
import api from "../../services/api";
import "../../styles/scrollbar.css";
import "../../styles/print-certificate-a4-clean.css";
import CertificatePrintPreview from "./CertificatePrintPreview";
import ProfessionalCertificateDesign from "./ProfessionalCertificateDesign";

export default function ClearanceCertificate() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [printingCert, setPrintingCert] = useState(null);
  const [viewingCert, setViewingCert] = useState(null);

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

  const fetchCertificates = async () => {
    try {
      setError("");
      const response = await api.get("/api/certificates");

      if (response.data.success) {
        setCertificates(response.data.data || []);
      } else {
        setError("Failed to load certificates");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownload = async (certId) => {
    setDownloadingId(certId);
    try {
      const response = await api.get(
        `/api/certificates/${certId}/download`,
        {
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clearance-certificate-${certId}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = (certId) => {
    // Find the certificate and open print preview
    const cert = certificates.find(c => c._id === certId);
    if (cert) {
      setPrintingCert(cert);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
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
        <div className="mb-8 bg-gradient-to-r from-blue-50/10 to-cyan-50/10 rounded-2xl p-8 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl">
              <Award size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Clearance Certificates</h1>
              <p className="text-gray-400 mt-1">Download and manage your clearance certificates</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your certificates...</p>
            </div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Certificates Yet</h3>
            <p className="text-gray-400 mb-6">
              Your clearance certificates will appear here once your request is fully approved.
            </p>
            <button
              onClick={() => navigate("/student-clearance-status")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              View Clearance Status
            </button>
          </div>
        ) : viewingCert ? (
          // Professional Certificate View
          <div>
            <button
              onClick={() => setViewingCert(null)}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-all"
            >
              <ChevronLeft size={16} />
              Back to List
            </button>
            <ProfessionalCertificateDesign
              certificateData={viewingCert}
              studentName={viewingCert.student_name || displayName}
              sapId={viewingCert.sapid || displaySap}
              departments={viewingCert.departments || []}
              date={viewingCert.completed_at}
            />
          </div>
        ) : (
          // Certificate List View
          <div className="grid gap-6">
            {certificates.map((cert, index) => (
              <div
                key={cert._id || index}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-amber-500/30 transition-all cursor-pointer"
                onClick={() => setViewingCert(cert)}
              >
                {/* Certificate Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-700">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
                      <Award size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">Clearance Certificate</h3>
                      <p className="text-sm text-gray-400 mt-2">
                        Certificate ID: <span className="text-gray-300 font-mono">{cert._id?.slice(-8)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold flex items-center gap-1">
                    <CheckCircle size={16} />
                    Approved
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-slate-700">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Student Name</label>
                    <p className="text-white font-semibold">{cert.student_name || displayName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">SAP ID</label>
                    <p className="text-white font-semibold font-mono">{cert.sapid || displaySap}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Program</label>
                    <p className="text-white font-semibold">{cert.program || "N/A"}</p>
                  </div>
                </div>

                {/* Department Sign-offs */}
                <div className="mb-6 pb-6 border-b border-slate-700">
                  <h4 className="text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wide">Approved By</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cert.departments && cert.departments.length > 0 ? (
                      cert.departments.map((dept, idx) => (
                        <div key={idx} className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                          <p className="text-white text-sm font-medium">{dept.name}</p>
                          <CheckCircle size={18} className="text-green-400" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">All required departments</p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-700">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ISSUED DATE</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Calendar size={16} className="text-blue-400" />
                      {cert.completed_at ? new Date(cert.completed_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CERTIFICATE ID</p>
                    <p className="text-white font-mono text-sm font-semibold">{cert._id?.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">VALIDITY STATUS</p>
                    <p className="text-green-300 font-semibold">✓ Valid</p>
                  </div>
                </div>

                {/* Action Hint */}
                <div className="text-sm text-gray-400">
                  Click to view full certificate details
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        {certificates.length > 0 && (
          <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">📋 Certificate Information</h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>✓ Your clearance certificate is issued once all departments approve your request</li>
              <li>✓ Certificates are digitally signed and can be verified authentically</li>
              <li>✓ Download the PDF for official use and submissions</li>
              <li>✓ Keep a backup copy for your records</li>
            </ul>
          </div>
        )}
      </main>
      </div>

      {/* Print Preview Modal */}
      {printingCert && (
        <CertificatePrintPreview
          certificate={printingCert}
          onClose={() => setPrintingCert(null)}
        />
      )}
    </>
  );
}