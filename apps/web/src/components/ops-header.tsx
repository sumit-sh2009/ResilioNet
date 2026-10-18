import { Link } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import { Badge } from "./ui/badge"
import { useTheme } from "../lib/theme"
import { cn } from "../lib/cn"
import type { OperatingMode } from "../ops"

const BOARD_LINKS = [
  { href: "#readings", label: "Readings" },
  { href: "#map", label: "Map" },
  { href: "#workspace", label: "Workspace" },
] as const

const MODE_BADGE: Record<
  OperatingMode,
  "outline" | "review" | "clear" | "secondary" | "breach" | "default"
> = {
  standby: "outline",
  running: "review",
  live: "clear",
  cached: "secondary",
  degraded: "review",
  offline: "breach",
}

type OpsHeaderProps = {
  locationLabel?: string
  locationOptions?: readonly string[]
  selectedLocation: string
  onLocationChange: (location: string) => void
  modeLabel: string
  mode: OperatingMode
  snapshotLabel: string
  validating: boolean
  onValidate: () => void
}

export function OpsHeader({
  locationLabel = "Location pending",
  locationOptions = [],
  selectedLocation,
  onLocationChange,
  modeLabel,
  mode,
  snapshotLabel,
  validating,
  onValidate,
}: OpsHeaderProps) {
  const theme = useTheme()

  return (
    <header className="sticky top-0 z-20 border-b border-hard/25 bg-background/95 text-foreground backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex min-h-16 flex-wrap items-center gap-3 py-2.5 sm:gap-4">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-hard bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--accent)]" aria-hidden="true">
              <svg viewBox="0 0 16 16" className="size-5">
                <path d="M9 1 3 9h5l-1 6 6-8H8l1-6Z" fill="currentColor" />
              </svg>
            </span>
            <span className="brutal-display truncate text-2xl leading-none">ResilioNet</span>
          </Link>

          <Breadcrumb className="hidden min-w-0 md:block">
            <BreadcrumbList className="font-mono text-[11px] uppercase tracking-[0.12em]">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-hard" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-foreground">Operations</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-hard" />
              <BreadcrumbItem>
                <BreadcrumbPage className="min-w-0 max-w-[min(28rem,45vw)] break-words font-bold text-muted-foreground">
                  {locationLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:ml-auto sm:w-auto sm:justify-end">
            <label className="location-picker flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="sr-only">Operating location</span>
              <input
                aria-label="Operating location"
                list="location-options"
                value={selectedLocation}
                onChange={(event) => onLocationChange(event.target.value)}
                placeholder="Country or place"
                className="nav-control min-w-0 flex-1 bg-card text-card-foreground sm:w-44 sm:flex-none"
              />
              <datalist id="location-options">
                {locationOptions.map((location) => <option key={location} value={location} />)}
              </datalist>
            </label>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Snapshot</span>
              <span className="rounded-md border border-hard/30 bg-card px-2.5 py-1 font-mono text-xs tabular-nums text-card-foreground shadow-[2px_2px_0_0_var(--hard)]">
                {snapshotLabel}
              </span>
            </div>
            <Badge variant={MODE_BADGE[mode]} className="min-h-11 rounded-lg px-3 text-xs uppercase tracking-wide">
              {modeLabel}
            </Badge>
            <button
              type="button"
              className="nav-control"
              aria-pressed={theme.theme === "light"}
              aria-label={theme.nextLabel}
              onClick={theme.toggle}
            >
              {theme.buttonLabel}
            </button>
            <button
              type="button"
              className="nav-control nav-control-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              disabled={validating}
              onClick={onValidate}
            >
              {validating ? "Validating…" : "Validate plan"}
            </button>
          </div>
        </div>

        <Separator className="bg-hard" />

        <div className="flex flex-col gap-2 border-t border-border/70 py-2 sm:min-h-14 sm:flex-row sm:items-center sm:justify-between sm:py-2.5">
          <p className="min-w-0 break-words font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:hidden">{locationLabel}</p>
          <NavigationMenu align="start" className="max-w-none flex-1 justify-start">
            <NavigationMenuList className="gap-1 rounded-lg bg-muted/45 p-1">
              {BOARD_LINKS.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink
                    href={link.href}
                    className={cn(
                      "nav-link",
                    )}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <p className="hidden font-mono text-[11px] tabular-nums text-muted-foreground lg:hidden">{snapshotLabel}</p>
        </div>
      </div>
    </header>
  )
}
