import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        breach: "border-transparent bg-[var(--breach)] text-white",
        clear: "border-transparent bg-[var(--clear)] text-white",
        review: "border-transparent bg-[var(--review)] text-[var(--ink)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
