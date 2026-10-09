import { useMutation } from "@tanstack/react-query"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"

type Place = { zip: string; minutes: number; empower: number; band: number; triage: boolean }

type Plan = {
  status: string
  iteration: number
  confidence: number | null
  data_source: string | null
  docket: {
    degraded: boolean
    plan: string
    grid: { demand_mw: number; generation_mw: number; net_interchange_mw: number; residual_mw: number }
    routing: { name: string; hits_hazard: boolean; hazard: string }
    population: { places: Place[] }
  } | null
}

export default function App() {
  const plan = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ county: "Bastrop County, TX" }),
      })
      if (!response.ok) throw new Error("plan rejected")
      return (await response.json()) as Plan
    },
  })
  const docket = plan.data?.docket

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">ERCOT · Bastrop County</p>
          <h1 className="font-serif text-6xl uppercase leading-none tracking-wide">ResilioNet</h1>
          <p className="max-w-xl text-muted-foreground">
            Demand, generation, and interchange have to close. The route has to stay out of the flood.
          </p>
        </div>
        <Button type="button" disabled={plan.isPending} onClick={() => plan.mutate()}>
          {plan.isPending ? "Checking the balance…" : "Build plan"}
        </Button>
      </header>

      <svg viewBox="0 0 640 180" className="h-44 w-full rounded-sm border border-border bg-card" role="img" aria-label="Detour north of the flood">
        <rect x="180" y="70" width="160" height="70" fill="#c4492c" opacity="0.85" />
        <text x="196" y="110" fill="#1a1404" fontSize="14">
          flood
        </text>
        <polyline points="40,40 220,30 420,24 600,50" fill="none" stroke="#e0a100" strokeWidth="3" />
        <text x="40" y="28" fill="#e7e1d1" fontSize="13">
          detour
        </text>
      </svg>

      {docket ? (
        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Grid</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 font-mono text-sm">
              <p>Demand {docket.grid.demand_mw} MW</p>
              <p>Generation {docket.grid.generation_mw} MW</p>
              <p>Interchange {docket.grid.net_interchange_mw} MW</p>
              <p>Residual {docket.grid.residual_mw} MW</p>
              <Badge variant={docket.degraded ? "review" : "clear"}>
                {plan.data?.data_source} · confidence {plan.data?.confidence}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-serif text-3xl uppercase">{docket.routing.name}</p>
              <Badge variant={docket.routing.hits_hazard ? "breach" : "clear"}>
                {docket.routing.hits_hazard ? "hits hazard" : "clear of hazard"}
              </Badge>
              <p className="text-sm text-muted-foreground">{docket.routing.hazard}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Triage</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>emPOWER</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docket.population.places.map((place) => (
                    <TableRow key={place.zip}>
                      <TableCell>
                        {place.zip}{" "}
                        {place.triage ? (
                          <Badge variant="breach">priority</Badge>
                        ) : (
                          <Badge variant="clear">{place.band} min</Badge>
                        )}
                      </TableCell>
                      <TableCell>{place.minutes}</TableCell>
                      <TableCell>{place.empower}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <pre className="mt-4 whitespace-pre-wrap rounded-sm bg-muted p-3 font-mono text-xs">{docket.plan}</pre>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
