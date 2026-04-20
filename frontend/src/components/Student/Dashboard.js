import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../../config/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import api from "../../services/api";
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
  Loader,
  BarChart3,
  CheckSquare,
  Menu,
} from "lucide-react";
import "../../styles/scrollbar.css";
import "../../styles/print-certificate-a4-clean.css";

export default function StudentDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearanceStatus, setClearanceStatus] = useState(null);
  const [departmentStatuses, setDepartmentStatuses] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const displayName = user?.full_name || "Student";
  const displaySap = user?.sap || "SAP ID";
  const displayDept = user?.department || "Department";

  // ✅ FETCH CLEARANCE STATUS
  const fetchClearanceStatus = useCallback(async () => {
    try {
      console.log("📊 Fetching clearance status...");
      const response = await api.get("/api/clearance-status");

      console.log("✅ Clearance status response:", response.data);

      if (response.data.success && response.data.summary) {
        setClearanceStatus(response.data.summary);
        setDepartmentStatuses(response.data.departmentStatuses || []);
        setError("");
        console.log("📈 Status set:", response.data.summary);
      } else {
        console.log("⚠️ No summary in response");
        // Set default values if no summary
        setClearanceStatus({
          total: 0,
          cleared: 0,
          pending: 0,
          rejected: 0,
          progressPercentage: 0
        });
      }
    } catch (err) {
      console.error("❌ Error fetching clearance status:", err);
      setError("Failed to load clearance status");
      // Set default values on error
      setClearanceStatus({
        total: 0,
        cleared: 0,
        pending: 0,
        rejected: 0,
        progressPercentage: 0
      });
    }
  }, []);

  // ✅ FETCH UNREAD MESSAGES
  const fetchUnreadMessages = useCallback(async () => {
    try {
      const response = await api.get("/api/my-messages");

      if (response.data.success && Array.isArray(response.data.data)) {
        const unread = response.data.data.filter(msg => !msg.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClearanceStatus(), fetchUnreadMessages()]);
      setLoading(false);
    };
    loadData();
  }, [fetchClearanceStatus, fetchUnreadMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchClearanceStatus(), fetchUnreadMessages()]);
    setRefreshing(false);
  };

  const handleDownloadCertificate = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/clearance-certificate");

      if (response.data.success) {
        // Create a simple certificate HTML and trigger download
        const certificateHTML = generateCertificateHTML(response.data);
        const blob = new Blob([certificateHTML], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Clearance_Certificate_${user.sap}_${new Date().getTime()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateHTML = (response) => {
    // Extract certificate data from the API response
    const certData = response.certificate || response.data || {};
    
    // Generate current date
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Student data from response
    const studentName = certData.student_name || user?.full_name || 'Student Name';
    const sapId = certData.sapid || user?.sap || 'SAP ID';
    const regNo = certData.registration_no || 'Registration Number';
    const program = certData.program || 'Program';
    const qrCode = certData.qr_code || `CLEARANCE_${sapId}_${new Date().getTime()}`;
    
    console.log('Certificate Data:', { studentName, sapId, regNo, program, qrCode });
    
    // Create verification URL - this is what will be encoded in the QR code
    let apiUrl = getApiUrl();
    
    // For mobile scanning: Replace localhost with actual hostname/IP
    // This allows QR codes to work on mobile devices
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : ':5000';
      
      // If we're accessing from a specific hostname/IP, use that
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        apiUrl = `http://${hostname}${port}`;
      }
      // Otherwise keep trying localhost but with explicit port
      else {
        apiUrl = "http://192.168.1.X:5000"; // Will be replaced below
        console.warn('⚠️ Could not determine local IP. You may need to manually set REACT_APP_API_URL to your machine IP.');
      }
    }
    
    const verificationUrl = `${apiUrl}/api/verify-certificate/${encodeURIComponent(qrCode)}`;
    
    // Create QR code URL using qr-server API - encode the verification URL, not just the ID
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
    
    console.log('📱 QR Verification URL:', verificationUrl);
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Clearance Certificate</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .certificate-container {
            max-width: 900px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
          
          .certificate {
            position: relative;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            padding: 60px;
            min-height: 1200px;
            border: 3px solid #2c3e50;
            border-radius: 8px;
            margin: 20px;
          }
          
          /* Decorative corners */
          .corner {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 2px solid #d4a574;
          }
          
          .corner-top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
          .corner-top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
          .corner-bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
          .corner-bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .university-logo {
            font-size: 48px;
            margin-bottom: 10px;
          }
          
          .university-name {
            font-size: 28px;
            font-weight: bold;
            color: #1a3a52;
            letter-spacing: 2px;
            margin-bottom: 5px;
            font-family: 'Georgia', serif;
          }
          
          .university-subtitle {
            font-size: 14px;
            color: #7f8c8d;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }
          
          .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #d4a574, transparent);
            margin: 30px 0;
          }
          
          .certificate-title {
            font-size: 42px;
            font-weight: bold;
            color: #1a3a52;
            text-align: center;
            margin: 30px 0;
            font-style: italic;
            letter-spacing: 1px;
          }
          
          .certificate-text {
            text-align: center;
            font-size: 18px;
            color: #2c3e50;
            margin: 30px 0;
            line-height: 1.8;
          }
          
          .content-box {
            background: linear-gradient(135deg, rgba(212, 165, 116, 0.05) 0%, rgba(212, 165, 116, 0.1) 100%);
            border: 2px solid #d4a574;
            padding: 40px;
            border-radius: 8px;
            margin: 40px 0;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 16px;
            line-height: 2;
          }
          
          .info-label {
            font-weight: bold;
            color: #1a3a52;
            min-width: 200px;
          }
          
          .info-value {
            color: #2c3e50;
            flex: 1;
            border-bottom: 1px dotted #d4a574;
            padding-right: 20px;
            text-align: right;
          }
          
          .departments-section {
            margin: 40px 0;
          }
          
          .departments-title {
            font-size: 20px;
            font-weight: bold;
            color: #1a3a52;
            text-align: center;
            margin-bottom: 25px;
            text-decoration: underline;
          }
          
          .departments-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .dept-item {
            background: white;
            border: 2px solid #27ae60;
            padding: 15px 20px;
            border-radius: 6px;
            text-align: center;
            font-weight: 500;
            color: #27ae60;
            box-shadow: 0 2px 8px rgba(39, 174, 96, 0.1);
          }
          
          .dept-item::before {
            content: "✓";
            margin-right: 10px;
            font-weight: bold;
            font-size: 18px;
          }
          
          .qr-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 40px 0;
            padding: 30px;
            background: white;
            border: 2px dashed #d4a574;
            border-radius: 8px;
          }
          
          .qr-container {
            text-align: center;
          }
          
          .qr-label {
            font-size: 14px;
            font-weight: bold;
            color: #1a3a52;
            margin-bottom: 15px;
            display: block;
          }
          
          .qr-image {
            border: 2px solid #2c3e50;
            padding: 10px;
            background: white;
            border-radius: 4px;
          }
          
          .qr-code {
            display: block;
            margin-bottom: 10px;
          }
          
          .qr-id {
            font-size: 12px;
            color: #7f8c8d;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            margin-top: 10px;
          }
          
          .signatures-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 2px solid #d4a574;
          }
          
          .signature-box {
            text-align: center;
            flex: 1;
            margin: 0 20px;
          }
          
          .signature-line {
            height: 2px;
            background-color: #2c3e50;
            margin: 20px 0;
          }
          
          .signature-title {
            font-size: 13px;
            font-weight: bold;
            color: #1a3a52;
          }
          
          .signature-subtitle {
            font-size: 11px;
            color: #7f8c8d;
            margin-top: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #ecf0f1;
            font-size: 12px;
            color: #7f8c8d;
          }
          
          .certificate-id {
            font-size: 14px;
            color: #34495e;
            font-weight: bold;
            margin: 10px 0 0 0;
            font-family: 'Courier New', monospace;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .certificate-container {
              box-shadow: none;
              border-radius: 0;
              margin: 0;
            }
            .certificate {
              margin: 0;
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="certificate">
            <!-- Decorative corners -->
            <div class="corner corner-top-left"></div>
            <div class="corner corner-top-right"></div>
            <div class="corner corner-bottom-left"></div>
            <div class="corner corner-bottom-right"></div>
            
            <!-- Header -->
            <div class="header">
              <div class="university-logo">🎓</div>
              <div class="university-name">RIPHAH INTERNATIONAL UNIVERSITY</div>
              <div class="university-subtitle">OFFICE OF THE REGISTRAR</div>
            </div>
            
            <div class="divider"></div>
            
            <!-- Certificate Title -->
            <div class="certificate-title">CLEARANCE CERTIFICATE</div>
            
            <!-- Opening Text -->
            <div class="certificate-text">
              This is to certify that the student mentioned below has successfully completed<br>
              all required clearance procedures and has been duly cleared to proceed.
            </div>
            
            <!-- Student Information -->
            <div class="content-box">
              <div class="info-row">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${studentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">SAP ID:</span>
                <span class="info-value">${sapId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Registration Number:</span>
                <span class="info-value">${regNo}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Program:</span>
                <span class="info-value">${program}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issue Date:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
            </div>
            
            <!-- Departments Section -->
            <div class="departments-section">
              <div class="departments-title">APPROVED BY ALL DEPARTMENTS</div>
              <div class="departments-list">
                <div class="dept-item">Coordination</div>
                <div class="dept-item">Transport</div>
                <div class="dept-item">Library</div>
                <div class="dept-item">Fee Department</div>
                <div class="dept-item">Student Service</div>
              </div>
            </div>
            
            <!-- QR Code Section -->
            <div class="qr-section">
              <div class="qr-container">
                <span class="qr-label">🔐 Verify Certificate Authenticity</span>
                <div class="qr-image">
                  <img src="${qrCodeUrl}" alt="Certificate QR Code" class="qr-code" style="width: 200px; height: 200px;">
                </div>
                <div class="qr-id">
                  <strong>Verify at:</strong><br>
                  <span style="word-break: break-all; font-size: 11px;">${verificationUrl}</span><br><br>
                  <strong>Certificate ID:</strong> ${qrCode}
                </div>
              </div>
            </div>
            
            <!-- Signatures -->
            <div class="signatures-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">Registrar</div>
                <div class="signature-subtitle">Riphah International University</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">HOD</div>
                <div class="signature-subtitle">Department of Student Affairs</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-title">Official Stamp</div>
                <div class="signature-subtitle">Dated: ${formattedDate}</div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>This certificate is valid and has been officially issued by Riphah International University.</p>
              <p>For verification, scan the QR code above or contact the Office of the Registrar.</p>
              <div class="certificate-id">Document Reference: ${qrCode}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ GET PROGRESS COLOR BASED ON PERCENTAGE
  const getProgressColors = (percentage) => {
    if (percentage === 100) {
      return {
        barGradient: "from-green-500 via-emerald-500 to-green-400",
        textGradient: "from-green-400 to-emerald-400",
        barShadow: "shadow-green-500/50"
      };
    } else if (percentage >= 67) {
      return {
        barGradient: "from-cyan-500 via-blue-500 to-blue-400",
        textGradient: "from-cyan-400 to-blue-400",
        barShadow: "shadow-blue-500/50"
      };
    } else if (percentage >= 34) {
      return {
        barGradient: "from-amber-500 via-orange-500 to-yellow-400",
        textGradient: "from-amber-400 to-orange-400",
        barShadow: "shadow-orange-500/50"
      };
    } else {
      return {
        barGradient: "from-red-500 via-rose-500 to-red-400",
        textGradient: "from-red-400 to-rose-400",
        barShadow: "shadow-red-500/50"
      };
    }
  };

  const navItems = [
    { path: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student-clearance-request", icon: ClipboardList, label: "Submit Request" },
    { path: "/student-clearance-status", icon: CheckCircle2, label: "Clearance Status" },
    { path: "/student-messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: "/student-edit-profile", icon: UserPen, label: "Edit Profile" },
  ];

  const departments = [
    { name: "Coordination", icon: CheckCircle2, color: "from-pink-400 to-pink-600" },
    { name: "Transport", icon: Bus, color: "from-green-400 to-green-600" },
    { name: "Library", icon: BookOpen, color: "from-blue-400 to-blue-600" },
    { name: "Fee Department", icon: CreditCard, color: "from-red-400 to-red-600" },
    { name: "Student Service", icon: Handshake, color: "from-orange-400 to-orange-600" },
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
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* ── MOBILE MENU TOGGLE ── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-700 shadow-lg border border-slate-600 hover:bg-slate-600 transition-colors duration-200">
        <Menu size={24} className="text-white" />
      </button>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

      {/* Sidebar with Custom Scrollbar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-[280px] h-screen lg:h-auto shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl overflow-y-auto border-r border-slate-700 scrollbar-blue transition-transform duration-300 z-40 lg:z-auto`}>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold whitespace-nowrap">
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
          © 2025 Riphah
        </footer>
      </aside>

      {/* Main Content with Custom Scrollbar */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-blue mt-14 lg:mt-0">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {displayName}!</h1>
            <p className="text-gray-400">Track your clearance progress and manage requests</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            title="Refresh data"
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
        {clearanceStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Departments */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-semibold">Total Departments</h3>
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                  <BarChart3 size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{clearanceStatus.total || 0}</p>
              <p className="text-sm text-gray-400 mt-2">Clearances needed</p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 w-full"></div>
              </div>
            </div>

            {/* Cleared */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-semibold">Approved</h3>
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
                  <CheckSquare size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{clearanceStatus.cleared || 0}</p>
              <p className="text-sm text-gray-400 mt-2">Clearances approved</p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${Math.min((clearanceStatus.cleared / (clearanceStatus.total || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-red-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-semibold">Rejected</h3>
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-all">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{clearanceStatus.rejected || 0}</p>
              <p className="text-sm text-gray-400 mt-2">Need resubmission</p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                  style={{ width: `${Math.min((clearanceStatus.rejected / (clearanceStatus.total || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Not Started / Waiting */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-slate-500/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-semibold">Waiting</h3>
                <div className="p-3 bg-slate-500/20 rounded-lg group-hover:bg-slate-500/30 transition-all">
                  <Clock size={20} className="text-slate-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{(clearanceStatus.total - clearanceStatus.cleared) || 0}</p>
              <p className="text-sm text-gray-400 mt-2">In queue</p>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-300"
                  style={{ width: `${Math.min(((clearanceStatus.total - clearanceStatus.cleared) / (clearanceStatus.total || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <Loader size={40} className="animate-spin mx-auto text-blue-400 mb-2" />
            <p className="text-gray-400">Loading statistics...</p>
          </div>
        )}

        {/* Progress Bar */}
        {clearanceStatus && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp size={20} className={`text-transparent bg-clip-text bg-gradient-to-r ${getProgressColors(clearanceStatus.progressPercentage || 0).textGradient}`} />
                Overall Clearance Progress
              </h3>
              <span className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getProgressColors(clearanceStatus.progressPercentage || 0).textGradient}`}>
                {clearanceStatus.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColors(clearanceStatus.progressPercentage || 0).barGradient} transition-all duration-500 shadow-lg ${getProgressColors(clearanceStatus.progressPercentage || 0).barShadow}`}
                style={{ width: `${clearanceStatus.progressPercentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{clearanceStatus.cleared} approved</span>
              <span>out of {clearanceStatus.total} departments</span>
              <span>{clearanceStatus.pending} pending</span>
            </div>
          </div>
        )}

        {/* Certificate & Resubmit Section */}
        {clearanceStatus && (clearanceStatus.cleared === clearanceStatus.total || clearanceStatus.rejected > 0) && (
          <div className="mb-8">
            {clearanceStatus.cleared === clearanceStatus.total && clearanceStatus.total > 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-500/30 rounded-full">
                    <Award size={40} className="text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-green-300 mb-2">🎓 Clearance Completed!</h2>
                <p className="text-green-200 mb-6">All departments have approved your clearance request. Your certificate is ready.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={() => handleDownloadCertificate()}
                    disabled={loading}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <ClipboardCheck size={20} />
                    Download Certificate
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <ClipboardList size={20} />
                    Print Certificate
                  </button>
                </div>
              </div>
            )}

            {clearanceStatus.rejected > 0 && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl p-8 mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-orange-300 mb-2">⚠️ Request Rejected</h2>
                    <p className="text-orange-200 mb-4">
                      One or more departments has rejected your clearance request. You can address the concerns and resubmit.
                    </p>
                    <button
                      onClick={() => navigate("/student-clearance-status")}
                      className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all"
                    >
                      View Rejection Details
                    </button>
                  </div>
                  <button
                    onClick={() => navigate("/student-clearance-request")}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <PlusCircle size={20} />
                    Resubmit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate("/student-clearance-request")}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 hover:shadow-xl transition-all group text-left"
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
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500/50 hover:shadow-xl transition-all group text-left"
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
            Required Clearance Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => {
              const DeptIcon = dept.icon;
              const deptStatus = departmentStatuses.find(ds => ds.name === dept.name);
              const status = deptStatus?.status || 'Not Started';
              const statusConfig = {
                'Approved': { label: 'Approved', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/50', icon: CheckCircle2 },
                'Cleared': { label: 'Approved', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/50', icon: CheckCircle2 },
                'Pending': { label: 'Pending', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/50', icon: Clock },
                'Rejected': { label: 'Rejected', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/50', icon: AlertCircle },
                'Not Started': { label: 'Waiting', bgColor: 'bg-slate-600/20', textColor: 'text-gray-400', borderColor: 'border-slate-600/50', icon: Clock },
              };
              const sc = statusConfig[status] || statusConfig['Not Started'];
              const StatusIcon = sc.icon;
              const isRejected = status === 'Rejected';
              
              return (
                <div
                  key={dept.name}
                  className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border ${sc.borderColor} hover:shadow-lg transition-all group cursor-pointer ${isRejected ? 'border-l-4' : ''}`}
                  style={isRejected ? { borderLeftColor: '#ef4444', borderLeftWidth: '4px' } : {}}
                  onClick={() => navigate("/student-clearance-status")}
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
                  <h3 className="text-white font-semibold group-hover:text-blue-400 transition-all">
                    {dept.name}
                  </h3>
                  
                  {isRejected && deptStatus ? (
                    <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-300 font-bold mb-2 flex items-center gap-1">
                        <AlertCircle size={14} />
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-100 mb-2">
                        {deptStatus.reason || 'Please contact the department for details'}
                      </p>
                      {deptStatus.pendingItems && deptStatus.pendingItems.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-500/30">
                          <p className="text-xs text-red-300 font-semibold mb-1">Pending Items:</p>
                          <ul className="text-xs text-red-100 space-y-1">
                            {deptStatus.pendingItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
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
                      {deptStatus?.isAutoApproved ? 'Auto-approved by system' : 
                       status === 'Approved' ? `Approved by ${deptStatus?.approverName || 'department'}` :
                       status === 'Pending' ? 'Under review' :
                       'Waiting for previous department'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages Preview */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Inbox size={24} className="text-blue-400" />
              Messages
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
              You have <span className="font-bold text-blue-400">{unreadCount}</span> unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-gray-400">No new messages. You're all caught up! 🎉</p>
          )}
        </div>
      </main>
    </div>
  );
}