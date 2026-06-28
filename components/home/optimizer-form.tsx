"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, KeyRound, Loader2, Sparkles, AlertCircle } from "lucide-react"

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
  const [showConfig, setShowConfig] = useState(true)
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
        if (saved.apiKey) setShowConfig(false)
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
      setShowConfig(true)
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

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* API config */}
      <div className="border-b border-border">
        <button
          type="button"
          onClick={() => setShowConfig((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-primary" />
            模型接入配置
            {config.apiKey ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-normal text-accent-foreground">
                已配置
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                待填写
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showConfig && "rotate-180")} />
        </button>

        {showConfig && (
          <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                className="mt-1.5 font-mono"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Key 仅保存在你的浏览器本地，直接从前端调用模型接口，不会上传到服务器。
              </p>
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
        )}
      </div>

      {/* Inputs */}
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="jd">岗位招聘 JD</Label>
            <span className="text-xs text-muted-foreground">{jd.length} 字</span>
          </div>
          <Textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="粘贴目标岗位的招聘要求、职责描述、任职资格..."
            className="min-h-64 resize-none leading-relaxed"
          />
        </div>
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="resume">个人简历</Label>
            <span className="text-xs text-muted-foreground">{resume.length} 字</span>
          </div>
          <Textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="粘贴你的现有简历内容（纯文本即可，无需排版）..."
            className="min-h-64 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">输出语言</span>
          <div className="flex rounded-lg border border-border p-0.5">
            {(["zh", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm transition-colors",
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l === "zh" ? "中文" : "English"}
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 优化中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              生成优化简历
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mx-6 mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
