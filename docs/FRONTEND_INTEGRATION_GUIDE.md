# Frontend Integration Guide - Comprehensive Clearance System

## 📋 Overview

The backend now returns a completely different response format for clearance requests. This guide shows exactly what changes are needed in the frontend components.

---

## 🔄 Response Format Changes

### OLD Response Format
```javascript
{
  success: true,
  message: "Request submitted",
  departmentId: ObjectId,
  // Only created first department
}
```

### NEW Response Format
```javascript
{
  success: true,
  message: "✅ Clearance APPROVED - All departments cleared!",
  overallStatus: "Completed" | "Rejected",
  certificateGenerated: true | false,
  validationId: ObjectId,
  
  departmentStatuses: [
    {
      name: "Library",
      status: "Approved" | "Rejected",
      reason: "No outstanding dues" | "Book not returned",
      pendingItems: ["Physics Book"],
      validatedAt: Date
    },
    // ... 4 more departments
  ],
  
  approvedDepartments: ["Coordination", "Library", "Transport", "Finance", "Student Services"],
  rejectedDepartments: [],
  
  isResubmission: true | false
}
```

---

## 🔧 Component Updates Required

### 1. ClearanceRequest.js (Form Submission Handling)

**Current Code (Example):**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await axios.post('/api/clearance-requests', formData);
    
    if (response.data.success) {
      alert('Clearance request submitted!');
      setFormData({...});
    }
  } catch (error) {
    alert('Error submitting request');
  }
};
```

**Update To:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await axios.post('/api/clearance-requests', formData);
    
    if (response.data.success) {
      const { overallStatus, certificateGenerated, departmentStatuses, rejectedDepartments } = response.data;
      
      // Store the result for dashboard display
      localStorage.setItem('clearanceResult', JSON.stringify(response.data));
      
      if (overallStatus === "Completed") {
        // ✅ ALL departments approved
        alert('🎉 Congratulations! Your clearance is APPROVED!\n\nAll 5 departments have cleared you.\nYou can now download your certificate.');
        setShowCertificate(true);
      } else if (overallStatus === "Rejected") {
        // ❌ Some departments have issues
        const rejectedList = rejectedDepartments
          .map(dept => {
            const deptStatus = departmentStatuses.find(d => d.name === dept);
            return `• ${dept}: ${deptStatus?.reason}`;
          })
          .join('\n');
        
        alert(`❌ Your clearance request was REJECTED.\n\nPlease fix the following issues and resubmit:\n\n${rejectedList}`);
        setShowRejectionDetails(true);
      }
      
      // Redirect to dashboard
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } else {
      // Failed to submit (e.g., already completed)
      alert(`⚠️ ${response.data.message}`);
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // Submission blocked (already completed or pending)
      alert(`⚠️ ${error.response.data.message}`);
    } else {
      alert('Error submitting clearance request');
    }
  }
};
```

---

### 2. Dashboard.js (Display Clearance Status)

**Key Changes:**

