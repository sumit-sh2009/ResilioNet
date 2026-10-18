import { useRef } from "react"
import type { Plan } from "../types"
import { formatConfidence, formatCount } from "../format"
import { useSettle } from "../lib/motion"
import { Badge } from "./ui/badge"
import { Panel } from "./panel"

function Row({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div data-settle className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl leading-none tabular-nums">
        {value}
        {unit ? <span className="ml-2 text-[11px] tracking-[0.08em] text-muted-foreground">{unit}</span> : null}
      </span>
    </div>
  )
}

export function Telemetry({ plan, pending }: { plan: Plan | undefined; pending: boolean }) {
  const grid = plan?.docket?.grid
  const routing = plan?.docket?.routing
  const dash = pending && !grid
  const root = useRef<HTMLDivElement>(null)
  useSettle(root, plan ? `${plan.status}:${plan.thread_id}` : pending ? "pending" : "idle")

  return (
    <Panel label="Telemetry" className="border-b lg:row-span-2 lg:border-b-0">
      <div ref={root} className={pending ? "opacity-70" : undefined} aria-busy={pending}>
        <Row label="Demand" value={grid ? formatCount(grid.demand_mw) : dash ? "…" : "—"} unit="MW" />
        <Row label="Generation" value={grid ? formatCount(grid.generation_mw) : dash ? "…" : "—"} unit="MW" />
        <Row label="Interchange" value={grid ? formatCount(grid.net_interchange_mw) : dash ? "…" : "—"} unit="MW" />
        <Row label="Residual" value={grid ? formatCount(grid.residual_mw) : dash ? "…" : "—"} unit="MW" />
        <div data-settle className="flex flex-col gap-3 px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Route</p>
          <p className="font-mono text-3xl leading-none uppercase tracking-[0.08em]" translate="no">
            {routing?.name ?? "—"}
          </p>
          {routing ? (
            <Badge variant={routing.hits_hazard ? "breach" : "clear"}>
              {routing.hits_hazard ? "Hits Hazard" : "Clear of Hazard"}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">{plan && !plan.docket ? "Held for review." : "No certified path."}</p>
          )}
          {plan?.data_source ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {plan.data_source} · {formatConfidence(plan.confidence)}
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
