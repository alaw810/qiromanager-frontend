'use client'

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

/**
 * QIROMANAGER CLINICAL LABEL
 * - calm medical typography
 * - subtle color
 * - spacing optimized for clinical forms
 * - supports invalid + disabled states
 */

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm font-medium text-foreground/80",
        "mb-1.5 block select-none",
        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
        "group-data-[invalid=true]:text-destructive/80",
        className
      )}
      {...props}
    />
  )
}

export { Label }
