import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * QIROMANAGER CLINICAL INPUT
 * - soft rounded edges
 * - gentle shadows
 * - medical-grade focus ring
 * - calm hover state
 */

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full h-11 px-4 py-2 text-base md:text-sm",
        "rounded-lg border border-border/60 bg-background/50 backdrop-blur-sm",
        "placeholder:text-muted-foreground/70",
        "shadow-sm transition-all",
        "hover:border-primary/40 hover:bg-background/80",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:border-primary",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export { Input }
