const express = require("express");
const router = express.Router();
const {
  submitAutoClearance,
  getStudentClearance,
  recheckClearance,
  previewClearance,
  emailCertificate,
} = require("../controllers/autoClearanceController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

// POST — submit clearance request (auto-check runs)
router.post("/", submitAutoClearance);

// GET — student views their clearance result
router.get("/student", getStudentClearance);

// POST — re-run check on rejected workflow
router.post("/recheck", recheckClearance);

// GET — dry-run preview of clearance status
router.get("/preview", previewClearance);

// POST — resend certificate email
router.post("/email-certificate", emailCertificate);

module.exports = router;
