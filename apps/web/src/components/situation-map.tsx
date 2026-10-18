import { useEffect, useRef } from "react"
import { animate, createDrawable } from "animejs"
import type { Docket } from "../types"
import { reducedMotion } from "../lib/motion"

const FRAME = { minLat: 30.03, maxLat: 30.28, minLon: -97.54, maxLon: -97.16 }
const FLOOD = { minLat: 30.05, maxLat: 30.12, minLon: -97.4, maxLon: -97.3 }
const WIDTH = 800
const HEIGHT = 520
const PAD = { left: 56, top: 28, right: 24, bottom: 36 }
const LATS = [30.25, 30.15, 30.05]
const LONS = [-97.5, -97.35, -97.2]

function project(lat: number, lon: number): [number, number] {
  const x = PAD.left + ((lon - FRAME.minLon) / (FRAME.maxLon - FRAME.minLon)) * (WIDTH - PAD.left - PAD.right)
  const y = PAD.top + ((FRAME.maxLat - lat) / (FRAME.maxLat - FRAME.minLat)) * (HEIGHT - PAD.top - PAD.bottom)
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

function pathFrom(points: [number, number][]) {
  return points
    .map(([lat, lon], index) => {
      const [x, y] = project(lat, lon)
      return `${index === 0 ? "M" : "L"}${x} ${y}`
    })
    .join(" ")
}

export function SituationMap({ docket }: { docket: Docket | null }) {
  const floodOrigin = project(FLOOD.maxLat, FLOOD.minLon)
  const floodFar = project(FLOOD.minLat, FLOOD.maxLon)
  const floodWidth = floodFar[0] - floodOrigin[0]
  const floodHeight = floodFar[1] - floodOrigin[1]
  const route = docket?.routing.points
  const routeKey = route?.map((point) => point.join(",")).join("|") ?? ""
  const pathRef = useRef<SVGPathElement>(null)
  const places = docket?.population.places.filter((place) => place.lat != null && place.lon != null) ?? []

  useEffect(() => {
    const path = pathRef.current
    if (!path || !routeKey || reducedMotion()) return
    const motion = animate(createDrawable(path), {
      draw: ["0 0", "0 1"],
      duration: 1100,
      ease: "outCubic",
    })
    return () => {
      motion.revert()
    }
  }, [routeKey])
  const label = docket
    ? `${docket.routing.name} route against ${docket.routing.hazard}`
    : "Bastrop County frame, standing by"

  return (
    <figure className="relative h-full min-h-[420px] bg-background">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <defs>
          <pattern id="rn-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="1" />
          </pattern>
          <pattern id="rn-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink)" strokeWidth="1.25" />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="var(--background)" />
        <rect x={PAD.left} y={PAD.top} width={WIDTH - PAD.left - PAD.right} height={HEIGHT - PAD.top - PAD.bottom} fill="url(#rn-grid)" />
        {LATS.map((lat) => {
          const [, y] = project(lat, FRAME.minLon)
          return (
            <g key={lat}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={8} y={y + 4} fill="var(--muted-foreground)" fontSize="11" fontFamily="IBM Plex Mono, monospace">
                {lat.toFixed(2)}
              </text>
            </g>
          )
        })}
        {LONS.map((lon) => {
          const [x] = project(FRAME.minLat, lon)
          return (
            <text key={lon} x={x} y={HEIGHT - 10} fill="var(--muted-foreground)" fontSize="11" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
              {lon.toFixed(2)}
            </text>
          )
        })}
        <rect x={floodOrigin[0]} y={floodOrigin[1]} width={floodWidth} height={floodHeight} fill="var(--breach)" opacity="0.72" />
        <rect x={floodOrigin[0]} y={floodOrigin[1]} width={floodWidth} height={floodHeight} fill="url(#rn-hatch)" opacity="0.45" />
        <text
          x={floodOrigin[0] + floodWidth / 2}
          y={floodOrigin[1] + floodHeight / 2 + 4}
          textAnchor="middle"
          fill="var(--ink)"
          fontSize="12"
          fontFamily="IBM Plex Mono, monospace"
        >
          FLOOD
        </text>
        {route && route.length > 1 ? (
          <g>
            <path
              ref={pathRef}
              d={pathFrom(route)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {route.map((point, index) => {
              if (index !== 0 && index !== route.length - 1) return null
              const [x, y] = project(point[0], point[1])
              return <rect key={`${point[0]}-${point[1]}`} x={x - 3.5} y={y - 3.5} width="7" height="7" fill="var(--primary)" />
            })}
          </g>
        ) : null}
        {places.map((place) => {
          const [x, y] = project(place.lat!, place.lon!)
          const labelX = x > WIDTH - 90 ? x - 8 : x + 12
          const anchor = x > WIDTH - 90 ? "end" : "start"
          return (
            <g key={place.zip}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={place.triage ? "var(--breach)" : "var(--clear)"}
                stroke="var(--foreground)"
                strokeWidth="1.5"
              />
              <text x={labelX} y={y - 10} textAnchor={anchor} fill="var(--foreground)" fontSize="12" fontFamily="IBM Plex Mono, monospace">
                {place.zip}
              </text>
            </g>
          )
        })}
        <text x={WIDTH - PAD.right} y={18} textAnchor="end" fill="var(--muted-foreground)" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          N
        </text>
        <line x1={WIDTH - PAD.right - 4} y1={22} x2={WIDTH - PAD.right - 4} y2={36} stroke="var(--muted-foreground)" strokeWidth="1" />
      </svg>
      <figcaption className="absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1 border border-border bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Grid 0.10°</span>
        <span>{docket ? docket.routing.hazard : "Flood frame"}</span>
        <span>{route ? `${route.length} vertices` : "No route"}</span>
      </figcaption>
    </figure>
  )
}
