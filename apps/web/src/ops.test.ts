import assert from "node:assert/strict"
import { test } from "node:test"
import { activityFromPlan, gates, operatingMode, planVerdict } from "./ops.ts"
import type { Plan } from "./types.ts"

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    thread_id: "thread-1",
    status: "certified",
    iteration: 1,
    confidence: 1,
    data_source: "cache",
    rejection_vector: [],
    audit_trail: [{ iteration: 1, result: "certified" }],
    docket: {
      degraded: false,
      plan: "plan",
      snapshot_date: "2024-07-08T18:00:00Z",
      grid: {
        demand_mw: 42000,
        generation_mw: 40000,
        net_interchange_mw: 2000,
        residual_mw: 0,
        balanced: true,
        used_interchange: true,
      },
      routing: { name: "detour", hits_hazard: false, hazard: "Colorado River flood" },
      population: { places: [] },
    },
    ...overrides,
  }
}

test("standby before any plan and offline after a failed request", () => {
  assert.equal(operatingMode({ failed: false, plan: undefined }).mode, "standby")
  assert.equal(operatingMode({ failed: true, plan: undefined }).mode, "offline")
})

test("cache, live, and degraded follow the response, not the fact that the page is open", () => {
  assert.equal(operatingMode({ failed: false, plan: plan() }).mode, "cached")
  assert.equal(operatingMode({ failed: false, plan: plan({ data_source: "live" }) }).mode, "live")
  assert.equal(operatingMode({ failed: false, plan: plan({ data_source: "live", confidence: 0.4, docket: { ...plan().docket!, degraded: true } }) }).mode, "degraded")
})

test("standby gates wait for a request instead of failing one", () => {
  const view = gates({ pending: false, failed: false, plan: undefined })
  assert.deepEqual(
    view.map((item) => item.state),
    ["awaiting", "awaiting", "awaiting"],
  )
})

test("a closed residual and a clear route pass; a flood intersection blocks hazard", () => {
  const clear = gates({ pending: false, failed: false, plan: plan() })
  assert.deepEqual(clear.map((item) => item.state), ["passed", "passed", "passed"])

  const blocked = gates({
    pending: false,
    failed: false,
    plan: plan({
      docket: {
        ...plan().docket!,
        routing: { name: "short", hits_hazard: true, hazard: "Colorado River flood" },
      },
    }),
  })
  assert.equal(blocked[1]?.state, "blocked")
})

test("validated is the evaluator result, not a dispatch order", () => {
  assert.match(planVerdict(plan(), false, false).detail, /not a dispatch order/)
  assert.equal(planVerdict(undefined, false, false).label, "Not run")
  assert.equal(planVerdict(plan(), false, false).label, "Validated")
})

test("a failed retry keeps the previous plan on the board", () => {
  const stored = plan()
  assert.equal(operatingMode({ failed: true, plan: stored }).mode, "cached")
  assert.equal(planVerdict(stored, true, false).label, "Validated")
  assert.match(planVerdict(stored, true, false).detail, /previous plan/)
  assert.deepEqual(
    gates({ pending: false, failed: true, plan: stored }).map((item) => item.state),
    ["passed", "passed", "passed"],
  )
})

test("a retry in flight does not present the previous pass as the current result", () => {
  const stored = plan()
  assert.equal(operatingMode({ failed: false, pending: true, plan: stored }).mode, "running")
  assert.equal(planVerdict(stored, false, true).label, "Running")
  assert.deepEqual(
    gates({ pending: true, failed: false, plan: stored }).map((item) => item.state),
    ["awaiting", "awaiting", "awaiting"],
  )
})

test("a degraded certified plan is titled degraded", () => {
  const degraded = plan({
    confidence: 0.4,
    docket: { ...plan().docket!, degraded: true },
  })
  assert.equal(planVerdict(degraded, false, false).label, "Degraded")
  assert.match(planVerdict(degraded, false, false).detail, /not a dispatch order/)
  assert.match(planVerdict(degraded, false, false).detail, /below 0\.8/)
})

test("activity lists the source and each audit pass", () => {
  const items = activityFromPlan(
    plan({
      audit_trail: [
        { iteration: 0, result: "rejected", errors: ["route short intersects Colorado River flood"] },
        { iteration: 1, result: "certified" },
      ],
    }),
    "2026-10-09T14:00:00.000Z",
  )
  assert.equal(items[1]?.category, "source")
  assert.match(items[2]?.detail ?? "", /short intersects/)
  assert.equal(items.every((item) => item.at === "2026-10-09T14:00:00.000Z"), true)
})
