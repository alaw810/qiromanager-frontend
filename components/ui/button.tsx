import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * QIROMANAGER CLINICAL BUTTONS
 * Modern healthcare-inspired:
 * - softer primary color
 * - subtle shadows
 * - calmer interactions
 * - cleaner outlines
 * - premium hover states
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 dark:focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        /* Primary — clean medical blue */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm hover:shadow-md hover:shadow-primary/10",

        /* Destructive — soft medical red */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/85 shadow-sm hover:shadow-md hover:shadow-destructive/20",

        /* Outline — modern clinical */
        outline:
          "border border-border bg-card hover:bg-accent hover:text-accent-foreground shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        /* Secondary — subtle healthcare neutral */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/75 shadow-sm",

        /* Ghost — ultra-light clean button */
        ghost:
          "text-foreground hover:bg-accent hover:text-primary transition-colors dark:hover:bg-accent/40",

        /* Link — clean blue underline style */
        link: "text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 rounded-md",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
