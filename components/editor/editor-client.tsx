"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, FileText, Loader2, Check, X, Lightbulb, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { loadResult, type OptimizeResult, type ResumeData } from "@/lib/resume"
import { computeMatchScore, type MatchResult } from "@/lib/matching"
import { ResumePreview } from "./resume-preview"
import { EditorPanel } from "./editor-panel"

const ACCENTS = [
  { name: "墨黑", value: "#18181b" },
  { name: "石灰", value: "#52525b" },
  { name: "深蓝", value: "#1e3a5f" },
  { name: "棕褐", value: "#5c4a3a" },
]

export function EditorClient() {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)

  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [data, setData] = useState<ResumeData | null>(null)
  const [accent, setAccent] = useState(ACCENTS[0].value)
  const [tab, setTab] = useState<"edit" | "insight">("edit")
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
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

  function handleExport() {
    if (!sheetRef.current || !data) return
    setExportError(null)
    setExporting(true)

    const sheet = sheetRef.current

    // Clone the resume sheet and inject into a clean print window.
    // This avoids ALL html2canvas oklch() issues — the browser renders natively.
    const clone = sheet.cloneNode(true) as HTMLElement

    // Collect all stylesheets from the current document
    const styles = Array.from(document.styleSheets)
      .map((ss) => {
        try {
          return Array.from(ss.cssRules)
            .map((r) => (r as CSSRule).cssText)
            .join("\n")
        } catch {
          return ""
        }
      })
      .join("\n")

    const printWin = window.open("", "_blank", "width=1024,height=768")
    if (!printWin) {
      setExportError("无法打开打印窗口，请检查浏览器弹窗拦截设置。")
      setExporting(false)
      return
    }

    // Build complete HTML document
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.name || "简历"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; display: flex; justify-content: center; }
          /* Inject captured styles (scoped) */
          ${styles}
        </style>
      </head>
      <body>
        ${clone.outerHTML}
        <script>
          // Adjust layout for print, then trigger
          document.querySelector('.resume-sheet')?.classList.add('printing');
          window.onload = () => {
            // Small delay to let fonts/styles settle
            setTimeout(() => window.print(), 300);
          };
        <\/script>
      </body>
      </html>
    `)
    printWin.document.close()

    // Detect when print dialog closes
    const checkClosed = setInterval(() => {
      if (printWin.closed) {
        clearInterval(checkClosed)
        setExporting(false)
      }
    }, 500)

    // Also listen for afterprint (works in some browsers even cross-window)
    try {
      printWin.addEventListener("afterprint", () => {
        setExporting(false)
        printWin?.close()
      })
    } catch {
      // cross-origin may prevent listener attachment; interval fallback handles it
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
          <p className="mt-1 text-sm text-muted-foreground">请先输入 JD 与简历生成优化内容。</p>
        </div>
        <Button onClick={() => router.push("/start")} className="gap-2 rounded-full">
          <ArrowLeft className="h-4 w-4" />
          去输入
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/start" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold tracking-tight">简历编辑器</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                title={a.name}
                onClick={() => setAccent(a.value)}
                className={cn(
                  "h-6 w-6 rounded-full border transition-transform hover:scale-110",
                  accent === a.value ? "border-foreground ring-2 ring-foreground/20" : "border-border",
                )}
                style={{ backgroundColor: a.value }}
              />
            ))}
          </div>
          <Button onClick={handleExport} disabled={exporting} className="gap-2 rounded-full">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            导出 PDF
          </Button>
        </div>
      </header>

      {exportError && (
        <div className="mx-5 mt-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{exportError}</span>
          <button className="ml-auto shrink-0 text-xs underline" onClick={() => setExportError(null)}>关闭</button>
        </div>
      )}

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
  // Run the production matching engine client-side.
  // Give priority to the algorithm score; fall back to AI score if no JD text.
  const [match, setMatch] = useState<MatchResult | null>(null)

  useEffect(() => {
    if (result.jd) {
      setMatch(computeMatchScore(result.jd, result.resume))
    }
  }, [result])

  const score = match?.score ?? result.matchScore
  const breakdown = match?.breakdown ?? []
  const matchedKeywords = match?.matchedKeywords ?? result.matchedKeywords
  const missingKeywords = match?.missingKeywords ?? result.missingKeywords
  const suggestions =
    match?.suggestions && match.suggestions.length > 0
      ? match.suggestions
      : result.suggestions

  // Color gradient for dimension bars
  function dimColor(s: number): string {
    if (s >= 70) return "#16a34a" // green
    if (s >= 40) return "#f59e0b" // amber
    return "#ef4444" // red
  }

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">
          {match ? "算法匹配度（五维加权）" : "优化后岗位匹配度"}
        </p>
        <p className="mt-1 text-4xl font-bold text-primary">{score}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
        {match && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            可复现 · 可解释 · 非 AI 主观打分
          </p>
        )}
      </div>

      {/* 5-dimension breakdown */}
      {breakdown.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" />
            评分明细
          </h3>
          <div className="space-y-3">
            {breakdown.map((dim) => (
              <div
                key={dim.label}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{dim.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-sm font-bold"
                      style={{ color: dimColor(dim.score) }}
                    >
                      {dim.score}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ×{Math.round(dim.weight * 100)}%
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${dim.score}%`,
                      backgroundColor: dimColor(dim.score),
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {dim.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched keywords */}
      {matchedKeywords.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Check className="h-4 w-4" style={{ color: "#16a34a" }} />
            已覆盖关键词
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((k) => (
              <Badge key={k} variant="secondary" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Missing keywords */}
      {missingKeywords.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <X className="h-4 w-4 text-destructive" />
            仍缺失关键词
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((k) => (
              <Badge
                key={k}
                variant="outline"
                className="border-destructive/30 font-normal text-destructive"
              >
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" />
            优化建议
          </h3>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-muted-foreground"
              >
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
