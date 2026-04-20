import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  RiListCheck2, RiCheckDoubleLine, RiCloseCircleLine, RiMessage2Line, RiUserSettingsLine, RiLogoutBoxLine,
  RiBookOpenLine, RiAlertCircleLine, RiCheckCircleLine, RiInboxLine, RiAlertFill, RiLoader4Line, RiCheckFill,
  RiAddCircleLine, RiArrowLeftLine, RiMenu3Line
} from "react-icons/ri";
import DepartmentIssueReturn from "../shared/DepartmentIssueReturn";

export default function LibraryIssueReturn() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = user?.full_name || "Library Staff";
  const displaySap = user?.sap || "N/A";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── MOBILE HAMBURGER ── */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
        <RiMenu3Line size={24} className="text-gray-800" />
      </button>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}

      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-[280px] h-screen lg:h-auto flex flex-col bg-gradient-to-b from-[#0a0f24] via-[#1b2a56] to-[#182848] text-white py-6 px-4 shadow-xl overflow-y-auto shrink-0 transition-transform duration-300 z-40 lg:z-auto`}>
        {/* Logo & Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300">
            <RiBookOpenLine size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Library</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-blue-500/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <p className="text-[11px] text-gray-300 truncate">{displaySap} • Library</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => navigate("/library-dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <RiCheckDoubleLine size={18} /> Approved
          </button>
          <button
            onClick={() => navigate("/library-dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <RiCloseCircleLine size={18} /> Rejected
          </button>
          <hr className="my-3 border-white/10" />
          <button
            onClick={() => navigate("/library-issue-return")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            <RiAddCircleLine size={18} /> Create Issue
          </button>
          <button
            onClick={() => navigate("/library-messages")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <RiMessage2Line size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/library-edit-profile")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <RiUserSettingsLine size={18} /> Edit Profile
          </button>
        </nav>

        {/* Logout Button */}
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 mt-4 group">
          <RiLogoutBoxLine size={18} className="group-hover:animate-pulse" /> Logout
        </button>

        {/* Footer */}
        <footer className="text-[11px] text-gray-500 text-center pt-4 mt-4 border-t border-white/10">© 2025 Riphah</footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Issue & Return Management</h1>
          <p className="text-gray-600 mt-2">Create and manage issues and returns for your department</p>
        </div>

        {/* Issue & Return Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DepartmentIssueReturn departmentName="Library" />
        </div>
      </main>
    </div>
  );
}
