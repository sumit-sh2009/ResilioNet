export function Mark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M3 11h10M4.5 11V6.5h2.2V11M9.2 11V4.2h2.3V11" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
