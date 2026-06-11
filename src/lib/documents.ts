import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return buffer.toString("utf-8");
  }

  if (mimeType === "text/csv") {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/json") {
    try {
      const json = JSON.parse(buffer.toString("utf-8"));
      return JSON.stringify(json, null, 2);
    } catch {
      return buffer.toString("utf-8");
    }
  }

  if (mimeType === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      return `[Could not extract text from PDF: ${filename}]`;
    }
  }

  // Try reading as text for unknown types
  const text = buffer.toString("utf-8");
  if (text && !/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 1000))) {
    return text;
  }

  return `[Binary file: ${filename} (${mimeType})]`;
}

export function buildDocumentContext(
  documents: { filename: string; content: string }[]
): string {
  if (documents.length === 0) return "";

  const parts = documents.map(
    (doc) => `--- Document: ${doc.filename} ---\n${doc.content}\n--- End ---`
  );

  return `\n\nThe user has attached the following documents for reference:\n\n${parts.join("\n\n")}\n\nPlease use the content of these documents to inform your responses.\n`;
}

export const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "text/html",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
