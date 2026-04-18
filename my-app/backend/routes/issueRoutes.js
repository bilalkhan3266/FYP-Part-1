const express = require("express");
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { verifyToken } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(verifyToken);

// POST — create issue (department staff / admin)
router.post("/", createIssue);

// GET — list issues (filtered by role's department)
router.get("/", getIssues);

// GET — single issue
router.get("/:id", getIssueById);

// PUT — update issue
router.put("/:id", updateIssue);

// DELETE — remove issue
router.delete("/:id", deleteIssue);

module.exports = router;
