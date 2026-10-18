import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BorderBeam } from "@/components/ui/border-beam"
import { Marquee } from "@/components/ui/marquee"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { SiteNav } from "../components/site-nav"
import { FIXTURE, fixtureResidualMw } from "../fixture"
import { formatMw, formatSnapshot } from "../format"

const MARQUEE = [
  "ERCOT",
  "Bastrop County",
  "Fixture 8 Jul 2024",
  "Residual 0 MW",
  "Detour",
  "Colorado River flood",
  "ZIP 78602",
  "ZIP 78612",
]

const FEATURES = [
  ["01", "Grid", "Generation plus interchange minus demand. Dropping interchange fails the gate."],
  ["02", "Hazard", "The short route enters the flood frame. The detour does not. This is not a live weather polygon."],
  ["03", "Coverage", "Priority means an emPOWER count above zero and travel over 20 minutes. Counts stay at ZIP resolution."],
  ["04", "Planning", "The first pass is meant to fail. A clean retry can be validated. A third failure waits for a person."],
] as const

export function Landing() {
  const [marqueePaused, setMarqueePaused] = useState(false)

  useEffect(() => {
    document.title = "ResilioNet"
  }, [])

  return (
    <div className="brutal min-h-svh">
      <ScrollProgress />
      <a href="#overview" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-black focus:px-4 focus:py-3 focus:text-white">
        Skip to overview
      </a>
      <SiteNav />
      <main>
        <section id="overview" className="brutal-dots relative overflow-hidden border-b border-hard/20">
          <Confetti />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-28">
            <div>
              <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-2"><span className="size-2 rounded-full bg-primary" /> Bastrop County · ERCOT fixture</p>
              <h1 className="mt-6 max-w-xl text-5xl text-foreground md:text-7xl lg:text-[5.4rem]">
                See infrastructure risk before it becomes a <span className="brutal-outline">crisis.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
                ResilioNet connects grid conditions, severe weather, emergency-response coverage, and community vulnerability so a team can investigate a plan before conditions deteriorate.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/operations" className="brutal-press inline-flex min-h-12 items-center rounded-lg bg-primary px-6 font-bold text-primary-foreground">
                  Open the board
                </Link>
                <a href="#method" className="brutal-press-sm inline-flex min-h-12 items-center rounded-lg bg-card px-6 font-bold text-card-foreground">
                  How a plan is made
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex -space-x-2" aria-hidden="true">
                  <span className="grid size-8 place-items-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground">G</span>
                  <span className="grid size-8 place-items-center rounded-full border-2 border-background bg-accent text-xs font-bold">W</span>
                  <span className="grid size-8 place-items-center rounded-full border-2 border-background bg-secondary text-xs font-bold">R</span>
                </span>
                <span>One shared picture for grid, weather, and response teams.</span>
              </div>
            </div>
            <BoardMock />
          </div>
        </section>

        <section className="overflow-hidden border-b border-black/20 bg-[#10241f] py-4" aria-label="What this fixture contains">
          <div className="mx-auto flex max-w-6xl justify-end px-4">
            <button
              type="button"
              className="min-h-11 font-bold text-[#b7c6c2]"
              aria-pressed={marqueePaused}
              onClick={() => setMarqueePaused((paused) => !paused)}
            >
              {marqueePaused ? "Play names" : "Pause names"}
            </button>
          </div>
          <Marquee paused={marqueePaused} repeat={2} className="p-0 [--duration:28s] [--gap:2.5rem]">
            {MARQUEE.map((item) => (
              <span key={item} className="brutal-display text-3xl text-[#b7c6c2]">{item}</span>
            ))}
          </Marquee>
        </section>

        <section className="brutal-dots relative border-b border-hard/20 bg-background text-foreground" aria-labelledby="passes-title">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:px-6 lg:grid-cols-2">
            <h2 id="passes-title" className="sr-only">The first pass and the retry</h2>
            <article className="surface-card rounded-3xl border-dashed p-6">
              <h3 className="text-3xl">The first pass</h3>
              <ul className="mt-4 space-y-2 text-lg">
                <li>Interchange is dropped.</li>
                <li>Residual is −2,000 MW.</li>
                <li>The short route enters the flood frame.</li>
              </ul>
            </article>
            <article className="rounded-3xl border-2 border-hard bg-accent p-6 text-accent-foreground shadow-[8px_8px_0_0_var(--hard)]">
              <h3 className="text-3xl">The retry</h3>
              <ul className="mt-4 space-y-2 text-lg">
                <li>Interchange stays in the residual.</li>
                <li>Residual closes at {formatMw(fixtureResidualMw())}.</li>
                <li>The detour stays outside the flood frame.</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="capabilities" className="brutal-dots relative border-y border-hard/20 bg-accent text-accent-foreground dark:bg-background dark:text-foreground" aria-labelledby="capabilities-title">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <h2 id="capabilities-title" className="text-5xl text-balance">Four readings</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {FEATURES.map(([index, title, copy]) => (
                <article key={title} className="group surface-card rounded-2xl p-5 text-foreground transition-transform duration-200 hover:-translate-y-1">
                  <span className="grid size-12 place-items-center rounded-xl border-2 border-hard bg-secondary font-bold transition-colors duration-200 group-hover:bg-accent">{index}</span>
                  <h3 className="mt-4 text-3xl">{title}</h3>
                  <p className="mt-2 leading-7">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="method" className="bg-[#10241f] text-[#d5e1dc]" aria-labelledby="method-title">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <h2 id="method-title" className="text-5xl text-white">How a plan is made</h2>
            <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:before:absolute md:before:top-8 md:before:right-[16%] md:before:left-[16%] md:before:h-1 md:before:bg-[#b7c6c2]/45">
              {[
                ["#b7c6c2", "01", "Load", "Workers read the Bastrop fixture. An EIA call exists, and its hourly series is not parsed into these megawatts."],
                ["#ffe17c", "02", "Evaluate", "Residual must match the equation within 1 MW, and the route must stay outside the flood frame. A failure is sent back, up to three times."],
                ["#fff", "03", "Decide", "A clean pass is validated. A third failure is held for a person. Nothing is dispatched."],
              ].map(([ring, index, title, copy]) => (
                <li key={title}>
                  <span className="relative z-10 grid size-16 place-items-center rounded-full border-4 bg-[#171e19] text-lg font-bold text-white" style={{ borderColor: ring }}>{index}</span>
                  <h3 className="mt-4 text-3xl text-white">{title}</h3>
                  <p className="mt-2 leading-7">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="brutal-dots relative border-b border-hard/20 bg-background text-foreground" aria-labelledby="who-title">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <h2 id="who-title" className="text-5xl">Who the board is for</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="border-2 border-black bg-[#b7c6c2] p-5 text-black dark:border-hard">
                <p className="inline-flex border-2 border-black bg-white px-2 py-0.5 text-sm font-bold dark:border-hard dark:bg-background dark:text-foreground">Operations</p>
                <h3 className="mt-4 text-3xl">County desk</h3>
                <p className="mt-2 leading-7">Sees whether a route clears the flood frame and which ZIP aggregate is priority.</p>
              </article>
              <article className="border-2 border-black bg-[#ffe17c] p-5 text-black shadow-[8px_8px_0_0_#000] dark:border-hard dark:shadow-[8px_8px_0_0_var(--hard)]">
                <p className="inline-flex border-2 border-black bg-white px-2 py-0.5 text-sm font-bold dark:border-hard dark:bg-background dark:text-foreground">Grid</p>
                <h3 className="mt-4 text-3xl">Balancing</h3>
                <p className="mt-2 leading-7">Checks that interchange was kept and the residual closed within 1 MW.</p>
              </article>
              <article className="border-2 border-black bg-[#272727] p-5 text-white dark:border-hard">
                <p className="inline-flex border-2 border-white px-2 py-0.5 text-sm font-bold dark:border-hard">Review</p>
                <h3 className="mt-4 text-3xl text-white">A person</h3>
                <p className="mt-2 leading-7 text-white">Reads a held plan. Recording a review stays in the browser. Crews are not dispatched.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="brutal-dots relative border-b-2 border-hard bg-[#b7c6c2] text-black dark:bg-background dark:text-foreground" aria-labelledby="limits-title">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <h2 id="limits-title" className="text-5xl">What this page will not claim</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["Cache", `These megawatts are the fixture dated ${formatSnapshot(FIXTURE.snapshot)}, not a live EIA series.`],
                ["Hazard", "The flood frame is a rectangle in the fixture. It is not an outage and not a road closure."],
                ["Approval", "Validated means the evaluator accepted the math and the route. It is not a dispatch order."],
              ].map(([title, copy]) => (
                <article key={title} className="border-2 border-black bg-white p-5 [border-bottom-left-radius:1.5rem] [border-top-right-radius:1.5rem] dark:border-hard dark:bg-background dark:text-foreground">
                  <h3 className="text-3xl">{title}</h3>
                  <p className="mt-2 leading-7">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="brutal-dots relative border-y-2 border-hard bg-[#ffe17c] text-black dark:bg-background dark:text-foreground">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
            <h2 className="text-5xl text-balance md:text-6xl">Open the county board</h2>
            <p className="mt-4 text-lg">It starts on standby. Readings appear after you validate a plan.</p>
            <Link
              to="/operations"
              className="brutal-press mt-8 inline-flex min-h-12 items-center justify-center bg-black px-6 font-bold text-white dark:bg-primary dark:text-primary-foreground"
            >
              Open the board
            </Link>
          </div>
        </section>
      </main>
      <footer className="bg-[#171e19] text-[#b7c6c2]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <p className="brutal-display text-3xl text-white">ResilioNet</p>
          <a href="#method" className="min-h-11 font-bold text-white">Method</a>
          <a href="#access" className="min-h-11 font-bold text-white">Accessibility</a>
          <Link to="/operations" className="min-h-11 font-bold text-[#ffe17c]">Operations</Link>
        </div>
        <p id="access" className="mx-auto max-w-6xl px-4 pb-10 text-sm leading-6 md:px-6">
          The map is a convenience. Findings are listed beside it. Status uses words as well as color. Motion on this page stops when the system asks for reduced motion.
        </p>
      </footer>
    </div>
  )
}

function BoardMock() {
  return (
    <figure className="surface-card relative overflow-hidden rounded-2xl border-2 border-hard bg-card text-card-foreground shadow-[12px_12px_0_0_var(--hard)]">
      <BorderBeam size={88} duration={9} />
      <div className="flex items-center gap-2 border-b-2 border-hard bg-foreground px-4 py-3">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <figcaption className="ml-3 flex-1 text-sm font-bold text-background">Fixture board · not live</figcaption>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">08 Jul 2024</span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {[
          { label: "Demand", value: FIXTURE.demandMw },
          { label: "Generation", value: FIXTURE.generationMw },
          { label: "Residual", value: fixtureResidualMw() },
        ].map((reading) => (
          <div key={reading.label} className="rounded-xl border border-hard/20 bg-secondary p-3">
            <p className="eyebrow text-foreground">{reading.label}</p>
            <NumberTicker value={reading.value} className="brutal-display mt-1 text-3xl text-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">MW</p>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 320 120" className="mx-4 mb-4 h-28 w-[calc(100%-2rem)] rounded-xl border border-hard/20 bg-foreground" role="img" aria-label="Detour staying outside the flood frame">
        <path d="M20 26H300M20 60H300M20 94H300" stroke="#d5e1dc" strokeOpacity="0.16" />
        <rect x="150" y="48" width="70" height="40" fill="#c94f3d" opacity="0.8" stroke="#f4f7f3" strokeWidth="1.5" />
        <path d="M40 90 L120 70 L280 30" fill="none" stroke="#f6c945" strokeWidth="4" strokeLinecap="round" />
        <circle cx="40" cy="90" r="4" fill="#f6c945" />
        <circle cx="280" cy="30" r="4" fill="#f6c945" />
      </svg>
      <div className="flex items-center justify-between border-t border-hard/10 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /> Route clears hazard frame</span>
        <span className="font-mono">READY</span>
      </div>
    </figure>
  )
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-foreground" aria-hidden="true">
      <svg className="confetti confetti-spin left-[8%] top-[18%] size-10" viewBox="0 0 40 40">
        <path d="M4 28c8-16 24-16 32 0" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <svg className="confetti right-[12%] top-[12%] size-12" style={{ animationDelay: "-2s" }} viewBox="0 0 48 48">
        <path d="M8 40 40 8l-8 32L8 40Z" fill="#b7c6c2" stroke="currentColor" strokeWidth="3" />
      </svg>
      <svg className="confetti confetti-spin bottom-[16%] left-[18%] size-14" style={{ animationDelay: "-4s" }} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 5" />
      </svg>
      <svg className="confetti right-[22%] bottom-[20%] size-12" style={{ animationDelay: "-1s" }} viewBox="0 0 48 48">
        <path d="M8 40 A24 24 0 0 1 40 8" fill="none" stroke="currentColor" strokeWidth="6" />
      </svg>
      <svg className="confetti left-[42%] top-[8%] size-16" style={{ animationDelay: "-3s" }} viewBox="0 0 64 24">
        <path d="M2 18 14 6l12 12 12-12 12 12" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <svg className="confetti confetti-spin right-[6%] top-[42%] size-14" style={{ animationDelay: "-5s" }} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="18" fill="#ffe17c" stroke="currentColor" strokeWidth="3" />
        <path d="M28 10v36M10 28h36M15 15l26 26M41 15 15 41" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  )
}
