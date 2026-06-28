import { KeyRound, FileInput, Sparkles, FileDown } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { OptimizerForm } from "@/components/home/optimizer-form"

const steps = [
  { icon: KeyRound, title: "接入模型", desc: "填写你自己的 API Key，数据仅存于本地浏览器。" },
  { icon: FileInput, title: "输入 JD 与简历", desc: "粘贴目标岗位描述与现有简历内容。" },
  { icon: Sparkles, title: "AI 智能优化", desc: "针对岗位重写要点、补齐关键词、量化成果。" },
  { icon: FileDown, title: "排版并导出", desc: "进入编辑器实时排版，一键导出精美 PDF。" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {/* Hero */}
        <section className="py-16 text-center md:py-20">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            AI 简历优化 · 精准匹配目标岗位
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            让每一份简历，都为<span className="text-primary">目标岗位</span>量身定制
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            输入招聘 JD 与个人简历，AI 自动重写并优化内容，进入可视化编辑器实时排版，导出专业 PDF。
          </p>
        </section>

        {/* How it works */}
        <section id="how" className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-medium text-muted-foreground/60">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* Input flow */}
        <section id="start" className="scroll-mt-20">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight">开始优化你的简历</h2>
            <p className="mt-1 text-sm text-muted-foreground">填写下方信息，约几秒即可生成优化结果。</p>
          </div>
          <OptimizerForm />
        </section>
      </main>
    </div>
  )
}
