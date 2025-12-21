const fs = require('fs');
const { marked } = require('marked');

async function convertToHtml() {
  // Read the markdown file
  const mdFile = fs.readFileSync('./COMPREHENSIVE_PROJECT_DOCUMENTATION.md', 'utf8');

  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  // Convert markdown to HTML
  const htmlContent = await marked(mdFile);

// Create complete HTML document with styling
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riphah Student Clearance Management System - Complete Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin: 30px 0 15px 0;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        h2 {
            color: #34495e;
            font-size: 2em;
            margin: 25px 0 12px 0;
            border-left: 4px solid #667eea;
            padding-left: 12px;
        }

        h3 {
            color: #555;
            font-size: 1.5em;
            margin: 20px 0 10px 0;
        }

        h4 {
            color: #666;
            font-size: 1.2em;
            margin: 15px 0 8px 0;
        }

        p {
            margin: 10px 0;
            text-align: justify;
        }

        ul, ol {
            margin: 15px 0 15px 40px;
        }

        li {
            margin: 8px 0;
        }

        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }

        pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            line-height: 1.4;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        pre code {
            color: #ecf0f1;
            background-color: transparent;
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #ddd;
        }

        th {
            background-color: #667eea;
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
            background-color: #f9f9f9;
        }

        tr:hover {
            background-color: #f0f0f0;
        }

        blockquote {
            border-left: 4px solid #667eea;
            padding-left: 15px;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }

        strong {
            color: #2c3e50;
            font-weight: 600;
        }

        em {
            color: #555;
        }

        a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid #667eea;
        }

        a:hover {
            background-color: #667eea;
            color: white;
            padding: 2px 4px;
        }

        .section {
            margin: 30px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
        }

        .highlight {
            background-color: #fffacd;
            padding: 2px 6px;
            border-radius: 3px;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
            margin: 3px;
        }

        .badge-success {
            background-color: #d4edda;
            color: #155724;
        }

        .badge-info {
            background-color: #d1ecf1;
            color: #0c5460;
        }

        .diagram {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            line-height: 1.5;
            white-space: pre;
            overflow-x: auto;
        }

        .header-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 5px;
            margin-bottom: 30px;
        }

        .header-info h1 {
            color: white;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            margin-top: 0;
        }

        .header-info p {
            margin: 8px 0;
            font-size: 0.95em;
        }

        .toc {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin: 20px 0;
        }

        .toc ul {
            list-style-type: none;
            margin-left: 0;
        }

        .toc li {
            margin: 5px 0;
        }

        .toc li:before {
            content: "▸ ";
            color: #667eea;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }

        @media print {
            body {
                padding: 0;
                background-color: white;
            }

            .container {
                box-shadow: none;
                padding: 0;
            }

            a {
                color: #667eea;
            }

            .page-break {
                page-break-after: always;
            }
        }

        .page-break {
            page-break-after: always;
            margin-bottom: 40px;
        }

        .usecase {
            background-color: #f0f4ff;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 15px 0;
        }

        .workflow {
            background-color: #fff5f0;
            padding: 15px;
            border-left: 4px solid #ff6b6b;
            margin: 15px 0;
        }

        .security {
            background-color: #f0fff4;
            padding: 15px;
            border-left: 4px solid #51cf66;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
</body>
</html>`;

  // Write HTML to file
  fs.writeFileSync('./COMPREHENSIVE_PROJECT_DOCUMENTATION.html', fullHtml);
  console.log('✅ HTML file created: COMPREHENSIVE_PROJECT_DOCUMENTATION.html');
}

convertToHtml().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
