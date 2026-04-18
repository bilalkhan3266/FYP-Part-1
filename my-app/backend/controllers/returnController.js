const DepartmentIssue = require("../models/DepartmentIssue");
const DepartmentReturn = require("../models/DepartmentReturn");

const VALID_DEPARTMENTS = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

const ROLE_TO_DEPT = {
  coordination: "Coordination",
  library: "Library",
  transport: "Transport",
  feedepartment: "Fee Department",
  studentservice: "Student Service",
  admin: null,
};

function resolveDepartment(user, bodyDept) {
  if (user.role === "admin" && bodyDept) return bodyDept;
  return ROLE_TO_DEPT[user.role] || user.department || bodyDept;
}

/**
 * POST /api/department-returns
 * Create a return record — marks the referenced issue as "Cleared"
 */
exports.createReturn = async (req, res) => {
  try {
    const { studentId, departmentName, referenceIssueId, returnDate, status } = req.body;
    const dept = resolveDepartment(req.user, departmentName);

    if (!studentId || !dept || !referenceIssueId) {
      return res.status(400).json({ success: false, message: "studentId, departmentName, and referenceIssueId are required" });
    }

    if (!VALID_DEPARTMENTS.includes(dept)) {
      return res.status(400).json({ success: false, message: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(", ")}` });
    }

    // Verify the issue exists and belongs to the same student/department
    const issue = await DepartmentIssue.findById(referenceIssueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Referenced issue not found" });
    }
    if (issue.studentId !== studentId.toString().trim()) {
      return res.status(400).json({ success: false, message: "Issue does not belong to this student" });
    }
    if (issue.departmentName !== dept) {
      return res.status(400).json({ success: false, message: "Issue department mismatch" });
    }

    // Check if already returned/cleared
    const existingReturn = await DepartmentReturn.findOne({ referenceIssueId });
    if (existingReturn) {
      return res.status(409).json({ success: false, message: "This issue has already been returned/cleared" });
    }

    // Create return record
    const returnRecord = new DepartmentReturn({
      studentId: studentId.toString().trim(),
      departmentName: dept,
      referenceIssueId,
      returnDate: returnDate || new Date(),
      status: status || "Returned",
      processedBy: req.user.id,
      processedByName: req.user.full_name || req.user.email,
    });

    await returnRecord.save();

    // Update the issue status to "Cleared"
    issue.status = "Cleared";
    await issue.save();

    res.status(201).json({
      success: true,
      message: `Return processed for student ${studentId} in ${dept}. Issue marked as Cleared.`,
      data: returnRecord,
    });
  } catch (err) {
    console.error("❌ Create Return Error:", err);
    res.status(500).json({ success: false, message: "Failed to process return: " + err.message });
  }
};

/**
 * GET /api/department-returns
 * Get return records — filtered by department (from role) and optionally by studentId
 */
exports.getReturns = async (req, res) => {
  try {
    const { studentId } = req.query;
    const dept = resolveDepartment(req.user, req.query.departmentName);

    const filter = {};
    if (dept && req.user.role !== "admin") filter.departmentName = dept;
    if (req.query.departmentName && req.user.role === "admin") filter.departmentName = req.query.departmentName;
    if (studentId) filter.studentId = studentId.toString().trim();

    const returns = await DepartmentReturn.find(filter)
      .populate("referenceIssueId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns, count: returns.length });
  } catch (err) {
    console.error("❌ Get Returns Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch returns: " + err.message });
  }
};

/**
 * GET /api/department-returns/:id
 */
exports.getReturnById = async (req, res) => {
  try {
    const record = await DepartmentReturn.findById(req.params.id).populate("referenceIssueId");
    if (!record) return res.status(404).json({ success: false, message: "Return record not found" });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch return: " + err.message });
  }
};
