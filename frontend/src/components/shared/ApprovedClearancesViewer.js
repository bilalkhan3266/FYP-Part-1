import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../config/apiConfig";
import {
  CheckCircle2,
  Download,
  Search,
  Loader,
  Eye,
  Mail,
  Calendar,
  Badge,
} from "lucide-react";
import axios from "axios";

/**
 * ApprovedClearancesViewer Component
 * 
 * Displays all fully approved clearances for a department
 * Uses the unified API: GET /api/approved-clearances/:departmentName
 * 
 * Features:
 * - Shows all students with completed clearances
 * - Search by SAP ID or student name
 * - Pagination
 * - Export to CSV
 * - Statistics
 * - Responsive design
 */
export default function ApprovedClearancesViewer({ departmentName }) {
  const [clearances, setClearances] = useState([]);
  const [filteredClearances, setFilteredClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem("token");

  // Fetch approved clearances
  const fetchApprovedClearances = async (searchQuery = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        sortBy: "date",
        sortOrder: "desc",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await axios.get(
        `${apiUrl}/api/approved-clearances/${departmentName}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setClearances(response.data.data);
        setFilteredClearances(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || "Failed to fetch approved clearances");
      }
    } catch (err) {
      console.error("Error fetching clearances:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch approved clearances. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get(
        `${apiUrl}/api/approved-clearances/${departmentName}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  // Execute search when term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApprovedClearances(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page, limit]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Export to CSV
  const handleExport = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/approved-clearances/${departmentName}/export?format=csv`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `approved-clearances-${departmentName}-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError("Failed to export data");
    }
  };

  // View details modal
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  if (loading && clearances.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading approved clearances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-800">
              Approved Clearances
            </h2>
          </div>
          <p className="text-gray-600">
            All students who have completed clearance from all departments
          </p>
        </div>

        {/* Statistics Cards */}
        {!loadingStats && stats.totalApproved !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">
                Total Approved
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {stats.totalApproved}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">
                This Month
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {stats.thisMonth}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">
                Today
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {stats.today}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="text-gray-600 text-sm font-semibold mb-2">
                Average/Day
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {stats.averagePerDay}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search and Export */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by SAP ID or student name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {clearances.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                No approved clearance records yet
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Completed clearances will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        SAP ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Approved Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clearances.map((record) => (
                      <tr
                        key={record._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.sapId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.studentDepartment || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.program || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(
                            record.dateApproved
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages} (
                    {pagination.total} total records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasMore}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-green-600 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Clearance Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl font-bold hover:text-green-100"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Student Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Name
                    </label>
                    <p className="text-gray-800 font-medium">
                      {selectedRecord.studentName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      SAP ID
                    </label>
                    <p className="text-gray-800 font-medium">
                      {selectedRecord.sapId}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Department
                    </label>
                    <p className="text-gray-800 font-medium">
                      {selectedRecord.studentDepartment || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Program
                    </label>
                    <p className="text-gray-800 font-medium">
                      {selectedRecord.program || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Registration No
                    </label>
                    <p className="text-gray-800 font-medium">
                      {selectedRecord.registrationNo || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Email
                    </label>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      {selectedRecord.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clearance Info */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Clearance Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </label>
                    <p className="text-green-600 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedRecord.clearanceStatus}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Approved Date
                    </label>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {new Date(
                        selectedRecord.dateApproved
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Approved Departments
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRecord.approvedDepartments?.map(
                        (dept) => (
                          <span
                            key={dept}
                            className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full"
                          >
                            ✓ {dept}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Info */}
              {selectedRecord.certificateId && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Certificate Information
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Certificate ID / QR Code
                    </label>
                    <p className="text-gray-800 font-mono text-sm bg-gray-50 p-3 rounded mt-2 break-all">
                      {selectedRecord.certificateId}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}