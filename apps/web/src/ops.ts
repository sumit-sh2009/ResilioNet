import type { Plan } from "./types"

export type OperatingMode = "standby" | "running" | "live" | "cached" | "degraded" | "offline"

export type GateState = "passed" | "warning" | "blocked" | "awaiting" | "failed"

export type GateId = "balance" | "hazard" | "confidence"

export type GateView = {
  id: GateId
  label: string
  state: GateState
  value: string
  reason: string
}

export type ActivityCategory = "validation" | "source" | "review"

export type ActivitySeverity = "info" | "warning" | "fault"

export type Activity = {
  id: string
  at: string
  category: ActivityCategory
  severity: ActivitySeverity
  title: string
  detail: string
}

const STATE_LABEL: Record<GateState, string> = {
  passed: "Passed",
  warning: "Warning",
  blocked: "Blocked",
  awaiting: "Awaiting data",
  failed: "Validation failed",
}

export function gateStateLabel(state: GateState) {
  return STATE_LABEL[state]
}

export function operatingMode(input: { failed: boolean; pending?: boolean; plan: Plan | undefined }): {
  mode: OperatingMode
  label: string
  detail: string
} {
  if (input.pending) {
    return {
      mode: "running",
      label: "Running",
      detail: input.plan
        ? "A plan request is in flight. Readings stay on the last returned plan."
        : "A plan request is in flight. No snapshot yet.",
    }
  }
  if (input.failed && !input.plan) {
    return {
      mode: "offline",
      label: "Offline",
      detail: "The plan request did not return. No snapshot is available.",
    }
  }
  const plan = input.plan
  if (!plan) {
    return {
      mode: "standby",
      label: "Standby",
      detail: "No plan has been requested in this session.",
    }
  }
  if (plan.docket?.degraded || (plan.confidence != null && plan.confidence < 0.8)) {
    return {
      mode: "degraded",
      label: "Degraded",
      detail: "Confidence is below 0.8. The evaluator treated this pass as a cache fallback.",
    }
  }
  if (plan.data_source === "live") {
    return {
      mode: "live",
      label: "Live",
      detail: "The response is marked live. Workers still load the Bastrop fixture megawatts; the EIA hourly series is not parsed.",
    }
  }
  return {
    mode: "cached",
    label: "Cached",
    detail: "data_source is cache. These megawatts are the published Bastrop fixture, not a live EIA series.",
  }
}

export function planVerdict(plan: Plan | undefined, failed: boolean, pending: boolean) {
  if (pending) {
    return {
      label: "Running",
      detail: plan
        ? "A request is in flight. The readings are the previous plan."
        : "The evaluator has not returned this request.",
    }
  }
  if (failed && !plan) return { label: "Blocked", detail: "The request failed before a docket existed." }
  if (!plan) return { label: "Not run", detail: "Validate a plan to run the balance, hazard, and confidence gates." }
  const verdict = verdictForPlan(plan)
  if (failed) {
    return { label: verdict.label, detail: `${verdict.detail} The latest request failed. This is the previous plan.` }
  }
  return verdict
}

function verdictForPlan(plan: Plan) {
  if (plan.status === "certified" && plan.docket) {
    const degraded = plan.docket.degraded || (plan.confidence != null && plan.confidence < 0.8)
    if (degraded) {
      return {
        label: "Degraded",
        detail: "The evaluator accepted this pass with confidence below 0.8. That is not a dispatch order and not a claim that the county is safe.",
      }
    }
    return {
      label: "Validated",
      detail: "The evaluator accepted this pass. That is not a dispatch order and not a claim that the county is safe.",
    }
  }
  if (plan.status === "human_review" || !plan.docket) {
    return {
      label: "Needs review",
      detail: "The evaluator held the plan. Read the rejection list before treating any route as usable.",
    }
  }
  return { label: plan.status, detail: "The API returned a status this board does not rank as validated." }
}

