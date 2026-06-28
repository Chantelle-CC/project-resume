import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { SiteHeader } from "@/components/site-header"

const steps = [
  {
    no: "01",
    title: "输入岗位与简历",
    desc: "粘贴目标岗位的招聘信息和你现有的简历内容，无需任何排版。",
  },
  {
    no: "02",
    title: "AI 精准优化",
    desc: "模型对照招聘要求重写要点、补齐关键词、量化成果，让简历更贴合岗位。",
  },
  {
    no: "03",
    title: "排版并导出",
    desc: "进入可视化编辑器实时调整版式，一键导出整洁专业的 PDF。",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader action={{ href: "/start", label: "开始使用" }} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        {/* Hero */}
        <section className="flex flex-col items-center gap-[84px] py-24 text-center md:py-36">
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            为每一个岗位
            <br />
            重新打磨你的简历
          </h1>
          <div className="mt-10">
            <Link
              href="/start"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              立即开始
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-border py-20">
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((s) => (
              <div key={s.no} className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">{s.no}</span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border py-20">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                准备好让简历脱颖而出了吗？
              </h2>
              <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
                只需几秒，把通用简历变成为目标岗位量身定制的版本。
              </p>
            </div>
            <Link
              href="/start"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              开始优化
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>JobFit</span>
        </div>
      </footer>
    </div>
  )
}
