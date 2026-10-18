import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { useTheme } from "../lib/theme"
import { cn } from "../lib/cn"

const LINKS = [
  { to: "/#overview", label: "Overview" },
  { to: "/#capabilities", label: "Capabilities" },
  { to: "/#method", label: "Method" },
] as const

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const theme = useTheme()

  return (
    <header className="sticky top-0 z-30 border-b border-hard/20 bg-background/90 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid size-10 place-items-center rounded-xl border-2 border-hard bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--accent)]" aria-hidden="true">
            <svg viewBox="0 0 16 16" className="size-5">
              <path d="M9 1 3 9h5l-1 6 6-8H8l1-6Z" fill="currentColor" />
            </svg>
          </span>
          <span className="brutal-display truncate text-2xl tracking-tight">ResilioNet</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 rounded-xl border border-hard/15 bg-card/70 p-1.5 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.to} href={link.to} className="nav-link min-h-9 rounded-lg px-3">
              {link.label}
            </a>
          ))}
          <NavLink to="/operations" className={({ isActive }) => cn("nav-link min-h-9 rounded-lg px-3", isActive && "bg-secondary text-secondary-foreground")}>
            Operations
          </NavLink>
        </nav>
        <button type="button" className="nav-control hidden bg-card md:inline-flex" aria-pressed={theme.theme === "light"} aria-label={theme.nextLabel} onClick={theme.toggle}>
          {theme.buttonLabel}
        </button>
        <Link to="/operations" className="nav-control nav-control-primary hidden md:inline-flex" >
          Open the board
        </Link>
        <button type="button" className="nav-control ml-auto bg-card md:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 md:hidden" aria-label="Mobile">
          {LINKS.map((link) => (
            <a key={link.to} href={link.to} className="nav-link w-full" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link to="/operations" className="nav-link w-full" onClick={() => setOpen(false)}>
            Operations
          </Link>
          <button type="button" className="nav-link w-full justify-start" onClick={theme.toggle}>
            {theme.nextLabel}
          </button>
        </nav>
      ) : null}
    </header>
  )
}
