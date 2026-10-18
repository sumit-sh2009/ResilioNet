import { useEffect, useState, type RefObject } from "react"
import { animate, stagger } from "animejs"

export function useReveal(root: RefObject<HTMLElement | null>) {
  const [shown, setShown] = useState(reducedMotion)

  useEffect(() => {
    const node = root.current
    if (!node || reducedMotion()) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { threshold: 0.18 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [root])

  return shown
}

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useSettle(root: RefObject<HTMLElement | null>, token: string) {
  useEffect(() => {
    const node = root.current
    if (!node || reducedMotion()) return
    const rows = node.querySelectorAll<HTMLElement>("[data-settle]")
    if (rows.length === 0) return
    const motion = animate(rows, {
      opacity: [0.4, 1],
      duration: 380,
      delay: stagger(48),
      ease: "outCubic",
    })
    return () => {
      motion.revert()
    }
  }, [root, token])
}
