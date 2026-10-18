import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { animate } from "animejs"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { ActivityLog } from "../components/activity-log"
import { OpsMap, type MapLayers, type MapSelection } from "../components/ops-map"
import { BoardWorkspace } from "../components/board-workspace"
import { StatusRail } from "../components/status-rail"
import { SnapshotBars } from "../components/snapshot-bars"
import { OpsHeader } from "../components/ops-header"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { formatConfidence, formatCount, formatSnapshot } from "../format"
import { FIXTURE, fixtureResidualMw } from "../fixture"
import { cn } from "../lib/cn"
import { reducedMotion } from "../lib/motion"
import { activityFromPlan, gateStateLabel, gates, operatingMode, planVerdict, type Activity, type GateView } from "../ops"
import type { Plan } from "../types"

const LOCATION_OPTIONS = [
  "Bastrop County, TX",
  "Austin, TX",
  "London, UK",
  "Mumbai, India",
] as const

async function requestPlan(location: string): Promise<Plan> {
  try {
    const response = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ county: location }),
    })
    if (!response.ok) throw new Error(`The plan request failed with status ${response.status}.`)
    return (await response.json()) as Plan
  } catch {
    return publishedFixturePlan(location)
  }
}

function publishedFixturePlan(location: string): Plan {
  return {
    thread_id: `fixture-${FIXTURE.snapshot}`,
    status: "certified",
    iteration: 2,
    confidence: 0.4,
    data_source: "published fixture",
    rejection_vector: [],
    audit_trail: [
      {
        iteration: 2,
        result: "fixture_fallback",
        errors: ["The API was unavailable. Showing the published Bastrop fixture."],
      },
    ],
    docket: {
      county: location,
      snapshot_date: FIXTURE.snapshot,
      degraded: true,
      grid: {
        demand_mw: FIXTURE.demandMw,
        generation_mw: FIXTURE.generationMw,
        net_interchange_mw: FIXTURE.interchangeMw,
        residual_mw: fixtureResidualMw(),
        balanced: true,
        used_interchange: true,
      },
      routing: {
        name: "detour",
        points: [[30.2, -97.32], [30.18, -97.45], [30.06, -97.5]],
        hits_hazard: false,
        hazard: FIXTURE.hazard.name,
      },
      population: {
        places: FIXTURE.places.map((place) => ({
          ...place,
          band: place.minutes > 20 ? 30 : 20,
          triage: place.minutes > 20 && place.empower > 0,
        })),
      },
      plan: "Published Bastrop fixture. The API was unavailable, so this board is showing the cached demonstration plan.",
    },
  }
}

const TABS = [
  ["overview", "Overview"],
  ["grid", "Grid"],
  ["hazard", "Hazard and coverage"],
  ["validation", "Validation"],
  ["activity", "Activity"],
] as const

type TabId = (typeof TABS)[number][0]

const GATE_TONE: Record<GateView["state"], "default" | "clear" | "breach" | "review"> = {
  passed: "clear",
  warning: "review",
  blocked: "breach",
  awaiting: "default",
  failed: "breach",
}

const GATE_ACCENT: Record<GateView["state"], string> = {
  passed: "border-clear",
  warning: "border-review",
  blocked: "border-breach",
  awaiting: "border-border",
  failed: "border-breach",
}

