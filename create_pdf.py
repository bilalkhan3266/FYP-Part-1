#!/usr/bin/env python3
"""
Convert Student Clearance System documentation to PDF
Uses reportlab for professional PDF generation
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from datetime import datetime

# Create PDF
pdf_path = "g:\\Part_3_Library\\STUDENT_CLEARANCE_SYSTEM.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, 
                        leftMargin=0.75*inch, rightMargin=0.75*inch)

# Container for PDF elements
story = []

# Define styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1e3a8a'),
    spaceAfter=6,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#1e40af'),
    spaceAfter=8,
    spaceBefore=8,
    fontName='Helvetica-Bold'
)

subheading_style = ParagraphStyle(
    'CustomSubHeading',
    parent=styles['Heading3'],
    fontSize=11,
    textColor=colors.HexColor('#2563eb'),
    spaceAfter=6,
    spaceBefore=6,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
    leading=14
)

# Title page
story.append(Paragraph("Student Clearance System", title_style))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("Complete Working Documentation", styles['Normal']))
story.append(Spacer(1, 0.3*inch))

# Add metadata
meta_style = ParagraphStyle('Meta', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER)
story.append(Paragraph(f"<i>Generated: {datetime.now().strftime('%B %d, %Y')}</i>", meta_style))
story.append(Spacer(1, 0.4*inch))

# Section 1: Purpose
story.append(Paragraph("1. System Purpose", heading_style))
story.append(Paragraph(
    "The Student Clearance System is an automated platform that validates student eligibility across multiple departments before they can graduate or access certain services. It ensures all administrative, financial, and academic requirements are met through a sequential, automated validation process.",
    body_style
))
story.append(Spacer(1, 0.15*inch))

# Section 2: Key Components
story.append(Paragraph("2. Key Components", heading_style))
story.append(Paragraph("<b>System Architecture:</b>", subheading_style))
story.append(Paragraph(
    "• <b>Backend API:</b> Express.js server handling validation logic and data management<br/>"
    "• <b>Data Models:</b> MongoDB collections for managing students, departments, and clearance records<br/>"
    "• <b>Frontend Interface:</b> React-based dashboard for students to submit requests and view status",
    body_style
))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("<b>Five Validation Departments:</b>", subheading_style))
story.append(Paragraph(
    "1. <b>Coordination</b> – Academic coordination and enrollment verification<br/>"
    "2. <b>Transport</b> – Transportation services clearance<br/>"
    "3. <b>Library</b> – Book returns and library fine clearance<br/>"
    "4. <b>Fee Department</b> – Tuition fees and financial obligations<br/>"
    "5. <b>Student Service</b> – Student services and administrative clearance",
    body_style
))
story.append(Spacer(1, 0.2*inch))

# Section 3: How It Works
story.append(Paragraph("3. How It Works", heading_style))

story.append(Paragraph("<b>Step 1: Student Submission</b>", subheading_style))
story.append(Paragraph(
    "Student accesses the clearance request form, enters their SAP ID (Student Academic Profile ID), and clicks 'Submit Clearance Request'.",
    body_style
))
story.append(Spacer(1, 0.08*inch))

story.append(Paragraph("<b>Step 2: Sequential Validation</b>", subheading_style))
story.append(Paragraph(
    "When a request is submitted, the system automatically validates all 5 departments in order: Coordination → Transport → Library → Fee Department → Student Service. At each step, if no issues are found, the system proceeds to the next; if issues are found, the request STOPS (blocks) at that department.",
    body_style
))
story.append(Spacer(1, 0.08*inch))

story.append(Paragraph("<b>Step 3: Issue Detection & Auto-Approval</b>", subheading_style))
story.append(Paragraph(
    "For each department, the system checks the DepartmentIssue collection. If no unresolved issues exist → Department Approved (Green ✓). If issues found → Department Rejected (Red ✗), and the request blocks at that department. Each department auto-approves by default; departments only reject if unresolved issues exist in their records.",
    body_style
))
story.append(Spacer(1, 0.08*inch))

story.append(Paragraph("<b>Step 4: Student Resolution & Resubmission</b>", subheading_style))
story.append(Paragraph(
    "If a department rejects the request, the student receives detailed feedback listing the unresolved issues. The student must resolve these issues by contacting that department. Once issues are marked as 'Cleared', the student can resubmit the clearance request to continue from the blocked department.",
    body_style
))
story.append(Spacer(1, 0.08*inch))

story.append(Paragraph("<b>Step 5: Certificate Generation</b>", subheading_style))
story.append(Paragraph(
    "If all 5 departments approve the request → Overall status is 'COMPLETED' and a certificate is automatically generated. If any department rejects → Overall status is 'REJECTED', no certificate is generated, and resubmission is allowed.",
    body_style
))

# Page break
story.append(PageBreak())

# Section 4: Response Status Types
story.append(Paragraph("4. Response Status Types", heading_style))

# Create status table
status_data = [
    ['Status', 'Meaning', 'Action Required'],
    ['<b>Completed</b>', 'All departments approved', 'Certificate ready for download'],
    ['<b>Rejected</b>', 'One or more departments have issues', 'Resolve issues and resubmit'],
    ['<b>Blocked</b>', 'Already submitted and completed', 'No action needed'],
    ['<b>Pending</b>', 'Awaiting validation response', 'Wait for system response']
]

status_table = Table(status_data, colWidths=[1.4*inch, 2.2*inch, 1.9*inch])
status_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4ff')])
]))
story.append(status_table)
story.append(Spacer(1, 0.2*inch))

# Section 5: Key Features
story.append(Paragraph("5. Key Features", heading_style))
story.append(Paragraph(
    "✓ <b>Automatic Processing:</b> No manual department intervention required. Issues automatically detected from DepartmentIssue collection with immediate approval for departments with no pending issues.<br/><br/>"
    "✓ <b>Sequential Blocking:</b> If rejected at any department, the process STOPS. Request doesn't proceed to remaining departments, preventing unnecessary validations.<br/><br/>"
    "✓ <b>Comprehensive Validation:</b> All 5 departments checked simultaneously in validation logic with complete departmental status report provided to student.<br/><br/>"
    "✓ <b>Resubmission Control:</b> Can resubmit if status is 'Rejected' (to retry after resolving issues). Cannot resubmit if status is 'Completed' (already cleared).<br/><br/>"
    "✓ <b>Detailed Feedback:</b> Each department provides approval/rejection status, specific reason for rejection, list of pending items blocking clearance, and timestamp of validation.",
    body_style
))
story.append(Spacer(1, 0.15*inch))

# Section 6: Validation Algorithm
story.append(Paragraph("6. Validation Algorithm", heading_style))

story.append(Paragraph("<b>Department Checking Logic:</b>", subheading_style))
story.append(Paragraph(
    "For each of the 5 departments in sequence: (1) Query DepartmentIssue collection with student's sapId; (2) If unresolved issues exist → Status = 'Rejected'; (3) If no issues exist → Status = 'Approved'; (4) Store status with reason and pending items; (5) If rejected, stop further processing.",
    body_style
))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("<b>Certificate Generation Rule:</b>", subheading_style))
story.append(Paragraph(
    "IF all 5 departments = 'Approved' THEN overallStatus = 'Completed' & certificateGenerated = true; ELSE overallStatus = 'Rejected' & certificateGenerated = false",
    body_style
))
story.append(Spacer(1, 0.2*inch))

# Section 7: Student Journey Example
story.append(Paragraph("7. Example Scenario: Blocked at Library", heading_style))
story.append(Paragraph(
    "1. Student submits clearance request<br/>"
    "2. Coordination validates: Approved ✓<br/>"
    "3. Transport validates: Approved ✓<br/>"
    "4. Library validates: Issues found (unreturned books, unpaid fine) ✗<br/>"
    "5. System STOPS here with status 'REJECTED'<br/>"
    "6. Student receives detailed list of unreturned books and fines<br/>"
    "7. Student returns books and pays fines<br/>"
    "8. Student resubmits clearance request<br/>"
    "9. Process continues: All departments pass → Status 'COMPLETED' ✓<br/>"
    "10. Certificate generated and ready for download",
    body_style
))
story.append(Spacer(1, 0.15*inch))

# Section 8: Benefits
story.append(Paragraph("8. System Benefits", heading_style))

benefits_data = [
    ['<b>Benefit</b>', '<b>Description</b>'],
    ['Time Efficient', 'Automated validation eliminates manual review delays'],
    ['Accurate', 'Cross-department validation ensures consistency'],
    ['Transparent', 'Students see exact reasons for rejection/approval'],
    ['Fair', 'Same rules applied uniformly across all students'],
    ['Trackable', 'Complete audit trail of all submissions and validations'],
]

benefits_table = Table(benefits_data, colWidths=[1.8*inch, 3.7*inch])
benefits_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4ff')])
]))
story.append(benefits_table)
story.append(Spacer(1, 0.2*inch))

# Section 9: Technical Stack
story.append(Paragraph("9. Technical Implementation", heading_style))
story.append(Paragraph(
    "<b>Backend:</b> Node.js + Express.js<br/>"
    "<b>Database:</b> MongoDB (NoSQL)<br/>"
    "<b>Frontend:</b> React.js with Tailwind CSS<br/>"
    "<b>Real-time Updates:</b> WebSocket connections<br/>"
    "<b>Authentication:</b> JWT-based student authentication<br/>"
    "<b>Deployment:</b> Containerized with Docker",
    body_style
))
story.append(Spacer(1, 0.2*inch))

# Conclusion
story.append(Paragraph("10. Conclusion", heading_style))
story.append(Paragraph(
    "The Student Clearance System automates the complex process of validating student eligibility across multiple administrative departments. By using sequential validation with automatic approval and rejection blocking, it ensures that students cannot progress until all departmental requirements are met. The system is transparent, fair, and efficient—providing students with clear feedback on their clearance status while eliminating manual administrative bottlenecks. This modern approach significantly reduces processing time while improving accuracy and student satisfaction.",
    body_style
))

# Build PDF
doc.build(story)
print(f"✓ PDF created successfully: {pdf_path}")
