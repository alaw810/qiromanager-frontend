import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Users } from "lucide-react"
import type { Patient } from "@/lib/api/patients-api"

interface PatientCardProps {
  patient: Patient
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{patient.fullName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={patient.active ? "default" : "secondary"}>{patient.active ? "Active" : "Inactive"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{patient.phone}</span>
          </div>
        )}
        {patient.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{patient.email}</span>
          </div>
        )}
        {patient.therapists && patient.therapists.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {patient.therapists.map((therapist) => (
                <Badge key={therapist.id} variant="outline" className="text-xs">
                  {therapist.fullName}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2">
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
