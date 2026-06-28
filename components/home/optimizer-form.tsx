"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, AlertCircle, KeyRound, FileText, Briefcase, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { optimizeResume, type AIConfig, DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/lib/ai"
import { saveResult, type Lang } from "@/lib/resume"

const CONFIG_KEY = "jobfit:config"

export function OptimizerForm() {
  const router = useRouter()

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

  useEffect(() => {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      try {
        const saved = JSON.parse(raw) as AIConfig
        setConfig((c) => ({ ...c, ...saved }))
      } catch {}
    }
  }, [])

  function updateConfig(patch: Partial<AIConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
  }

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
      const result = await optimizeResume({ config, jd, resume, lang })
      saveResult(result)
      router.push("/editor")
    } catch (e) {
      setError(e instanceof Error ? e.message : "优化失败，请重试。")
      setLoading(false)
    }
  }

  const configured = Boolean(config.apiKey)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
      {/* Left: settings sidebar */}
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
            Key 仅保存在你的本地，不会上传到服务器。
          </p>
        </div>
      </aside>

      {/* Right: main inputs */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Label htmlFor="jd" className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            岗位招聘 JD
          </Label>
          <Textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="粘贴目标岗位的招聘要求、职责描述、任职资格..."
            className="min-h-52 resize-none border-0 bg-transparent p-0 leading-relaxed shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <Label htmlFor="resume" className="mb-3 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            个人简历
          </Label>
          <Textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="粘贴你的现有简历内容（纯文本即可，无需排版）..."
            className="min-h-52 resize-none border-0 bg-transparent p-0 leading-relaxed shadow-none focus-visible:ring-0"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
