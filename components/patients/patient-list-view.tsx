"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye } from "lucide-react"
import type { Patient } from "@/lib/api/patients-api"

interface PatientListViewProps {
  patients: Patient[]
}

export function PatientListView({ patients }: PatientListViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-62.5">Name</TableHead>
            <TableHead>Birthdate</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.fullName}</TableCell>
              <TableCell>
                {/* Usamos slice para asegurar YYYY-MM-DD visualmente simple y consistente */}
                {p.dateOfBirth ? p.dateOfBirth.toString().split("T")[0] : "-"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm text-muted-foreground">
                  <span>{p.phone || "No phone"}</span>
                  <span className="text-xs">{p.email}</span>
                </div>
              </TableCell>
              <TableCell>
                {p.active ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/patients/${p.id}`}>
                  <Button variant="ghost" size="icon" title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}