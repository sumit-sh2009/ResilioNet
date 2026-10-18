import { useState } from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Grid } from "../types"
import { formatCount, formatSnapshot } from "../format"

const SERIES = [
  { id: "demand", label: "Demand", key: "demand_mw" },
  { id: "generation", label: "Generation", key: "generation_mw" },
  { id: "interchange", label: "Net interchange", key: "net_interchange_mw" },
] as const

const chartConfig = {
  demand: { label: "Demand", color: "var(--series-demand)" },
  generation: { label: "Generation", color: "var(--series-generation)" },
  interchange: { label: "Net interchange", color: "var(--series-interchange)" },
} satisfies ChartConfig

export function SnapshotBars({ grid, snapshot }: { grid: Grid | null; snapshot: string | undefined }) {
  const [visible, setVisible] = useState<Record<(typeof SERIES)[number]["id"], boolean>>({
    demand: true,
    generation: true,
    interchange: true,
  })

  if (!grid) {
    return (
      <Card className="rounded-2xl border border-dashed border-primary/35 bg-muted/30 py-0 shadow-none">
        <CardHeader className="gap-3 p-6 sm:p-8">
          <p className="eyebrow">No snapshot loaded</p>
          <CardTitle className="font-serif text-3xl uppercase">Grid snapshot</CardTitle>
          <CardDescription className="max-w-xl text-base leading-6">
            No snapshot yet. Validate a plan to compare demand, generation, and interchange. Hourly history and forecasts are not connected.
          </CardDescription>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {["Demand", "Generation", "Interchange"].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="eyebrow text-muted-foreground">{item}</p>
                <p className="mt-2 font-mono text-xl text-muted-foreground">— <span className="text-xs">MW</span></p>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>
    )
  }

  const shown = SERIES.filter((series) => visible[series.id])
  const rows = shown.map((series) => ({
    series: series.label,
    key: series.id,
    mw: grid[series.key],
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Returned result</p>
          <h3 className="mt-1 font-serif text-2xl font-semibold uppercase">Grid snapshot</h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        One observation{snapshot ? ` at ${formatSnapshot(snapshot)}` : ""}. This is not a trend and not a forecast. Residual is generation plus net interchange minus demand.
        </p>
      </div>
      <fieldset className="flex flex-wrap gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <legend className="sr-only">Series</legend>
        {SERIES.map((series) => (
          <label key={series.id} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm transition-colors hover:bg-muted">
            <input
              type="checkbox"
              checked={visible[series.id]}
              onChange={() => setVisible((current) => ({ ...current, [series.id]: !current[series.id] }))}
            />
            {series.label}
          </label>
        ))}
      </fieldset>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Choose at least one series. The table below still lists every value.</p>
      ) : (
        <ChartContainer config={chartConfig} className="snapshot-chart aspect-auto h-56 w-full max-w-3xl rounded-xl border border-hard/20 bg-card p-4 text-card-foreground shadow-[0_14px_30px_color-mix(in_srgb,var(--foreground)_7%,transparent)]" aria-hidden="true">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="series" width={120} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="mw" barSize={18} radius={0}>
              {rows.map((row) => (
                <Cell key={row.key} fill={`var(--color-${row.key})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      <Card className="rounded-none py-0 shadow-[4px_4px_0_0_var(--hard)]">
        <CardHeader className="border-b-2 border-hard">
          <CardTitle className="font-serif text-xl uppercase">Megawatt table</CardTitle>
          <CardDescription>Residual uses generation plus net interchange minus demand.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Megawatt snapshot.</caption>
            <thead>
              <tr className="border-b-2 border-hard text-sm text-muted-foreground">
                <th scope="col" className="py-3 font-medium">Series</th>
                <th scope="col" className="py-3 font-medium">MW</th>
              </tr>
            </thead>
            <tbody>
              {SERIES.map((series) => (
                <tr key={series.id} className="border-b border-border">
                  <th scope="row" className="py-3 font-normal">{series.label}</th>
                  <td className="py-3 font-mono tabular-nums">{formatCount(grid[series.key])}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-3 font-normal">Residual</th>
                <td className="py-3 font-mono tabular-nums">{formatCount(grid.residual_mw)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
