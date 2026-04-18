const express = require("express");
const router = express.Router();
const {
  createReturn,
  getReturns,
  getReturnById,
} = require("../controllers/returnController");
const { verifyToken } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(verifyToken);

// POST — process return (department staff / admin)
router.post("/", createReturn);

// GET — list returns
router.get("/", getReturns);

// GET — single return
router.get("/:id", getReturnById);

module.exports = router;
