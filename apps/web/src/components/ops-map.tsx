import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { animate, createDrawable } from "animejs"
import { FIXTURE } from "../fixture"
import { reducedMotion } from "../lib/motion"
import { useTheme } from "../lib/theme"
import type { Docket, MapBounds } from "../types"

function mapColors() {
  const root = getComputedStyle(document.documentElement)
  return {
    breach: root.getPropertyValue("--breach").trim() || "#d4533a",
    route: root.getPropertyValue("--route").trim() || "#145c4a",
    clear: root.getPropertyValue("--clear").trim() || "#3f6f62",
    foreground: root.getPropertyValue("--foreground").trim() || "#171e19",
  }
}

export type MapSelection = { kind: "flood" } | { kind: "route" } | { kind: "place"; zip: string }

export type MapLayers = { flood: boolean; route: boolean; places: boolean }

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"

function toLeafletBounds(bounds: MapBounds) {
  return L.latLngBounds([bounds.minLat, bounds.minLon], [bounds.maxLat, bounds.maxLon])
}

function coordinatesBounds(docket: Docket | null) {
  const coordinates = [
    ...(docket?.routing.points ?? []),
    ...(docket?.population.places.flatMap((place) => place.lat != null && place.lon != null ? [[place.lat, place.lon] as [number, number]] : []) ?? []),
  ]
  if (coordinates.length === 0) return toLeafletBounds(FIXTURE.frame)
  const bounds = L.latLngBounds(coordinates)
  return bounds.pad(0.2)
}

function frameBounds(docket: Docket | null) {
  return docket?.map?.bounds ? toLeafletBounds(docket.map.bounds) : coordinatesBounds(docket)
}

function hazardBounds(docket: Docket | null) {
  return docket?.map?.hazard_bounds ? toLeafletBounds(docket.map.hazard_bounds) : toLeafletBounds(FIXTURE.hazard)
}

export function OpsMap({
  docket,
  layers,
  selection,
  resetSignal,
  onSelect,
}: {
  docket: Docket | null
  layers: MapLayers
  selection: MapSelection | null
  resetSignal: number
  onSelect: (selection: MapSelection) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const [ready, setReady] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const node = host.current
    if (!node || mapRef.current) return
    const map = L.map(node, { zoomControl: true, attributionControl: true, minZoom: 8, maxZoom: 16 })
    map.fitBounds(frameBounds(docket), { padding: [28, 28], animate: false })
    mapRef.current = map
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(node)
    map.whenReady(() => setReady(true))
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [docket])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const tiles = L.tileLayer(TILES, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    return () => {
      tiles.remove()
    }
  }, [ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const group = L.layerGroup().addTo(map)
    const colors = mapColors()

    if (layers.flood) {
      const rect = L.rectangle(hazardBounds(docket), {
        color: colors.breach,
        weight: selection?.kind === "flood" ? 3 : 1.5,
        fillColor: colors.breach,
        fillOpacity: 0.35,
      })
      rect.on("click", () => onSelectRef.current({ kind: "flood" }))
      rect.bindTooltip(docket?.routing.hazard ?? "Hazard frame", { sticky: true })
      rect.addTo(group)
    }

    const points = docket?.routing.points
    if (layers.route && points && points.length > 1) {
      const line = L.polyline(
        points.map(([lat, lon]) => [lat, lon] as [number, number]),
        {
          color: docket?.routing.hits_hazard ? colors.breach : colors.route,
          weight: selection?.kind === "route" ? 5 : 3,
        },
      )
      line.on("click", () => onSelectRef.current({ kind: "route" }))
      line.bindTooltip(docket?.routing.name ?? "Route", { sticky: true })
      line.addTo(group)
      const path = line.getElement()
      if (path instanceof SVGPathElement && !reducedMotion()) {
        const motion = animate(createDrawable(path), { draw: ["0 0", "0 1"], duration: 1100, ease: "outCubic" })
        line.once("remove", () => motion.cancel())
      }
    }

    if (layers.places && docket) {
      for (const place of docket.population.places) {
        if (place.lat == null || place.lon == null) continue
        const marker = L.circleMarker([place.lat, place.lon], {
          radius: selection?.kind === "place" && selection.zip === place.zip ? 9 : 7,
          color: colors.foreground,
          weight: 1.5,
          fillColor: place.triage ? colors.breach : colors.clear,
          fillOpacity: 0.95,
        })
        marker.on("click", () => onSelectRef.current({ kind: "place", zip: place.zip }))
        marker.bindTooltip(`${place.zip}, ${place.minutes} min`, { sticky: true })
        marker.addTo(group)
      }
    }

    return () => {
      group.remove()
    }
  }, [docket, layers, ready, selection, theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || resetSignal === 0) return
    map.fitBounds(frameBounds(docket), { padding: [28, 28], animate: !reducedMotion() })
  }, [docket, ready, resetSignal])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || resetSignal !== 0) return
    map.fitBounds(frameBounds(docket), { padding: [28, 28], animate: !reducedMotion() })
  }, [docket, ready, resetSignal])

  const selectionKey = !selection ? "" : selection.kind === "place" ? `place:${selection.zip}` : selection.kind

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !selection) return
    const motion = !reducedMotion()
    if (selection.kind === "flood") map.fitBounds(hazardBounds(docket), { padding: [40, 40], animate: motion })
    if (selection.kind === "route" && docket?.routing.points && docket.routing.points.length > 1) {
      map.fitBounds(L.latLngBounds(docket.routing.points.map(([lat, lon]) => [lat, lon])), { padding: [40, 40], animate: motion })
    }
    if (selection.kind === "place") {
      const place = docket?.population.places.find((item) => item.zip === selection.zip)
      if (place?.lat != null && place.lon != null) map.flyTo([place.lat, place.lon], 12, { animate: motion, duration: motion ? 0.6 : 0 })
    }
  }, [docket, ready, selection, selectionKey])

  return <div ref={host} className="h-full min-h-[420px] w-full" role="application" aria-label={`${docket?.county ?? "Operations"} map. Feature details are in the inspector.`} />
}
