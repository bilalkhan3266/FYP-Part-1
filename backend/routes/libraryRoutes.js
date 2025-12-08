// backend/routes/libraryRoutes.js
const express = require("express");
const router = express.Router();
const ClearanceRequest = require("../models/ClearanceRequest"); // Mongoose model

// ================================
// GET REQUESTS BY STATUS
// ================================
router.get("/requests/:status", async (req, res) => {
  try {
    const status = req.params.status.toLowerCase();

    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status type" });
    }

    const requests = await ClearanceRequest.find({ status });
    res.json({ requests });
  } catch (err) {
    console.error("❌ DB Fetch Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ================================
// APPROVE REQUEST
// ================================
router.post("/requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ClearanceRequest.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request approved successfully", request: updated });
  } catch (err) {
    console.error("❌ Approve Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ================================
// REJECT REQUEST
// ================================
router.post("/requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ClearanceRequest.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request rejected successfully", request: updated });
  } catch (err) {
    console.error("❌ Reject Error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
