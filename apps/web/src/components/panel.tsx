import type { ReactNode } from "react"
import { cn } from "../lib/cn"

export function Panel({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col border-border bg-card", className)}>
      <h2 className="shrink-0 border-b border-border px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </h2>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
