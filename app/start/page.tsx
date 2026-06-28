import { SiteHeader } from "@/components/site-header"
import { OptimizerForm } from "@/components/home/optimizer-form"

export default function StartPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <section className="py-12 md:py-16">
          <p className="text-sm font-medium text-muted-foreground">第 1 步 / 共 2 步</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            输入岗位描述与简历
          </h1>
          <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            填写你的模型 API、目标岗位 JD 与现有简历，几秒后生成优化结果并进入编辑器。
          </p>
        </section>

        <OptimizerForm />
      </main>
    </div>
  )
}
