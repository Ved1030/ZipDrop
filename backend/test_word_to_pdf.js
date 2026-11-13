const fs = require('fs');
const path = require('path');
const { WordToPdfConverter } = require('./converters/word-to-pdf');

async function testConversion() {
  const converter = new WordToPdfConverter();
  
  // Read test DOCX file
  const testDocxPath = path.join(__dirname, 'temp', 'test.docx');
  const inputBuffer = fs.readFileSync(testDocxPath);
  
  console.log(`Input file size: ${inputBuffer.length} bytes`);
  
  try {
    console.log('Starting conversion...');
    const startTime = Date.now();
    const outputBuffer = await converter.convert({
      inputBuffer,
      inputFormat: 'docx',
      outputFormat: 'pdf'
    });
    const elapsed = Date.now() - startTime;
    
    console.log(`Conversion completed in ${elapsed}ms`);
    console.log(`Output file size: ${outputBuffer.length} bytes`);
    
    // Write output for verification
    const outputPath = path.join(__dirname, 'temp', 'test-output.pdf');
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`Output written to: ${outputPath}`);
    
    console.log('TEST PASSED: Conversion successful!');
  } catch (err) {
    console.error('TEST FAILED:', err.message);
    if (err.details) {
      console.error('Details:', JSON.stringify(err.details, null, 2));
    }
    process.exit(1);
  }
}

testConversion();