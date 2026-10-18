import type { Plan } from "../types"
import { Alert } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Panel } from "./panel"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

const RULES = [
  ["01", "Residual", "Generation plus net interchange, minus demand, within 1 MW."],
  ["02", "Hazard", "The route stays outside the Colorado River flood polygon."],
  ["03", "Triage", "Priority when emPOWER is above zero and travel exceeds 20 minutes."],
] as const

export function RecordBand({
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
  return (
    <div className="grid min-h-0 border-border lg:col-span-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:overflow-auto">
      <Places plan={plan} pending={pending} failed={failed} onRetry={onRetry} />
      <Log plan={plan} pending={pending} />
    </div>
  )
}

function Places({
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
  const places = plan?.docket?.population.places

  if (failed) {
    return (
      <Panel label="Population" className="border-b lg:border-r lg:border-b-0">
        <div className="p-4">
          <Alert tone="error" title="The Plan Did Not Return">
            <p>The evaluator did not answer. Check that the API is up, then run the balance again.</p>
            <Button type="button" className="mt-4" onClick={onRetry}>
              Try Again
            </Button>
          </Alert>
        </div>
      </Panel>
    )
  }

  if (plan && !plan.docket && !pending) {
    return (
      <Panel label="Rejections" className="border-b lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm leading-6">Three passes failed the gates. Nothing on this board is certified.</p>
          {plan.rejection_vector.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rejection text came back with this review.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {plan.rejection_vector.map((item) => (
                <li key={item} className="font-mono text-xs leading-5">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    )
  }

  if (!places) {
    return (
      <Panel label="Standing Orders" className="border-b lg:border-r lg:border-b-0">
        <ol className="grid gap-0 sm:grid-cols-3">
          {RULES.map(([index, title, body]) => (
            <li key={index} className="flex flex-col gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
              <span className="font-mono text-[11px] tracking-[0.14em] text-primary">{index}</span>
              <span className="font-mono text-sm uppercase tracking-[0.08em]">{title}</span>
              <span className="text-sm leading-5 text-muted-foreground">{body}</span>
            </li>
          ))}
        </ol>
      </Panel>
    )
  }

  return (
    <Panel label="Triage" className="border-b lg:border-r lg:border-b-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ZIP</TableHead>
            <TableHead>Min</TableHead>
            <TableHead>Band</TableHead>
            <TableHead>emPOWER</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {places.map((place) => (
            <TableRow key={place.zip}>
              <TableCell translate="no">{place.zip}</TableCell>
              <TableCell>{place.minutes}</TableCell>
              <TableCell>
                {place.triage ? <Badge variant="breach">Priority</Badge> : <Badge variant="clear">{place.band} min</Badge>}
              </TableCell>
              <TableCell>{place.empower}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

function Log({ plan, pending }: { plan: Plan | undefined; pending: boolean }) {
  return (
    <Panel label="Log">
      <div className="flex flex-col gap-3 p-4">
        {pending ? <p className="font-mono text-xs text-muted-foreground">Checking the balance…</p> : null}
        {plan?.docket ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">{plan.docket.plan}</pre>
        ) : null}
        {plan && plan.audit_trail.length > 0 ? (
          <ol className="flex flex-col gap-2 border-t border-border pt-3">
            {plan.audit_trail.map((entry) => (
              <li key={`${entry.iteration}-${entry.result}`} className="font-mono text-xs leading-5">
                <span className="text-muted-foreground">Pass {entry.iteration}</span> {entry.result.replaceAll("_", " ")}
                {entry.errors && entry.errors.length > 0 ? (
                  <span className="text-muted-foreground"> — {entry.errors.join("; ")}</span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : !pending ? (
          <p className="text-sm leading-5 text-muted-foreground">
            The log stays empty until a pass is certified or sent for review.
          </p>
        ) : null}
        {plan ? (
          <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground" translate="no">
            {plan.thread_id}
          </p>
        ) : null}
      </div>
    </Panel>
  )
}
