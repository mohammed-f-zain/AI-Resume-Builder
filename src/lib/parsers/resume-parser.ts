import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (mimeType === "application/pdf" || ext === "pdf") {
    // unpdf: serverless-safe PDF.js (no DOMMatrix / canvas — works on Vercel)
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    try {
      const { text } = await extractText(pdf, { mergePages: true });
      const combined = Array.isArray(text) ? text.join("\n") : text;
      return (combined || "").trim();
    } finally {
      await pdf.destroy().catch(() => undefined);
    }
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(
    "Unsupported file format. Please upload a PDF or DOCX file."
  );
}