export function gates(input: { pending: boolean; failed: boolean; plan: Plan | undefined }): GateView[] {
  if (input.pending) {
    const prior = Boolean(input.plan)
    return [
      gate("balance", "awaiting", "Awaiting data", prior ? "A request is in flight. Readings stay on the previous plan until this one returns." : "Residual must close within 1 MW, with interchange included."),
      gate("hazard", "awaiting", "Awaiting data", prior ? "The route on the map is from the previous plan." : "The route has to stay outside the flood frame."),
      gate("confidence", "awaiting", "Awaiting data", prior ? "Source and confidence update when this request returns." : "The response will name cache or live, plus a confidence value."),
    ]
  }
  if (input.failed && !input.plan) {
    return [
      gate("balance", "failed", "Validation failed", "The evaluator did not answer."),
      gate("hazard", "failed", "Validation failed", "No route was returned."),
      gate("confidence", "failed", "Validation failed", "Source, timestamp, and confidence are unknown for this request."),
    ]
  }
  const plan = input.plan
  if (!plan) {
    return [
      gate("balance", "awaiting", "Awaiting data", "Residual must close within 1 MW, with interchange included."),
      gate("hazard", "awaiting", "Awaiting data", "The route has to stay outside the flood frame."),
      gate("confidence", "awaiting", "Awaiting data", "The response will name cache or live, plus a confidence value."),
    ]
  }
  const docket = plan.docket
  if (!docket) {
    const reasons = plan?.rejection_vector ?? []
    return [
      gate("balance", "blocked", "Needs review", reasons.find((item) => item.includes("residual") || item.includes("interchange")) ?? "No certified residual."),
      gate("hazard", "blocked", "Needs review", reasons.find((item) => item.includes("route") || item.includes("hazard")) ?? "No route cleared the flood frame."),
      gate("confidence", "awaiting", "Awaiting data", plan ? `${plan.rejection_vector.length} rejections on the last pass.` : "No snapshot has been requested."),
    ]
  }

  const balance: GateState = docket.grid.balanced ? "passed" : "blocked"
  const hazard: GateState = docket.routing.hits_hazard ? "blocked" : "passed"
  const confidence: GateState = docket.degraded ? "warning" : plan.confidence == null ? "awaiting" : "passed"

  return [
    gate(
      "balance",
      balance,
      docket.grid.balanced ? "Passed" : "Blocked",
      docket.grid.used_interchange ? "Interchange is in the residual." : "Interchange was dropped from the residual.",
    ),
    gate(
      "hazard",
      hazard,
      docket.routing.hits_hazard ? "Blocked" : "Passed",
      docket.routing.hits_hazard ? `${docket.routing.name} intersects ${docket.routing.hazard}.` : `${docket.routing.name} stays outside ${docket.routing.hazard}.`,
    ),
    gate(
      "confidence",
      confidence,
      confidence === "passed" ? "Passed" : confidence === "warning" ? "Warning" : "Awaiting data",
      docket.degraded ? "The live feed missed the 1,500 ms budget." : "The fixture held for this pass.",
    ),
  ]
}

function gate(id: GateId, state: GateState, value: string, reason: string): GateView {
  const label = id === "balance" ? "Balance" : id === "hazard" ? "Hazard" : "Confidence"
  return { id, label, state, value, reason }
}

export function activityFromPlan(plan: Plan, at: string): Activity[] {
  const source = plan.data_source ?? "unspecified"
  const items: Activity[] = [
    {
      id: `${plan.thread_id}-done`,
      at,
      category: "validation",
      severity: plan.docket ? "info" : "warning",
      title: plan.docket ? "Validation completed" : "Validation held",
      detail: `Status ${plan.status}. Thread ${plan.thread_id}.`,
    },
    {
      id: `${plan.thread_id}-source`,
      at,
      category: "source",
      severity: plan.docket?.degraded ? "warning" : "info",
      title: "Source recorded",
      detail: `${source}, confidence ${plan.confidence ?? "missing"}${plan.docket?.snapshot_date ? `, snapshot ${plan.docket.snapshot_date}` : ""}.`,
    },
  ]
  for (const entry of plan.audit_trail) {
    const errors = entry.errors?.join("; ")
    items.push({
      id: `${plan.thread_id}-pass-${entry.iteration}-${entry.result}`,
      at,
      category: "validation",
      severity: entry.result === "certified" ? "info" : "warning",
      title: `Pass ${entry.iteration} ${entry.result}`,
      detail: errors || "The evaluator recorded this pass without an error list.",
    })
  }
  return items
}
