const fs = require('fs');
const pdf = require('html-pdf');

// Read the HTML file
const htmlFile = fs.readFileSync('./PROJECT_DOCUMENTATION.html', 'utf8');

// PDF options
const options = {
  format: 'A4',
  orientation: 'portrait',
  border: {
    top: '2cm',
    right: '1.5cm',
    bottom: '2cm',
    left: '1.5cm'
  },
  header: {
    height: '1cm',
    contents: '<div style="text-align: center; font-size: 10px; color: #666;">Riphah Student Clearance Management System</div>'
  },
  footer: {
    height: '1cm',
    contents: {
      default: '<div style="text-align: center; font-size: 10px; color: #666; width: 100%;">Page <span class="page"></span> of <span class="pages"></span></div>'
    }
  },
  base: 'file://' + __dirname + '/'
};

// Convert HTML to PDF
pdf.create(htmlFile, options).toFile('./PROJECT_DOCUMENTATION.pdf', function(err, res) {
  if (err) {
    console.error('❌ Error creating PDF:', err);
    process.exit(1);
  }
  
  console.log('✅ PDF created successfully!');
  console.log('📄 File: PROJECT_DOCUMENTATION.pdf');
  console.log('📊 Size: ' + (res.filename ? 'Generated' : 'Unknown'));
  console.log('✨ Your project documentation is ready!');
});
