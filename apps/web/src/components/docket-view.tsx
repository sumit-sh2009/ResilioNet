import type { Plan } from "../types"
import { formatConfidence, formatMw, formatSnapshot } from "../format"
import { Alert } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Skeleton } from "./ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { SituationMap } from "./situation-map"

export function DocketView({
  plan,
  pending,
  failed,
  onRetry,
}: {
  plan: Plan | undefined
  pending: boolean
  failed: boolean
  onRetry: () => void
}) {
  if (pending) return <BoardSkeleton />
  if (failed) {
    return (
      <Alert tone="error" title="The Plan Did Not Return">
        <p>The evaluator did not answer. Check that the API is up, then run the balance again.</p>
        <Button type="button" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      </Alert>
    )
  }
  if (!plan) return <WaitingBrief />
  if (!plan.docket) return <HumanReview plan={plan} />
  return <Certified plan={plan} />
}

function WaitingBrief() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Standing Orders</CardTitle>
        <CardDescription>
          Build a plan for Bastrop County. The board stays blank until generation, interchange, and the flood gate agree.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <Order title="Close the residual" body="Generation plus net interchange, minus demand, within 1 MW. Dropping interchange is a reject." />
        <Order title="Stay out of the flood" body="The short path crosses the Colorado River rectangle. The certified route is the detour." />
        <Order title="Triage the ZIPs" body="A ZIP is priority when emPOWER count is above zero and travel from the station exceeds 20 minutes." />
      </CardContent>
    </Card>
  )
}

function Order({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      <Skeleton className="h-64 lg:col-span-2" />
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  )
}

function HumanReview({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="review" title="This Plan Needs a Person">
        <p>Three passes failed the gates. Nothing on this board is certified.</p>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Rejections</CardTitle>
          <CardDescription>Read these before you override the route or the residual.</CardDescription>
        </CardHeader>
        <CardContent>
          {plan.rejection_vector.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rejection text came back with this review.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {plan.rejection_vector.map((item) => (
                <li key={item} className="text-sm leading-6">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <AuditTrail plan={plan} />
    </div>
  )
}

function Certified({ plan }: { plan: Plan }) {
  const docket = plan.docket
  if (!docket) return null
  const places = docket.population.places

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>County Frame</CardTitle>
            <CardDescription>
              {docket.snapshot_date ? formatSnapshot(docket.snapshot_date) : "Snapshot time unlisted"}
              {docket.county ? ` · ${docket.county}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SituationMap docket={docket} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resilience Plan</CardTitle>
            <CardDescription>
              {docket.degraded ? "Degraded. This copy uses the cache." : "Gates passed on this pass."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">{docket.plan}</pre>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Grid</CardTitle>
            <CardDescription>Residual is generation plus interchange, minus demand.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 font-mono text-sm tabular-nums">
            <p>Demand {formatMw(docket.grid.demand_mw)}</p>
            <p>Generation {formatMw(docket.grid.generation_mw)}</p>
            <p>Interchange {formatMw(docket.grid.net_interchange_mw)}</p>
            <p>Residual {formatMw(docket.grid.residual_mw)}</p>
            <Badge variant={docket.degraded ? "review" : "clear"}>
              {plan.data_source ?? "unlisted"} · {formatConfidence(plan.confidence)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Route</CardTitle>
            <CardDescription>The name is the path the evaluator kept.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="font-serif text-3xl font-semibold uppercase leading-8" translate="no">
              {docket.routing.name}
            </p>
            <Badge variant={docket.routing.hits_hazard ? "breach" : "clear"}>
              {docket.routing.hits_hazard ? "Hits Hazard" : "Clear of Hazard"}
            </Badge>
            <p className="text-sm leading-6 text-muted-foreground">{docket.routing.hazard}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Triage</CardTitle>
            <CardDescription>Priority means emPOWER and travel over 20 minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            {places.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ZIP bands in this plan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>emPOWER</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {places.map((place) => (
                    <TableRow key={place.zip}>
                      <TableCell>
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span translate="no">{place.zip}</span>
                          {place.triage ? (
                            <Badge variant="breach">Priority</Badge>
                          ) : (
                            <Badge variant="clear">{place.band} min</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{place.minutes}</TableCell>
                      <TableCell>{place.empower}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <AuditTrail plan={plan} />
    </div>
  )
}

function AuditTrail({ plan }: { plan: Plan }) {
  if (plan.audit_trail.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit</CardTitle>
        <CardDescription>
          Thread <span translate="no">{plan.thread_id}</span> · pass {plan.iteration}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {plan.audit_trail.map((entry) => (
            <li key={`${entry.iteration}-${entry.result}`} className="text-sm leading-6">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Pass {entry.iteration}
              </span>{" "}
              <span className="capitalize">{entry.result.replaceAll("_", " ")}</span>
              {entry.errors && entry.errors.length > 0 ? (
                <span className="text-muted-foreground"> — {entry.errors.join("; ")}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
