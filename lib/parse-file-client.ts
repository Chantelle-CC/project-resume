// ============================================================
// Client-side file parser — replaces /api/parse-file for
// static export (GitHub Pages can't run API routes).
// Uses pdfjs-dist and mammoth directly in the browser.
// ============================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export interface ParseResult {
  text: string
  pageCount?: number
}

/**
 * Parse a PDF or DOCX file in the browser.
 * Returns extracted plain text.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 5 MB。")
  }

  const mime = file.type
  const isDocxByName = file.name.endsWith(".docx")

  if (mime === "application/pdf") {
    return parsePdfClient(file)
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    isDocxByName
  ) {
    return parseDocxClient(file)
  }

  throw new Error("不支持的文件格式，请上传 PDF 或 DOCX 文件。")
}

async function parsePdfClient(file: File): Promise<ParseResult> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

  // Configure worker for browser environment
  const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs")
  ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker

  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)
  const doc = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item: any) => item.str ?? "")
      .filter(Boolean)
      .join(" ")
    pages.push(text)
  }

  return {
    text: pages.join("\n\n").trim(),
    pageCount: doc.numPages,
  }
}

async function parseDocxClient(file: File): Promise<ParseResult> {
  const mammoth = await import("mammoth")
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ buffer: arrayBuffer })
  return {
    text: result.value.trim(),
  }
}
