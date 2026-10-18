import { useRef } from "react"
import type { Plan } from "../types"
import { formatConfidence } from "../format"
import { cn } from "../lib/cn"
import { useSettle } from "../lib/motion"
import { Panel } from "./panel"

type Tone = "waiting" | "checking" | "clear" | "breach" | "review"

const bar: Record<Tone, string> = {
  waiting: "bg-border",
  checking: "bg-primary",
  clear: "bg-clear",
  breach: "bg-breach",
  review: "bg-review",
}

function Gate({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return (
    <div data-settle className="grid grid-cols-[2px_minmax(0,1fr)] gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <span className={cn("w-0.5", bar[tone])} aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-lg tabular-nums leading-6 text-foreground">{value}</p>
        <p className="text-sm leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

export function GateRail({ plan, pending, failed }: { plan: Plan | undefined; pending: boolean; failed: boolean }) {
  const docket = plan?.docket
  let gates: { label: string; value: string; detail: string; tone: Tone }[]

  if (failed) {
    gates = [
      { label: "Balance", value: "Fault", detail: "The evaluator did not answer.", tone: "breach" },
      { label: "Hazard", value: "Fault", detail: "No route was returned.", tone: "breach" },
      { label: "Confidence", value: "—", detail: "Run the balance again.", tone: "breach" },
    ]
  } else if (pending && !docket) {
    gates = [
      { label: "Balance", value: "Checking…", detail: "Residual must close within 1 MW.", tone: "checking" },
      { label: "Hazard", value: "Checking…", detail: "The route has to stay out of the flood.", tone: "checking" },
      { label: "Confidence", value: "Checking…", detail: "A slow feed drops this plan onto the cache.", tone: "checking" },
    ]
  } else if (!plan || !docket) {
    const review = Boolean(plan && !docket)
    gates = review
      ? [
          { label: "Balance", value: "Review", detail: "The gates did not certify a residual.", tone: "review" },
          { label: "Hazard", value: "Review", detail: "No route cleared the flood polygon.", tone: "review" },
          {
            label: "Confidence",
            value: formatConfidence(plan?.confidence ?? null),
            detail: `${plan?.rejection_vector.length ?? 0} rejections on the last pass.`,
            tone: "review",
          },
        ]
      : [
          { label: "Balance", value: "Standby", detail: "Generation plus interchange, minus demand.", tone: "waiting" },
          { label: "Hazard", value: "Standby", detail: "Colorado River flood is the active polygon.", tone: "waiting" },
          { label: "Confidence", value: "Standby", detail: "Live telemetry has a 1,500 ms budget.", tone: "waiting" },
        ]
  } else {
    gates = [
      {
        label: "Balance",
        value: docket.grid.balanced ? "Closed" : "Open",
        detail: docket.grid.used_interchange ? "Interchange is in the residual." : "Interchange was dropped.",
        tone: docket.grid.balanced ? "clear" : "breach",
      },
      {
        label: "Hazard",
        value: docket.routing.hits_hazard ? "Intersect" : "Clear",
        detail: docket.routing.hazard,
        tone: docket.routing.hits_hazard ? "breach" : "clear",
      },
      {
        label: "Confidence",
        value: formatConfidence(plan.confidence),
        detail: docket.degraded ? "The live feed missed the 1,500 ms budget." : "The fixture held for this pass.",
        tone: docket.degraded ? "review" : "clear",
      },
    ]
  }

  const root = useRef<HTMLDivElement>(null)
  const token = failed ? "fault" : pending && !docket ? "checking" : plan?.thread_id ? `${plan.status}:${plan.thread_id}` : "standby"
  useSettle(root, token)

  return (
    <Panel label="Gates" className="border-b lg:border-r lg:border-b-0">
      <div ref={root} aria-busy={pending}>
        {gates.map((gate) => (
          <Gate key={gate.label} {...gate} />
        ))}
      </div>
    </Panel>
  )
}
