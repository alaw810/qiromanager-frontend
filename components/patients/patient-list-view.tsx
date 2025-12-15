"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Patient } from "@/lib/api/patients-api"

interface PatientListViewProps {
  patients: Patient[]
}

export function PatientListView({ patients }: PatientListViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Birthdate</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {patients.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.fullName}</TableCell>
            <TableCell>{new Date(p.dateOfBirth).toLocaleDateString()}</TableCell>
            <TableCell>{p.phone || "-"}</TableCell>
            <TableCell>{p.email || "-"}</TableCell>
            <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Link href={`/patients/${p.id}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