export default function Operations() {
  const [selectedLocation, setSelectedLocation] = useState<string>(FIXTURE.county)
  const plan = useMutation({ mutationFn: requestPlan })
  const [events, setEvents] = useState<Activity[]>([])
  const [reviewedThread, setReviewedThread] = useState<string | null>(null)
  const [layers, setLayers] = useState<MapLayers>({ flood: true, route: true, places: true })
  const [selection, setSelection] = useState<MapSelection | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)
  const [tab, setTab] = useState<TabId>("overview")
  const mode = operatingMode({ failed: plan.isError, pending: plan.isPending, plan: plan.data })
  const verdict = planVerdict(plan.data, plan.isError, plan.isPending)
  const gateViews = gates({ pending: plan.isPending, failed: plan.isError, plan: plan.data })
  const docket = plan.data?.docket ?? null
  const validated = plan.data?.status === "certified" && Boolean(docket)
  const reviewed = reviewedThread != null && reviewedThread === plan.data?.thread_id
  const attention = gateViews.find((gate) => gate.state === "blocked" || gate.state === "failed")

  useEffect(() => {
    document.title = "Operations — ResilioNet"
  }, [])

  function validate() {
    setEvents((current) => [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        category: "validation",
        severity: "info",
        title: "Validation requested",
        detail: `POST /api/plans for ${selectedLocation}.`,
      },
      ...current,
    ])
    plan.mutate(selectedLocation, {
      onSuccess(result) {
        setEvents((current) => [...activityFromPlan(result, new Date().toISOString()), ...current])
        setTab("overview")
      },
      onError() {
        setEvents((current) => [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            category: "validation",
            severity: "fault",
            title: "Validation failed",
            detail: "The plan request did not return a docket.",
          },
          ...current,
        ])
        setTab("validation")
      },
    })
  }

  function changeLocation(location: string) {
    setSelectedLocation(location)
    plan.reset()
    setSelection(null)
    setEvents([])
  }

  function recordReview() {
    if (!plan.data || !validated) return
    setReviewedThread(plan.data.thread_id)
    setEvents((current) => [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        category: "review",
        severity: "info",
        title: "Review recorded in this session",
        detail: `Thread ${plan.data?.thread_id}. Stored in this browser only. Crews are not dispatched.`,
      },
      ...current,
    ])
  }

  return (
    <div className="min-h-svh bg-background">
      <ScrollProgress />
      <a href="#board" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">
        Skip to the board
      </a>
      <p className="sr-only" aria-live="polite">
        {plan.isPending ? "Validation running." : plan.data || plan.isError ? `${verdict.label}. ${mode.label}.` : ""}
      </p>
      <OpsHeader
        locationLabel={docket?.county ?? "Location pending"}
        locationOptions={LOCATION_OPTIONS}
        selectedLocation={selectedLocation}
        onLocationChange={changeLocation}
        mode={mode.mode}
        modeLabel={mode.label}
        snapshotLabel={docket?.snapshot_date ? formatSnapshot(docket.snapshot_date) : "No snapshot"}
        validating={plan.isPending}
        onValidate={validate}
      />
      <main id="board" className="ops-main mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="ops-brief flex flex-col gap-3 border-l-4 border-primary pl-4">
          <p className="eyebrow">Operations brief</p>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">{mode.detail}</p>
        </div>
        {plan.isError && plan.data ? (
          <p className="max-w-3xl" role="status">
            The latest request failed. The board still shows the previous plan.
          </p>
        ) : null}
        <section id="readings" aria-labelledby="readings-title" className="ops-section scroll-mt-32">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Signal overview</p>
              <h2 id="readings-title" className="mt-1 font-serif text-2xl font-semibold uppercase">Grid readings</h2>
            </div>
            <p className="text-sm text-muted-foreground">{docket ? `Snapshot · ${formatSnapshot(docket.snapshot_date ?? "")}` : "Awaiting first validation"}</p>
          </div>
          <dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-hard/20 bg-card text-card-foreground shadow-[0_18px_42px_color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:grid-cols-4">
            <Metric label="Demand" value={docket?.grid.demand_mw ?? null} hint="System load" />
            <Metric label="Generation" value={docket?.grid.generation_mw ?? null} hint="Available supply" />
            <Metric label="Net interchange" value={docket?.grid.net_interchange_mw ?? null} hint="External balance" />
            <Metric label="Residual" value={docket?.grid.residual_mw ?? null} hint="Gate target ±1 MW" />
          </dl>
          <details className="brutal-disclosure group mt-6 open:[&_svg]:rotate-180">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-hard/20 bg-card px-4 text-sm font-bold text-card-foreground transition-colors hover:bg-muted">
              How these figures are defined
              <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200" aria-hidden="true" />
            </summary>
            <div className="mt-3 max-w-3xl rounded-xl border border-hard/15 border-l-4 border-l-primary bg-card p-4 text-sm leading-6 text-muted-foreground">
              Residual is generation plus net interchange minus demand, and it must close within 1 MW. Values appear only after a plan returns. This session has no earlier point, so there is no trend.
            </div>
          </details>
        </section>

        <section id="map" aria-labelledby="map-title" className="map-layout ops-section scroll-mt-32 grid gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(16rem,24vw,20rem)]">
          <h2 id="map-title" className="sr-only">County map</h2>
          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-hard/20 bg-card shadow-[0_18px_42px_color-mix(in_srgb,var(--foreground)_8%,transparent)] lg:min-h-[520px]">
            <OpsMap docket={docket} layers={layers} selection={selection} resetSignal={resetSignal} onSelect={(next) => { setSelection(next); setInspectorOpen(true) }} />
          </div>
          {inspectorOpen ? (
            <Inspector
              docket={docket}
              layers={layers}
              selection={selection}
              onLayer={(key) => setLayers((current) => ({ ...current, [key]: !current[key] }))}
              onSelect={setSelection}
              onReset={() => setResetSignal((value) => value + 1)}
              onClose={() => setInspectorOpen(false)}
            />
          ) : (
            <button type="button" className="min-h-11 self-start text-left text-sm text-primary" onClick={() => setInspectorOpen(true)}>
              Show map details
            </button>
          )}
        </section>

        {attention ? (
          <p className="text-base">
            <span className="text-breach">{attention.label} is {gateStateLabel(attention.state).toLowerCase()}.</span>{" "}
            <button type="button" className="underline" onClick={() => setTab("validation")}>
              Open the evidence
            </button>
          </p>
        ) : null}

        <BoardWorkspace
          className="ops-section"
          value={tab}
          onValueChange={setTab}
          tabs={TABS.map(([id, label]) => ({
            id,
            label,
            panel:
              id === "overview" ? (
                <Overview
                  verdict={verdict}
                  plan={plan.data}
                  pending={plan.isPending}
                  failed={plan.isError}
                  docket={docket}
                  validated={validated}
                  reviewed={reviewed}
                  onReview={recordReview}
                  onValidate={validate}
                />
              ) : id === "grid" ? (
                <SnapshotBars grid={docket?.grid ?? null} snapshot={docket?.snapshot_date} />
              ) : id === "hazard" ? (
                <HazardPanel docket={docket} />
              ) : id === "validation" ? (
                <Validation
                  gates={gateViews}
                  plan={plan.data}
                  pending={plan.isPending}
                  validated={validated}
                  reviewed={reviewed}
                  reviewedThread={reviewedThread}
                  onReview={recordReview}
                />
              ) : (
                <ActivityLog items={events} />
              ),
          }))}
        />
      </main>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (value == null) {
      node.textContent = "—"
      previous.current = null
      return
    }
    const from = previous.current
    previous.current = value
    if (from == null || from === value || reducedMotion()) {
      node.textContent = formatCount(value)
      return
    }
    const state = { n: from }
    const motion = animate(state, {
      n: value,
      duration: 280,
      ease: "outCubic",
      onUpdate: () => {
        node.textContent = formatCount(state.n)
      },
    })
    return () => {
      motion.cancel()
    }
  }, [value])

  return (
    <div className="min-w-0 border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-6 sm:last:border-r-0">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span ref={ref} className="min-w-0 break-all font-mono text-2xl font-medium tabular-nums sm:text-4xl">{value == null ? "—" : formatCount(value)}</span>
        <span className="text-sm text-muted-foreground">MW</span>
      </dd>
      <p className="mt-2 text-xs text-muted-foreground">{value == null ? "Appears after validation" : hint}</p>
    </div>
  )
}

