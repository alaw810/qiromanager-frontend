import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * QIROMANAGER CLINICAL TEXTAREA
 * - soft rounded corners
 * - medical-grade focus ring
 * - translucent background depth
 * - cleaner placeholder
 * - calm hover + shadow
 */

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-24 px-4 py-3 text-base md:text-sm",
        "rounded-lg border border-border/60 bg-background/50 backdrop-blur-sm",
        "placeholder:text-muted-foreground/70",
        "shadow-sm transition-all resize-none field-sizing-content",
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

export { Textarea }