#### A. Clearance Status Card
```javascript
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [clearanceStatus, setClearanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClearanceStatus();
  }, []);

  const fetchClearanceStatus = async () => {
    try {
      const response = await axios.get('/api/clearance-status', {
        params: { student_id: localStorage.getItem('studentId') }
      });
      
      setClearanceStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clearance status:', error);
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {loading ? (
        <div>Loading...</div>
      ) : clearanceStatus?.overallStatus === "Completed" ? (
        <ClearanceCompletedCard clearanceStatus={clearanceStatus} />
      ) : clearanceStatus?.overallStatus === "Rejected" ? (
        <ClearanceRejectedCard clearanceStatus={clearanceStatus} />
      ) : (
        <NoClearanceCard />
      )}
    </div>
  );
};

// Component for Completed Clearance
const ClearanceCompletedCard = ({ clearanceStatus }) => {
  return (
    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <span className="text-4xl">✅</span>
        <div>
          <h3 className="text-2xl font-bold text-green-700">Clearance Completed</h3>
          <p className="text-gray-600">All 5 departments have cleared you</p>
        </div>
      </div>

      {/* Department Status Summary */}
      <div className="mt-6 grid grid-cols-5 gap-4">
        {clearanceStatus.departmentStatuses.map((dept) => (
          <div
            key={dept.name}
            className="text-center p-4 bg-white rounded border-2 border-green-300"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold text-sm">{dept.name}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
        ))}
      </div>

      {/* Certificate Section */}
      {clearanceStatus.certificateGenerated && (
        <div className="mt-6 pt-6 border-t-2 border-green-300">
          <h4 className="font-bold mb-4">Certificate</h4>
          <button
            onClick={() => handleDownloadCertificate(clearanceStatus.qrCode)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            📄 Download Certificate
          </button>
          {clearanceStatus.qrCode && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">QR Code: {clearanceStatus.qrCode}</p>
              {/* Generate QR code image here */}
            </div>
          )}
        </div>
      )}

      {/* Progress Summary */}
      <div className="mt-6 bg-white p-4 rounded">
        <div className="flex justify-between items-center">
          <span>Clearance Progress</span>
          <span className="text-lg font-bold text-green-600">
            {clearanceStatus.summary?.cleared}/{clearanceStatus.summary?.total} Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${clearanceStatus.summary?.progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Component for Rejected Clearance
const ClearanceRejectedCard = ({ clearanceStatus }) => {
  const rejectedDepts = clearanceStatus.departmentStatuses.filter(
    d => d.status === "Rejected"
  );

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <span className="text-4xl">❌</span>
        <div>
          <h3 className="text-2xl font-bold text-red-700">Clearance Pending</h3>
          <p className="text-gray-600">
            {rejectedDepts.length} department(s) need attention
          </p>
        </div>
      </div>

      {/* Department Status Grid */}
      <div className="mt-6 grid grid-cols-5 gap-4">
        {clearanceStatus.departmentStatuses.map((dept) => (
          <div
            key={dept.name}
            className={`text-center p-4 rounded border-2 ${
              dept.status === "Approved"
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="text-2xl mb-2">
              {dept.status === "Approved" ? "✅" : "❌"}
            </div>
            <div className="font-semibold text-sm">{dept.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {dept.status === "Approved" ? "Cleared" : "Pending"}
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Details */}
      <div className="mt-6 bg-white p-4 rounded">
        <h4 className="font-bold text-red-700 mb-4">Issues to Fix:</h4>
        {rejectedDepts.map((dept) => (
          <div key={dept.name} className="mb-4 p-3 bg-red-50 rounded border-l-4 border-red-500">
            <h5 className="font-semibold text-red-700">{dept.name}</h5>
            <p className="text-sm text-gray-700 mt-1">{dept.reason}</p>
            {dept.pendingItems?.length > 0 && (
              <ul className="mt-2 ml-4 text-sm">
                {dept.pendingItems.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Resubmit Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/student/clearance-request')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          🔄 Fix Issues & Resubmit
        </button>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 bg-white p-4 rounded">
        <div className="flex justify-between items-center">
          <span>Clearance Progress</span>
          <span className="text-lg font-bold text-orange-600">
            {clearanceStatus.summary?.cleared}/{clearanceStatus.summary?.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-orange-600 h-2 rounded-full"
            style={{
              width: `${(clearanceStatus.summary?.cleared / clearanceStatus.summary?.total) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Component for No Clearance Record
const NoClearanceCard = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <span className="text-4xl">📋</span>
        <div>
          <h3 className="text-2xl font-bold text-gray-700">No Clearance Request</h3>
          <p className="text-gray-600">Submit your clearance request to get started</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/student/clearance-request')}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        📝 Submit Clearance Request
      </button>
    </div>
  );
};

export default Dashboard;
```

---

### 3. ClearanceStatus.js (Detailed View)

**Key Changes:**
```javascript
import React, { useEffect, useState } from 'react';

const ClearanceStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await axios.get('/api/clearance-status', {
        params: { student_id: localStorage.getItem('studentId') }
      });
      setStatus(response.data);
    };
    
    fetchStatus();
  }, []);

  if (!status) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">
        {status.overallStatus === "Completed" ? "✅ Clearance Completed" : "Clearance Status"}
      </h2>

      {/* Overall Status Summary */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {status.summary?.cleared}
            </div>
            <div className="text-sm text-gray-600">Cleared</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">
              {status.summary?.rejected}
            </div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-600">
              {status.summary?.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {status.summary?.progressPercentage}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
      </div>

      {/* Department Statuses */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Department Status</h3>
        {status.departmentStatuses?.map((dept, idx) => (
          <DepartmentStatusCard key={idx} dept={dept} />
        ))}
      </div>

      {/* Certificate Section */}
      {status.certificateGenerated && (
        <div className="mt-8 bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">✅ Certificate Ready</h3>
          <button className="bg-green-600 text-white px-6 py-2 rounded">
            📄 Download Certificate
          </button>
          {status.qrCode && (
            <div className="mt-4 text-sm text-gray-600">
              Verification Code: {status.qrCode}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DepartmentStatusCard = ({ dept }) => {
  const isApproved = dept.status === "Approved";

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        isApproved
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isApproved ? "✅" : "❌"}</span>
          <div>
            <h4 className="font-bold">{dept.name}</h4>
            <p className="text-sm text-gray-600">{dept.reason}</p>
            {dept.pendingItems?.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>Pending Items:</strong>
                <ul className="ml-4 mt-1">
                  {dept.pendingItems.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(dept.validatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ClearanceStatus;
```

---

### 4. ClearanceCertificate.js (Certificate Display)

**Update To:**
```javascript
import React from 'react';

const ClearanceCertificate = ({ clearanceData, studentInfo }) => {
  // IMPORTANT: Only show if certificateGenerated === true
  if (!clearanceData.certificateGenerated) {
    return (
      <div className="p-6 bg-yellow-50 border-2 border-yellow-400 rounded">
        <p>Certificate not available. Your clearance must be completed to generate a certificate.</p>
      </div>
    );
  }

  return (
    <div id="certificate-print" className="p-8 bg-white border-4 border-gold">
      {/* Certificate Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">CLEARANCE CERTIFICATE</h1>
        <p className="text-gray-600">University - Academic Year 2025-2026</p>
      </div>

      {/* Student Information */}
      <div className="mb-8 p-6 border-2 border-gray-300 rounded">
        <h3 className="font-bold mb-4">Student Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Name:</strong> {studentInfo.student_name}
          </div>
          <div>
            <strong>SAP ID:</strong> {studentInfo.sapid}
          </div>
          <div>
            <strong>Registration No:</strong> {studentInfo.registration_no}
          </div>
          <div>
            <strong>Program:</strong> {studentInfo.program}
          </div>
          <div>
            <strong>Semester:</strong> {studentInfo.semester}
          </div>
          <div>
            <strong>Status:</strong> {studentInfo.degree_status}
          </div>
        </div>
      </div>

      {/* Approved Departments */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4">✅ CLEARED DEPARTMENTS (All 5)</h3>
        <div className="grid grid-cols-1 gap-3">
          {clearanceData.departmentStatuses?.map((dept) => (
            <div key={dept.name} className="flex items-center gap-3 p-3 bg-green-50 border-l-4 border-green-600">
              <span className="text-xl">✅</span>
              <span className="font-semibold">{dept.name}</span>
              <span className="text-gray-600 text-sm ml-auto">
                Cleared: {new Date(dept.validatedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Details */}
      <div className="mb-8 px-6 py-4 bg-gray-50 rounded text-center text-sm">
        <p>
          <strong>Certificate Date:</strong> {new Date().toLocaleDateString()}
        </p>
        <p className="mt-2">
          <strong>Verification Code:</strong> {clearanceData.qr_code}
        </p>
        <p className="mt-4 text-xs text-gray-600">
          This certificate confirms that the above-named student has completed
          all clearance requirements from all university departments.
        </p>
      </div>

      {/* QR Code Section */}
      {clearanceData.qr_code && (
        <div className="text-center mt-8 pt-8 border-t-2 border-gray-300">
          <p className="text-sm font-semibold mb-4">Verification QR Code</p>
          {/* Generate QR code image here using qrcode.react or similar */}
          <img
            src={generateQRCode(clearanceData.qr_code)}
            alt="QR Code"
            className="w-24 h-24 mx-auto"
          />
        </div>
      )}

      {/* Print Button */}
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          🖨️ Print Certificate
        </button>
      </div>
    </div>
  );
};

export default ClearanceCertificate;
```

---

## 🔗 API Response Breakdown

### Success Response - All Approved
```javascript
{
  "success": true,
  "message": "✅ Clearance APPROVED - All departments cleared!",
  "validationId": "507f1f77bcf86cd799439011",
  "overallStatus": "Completed",
  "certificateGenerated": true,
  "departmentStatuses": [
    {
      "name": "Coordination",
      "status": "Approved",
      "reason": "No outstanding dues",
      "pendingItems": [],
      "validatedAt": "2026-04-03T10:30:00Z"
    },
    // ... 4 more
  ],
  "approvedDepartments": [
    "Coordination",
    "Library",
    "Transport",
    "Finance",
    "Student Services"
  ],
  "rejectedDepartments": []
}
```

### Failure Response - Some Departments Rejected
```javascript
{
  "success": true,
  "message": "❌ Clearance REJECTED - Please fix the issues and resubmit",
  "validationId": "507f1f77bcf86cd799439012",
  "overallStatus": "Rejected",
  "certificateGenerated": false,
  "departmentStatuses": [
    {
      "name": "Library",
      "status": "Rejected",
      "reason": "Pending items: Physics Book",
      "pendingItems": ["Physics Book"],
      "validatedAt": "2026-04-03T10:30:00Z"
    },
    {
      "name": "Finance",
      "status": "Rejected",
      "reason": "Pending items: Tuition Fee",
      "pendingItems": ["Tuition Fee"],
      "validatedAt": "2026-04-03T10:30:00Z"
    }
  ],
  "approvedDepartments": ["Coordination", "Transport", "Student Services"],
  "rejectedDepartments": ["Library", "Finance"],
  "isResubmission": false
}
```

### Blocked Response - Already Completed
```javascript
{
  "success": false,
  "message": "You have already completed your clearance. Please do not resubmit."
  // HTTP 409
}
```

---

## 📋 Frontend Checklist

- [ ] Update ClearanceRequest.js form submission handler
- [ ] Update Dashboard.js clearance status card display
- [ ] Create ClearanceCompletedCard component (green card with all depts approved)
- [ ] Create ClearanceRejectedCard component (red card with rejection reasons)
- [ ] Create DepartmentStatusCard component (per-dept status display)
- [ ] Update ClearanceStatus.js to show comprehensive results
- [ ] Update ClearanceCertificate.js to check `certificateGenerated` flag
- [ ] Add localStorage handling for clearance results
- [ ] Update routing/navigation after form submission
- [ ] Add error handling for 409 conflicts (already completed)
- [ ] Format dates properly (validatedAt timestamps)
- [ ] Style rejected departments with specific reasons and pending items
- [ ] Test with response showing mixed approvals/rejections
- [ ] Test certificate only appears when certificateGenerated === true
- [ ] Test resubmission button appears only for rejected status

---

**Status:** Frontend Integration Guide Complete  
**Last Updated:** April 3, 2026
