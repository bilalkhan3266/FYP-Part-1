const fs = require('fs');
const path = require('path');

// Simple HTML template for PDF conversion
const markdownContent = fs.readFileSync('./PROJECT_DOCUMENTATION.md', 'utf8');

// Basic markdown to HTML conversion
let htmlContent = markdownContent
  .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
  .replace(/^##### (.*?)$/gm, '<h5>$1</h5>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`(.*?)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/^- (.*?)$/gm, '<li>$1</li>')
  .replace(/^✅ (.*?)$/gm, '<li style="color: green;">✅ $1</li>')
  .replace(/^✓ (.*?)$/gm, '<li style="color: green;">✓ $1</li>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^```[\s\S]*?^```/gm, (match) => {
    return '<pre><code>' + match.replace(/^```/gm, '').trim() + '</code></pre>';
  })
  .replace(/^---/gm, '<hr>');

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riphah Student Clearance Management System - Project Documentation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    h1 {
      color: #003366;
      border-bottom: 3px solid #003366;
      padding-bottom: 10px;
      margin-top: 30px;
      font-size: 2em;
    }
    h2 {
      color: #00509e;
      margin-top: 25px;
      font-size: 1.6em;
      border-left: 4px solid #00509e;
      padding-left: 15px;
    }
    h3 {
      color: #0066cc;
      margin-top: 20px;
      font-size: 1.3em;
    }
    h4, h5 {
      color: #333;
      margin-top: 15px;
    }
    p {
      margin: 10px 0;
      text-align: justify;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #d63384;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #003366;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #003366;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f0f0;
    }
    li {
      margin: 8px 0;
      margin-left: 20px;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 2px solid #ddd;
      margin: 30px 0;
    }
    .title {
      text-align: center;
      color: #003366;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 20px;
      font-size: 0.9em;
    }
    .toc {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    strong {
      color: #003366;
      font-weight: 600;
    }
    em {
      color: #666;
      font-style: italic;
    }
    @page {
      size: A4;
      margin: 2cm;
    }
    @media print {
      body {
        padding: 0;
      }
      h1 {
        page-break-before: always;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="title">
    <h1>Riphah Student Clearance Management System</h1>
  </div>
  <div class="subtitle">
    <p><strong>Project Documentation</strong></p>
    <p>Version 1.0 | December 2025</p>
  </div>
  ${htmlContent}
  <hr>
  <p style="text-align: center; font-size: 0.9em; color: #666; margin-top: 40px;">
    <em>This document is confidential and intended for authorized users only.</em>
  </p>
</body>
</html>
`;

fs.writeFileSync('./PROJECT_DOCUMENTATION.html', html);
console.log('✅ HTML file created: PROJECT_DOCUMENTATION.html');
console.log('📋 Now converting to PDF...');

// Try to use print-to-file approach
console.log('✅ HTML document ready for PDF conversion');
console.log('📄 Open PROJECT_DOCUMENTATION.html in a browser and use Ctrl+P to print as PDF');