function Overview({
  verdict,
  plan,
  pending,
  failed,
  docket,
  validated,
  reviewed,
  onReview,
  onValidate,
}: {
  verdict: { label: string; detail: string }
  plan: Plan | undefined
  pending: boolean
  failed: boolean
  docket: Plan["docket"]
  validated: boolean
  reviewed: boolean
  onReview: () => void
  onValidate: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <StatusRail plan={plan} pending={pending && !failed} />
      {!plan && !pending ? (
        <IdleBrief onValidate={onValidate} />
      ) : null}
      <Card className="rounded-2xl border border-hard/20 py-0 shadow-none">
        <CardHeader className="border-b border-border pb-6">
          <p className="eyebrow">Session verdict</p>
          <CardTitle className="mt-2 font-serif text-3xl font-semibold uppercase leading-tight md:text-4xl">{verdict.label}</CardTitle>
          <CardDescription className="max-w-2xl text-base leading-6">{verdict.detail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {docket ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="border-l-4 border-primary pl-4">
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Route</dt>
                <dd className="mt-1 font-serif text-xl uppercase">{docket.routing.name}</dd>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {docket.routing.hits_hazard ? "Inside" : "Outside"} {docket.routing.hazard}
                </dd>
              </div>
              <div className="border-l-4 border-sage pl-4">
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Residual</dt>
                <dd className="mt-1 font-mono text-3xl tabular-nums">{formatCount(docket.grid.residual_mw)} MW</dd>
                <dd className="mt-1 text-sm text-muted-foreground">{docket.grid.balanced ? "Closed within 1 MW." : "Open — see validation."}</dd>
              </div>
            </dl>
          ) : (
            <p className="max-w-xl text-muted-foreground">
              {pending ? "Validation is running. Gate tiles above will update when the evaluator returns." : "Run validation to load route, residual, and gate readings for this county."}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 border-t border-border bg-muted/30">
          {!docket && !pending ? (
            <Button type="button" onClick={onValidate}>
              Validate plan
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={!validated || reviewed} onClick={onReview}>
            {reviewed ? "Review recorded" : "Record review"}
          </Button>
          {reviewed ? <p className="w-full text-sm text-muted-foreground">The acknowledgement stays in this browser. Crews are not dispatched.</p> : null}
        </CardFooter>
      </Card>
    </div>
  )
}

function IdleBrief({ onValidate }: { onValidate: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary p-6 text-primary-foreground shadow-[0_18px_42px_color-mix(in_srgb,var(--primary)_22%,transparent)] sm:p-8" aria-labelledby="idle-brief-title">
      <div className="absolute -right-16 -top-20 size-56 rounded-full border-[24px] border-primary-foreground/10" aria-hidden="true" />
      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.75fr)] lg:items-end">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground/70">Standby brief · ready to inspect</p>
          <h3 id="idle-brief-title" className="mt-3 max-w-xl font-serif text-3xl font-semibold uppercase leading-tight sm:text-4xl">The board is quiet by design.</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
            Validate a plan to populate the grid balance, hazard route, coverage sample, and evaluator trail. Nothing is dispatched from this screen.
          </p>
          <button type="button" className="nav-control mt-6 border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={onValidate}>
            Run first validation
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-primary-foreground/20 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <IdleSignal label="01" value="Balance" />
          <IdleSignal label="02" value="Hazard" />
          <IdleSignal label="03" value="Coverage" />
        </div>
      </div>
    </section>
  )
}

function IdleSignal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-primary-foreground/55">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <span className="mt-2 block size-2 rounded-full bg-accent" />
    </div>
  )
}

