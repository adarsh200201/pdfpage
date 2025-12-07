const fs = require('fs');
const path = require('path');
const PDFProtectionService = require('./services/pdfProtectionService');

async function testPdfProtection() {
    const inputPath = path.join(__dirname, 'sample.pdf'); // Path to your sample PDF
    const outputPath = path.join(__dirname, 'protected_sample.pdf'); // Output path for the protected PDF
    const password = 'testpassword'; // Example password
    const permissions = { printing: true, editing: false }; // Example permissions

    // Read the sample PDF file
    const inputBuffer = await fs.promises.readFile(inputPath);

    // Protect the PDF
    const result = await PDFProtectionService.protectPDF(inputBuffer, password, permissions);

    // Write the protected PDF to a file
    await fs.promises.writeFile(outputPath, result.buffer);
    console.log('Protected PDF created successfully at:', outputPath);
}

testPdfProtection().catch(console.error);
