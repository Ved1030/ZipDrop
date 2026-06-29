declare module "html-docx-js" {
  function asBlob(
    html: string,
    options?: { orientation?: string; margins?: Record<string, number> }
  ): Blob;
  export { asBlob };
}
