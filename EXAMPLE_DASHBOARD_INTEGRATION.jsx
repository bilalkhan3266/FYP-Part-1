/**
 * EXAMPLE: Enhanced Transport Dashboard with Approved Clearances
 * 
 * Shows how to integrate ApprovedClearancesViewer component
 * into existing department dashboards
 * 
 * Apply same pattern to:
 * - LibraryDashboard.js
 * - FeeDepartmentDashboard.js
 * - StudentServiceDashboard.js
 * - CoordinationDashboard.js
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  MessageSquare,
  LogOut,
  AlertCircle,
} from "lucide-react";
import ApprovedClearancesViewer from "../shared/ApprovedClearancesViewer";

export default function TransportDashboardEnhanced() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");

  // Your existing handlers...
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Keep Your Existing Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Transport Department
            </h1>
            <p className="text-gray-600">Welcome, {user?.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation - ENHANCED */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200">
            {/* Pending Tab */}
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              Pending Requests
            </button>

            {/* Approved Tab - NEW WITH COMPONENT */}
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "approved"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              Approved Clearances
            </button>

            {/* Rejected Tab */}
            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "rejected"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <XCircle className="w-5 h-5" />
              Rejected Requests
            </button>

            {/* Messages Tab */}
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "messages"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Messages
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}

        {/* Pending Tab - Your Existing Content */}
        {activeTab === "pending" && (
          <div>
            {/* Your existing pending requests content */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Clearance Requests
              </h2>
              {/* Place your existing pending requests component here */}
              <p className="text-gray-600">
                Pending requests content goes here...
              </p>
            </div>
          </div>
        )}

        {/* Approved Tab - NEW UNIFIED COMPONENT */}
        {activeTab === "approved" && (
          <ApprovedClearancesViewer departmentName="Transport" />
        )}

        {/* Rejected Tab - Your Existing Content */}
        {activeTab === "rejected" && (
          <div>
            {/* Your existing rejected requests content */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Rejected Clearance Requests
              </h2>
              {/* Place your existing rejected requests component here */}
              <p className="text-gray-600">
                Rejected requests content goes here...
              </p>
            </div>
          </div>
        )}

        {/* Messages Tab - Your Existing Content */}
        {activeTab === "messages" && (
          <div>
            {/* Your existing messages content */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Messages
              </h2>
              {/* Place your existing messages component here */}
              <p className="text-gray-600">Messages content goes here...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
