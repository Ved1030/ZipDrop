export async function run(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
  console.log("A ops 91?", pdfjs.OPS.constructPath);
  const pdf = await pdfjs.getDocument({ data, useWorkerFetch: false, useSystemFonts: true }).promise;
  const page = await pdf.getPage(2);
  const ol = await page.getOperatorList();
  console.log("B count", ol.fnArray.filter((f) => f === 91).length);
  const pdf2 = await import("pdfjs-dist/legacy/build/pdf.mjs");
  console.log("C same module?", pdf2.OPS === pdfjs.OPS, pdf2.OPS.constructPath);
  const ol2 = await page.getOperatorList();
  console.log("D count", ol2.fnArray.filter((f) => f === pdf2.OPS.constructPath).length);
}
