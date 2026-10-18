import { type ReactNode } from "react"
import { cn } from "../../lib/cn"

const tones = {
  error: "border-breach/50 bg-breach/10",
  review: "border-review/50 bg-review/10",
  clear: "border-clear/40 bg-clear/10",
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: keyof typeof tones
  title: string
  children: ReactNode
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-sm border px-6 py-4", tones[tone])}>
      <h2 className="text-pretty font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-foreground">{children}</div>
    </div>
  )
}
