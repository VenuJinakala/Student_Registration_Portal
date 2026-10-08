const fs = require('fs');
const path = require('path');

// Minimal valid PDF structure
const createSamplePdf = () => {
  const content = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
>>
endobj
4 0 obj
<<
  /Length 380
>>
stream
BT
/F1 24 Tf
72 700 Td
(GOVERNMENT OF INDIA - SAMPLE AADHAAR CARD) Tj
ET
BT
/F2 14 Tf
72 650 Td
(Cardholder Name: John Doe) Tj
ET
BT
/F2 14 Tf
72 620 Td
(Aadhaar Number: XXXX-XXXX-1234) Tj
ET
BT
/F2 14 Tf
72 590 Td
(DOB: 20/03/1994 | Gender: Male) Tj
ET
BT
/F2 14 Tf
72 560 Td
(Verification Status: Verified Document for Demonstration) Tj
ET
BT
/F2 12 Tf
72 500 Td
(This is a test Aadhaar PDF document generated for the Student Registration System.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000378 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
809
%%EOF`;

  const outputPath = path.join(__dirname, 'uploads', 'sample_aadhaar.pdf');
  fs.writeFileSync(outputPath, content.trim());
  console.log('Sample PDF created at:', outputPath);
};

createSamplePdf();
