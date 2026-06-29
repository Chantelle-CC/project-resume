import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "请上传文件。" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件大小不能超过 5 MB。" }, { status: 400 })
    }

    const mime = file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    if (mime === "application/pdf") {
      return await parsePdf(buffer)
    }

    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      return await parseDocx(buffer)
    }

    return NextResponse.json(
      { error: "不支持的文件格式，请上传 PDF 或 DOCX 文件。" },
      { status: 400 },
    )
  } catch (err) {
    console.error("[parse-file] unexpected error:", err)
    return NextResponse.json({ error: "文件解析失败，请重试。" }, { status: 500 })
  }
}

async function parsePdf(buffer: Buffer) {
  // Dynamic import to avoid bundling pdfjs-dist on every request initially
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")

  const data = new Uint8Array(buffer)
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

  return NextResponse.json({
    text: pages.join("\n\n").trim(),
    pageCount: doc.numPages,
  })
}

async function parseDocx(buffer: Buffer) {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return NextResponse.json({
    text: result.value.trim(),
    warnings: result.messages,
  })
}
