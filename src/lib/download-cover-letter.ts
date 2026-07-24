import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "Cover-Letter";
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Download cover letter as PDF via print → Save as PDF (supports EN + AR). */
export function downloadCoverLetterPdf(
  text: string,
  options: { position?: string; dir?: "ltr" | "rtl" } = {}
) {
  if (typeof window === "undefined") return;

  const title = `Bahath Jobz - Cover Letter${
    options.position?.trim() ? ` - ${options.position.trim()}` : ""
  }`;
  const dir = options.dir || "ltr";
  const body = escapeHtml(text).replace(/\n/g, "<br/>");

  const w = window.open("", "_blank");
  if (!w) {
    // Popup blocked — fall back to same-tab print of a temporary element
    const prevTitle = document.title;
    document.title = title;
    const el = document.createElement("div");
    el.setAttribute("dir", dir);
    el.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:white;padding:48px;overflow:auto;font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.6;white-space:pre-wrap;";
    el.textContent = text;
    document.body.appendChild(el);
    const cleanup = () => {
      el.remove();
      document.title = prevTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 2000);
    return;
  }

  w.document.open();
  w.document.write(`<!DOCTYPE html>
<html lang="${dir === "rtl" ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.65;
      color: #141f2e;
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
    }
  </style>
</head>
<body>${body}</body>
</html>`);
  w.document.close();
  w.focus();
  // Wait for layout then print
  w.setTimeout(() => {
    w.print();
    // Close after print on most browsers
    w.setTimeout(() => w.close(), 500);
  }, 250);
}

/** Download cover letter as a real .docx Word file. */
export async function downloadCoverLetterWord(
  text: string,
  options: { position?: string } = {}
) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const children = lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: line.length ? line : " ",
            font: "Calibri",
            size: 22, // 11pt
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children:
          children.length > 0
            ? children
            : [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: " ", font: "Calibri", size: 22 })],
                }),
              ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const base = sanitizeFilename(
    options.position?.trim()
      ? `Cover-Letter-${options.position.trim()}`
      : "Cover-Letter"
  );
  triggerBlobDownload(blob, `${base}.docx`);
}
