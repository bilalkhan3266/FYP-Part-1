const pdf = require('html-pdf');
const fs = require('fs');

const htmlFile = fs.readFileSync('./COMPREHENSIVE_PROJECT_DOCUMENTATION.html', 'utf8');

const options = {
    format: 'A4',
    orientation: 'portrait',
    border: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
    },
    footer: {
        height: '15mm',
        contents: {
            default: '<div style="text-align: center; color: #999; font-size: 10px;">Page <span style="font-weight: bold">{{page}}</span> of <span style="font-weight: bold">{{pages}}</span> | Riphah Student Clearance Management System</div>'
        }
    },
    header: {
        height: '10mm',
        contents: '<div style="text-align: right; color: #999; font-size: 9px; padding: 5px 15px;">COMPREHENSIVE PROJECT DOCUMENTATION</div>'
    },
    paginationOffset: 0,
    margin: '20px'
};

pdf.create(htmlFile, options).toFile('./COMPREHENSIVE_PROJECT_DOCUMENTATION.pdf', function(err, res) {
    if (err) {
        console.error('❌ Error creating PDF:', err);
        process.exit(1);
    }
    console.log('✅ PDF created successfully!');
    console.log('📄 File: COMPREHENSIVE_PROJECT_DOCUMENTATION.pdf');
    console.log('📊 Size: ' + (res.filename.length / 1024).toFixed(2) + ' KB');
});
