const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createComplexPdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Page 1: Title page with text
  let page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  page.drawText('Complex Test Document', { x: 50, y: 700, size: 28, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('PDF to DOCX Conversion Test', { x: 50, y: 650, size: 20, font: font, color: rgb(0, 0, 0) });
  page.drawText('This document contains:', { x: 50, y: 600, size: 14, font: font, color: rgb(0, 0, 0) });
  
  const items = [
    '• Multiple paragraphs of text',
    '• Headings and subheadings',
    '• Bold, italic, and underlined text (simulated)',
    '• Lists and bullet points',
    '• Page breaks',
    '• Multi-page content'
  ];
  
  let y = 570;
  for (const item of items) {
    page.drawText(item, { x: 70, y, size: 12, font, color: rgb(0, 0, 0) });
    y -= 25;
  }
  
  // Page 2: More content with table-like structure
  page = pdfDoc.addPage([600, 800]);
  page.drawText('Page 2: Structured Content', { x: 50, y: 750, size: 20, font: fontBold, color: rgb(0, 0, 0) });
  
  // Simulate a table with text
  const headers = ['Column 1', 'Column 2', 'Column 3'];
  let y2 = 700;
  headers.forEach((h, idx) => page.drawText(h, { x: 50 + idx * 150, y: y2, size: 12, font: fontBold, color: rgb(0, 0, 0) }));
  
  for (let row = 0; row < 5; row++) {
    y2 -= 25;
    page.drawText('Row ' + (row+1) + ' Col 1', { x: 50, y: y2, size: 11, font, color: rgb(0, 0, 0) });
    page.drawText('Data ' + (row+1) + '-2', { x: 200, y: y2, size: 11, font, color: rgb(0, 0, 0) });
    page.drawText('Value ' + (row+1) + '-3', { x: 350, y: y2, size: 11, font, color: rgb(0, 0, 0) });
  }
  
  y2 -= 40;
  page.drawText('Section Heading', { x: 50, y: y2, size: 16, font: fontBold, color: rgb(0, 0, 0) });
  y2 -= 30;
  page.drawText('This is a paragraph of text that should be preserved in the conversion. It contains multiple sentences to test text extraction and paragraph reconstruction.', { x: 50, y: y2, size: 12, font, color: rgb(0, 0, 0) });
  
  y2 -= 40;
  page.drawText('Another Heading', { x: 50, y: y2, size: 14, font: fontBold, color: rgb(0, 0, 0) });
  y2 -= 25;
  page.drawText('• Bullet point one', { x: 70, y: y2, size: 12, font, color: rgb(0, 0, 0) });
  y2 -= 20;
  page.drawText('• Bullet point two', { x: 70, y: y2, size: 12, font, color: rgb(0, 0, 0) });
  y2 -= 20;
  page.drawText('• Bullet point three', { x: 70, y: y2, size: 12, font, color: rgb(0, 0, 0) });
  
  // Page 3: Final page
  page = pdfDoc.addPage([600, 800]);
  page.drawText('Page 3: Final Content', { x: 50, y: 750, size: 20, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('End of test document.', { x: 50, y: 700, size: 14, font, color: rgb(0, 0, 0) });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('../complex_test.pdf', pdfBytes);
  console.log('Complex PDF created');
}
createComplexPdf().catch(console.error);