import { Button } from "./ui/button"
import { useTheme } from "../lib/theme"

export function ThemeToggle() {
  const theme = useTheme()

  return (
    <Button type="button" variant="outline" aria-pressed={theme.theme === "light"} aria-label={theme.nextLabel} onClick={theme.toggle}>
      {theme.buttonLabel}
    </Button>
  )
}
