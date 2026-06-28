import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function SiteHeader({
  action,
}: {
  action?: { href: string; label: string }
}) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          JobFit
        </Link>
        {action ? (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
            aria-label={action.label}
          >
            {action.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </header>
  )
}
