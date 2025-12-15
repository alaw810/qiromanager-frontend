"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, Grid } from "lucide-react"

interface ViewToggleProps {
  view: "grid" | "list"
  onChange: (view: "grid" | "list") => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("grid")}
      >
        <Grid className="h-4 w-4 mr-1" /> Grid
      </Button>

      <Button
        variant={view === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("list")}
      >
        <Table className="h-4 w-4 mr-1" /> List
      </Button>
    </div>
  )
}
