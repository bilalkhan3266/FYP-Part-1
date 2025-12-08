// backend/routes/clearanceRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitRequest,
  getRequestsByStatus,
  approveRequest,
  rejectRequest
} = require("../controllers/clearanceController");

// Middleware to simulate authentication (replace with JWT middleware if needed)
const verifyToken = (req, res, next) => {
  // Example: req.user = { role: "Department" };
  next();
};

// Submit a clearance request (student)
router.post("/submit", submitRequest);

// Get requests by status
router.get("/requests/:status", verifyToken, getRequestsByStatus);

// Approve a request
router.post("/requests/:id/approve", verifyToken, approveRequest);

// Reject a request
router.post("/requests/:id/reject", verifyToken, rejectRequest);

module.exports = router;
