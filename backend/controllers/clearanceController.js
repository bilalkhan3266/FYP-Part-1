// backend/controllers/clearanceController.js
const ClearanceRequest = require("../models/ClearanceRequest");

// Submit a new clearance request (Student)
exports.submitRequest = async (req, res) => {
  try {
    const { student_name, sapid, program, semester } = req.body;
    if (!student_name || !sapid || !program || !semester) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const request = new ClearanceRequest({ student_name, sapid, program, semester });
    await request.save();

    res.json({ success: true, message: "Clearance request submitted", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to submit request" });
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
