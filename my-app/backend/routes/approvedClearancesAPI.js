/**
 * UNIFIED CLEARANCE APPROVED RECORDS API
 * 
 * GET /api/approved-clearances/:departmentName
 * GET /api/approved-clearances/:departmentName/search
 * 
 * Returns all fully approved clearances visible to a department
 * Data source: ComprehensiveClearanceValidation (overallStatus === "Completed")
 * 
 * Departments: Library, Coordination, Transport, Finance, Student Services
 */

module.exports = function setupApprovedClearancesAPI(app, verifyToken) {
  const ComprehensiveClearanceValidation = require("../models/ComprehensiveClearanceValidation");
  const User = require("../models/User");
  const DepartmentClearance = require("../models/DepartmentClearance");

  // Map roles to department names
  const roleToDepartmentMap = {
    'library': 'Library',
    'coordination': 'Coordination',
    'transport': 'Transport',
    'feedepartment': 'Finance',
    'studentservice': 'Student Services'
  };

  const validDepartments = ['Library', 'Coordination', 'Transport', 'Finance', 'Student Services'];

  /**
   * GET /api/approved-clearances/:departmentName
   * Get all approved clearances for a department
   * 
   * Query params:
   * - search: Search by SAP ID or student name
   * - limit: Number of records (default: 20)
   * - page: Page number (default: 1)
   * - sortBy: 'date' or 'name' (default: date)
   * - sortOrder: 'asc' or 'desc' (default: desc)
   */
  app.get('/api/approved-clearances/:departmentName', verifyToken, async (req, res) => {
    try {
      const { departmentName } = req.params;
      const { search, limit = 20, page = 1, sortBy = 'date', sortOrder = 'desc' } = req.query;
      const userRole = (req.user.role || '').toLowerCase();
      const userDepartment = roleToDepartmentMap[userRole];

      console.log('\n📋 APPROVED CLEARANCES REQUEST');
      console.log(`   Department: ${departmentName}`);
      console.log(`   User Role: ${userRole}`);
      console.log(`   User Department: ${userDepartment}`);
      console.log(`   Search: ${search || 'none'}`);

      // Validate department
      if (!validDepartments.includes(departmentName)) {
        return res.status(400).json({
          success: false,
          message: `Invalid department. Valid departments: ${validDepartments.join(', ')}`
        });
      }

      // Security: Only department staff can view their own department
      // But all departments can see completed clearances
      if (userDepartment && userDepartment !== departmentName) {
        // Check if user can view other departments (optional admin check)
        if (req.user.role !== 'admin' && req.user.role !== 'hod') {
          return res.status(403).json({
            success: false,
            message: `Access denied. You can only view ${userDepartment} approvals.`
          });
        }
      }

      // Build query for completed clearances
      const query = {
        overallStatus: 'Completed',
        certificateGenerated: true
      };

      // Add search filter if provided
      if (search) {
        query.$or = [
          { sapid: { $regex: search, $options: 'i' } },
          { student_name: { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count
      const totalCount = await ComprehensiveClearanceValidation.countDocuments(query);

      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build sort
      const sortObj = {};
      if (sortBy === 'name') {
        sortObj.student_name = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortObj.completedAt = sortOrder === 'asc' ? 1 : -1;
      }

      // Fetch completed clearances
      const completedClearances = await ComprehensiveClearanceValidation.find(query)
        .populate('student_id', 'full_name email sap department')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);

      // Format response
      const formattedRecords = completedClearances.map(record => ({
        _id: record._id,
        studentId: record.student_id?._id,
        studentName: record.student_name,
        sapId: record.sapid,
        email: record.student_id?.email,
        studentDepartment: record.student_id?.department,
        registrationNo: record.registration_no,
        fatherName: record.father_name,
        program: record.program,
        semester: record.semester,
        degreeStatus: record.degree_status,
        departmentName: departmentName,
        clearanceStatus: 'Approved',
        dateApproved: record.completedAt || record.certificate_generated_at,
        certificateId: record.qr_code,
        qrCode: record.qr_code,
        approvedDepartments: record.departmentStatuses
          .filter(d => d.status === 'Approved')
          .map(d => d.name),
        certificateGenerated: record.certificateGenerated,
        // Add department-specific status if available
        departmentStatus: record.departmentStatuses.find(d => d.name === departmentName)?.status || 'Approved',
        // Add the full record for detailed view
        fullRecord: {
          overallStatus: record.overallStatus,
          departmentStatuses: record.departmentStatuses,
          submittedAt: record.submittedAt,
          completedAt: record.completedAt
        }
      }));

      console.log(`✅ Found ${formattedRecords.length} approved clearances for ${departmentName}`);

      res.status(200).json({
        success: true,
        data: formattedRecords,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum),
          hasMore: pageNum < Math.ceil(totalCount / limitNum)
        },
        filters: {
          departmentName: departmentName,
          search: search || null
        }
      });

    } catch (error) {
      console.error('❌ Error fetching approved clearances:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approved clearances: ' + error.message
      });
    }
  });

  /**
   * GET /api/approved-clearances/:departmentName/stats
   * Get statistics for approved clearances
   */
  app.get('/api/approved-clearances/:departmentName/stats', verifyToken, async (req, res) => {
    try {
      const { departmentName } = req.params;

      if (!validDepartments.includes(departmentName)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department'
        });
      }

      // Get completed clearances
      const completedClearances = await ComprehensiveClearanceValidation.find({
        overallStatus: 'Completed',
        certificateGenerated: true
      });

      // Get this month's completions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthCompletions = await ComprehensiveClearanceValidation.countDocuments({
        overallStatus: 'Completed',
        certificateGenerated: true,
        completedAt: { $gte: startOfMonth }
      });

      // Get today's completions
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const todayCompletions = await ComprehensiveClearanceValidation.countDocuments({
        overallStatus: 'Completed',
        certificateGenerated: true,
        completedAt: { $gte: startOfDay }
      });

      console.log(`📊 ${departmentName} - Approved Clearances Stats`);
      console.log(`   Total: ${completedClearances.length}`);
      console.log(`   This Month: ${thisMonthCompletions}`);
      console.log(`   Today: ${todayCompletions}`);

      res.status(200).json({
        success: true,
        stats: {
          departmentName: departmentName,
          totalApproved: completedClearances.length,
          thisMonth: thisMonthCompletions,
          today: todayCompletions,
          averagePerDay: Math.round(completedClearances.length / ((now - startOfMonth) / (1000 * 60 * 60 * 24)))
        }
      });

    } catch (error) {
      console.error('❌ Error fetching stats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats'
      });
    }
  });

  /**
   * GET /api/approved-clearances/:departmentName/export
   * Export approved clearances as CSV or JSON
   */
  app.get('/api/approved-clearances/:departmentName/export', verifyToken, async (req, res) => {
    try {
      const { departmentName } = req.params;
      const { format = 'json' } = req.query;

      if (!validDepartments.includes(departmentName)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department'
        });
      }

      // Fetch all completed clearances
      const completedClearances = await ComprehensiveClearanceValidation.find({
        overallStatus: 'Completed',
        certificateGenerated: true
      })
        .populate('student_id', 'full_name email sap department')
        .sort({ completedAt: -1 });

      const formattedData = completedClearances.map(record => ({
        studentName: record.student_name,
        sapId: record.sapid,
        email: record.student_id?.email || 'N/A',
        department: record.student_id?.department || 'N/A',
        program: record.program || 'N/A',
        semester: record.semester || 'N/A',
        registrationNo: record.registration_no || 'N/A',
        fatherName: record.father_name || 'N/A',
        approvedDate: record.completedAt ? new Date(record.completedAt).toLocaleDateString() : 'N/A',
        certificateId: record.qr_code || 'N/A'
      }));

      if (format === 'csv') {
        // Convert to CSV
        const csv = [
          ['Student Name', 'SAP ID', 'Email', 'Department', 'Program', 'Semester', 'Registration No', 'Father Name', 'Approved Date', 'Certificate ID'],
          ...formattedData.map(d => [
            d.studentName,
            d.sapId,
            d.email,
            d.department,
            d.program,
            d.semester,
            d.registrationNo,
            d.fatherName,
            d.approvedDate,
            d.certificateId
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="approved-clearances-${departmentName}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          departmentName: departmentName,
          totalRecords: formattedData.length,
          exportDate: new Date().toISOString(),
          data: formattedData
        });
      }

    } catch (error) {
      console.error('❌ Error exporting data:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  });

};
