import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type WorkspaceTab<ID extends string = string> = {
  id: ID
  label: string
  panel: ReactNode
}

type BoardWorkspaceProps<ID extends string> = {
  tabs: readonly WorkspaceTab<ID>[]
  value: ID
  onValueChange: (id: ID) => void
  title?: string
  lead?: string
  className?: string
}

export function BoardWorkspace<ID extends string>({
  tabs,
  value,
  onValueChange,
  title = "Workspace",
  lead,
  className,
}: BoardWorkspaceProps<ID>) {
  return (
    <section id="workspace" className={`ops-workspace scroll-mt-40 ${className ?? ""}`}>
      <header className="workspace-heading mb-7 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] md:items-end">
        <div>
          <p className="eyebrow">Command surface</p>
          <h2 id="workspace-title" className="brutal-display mt-2 text-4xl leading-none md:text-5xl">{title}</h2>
        </div>
        {lead ? <p className="max-w-xl text-sm leading-6 text-muted-foreground md:justify-self-end md:text-right">{lead}</p> : null}
      </header>
      <Tabs value={value} onValueChange={(next) => onValueChange(next as ID)} className="ops-tabs">
        <TabsList variant="brutal" className="px-2 sm:px-3">
          {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id} className="workspace-tab min-h-10 flex-none rounded-lg px-3 sm:px-4">{tab.label}</TabsTrigger>)}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="px-4 py-6 outline-none sm:px-7 sm:py-8">
            {tab.panel}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
