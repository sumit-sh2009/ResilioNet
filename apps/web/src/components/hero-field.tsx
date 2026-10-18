import { useEffect, useRef } from "react"
import { animate, createDrawable } from "animejs"
import { reducedMotion } from "../lib/motion"

export function HeroField() {
  const detourRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = detourRef.current
    if (!path || reducedMotion()) return
    const motion = animate(createDrawable(path), {
      draw: ["0 0", "0 1"],
      duration: 1400,
      ease: "outCubic",
    })
    return () => {
      motion.revert()
    }
  }, [])

  return (
    <figure className="relative min-h-[340px]">
      <svg viewBox="0 0 640 460" className="h-full w-full" role="img" aria-label="Bastrop fixture: a flood frame and a detour that stays outside it.">
        <title>Bastrop fixture</title>
        <g fill="none" stroke="var(--border)" strokeWidth="1">
          <path d="M20 70 C 160 20, 240 130, 360 60 S 540 20, 630 90" />
          <path d="M10 150 C 170 100, 280 210, 400 140 S 560 100, 640 160" />
          <path d="M0 240 C 180 190, 300 310, 430 230 S 580 190, 640 250" />
          <path d="M0 330 C 200 280, 320 390, 460 320 S 600 290, 640 350" />
        </g>
        <rect x="248" y="248" width="148" height="86" fill="var(--breach)" opacity="0.22" stroke="var(--breach)" strokeWidth="1.25" />
        <path d="M292 286 L 258 328 L 214 360" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 5" />
        <path ref={detourRef} d="M520 128 L 410 168 L 118 392" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        <circle cx="292" cy="284" r="5" fill="var(--breach)" />
        <circle cx="548" cy="108" r="5" fill="var(--clear)" />
      </svg>
      <figcaption className="mt-3 text-sm text-muted-foreground">Fixture geography. The solid line is the detour. The dashed line is the route the evaluator rejects.</figcaption>
    </figure>
  )
}
