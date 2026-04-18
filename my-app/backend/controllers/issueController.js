const DepartmentIssue = require("../models/DepartmentIssue");

// Valid departments list
const VALID_DEPARTMENTS = ["Coordination", "Library", "Transport", "Fee Department", "Student Service"];

// Map user roles to department names
const ROLE_TO_DEPT = {
  coordination: "Coordination",
  library: "Library",
  transport: "Transport",
  feedepartment: "Fee Department",
  studentservice: "Student Service",
  admin: null, // admin can act on any department
};

// Resolve the department name from the user's role/department field
function resolveDepartment(user, bodyDept) {
  if (user.role === "admin" && bodyDept) return bodyDept;
  return ROLE_TO_DEPT[user.role] || user.department || bodyDept;
}

/**
 * POST /api/department-issues
 * Create a new issue record (department staff only)
 */
exports.createIssue = async (req, res) => {
  try {
    const { studentId, departmentName, itemType, description, issueDate, status } = req.body;
    const dept = resolveDepartment(req.user, departmentName);

    if (!studentId || !dept || !itemType || !description) {
      return res.status(400).json({ success: false, message: "studentId, departmentName, itemType, and description are required" });
    }

    if (!VALID_DEPARTMENTS.includes(dept)) {
      return res.status(400).json({ success: false, message: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(", ")}` });
    }

    const issue = new DepartmentIssue({
      studentId: studentId.toString().trim(),
      departmentName: dept,
      itemType: itemType.trim(),
      description: description.trim(),
      issueDate: issueDate || new Date(),
      status: status || "Issued",
      issuedBy: req.user.id,
      issuedByName: req.user.full_name || req.user.email,
    });

    await issue.save();

    res.status(201).json({
      success: true,
      message: `Issue record created for student ${studentId} in ${dept}`,
      data: issue,
    });
  } catch (err) {
    console.error("❌ Create Issue Error:", err);
    res.status(500).json({ success: false, message: "Failed to create issue record: " + err.message });
  }
};

/**
 * GET /api/department-issues
 * Get issues — filtered by department (from role) and optionally by studentId
 */
exports.getIssues = async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const dept = resolveDepartment(req.user, req.query.departmentName);

    const filter = {};
    if (dept && req.user.role !== "admin") filter.departmentName = dept;
    if (req.query.departmentName && req.user.role === "admin") filter.departmentName = req.query.departmentName;
    if (studentId) filter.studentId = studentId.toString().trim();
    if (status) filter.status = status;

    const issues = await DepartmentIssue.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: issues, count: issues.length });
  } catch (err) {
    console.error("❌ Get Issues Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch issues: " + err.message });
  }
};

/**
 * GET /api/department-issues/:id
 * Get a single issue by ID
 */
exports.getIssueById = async (req, res) => {
  try {
    const issue = await DepartmentIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch issue: " + err.message });
  }
};

/**
 * PUT /api/department-issues/:id
 * Update an issue record
 */
exports.updateIssue = async (req, res) => {
  try {
    const { itemType, description, status } = req.body;
    const update = {};
    if (itemType) update.itemType = itemType.trim();
    if (description) update.description = description.trim();
    if (status) update.status = status;

    const issue = await DepartmentIssue.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    res.json({ success: true, message: "Issue updated", data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update issue: " + err.message });
  }
};

/**
 * DELETE /api/department-issues/:id
 * Delete an issue record
 */
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await DepartmentIssue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    res.json({ success: true, message: "Issue deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete issue: " + err.message });
  }
};
