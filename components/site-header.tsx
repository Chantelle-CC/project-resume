import Link from "next/link"
import { FileText } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            JobFit<span className="text-primary">.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="hidden transition-colors hover:text-foreground sm:inline">
            工作原理
          </a>
          <a href="#start" className="transition-colors hover:text-foreground">
            开始优化
          </a>
        </nav>
      </div>
    </header>
  )
}
