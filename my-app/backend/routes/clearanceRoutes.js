// backend/routes/clearanceRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitRequest,
  getRequestsByStatus,
  approveRequest,
  rejectRequest
} = require("../controllers/clearanceController");
const verifyToken = require("../verifyToken");

// Submit a clearance request (student)
router.post("/submit-request", verifyToken, submitRequest);

// Get requests by status
router.get("/requests/:status", verifyToken, getRequestsByStatus);

// Approve a request
router.post("/requests/:id/approve", verifyToken, approveRequest);

// Reject a request
router.post("/requests/:id/reject", verifyToken, rejectRequest);

module.exports = router;
