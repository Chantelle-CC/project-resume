import { NextRequest, NextResponse } from "next/server"
import { buildPrompt, normalize, DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jd, resume, lang, baseUrl, model } = body as {
      jd?: string
      resume?: string
      lang?: string
      baseUrl?: string
      model?: string
    }

    // Validate required fields
    if (!jd || typeof jd !== "string" || !jd.trim()) {
      return NextResponse.json({ error: "请提供岗位描述 (JD)。" }, { status: 400 })
    }
    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json({ error: "请提供个人简历内容。" }, { status: 400 })
    }
    if (lang !== "zh" && lang !== "en") {
      return NextResponse.json({ error: "语言参数无效，仅支持 zh 或 en。" }, { status: 400 })
    }

    const apiKey = process.env.AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "服务端未配置 AI_API_KEY。" }, { status: 500 })
    }

    const targetUrl = (baseUrl || process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
    const targetModel = model || process.env.AI_MODEL || DEFAULT_MODEL

    const prompt = buildPrompt(jd.trim(), resume.trim(), lang as "zh" | "en")

    const res = await fetch(`${targetUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You output only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      const snippet = text.slice(0, 300) || res.statusText
      console.error("[optimize] AI upstream error:", res.status, snippet)
      return NextResponse.json(
        { error: `AI 服务请求失败 (${res.status}): ${snippet}` },
        { status: 502 },
      )
    }

    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ""
    if (!content) {
      return NextResponse.json({ error: "模型未返回内容，请检查模型配置或账户额度。" }, { status: 502 })
    }

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: "无法解析模型返回的 JSON 内容。" }, { status: 502 })
      }
      parsed = JSON.parse(match[0])
    }

    const result = normalize(parsed)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[optimize] unexpected error:", err)
    return NextResponse.json({ error: "服务器内部错误，请稍后重试。" }, { status: 500 })
  }
}
