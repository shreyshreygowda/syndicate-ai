declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }

  function pdfParse(data: Buffer): Promise<PDFData>;
  export default pdfParse;
}
