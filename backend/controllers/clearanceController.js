// backend/controllers/clearanceController.js
const ClearanceRequest = require("../models/ClearanceRequest");
const DepartmentClearance = require("../models/DepartmentClearance");
const { v4: uuidv4 } = require("uuid");

// Submit a new clearance request (Student)
exports.submitRequest = async (req, res) => {
  try {
    const { registration_no, father_name, program, semester, degree_status } = req.body;
    
    // Get user info from JWT token
    const sapid = req.user.sap || req.user.sap_id;
    const studentId = req.user._id || req.user.id;
    const student_name = req.user.full_name || req.user.name;

    console.log(`📝 Submitting clearance request for student: ${sapid}`);

    // Validation
    if (!sapid) {
      return res.status(400).json({
        success: false,
        message: "User SAP ID not found. Please update your profile."
      });
    }

    if (!registration_no || !father_name || !program || !semester || !degree_status) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Generate request ID to link all department clearances
    const requestId = uuidv4();

    // List of all departments
    const departments = [
      "Fee & Dues",
      "Library",
      "Student Services",
      "Laboratory",
      "Coordination Office",
      "Transport",
      "Hostel Mess"
    ];

    // Create clearance records for each department
    const clearanceRecords = [];
    for (const dept of departments) {
      const clearance = new DepartmentClearance({
        studentId: studentId,
        sapid: sapid,
        student_name: student_name,
        registration_no: registration_no.trim(),
        father_name: father_name.trim(),
        program: program.trim(),
        semester: semester.trim(),
        degree_status: degree_status.trim(),
        department: dept,
        status: "Pending",
        remarks: "",
        requestId: requestId
      });

      await clearance.save();
      clearanceRecords.push(clearance);
    }

    console.log(`✅ Clearance request submitted to ${departments.length} departments`);

    res.status(201).json({
      success: true,
      message: `✅ Clearance request submitted to ${departments.length} departments!`,
      data: {
        requestId: requestId,
        studentSap: sapid,
        departmentsCount: departments.length,
        clearances: clearanceRecords
      }
    });
  } catch (err) {
    console.error("❌ Error submitting clearance request:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit clearance request",
      error: err.message
    });
  }
};

// Get requests by status (Department)
exports.getRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const requests = await ClearanceRequest.find({ status }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
};

// Approve a request
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ClearanceRequest.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request approved", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to approve request" });
  }
};

// Reject a request
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ClearanceRequest.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request rejected", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reject request" });
  }
};
