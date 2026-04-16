import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { ClipboardList, CheckCircle2, XCircle, MessageSquare, UserPen, LogOut, Inbox, AlertCircle, AlertTriangle } from "lucide-react";
import DepartmentIssueReturn from "../shared/DepartmentIssueReturn";

export default function ServiceIssueReturn() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const displayName = user?.full_name || "Service Staff";
  const displaySap = user?.sap || "N/A";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gradient-to-b from-[#0a3d2e] via-[#1a5c47] to-[#0d4835] text-white p-6 shadow-lg overflow-y-auto">
        {/* Profile Card */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-white">{displayName}</h3>
          <p className="text-sm text-emerald-200">{displaySap} • Service</p>
          <p className="text-xs text-emerald-200 mt-1">Riphah International University</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <button
            onClick={() => navigate("/service-dashboard")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <CheckCircle2 size={18} /> Approved
          </button>
          <button
            onClick={() => navigate("/service-dashboard")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <XCircle size={18} /> Rejected
          </button>
          <div className="border-t border-emerald-400/30 my-4"></div>
          <button
            onClick={() => navigate("/service-issue-return")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-400 to-green-500 text-white transition-all"
          >
            <Inbox size={18} /> Create Issue
          </button>
          <button
            onClick={() => navigate("/service-messages")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/service-edit-profile")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-white/10 transition-all"
          >
            <UserPen size={18} /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-emerald-100 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>

        <footer className="text-xs text-emerald-300 text-center mt-8">© 2025 Riphah</footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Issue & Return Management</h1>
          <p className="text-gray-600 mt-2">Create and manage issues and returns for your department</p>
        </div>

        {/* Issue & Return Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DepartmentIssueReturn departmentName="Student Service" />
        </div>
      </main>
    </div>
  );
}
