/** Published Bastrop fixture. Landing metrics use these values and say so. The operations board does not. */

export const FIXTURE = {
  county: "Bastrop County, TX",
  authority: "ERCOT",
  snapshot: "2024-07-08T18:00:00Z",
  demandMw: 42_000,
  generationMw: 40_000,
  interchangeMw: 2_000,
  hazard: {
    name: "Colorado River flood",
    minLat: 30.05,
    maxLat: 30.12,
    minLon: -97.4,
    maxLon: -97.3,
  },
  frame: {
    minLat: 30.02,
    maxLat: 30.32,
    minLon: -97.58,
    maxLon: -97.12,
  },
  places: [
    { zip: "78602", minutes: 28, empower: 42, lat: 30.11, lon: -97.315 },
    { zip: "78612", minutes: 12, empower: 5, lat: 30.25, lon: -97.2 },
  ],
} as const

export const RESIDUAL_EQUATION = "Generation plus net interchange, minus demand. The gate passes within 1 MW."

export function fixtureResidualMw() {
  return FIXTURE.generationMw + FIXTURE.interchangeMw - FIXTURE.demandMw
}
