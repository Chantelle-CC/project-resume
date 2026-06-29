"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, ArrowRight, AlertCircle, FileText, Briefcase,
  ImageIcon, FileUp, CheckCircle2, X, ScanLine, KeyRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { optimizeResume, type AIConfig, DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/lib/ai"
import { saveResult, type Lang } from "@/lib/resume"
import { parseFile } from "@/lib/parse-file-client"

const CONFIG_KEY = "jobfit:config"

export function OptimizerForm() {
  const router = useRouter()

  // ---- state ----
  const [config, setConfig] = useState<AIConfig>({
    apiKey: "",
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  })
  const [jd, setJd] = useState("")
  const [resume, setResume] = useState("")
  const [lang, setLang] = useState<Lang>("zh")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // file upload states
  const [resumeParsing, setResumeParsing] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)

  // OCR states
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState("")

  const jdContainerRef = useRef<HTMLDivElement>(null)
  const resumeContainerRef = useRef<HTMLDivElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const jdImageInputRef = useRef<HTMLInputElement>(null)

  // ---- load saved config ----
  useEffect(() => {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Partial<AIConfig>
        setConfig((c) => ({ ...c, ...saved }))
      } catch {}
    }
  }, [])

  function updateConfig(patch: Partial<AIConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ baseUrl: next.baseUrl, model: next.model }))
  }

  // ---- submit ----
  async function handleSubmit() {
    setError(null)
    if (!config.apiKey.trim()) {
      setError("请先填写 API Key。")
      return
    }
    if (!jd.trim() || !resume.trim()) {
      setError("请填写岗位 JD 与个人简历内容。")
      return
    }
    setLoading(true)
    try {
      const result = await optimizeResume({ config, jd: jd.trim(), resume: resume.trim(), lang })
      saveResult({ ...result, jd: jd.trim() })
      router.push("/editor")
    } catch (e) {
      setError(e instanceof Error ? e.message : "优化失败，请重试。")
      setLoading(false)
    }
  }

  // ---- resume file upload (PDF/DOCX) ----
  async function handleResumeFile(file: File) {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    const isDocxByName = file.name.endsWith(".docx")
    if (!validTypes.includes(file.type) && !isDocxByName) {
      setError("仅支持 PDF 和 DOCX 文件。")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("文件大小不能超过 5 MB。")
      return
    }

    setError(null)
    setResumeFileName(file.name)
    setResumeParsing(true)
    try {
      const result = await parseFile(file)
      setResume(result.text)
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件解析失败，请重试。")
    } finally {
      setResumeParsing(false)
    }
  }

  // ---- drag & drop for resume ----
  const [resumeDragOver, setResumeDragOver] = useState(false)

  function onResumeDragOver(e: React.DragEvent) {
    e.preventDefault()
    setResumeDragOver(true)
  }
  function onResumeDragLeave() {
    setResumeDragOver(false)
  }
  function onResumeDrop(e: React.DragEvent) {
    e.preventDefault()
    setResumeDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleResumeFile(file)
  }

  // ---- OCR for JD images ----
  async function runOcr(imageFile: File | Blob) {
    setOcrLoading(true)
    setOcrProgress("正在加载 OCR 引擎...")
    setError(null)

    try {
      const Tesseract = (await import("tesseract.js")).default
      const { data } = await Tesseract.recognize(imageFile, "chi_sim+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(`识别中... ${Math.round(m.progress * 100)}%`)
          }
        },
      })
      const text = data.text.trim()
      if (text) {
        setJd((prev) => (prev ? prev + "\n\n" + text : text))
      } else {
        setError("图片中未识别到文字，请确认图片清晰度。")
      }
    } catch (e) {
      setError("OCR 识别失败，请重试。")
    } finally {
      setOcrLoading(false)
      setOcrProgress("")
    }
  }

  function handleJdImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件。")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10 MB。")
      return
    }
    runOcr(file)
  }

  // ---- paste image for JD ----
  const onJdPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) runOcr(blob)
          return
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ---- helpers ----
  const configured = Boolean(config.apiKey)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
      {/* Left: API config sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              模型接入配置
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                configured ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {configured && <CheckCircle2 className="h-3.5 w-3.5" />}
              {configured ? "已配置" : "待填写"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="baseUrl">接口地址 Base URL</Label>
              <Input
                id="baseUrl"
                placeholder={DEFAULT_BASE_URL}
                value={config.baseUrl}
                onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="model">模型名称</Label>
              <Input
                id="model"
                placeholder={DEFAULT_MODEL}
                value={config.model}
                onChange={(e) => updateConfig({ model: e.target.value })}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
          </div>

          <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Key 仅保存在你的本地浏览器，不会上传到任何服务器。
          </p>
        </div>
      </aside>

      {/* Right: main inputs */}
      <div className="space-y-6">
        {/* ---- JD ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            岗位招聘 JD
          </div>
          <div
            ref={jdContainerRef}
            className="rounded-2xl border border-border bg-card p-6"
            onPaste={onJdPaste}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                粘贴文字，或上传 / 粘贴截图自动识别
              </span>
              <div className="flex items-center gap-2">
                <input
                  ref={jdImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleJdImage(f)
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  disabled={ocrLoading}
                  onClick={() => jdImageInputRef.current?.click()}
                >
                  {ocrLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  上传图片
                </Button>
              </div>
            </div>

            {/* OCR progress */}
            {ocrLoading && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <ScanLine className="h-3.5 w-3.5 animate-pulse" />
                <span>{ocrProgress}</span>
              </div>
            )}

            <Textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="粘贴目标岗位的招聘要求、职责描述、任职资格...&#10;也可以直接 Ctrl+V 粘贴截图，或点击「上传图片」按钮。"
              className="min-h-52 resize-none border-0 bg-transparent p-0 leading-relaxed shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* ---- Resume ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            个人简历
          </div>
          <div
            ref={resumeContainerRef}
            className={cn(
              "rounded-2xl border bg-card p-6 transition-colors",
              resumeDragOver ? "border-primary ring-2 ring-primary/20" : "border-border",
            )}
            onDragOver={onResumeDragOver}
            onDragLeave={onResumeDragLeave}
            onDrop={onResumeDrop}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                粘贴文字，或上传 PDF / DOCX 自动解析
              </span>
              <div className="flex items-center gap-2">
                {resumeFileName && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {resumeFileName}
                    <button
                      type="button"
                      className="ml-1 hover:text-foreground"
                      onClick={() => setResumeFileName(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleResumeFile(f)
                    e.target.value = ""
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  disabled={resumeParsing}
                  onClick={() => resumeInputRef.current?.click()}
                >
                  {resumeParsing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileUp className="h-3.5 w-3.5" />
                  )}
                  上传文件
                </Button>
              </div>
            </div>

            {resumeParsing && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>正在解析 {resumeFileName}...</span>
              </div>
            )}

            <Textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="粘贴你的现有简历内容（纯文本即可，无需排版）...&#10;也可以拖拽或点击「上传文件」导入 PDF / DOCX。"
              className="min-h-52 resize-none border-0 bg-transparent p-0 leading-relaxed shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2 rounded-full pr-2.5">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 优化中...
              </>
            ) : (
              <>
                生成优化简历
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