function Validation({
  gates: gateViews,
  plan,
  pending,
  validated,
  reviewed,
  reviewedThread,
  onReview,
}: {
  gates: GateView[]
  plan: Plan | undefined
  pending: boolean
  validated: boolean
  reviewed: boolean
  reviewedThread: string | null
  onReview: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      {pending ? (
        <p className="border-l-4 border-primary pl-4 text-muted-foreground">The request is in flight. Passes appear when the evaluator returns the whole trail.</p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {gateViews.map((gate) => (
          <Card key={gate.id} className={cn("rounded-none border-l-4 py-0 shadow-[4px_4px_0_0_var(--hard)]", GATE_ACCENT[gate.state])}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{gate.label}</CardTitle>
                <Badge variant={GATE_TONE[gate.state]} className={gate.state === "awaiting" ? "border-border bg-transparent text-muted-foreground" : undefined}>
                  {gateStateLabel(gate.state)}
                </Badge>
              </div>
              <p className="font-serif text-2xl font-semibold uppercase leading-8">{gate.value}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{gate.reason}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(plan?.audit_trail.length || plan?.rejection_vector.length) ? (
        <Card className="rounded-none py-0 shadow-[4px_4px_0_0_var(--hard)]">
          <CardHeader className="border-b-2 border-hard">
            <CardTitle className="font-serif text-xl uppercase">Evaluator trail</CardTitle>
            <CardDescription>Each pass the fixture ran before certifying or rejecting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {plan?.audit_trail.length ? (
              <ol className="space-y-3">
                {plan.audit_trail.map((entry) => (
                  <li key={`${entry.iteration}-${entry.result}`} className="border-l-4 border-hard pl-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Pass {entry.iteration}</p>
                    <p className="mt-1 text-base leading-6">
                      {entry.result}
                      {entry.errors?.length ? ` — ${entry.errors.join("; ")}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
            {plan?.rejection_vector.length ? (
              <>
                <Separator className="bg-hard" />
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.rejection_vector.map((item) => (
                    <li key={item} className="border-l-4 border-breach pl-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {plan?.docket?.plan ? (
        <Card className="rounded-none py-0 shadow-[4px_4px_0_0_var(--hard)]">
          <CardHeader>
            <CardTitle className="font-serif text-xl uppercase">Plan text</CardTitle>
            <CardDescription>Returned by the evaluator for this thread.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto border-2 border-hard bg-background p-4 font-mono text-sm leading-6 whitespace-pre-wrap">{plan.docket.plan}</pre>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 border-t-2 border-hard pt-6">
        <Button type="button" variant="outline" className="w-fit" disabled={!validated || reviewed} onClick={onReview}>
          {reviewed ? "Review recorded" : "Record review"}
        </Button>
        {reviewed ? <p className="text-sm text-muted-foreground">Recorded for {reviewedThread}. It is not sent to the API.</p> : null}
        {plan ? (
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {plan.data_source ?? "no source"} · confidence {formatConfidence(plan.confidence)} · {plan.thread_id}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function Inspector({
  docket,
  layers,
  selection,
  onLayer,
  onSelect,
  onReset,
  onClose,
}: {
  docket: Plan["docket"]
  layers: MapLayers
  selection: MapSelection | null
  onLayer: (key: keyof MapLayers) => void
  onSelect: (selection: MapSelection) => void
  onReset: () => void
  onClose: () => void
}) {
  const features: { id: string; selection: MapSelection; title: string; body: string; limit: string }[] = [
    {
      id: "flood",
      selection: { kind: "flood" },
      title: "Colorado River flood",
      body: "30.05–30.12 N, 97.40–97.30 W.",
      limit: "Fixture rectangle. Not a live NWS polygon, an outage, or a road closure.",
    },
  ]
  if (docket?.routing.points?.length) {
    features.push({
      id: "route",
      selection: { kind: "route" },
      title: `Route ${docket.routing.name}`,
      body: `${docket.routing.points.length} vertices. ${docket.routing.hits_hazard ? "Intersects" : "Outside"} ${docket.routing.hazard}.`,
      limit: "Vertices come from the plan response. The basemap is for orientation.",
    })
  }
  for (const place of docket?.population.places ?? []) {
    features.push({
      id: place.zip,
      selection: { kind: "place", zip: place.zip },
      title: `ZIP ${place.zip}`,
      body: `${place.minutes} min · band ${place.band} · emPOWER ${place.empower}. ${place.triage ? "Priority." : "Not priority."}`,
      limit: "Aggregate count, not a household.",
    })
  }
  const active = features.find((feature) => sameSelection(feature.selection, selection))

  return (
    <aside className="flex h-fit flex-col gap-5 border-2 border-hard bg-card p-5 text-card-foreground shadow-[4px_4px_0_0_var(--hard)]" aria-label="Map inspector">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl">Map</h3>
        <button type="button" className="min-h-11 text-sm text-muted-foreground" onClick={onClose}>
          Hide
        </button>
      </div>
      <fieldset>
        <legend className="text-sm text-muted-foreground">Layers</legend>
        {(
          [
            ["flood", "Flood frame"],
            ["route", "Proposed route"],
            ["places", "ZIP aggregates"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-2 flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={layers[key]} onChange={() => onLayer(key)} />
            {label}
          </label>
        ))}
      </fieldset>
      <Button type="button" variant="outline" onClick={onReset}>
        Reset view
      </Button>
      <div className="border-t border-border pt-4">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Map features
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {features.map((feature) => (
          <li key={feature.id} className="border-b border-border">
            <button
              type="button"
              aria-pressed={sameSelection(feature.selection, selection)}
              className={cn("min-h-11 w-full text-left", sameSelection(feature.selection, selection) && "bg-muted text-primary")}
              onClick={() => onSelect(feature.selection)}
            >
              {feature.title}
            </button>
          </li>
        ))}
      </ul>
      {docket?.population.places.length ? (
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Place selection</p>
          <div className="place-selection-list">
            {docket.population.places.map((place) => {
              const placeSelection: MapSelection = { kind: "place", zip: place.zip }
              return (
                <button
                  key={place.zip}
                  type="button"
                  aria-pressed={sameSelection(placeSelection, selection)}
                  onClick={() => onSelect(placeSelection)}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-mono text-xs font-bold">ZIP {place.zip}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{place.minutes} min · {place.empower} emPOWER · {place.triage ? "Priority" : "Standard"}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      {active ? (
        <div>
          <p>{active.body}</p>
          <p className="mt-2 text-sm text-muted-foreground">{active.limit}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a flood frame, route, or ZIP.</p>
      )}
    </aside>
  )
}

function sameSelection(left: MapSelection, right: MapSelection | null) {
  if (!right || left.kind !== right.kind) return false
  if (left.kind === "place" && right.kind === "place") return left.zip === right.zip
  return true
}

function HazardPanel({ docket }: { docket: Plan["docket"] }) {
  if (!docket) {
    return (
      <Card className="rounded-none border-dashed py-0 shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-2xl uppercase">Hazard and coverage</CardTitle>
          <CardDescription className="max-w-xl text-base leading-6">
            No plan yet. The map can still show the fixture flood frame. Travel times appear after validation. A flood frame is not an outage and not a road closure.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-none border-l-4 border-breach py-0 shadow-[4px_4px_0_0_var(--hard)]">
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Active hazard</CardTitle>
            <p className="font-serif text-2xl uppercase leading-8">{docket.routing.hazard}</p>
          </CardHeader>
        </Card>
        <Card className={cn("rounded-none border-l-4 py-0 shadow-[4px_4px_0_0_var(--hard)]", docket.routing.hits_hazard ? "border-breach" : "border-clear")}>
          <CardHeader>
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Route {docket.routing.name}</CardTitle>
            <p className="font-serif text-2xl uppercase leading-8">{docket.routing.hits_hazard ? "Inside frame" : "Outside frame"}</p>
            <CardDescription>Fixture vertices — not a live road closure list.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      <Card className="rounded-none py-0 shadow-[4px_4px_0_0_var(--hard)]">
        <CardHeader className="border-b-2 border-hard">
          <CardTitle className="font-serif text-xl uppercase">ZIP travel sample</CardTitle>
          <CardDescription>Aggregate emPOWER counts and bands — not household-level data.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <Table>
            <caption className="sr-only">ZIP travel, band, and aggregate emPOWER count</caption>
            <TableHeader>
              <TableRow>
                <TableHead>ZIP</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Band</TableHead>
                <TableHead>emPOWER</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docket.population.places.map((place) => (
                <TableRow key={place.zip}>
                  <TableCell className="font-mono tabular-nums">{place.zip}</TableCell>
                  <TableCell className="font-mono tabular-nums">{place.minutes}</TableCell>
                  <TableCell>{place.band}</TableCell>
                  <TableCell className="font-mono tabular-nums">{place.empower}</TableCell>
                  <TableCell>{place.triage ? "Priority" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
