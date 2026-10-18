const megawatts = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const confidence = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
const when = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function formatCount(value: number) {
  return megawatts.format(value)
}

export function formatMw(value: number) {
  return `${megawatts.format(value)}\u00a0MW`
}

export function formatConfidence(value: number | null) {
  if (value == null) return "—"
  return confidence.format(value)
}

export function formatSnapshot(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${when.format(date)} UTC`
}
