import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { 
  UserPen, ClipboardList, CheckCircle2, XCircle, MessageSquare, LogOut,
  DollarSign, AlertCircle, CheckCircle, Inbox, AlertTriangle
} from "lucide-react";
import DepartmentIssueReturn from "../shared/DepartmentIssueReturn";

export default function FeeIssueReturn() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const displayName = user?.full_name || "Fee Department";
  const displaySap = user?.sap || "N/A";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] flex flex-col bg-gradient-to-b from-[#5a2e0f] via-[#8b4513] to-[#654321] text-white py-6 px-4 shadow-xl overflow-y-auto shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
            <DollarSign size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Fee Dept</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-orange-500/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <p className="text-[11px] text-gray-300 truncate">{displaySap} • Fee Dept</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          <button
            onClick={() => navigate("/fee-dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <CheckCircle2 size={18} /> Approved
          </button>
          <button
            onClick={() => navigate("/fee-dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <XCircle size={18} /> Rejected
          </button>
          <div className="my-2 border-t border-white/10" />
          <button
            onClick={() => navigate("/fee-issue-return")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 transition-all duration-200"
          >
            <Inbox size={18} /> Create Issue
          </button>
          <button
            onClick={() => navigate("/fee-messages")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <MessageSquare size={18} /> Messages
          </button>
          <button
            onClick={() => navigate("/fee-edit-profile")}
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Issue & Return Management</h1>
          <p className="text-gray-600 mt-2">Create and manage issues and returns for your department</p>
        </div>

        {/* Issue & Return Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DepartmentIssueReturn departmentName="Fee Department" />
        </div>
      </main>
    </div>
  );
}
