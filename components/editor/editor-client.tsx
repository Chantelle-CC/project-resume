"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, FileText, Loader2, Check, X, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { loadResult, type OptimizeResult, type ResumeData } from "@/lib/resume"
import { ResumePreview } from "./resume-preview"
import { EditorPanel } from "./editor-panel"

const ACCENTS = [
  { name: "深蓝", value: "#2f4f8f" },
  { name: "墨黑", value: "#1f2430" },
  { name: "青绿", value: "#0f766e" },
  { name: "酒红", value: "#9f1239" },
]

export function EditorClient() {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)

  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [data, setData] = useState<ResumeData | null>(null)
  const [accent, setAccent] = useState(ACCENTS[0].value)
  const [tab, setTab] = useState<"edit" | "insight">("edit")
  const [exporting, setExporting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const r = loadResult()
    if (!r) {
      setReady(true)
      return
    }
    setResult(r)
    setData(r.resume)
    setReady(true)
  }, [])

  async function handleExport() {
    if (!sheetRef.current || !data) return
    setExporting(true)
    try {
      const html2pdf = (await import("html2pdf.js")).default
      await html2pdf()
        .set({
          margin: 0,
          filename: `${data.name || "resume"}-简历.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        } as any)
        .from(sheetRef.current)
        .save()
    } catch (e) {
      console.log("[v0] export error:", e)
    } finally {
      setExporting(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!data || !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">还没有优化结果</h1>
          <p className="mt-1 text-sm text-muted-foreground">请先在首页输入 JD 与简历生成优化内容。</p>
        </div>
        <Button onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            简历编辑器
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                title={a.name}
                onClick={() => setAccent(a.value)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                  accent === a.value ? "border-foreground" : "border-transparent",
                )}
                style={{ backgroundColor: a.value }}
              />
            ))}
          </div>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出 PDF
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 lg:grid-cols-[440px_1fr]">
        {/* Left: editor + insights */}
        <aside className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex border-b border-border">
            {([
              ["edit", "编辑内容"],
              ["insight", "匹配分析"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  tab === key ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5">
            {tab === "edit" ? (
              <EditorPanel data={data} onChange={setData} />
            ) : (
              <MatchInsights result={result} />
            )}
          </div>
        </aside>

        {/* Right: live preview */}
        <div className="overflow-auto bg-muted/40 p-6">
          <div className="origin-top scale-[0.62] sm:scale-75 lg:scale-90 xl:scale-100">
            <ResumePreview ref={sheetRef} data={data} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchInsights({ result }: { result: OptimizeResult }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">优化后岗位匹配度</p>
        <p className="mt-1 text-4xl font-bold text-primary">{result.matchScore}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${result.matchScore}%` }} />
        </div>
      </div>

      {result.matchedKeywords.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Check className="h-4 w-4 text-primary" />
            已覆盖关键词
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedKeywords.map((k) => (
              <Badge key={k} variant="secondary" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.missingKeywords.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <X className="h-4 w-4 text-destructive" />
            仍缺失关键词
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <Badge key={k} variant="outline" className="border-destructive/30 font-normal text-destructive">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" />
            优化建议
          </h3>
          <ul className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-primary">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
