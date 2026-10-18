import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Activity, ActivityCategory } from "../ops"
import { formatSnapshot } from "../format"

const FILTERS: { id: "all" | ActivityCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "validation", label: "Validation" },
  { id: "source", label: "Source" },
  { id: "review", label: "Review" },
]

export function ActivityLog({ items }: { items: Activity[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")

  return (
    <div className="activity-log flex flex-col gap-6">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as (typeof FILTERS)[number]["id"])}>
        <TabsList variant="brutal" className="max-w-full">
          {FILTERS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {FILTERS.map((item) => {
          const list = item.id === "all" ? items : items.filter((entry) => entry.category === item.id)
          return (
          <TabsContent key={item.id} value={item.id} className="mt-6 outline-none">
            {list.length === 0 ? (
              <Card className="rounded-none border-dashed py-0 shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-xl uppercase">No events</CardTitle>
                  <CardDescription>
                    {items.length === 0
                      ? "Validating a plan records the request, the source, and each evaluator pass."
                      : "Nothing in this filter yet."}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="rounded-none py-0 shadow-[4px_4px_0_0_var(--hard)]">
                <CardHeader className="activity-log-header border-b-2 border-hard">
                  <CardTitle className="font-serif text-xl uppercase">Session log</CardTitle>
                  <CardDescription className="activity-log-count">{list.length} event{list.length === 1 ? "" : "s"} in this filter.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                  <ol className="flex flex-col">
                    {list.map((item) => (
                      <li key={item.id} className="activity-event border-b-2 border-hard last:border-b-0">
                        <details className="group px-4 sm:px-6">
                          <summary className="activity-event-summary flex min-h-12 cursor-pointer list-none items-baseline justify-between gap-3 py-3">
                            <span className="activity-event-title text-base font-medium">
                              <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{item.severity}</span>
                              {item.title}
                            </span>
                            <time className="activity-event-time shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground" dateTime={item.at}>
                              {formatSnapshot(item.at)}
                            </time>
                          </summary>
                          <p className="pb-4 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                        </details>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
