import { useEffect, useState } from "react"

const STORAGE_KEY = "resilionet.theme.v1"
export type Theme = "dark" | "light"

const listeners = new Set<(theme: Theme) => void>()

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

export function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next
  localStorage.setItem(STORAGE_KEY, next)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f4f7f3" : "#171e19")
  for (const listener of listeners) listener(next)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const listener = (next: Theme) => setTheme(next)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const next: Theme = theme === "dark" ? "light" : "dark"
  return {
    theme,
    toggle() {
      applyTheme(next)
    },
    nextLabel: next === "light" ? "Use light theme" : "Use dark theme",
    buttonLabel: theme === "dark" ? "Light" : "Dark",
  }
}
