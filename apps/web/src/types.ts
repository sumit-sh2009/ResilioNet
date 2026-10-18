export type Place = {
  zip: string
  minutes: number
  empower: number
  band: number
  triage: boolean
  lat?: number
  lon?: number
}

export type Grid = {
  demand_mw: number
  generation_mw: number
  net_interchange_mw: number
  residual_mw: number
  balanced?: boolean
  used_interchange?: boolean
}

export type Routing = {
  name: string
  hits_hazard: boolean
  hazard: string
  points?: [number, number][]
}

export type MapBounds = {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

export type Docket = {
  degraded: boolean
  plan: string
  county?: string
  snapshot_date?: string
  grid: Grid
  routing: Routing
  population: { places: Place[] }
  map?: {
    bounds?: MapBounds
    hazard_bounds?: MapBounds
  }
}

export type AuditEntry = {
  iteration: number
  result: string
  errors?: string[]
}

export type Plan = {
  thread_id: string
  status: string
  iteration: number
  confidence: number | null
  data_source: string | null
  rejection_vector: string[]
  audit_trail: AuditEntry[]
  docket: Docket | null
}
