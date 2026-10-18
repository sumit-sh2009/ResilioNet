import type { Plan } from "../types"
import { formatConfidence } from "../format"
import { cn } from "../lib/cn"

type Tone = "waiting" | "checking" | "clear" | "breach" | "review"

const toneClass: Record<Tone, string> = {
  waiting: "border-border",
  checking: "border-primary",
  clear: "border-clear",
  breach: "border-breach",
  review: "border-review",
}

function Gate({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-xl border border-hard/15 border-l-4 bg-card px-5 py-5 shadow-[0_10px_24px_color-mix(in_srgb,var(--foreground)_5%,transparent)]", toneClass[tone])}>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="truncate font-serif text-2xl font-semibold uppercase leading-8">{value}</p>
      <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}

export function StatusRail({ plan, pending }: { plan: Plan | undefined; pending: boolean }) {
  const docket = plan?.docket

  if (pending) {
    return (
      <div className="grid gap-4 sm:grid-cols-3" aria-busy="true">
        <Gate label="Balance" value="Checking…" detail="Residual must close within 1 MW." tone="checking" />
        <Gate label="Hazard" value="Checking…" detail="The route has to stay out of the flood." tone="checking" />
        <Gate label="Confidence" value="Checking…" detail="A slow feed drops this plan onto the cache." tone="checking" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Gate label="Balance" value="Waiting" detail="Generation plus interchange, minus demand." tone="waiting" />
        <Gate label="Hazard" value="Waiting" detail="Colorado River flood is the active polygon." tone="waiting" />
        <Gate label="Confidence" value="Waiting" detail="Live telemetry has a 1,500 ms budget." tone="waiting" />
      </div>
    )
  }

  if (!docket) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Gate label="Balance" value="Review" detail="The gates did not certify a residual." tone="review" />
        <Gate label="Hazard" value="Review" detail="No route cleared the flood polygon." tone="review" />
        <Gate
          label="Confidence"
          value={formatConfidence(plan.confidence)}
          detail={`${plan.rejection_vector.length} rejection${plan.rejection_vector.length === 1 ? "" : "s"} on the last pass.`}
          tone="review"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Gate
        label="Balance"
        value={docket.grid.balanced ? "Closed" : "Open"}
        detail={docket.grid.used_interchange ? "Interchange is in the residual." : "Interchange was dropped."}
        tone={docket.grid.balanced ? "clear" : "breach"}
      />
      <Gate
        label="Hazard"
        value={docket.routing.hits_hazard ? "Intersect" : "Clear"}
        detail={docket.routing.hazard}
        tone={docket.routing.hits_hazard ? "breach" : "clear"}
      />
      <Gate
        label="Confidence"
        value={formatConfidence(plan.confidence)}
        detail={docket.degraded ? "The live feed missed the 1,500 ms budget." : "The fixture held for this pass."}
        tone={docket.degraded ? "review" : "clear"}
      />
    </div>
  )
}
