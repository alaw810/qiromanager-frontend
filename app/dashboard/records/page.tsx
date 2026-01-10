"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, FileText, Activity, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { patientsApi, type Patient } from "@/lib/api/patients-api"
import { PrivateRoute } from "@/components/auth/private-route"

// Importamos tus componentes existentes
import ClinicalHistoryTab from "@/components/patients/tabs/clinical-history-tab"
import TreatmentSessionsTab from "@/components/patients/tabs/treatment-sessions-tab"

export default function RecordsPage() {
  return (
    <PrivateRoute>
      <RecordsPageContent />
    </PrivateRoute>
  )
}

function RecordsPageContent() {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Cargar lista de pacientes
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await patientsApi.getAll()
        setPatients(data.sort((a, b) => a.fullName.localeCompare(b.fullName)))
      } catch (error) {
        console.error("Failed to load patients", error)
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [])

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in-50">
      
      {/* Header Simplificado */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Clinical Records Hub</h1>
        <p className="text-muted-foreground">
          Centralized access to patient history and treatments.
        </p>
      </div>

      {/* --- NUEVO DISEÑO DEL BUSCADOR --- */}
      {/* Barra horizontal limpia, sin tarjetas pesadas */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/40 p-2 rounded-lg border border-border/50 shadow-sm">
        
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm text-primary">
            <Users className="w-5 h-5" />
        </div>

        <div className="flex-1 w-full">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-11 bg-white hover:bg-slate-50 border-slate-200 text-muted-foreground hover:text-foreground transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                     <Search className="h-4 w-4 opacity-50 shrink-0" />
                     {selectedPatient ? (
                        <span className="font-medium text-foreground">{selectedPatient.fullName}</span>
                     ) : (
                        <span>Search patient by name...</span>
                     )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Type to search..." />
                  <CommandList>
                    <CommandEmpty>No patient found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.fullName}
                          onSelect={() => {
                            setSelectedPatientId(patient.id)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                              <span>{patient.fullName}</span>
                              <span className="text-xs text-muted-foreground">{patient.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
        </div>
        
        {/* Texto de ayuda o estado a la derecha (opcional) */}
        {selectedPatient && (
             <div className="hidden md:block text-xs text-muted-foreground px-2 whitespace-nowrap">
                ID: <span className="font-mono font-medium">#{selectedPatient.id}</span>
             </div>
        )}
      </div>

      {/* Área de Visualización */}
      {selectedPatientId ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
          
          {/* Cabecera del Paciente (Más compacta) */}
          <div className="flex items-center gap-4 py-2 border-b">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                 {selectedPatient?.fullName.charAt(0)}
             </div>
             <div>
                 <h2 className="text-lg font-bold leading-none">{selectedPatient?.fullName}</h2>
                 <p className="text-sm text-muted-foreground mt-1">{selectedPatient?.email}</p>
             </div>
          </div>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-100">
              <TabsTrigger value="history" className="flex gap-2">
                <FileText className="w-4 h-4" /> Clinical History
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex gap-2">
                <Activity className="w-4 h-4" /> Sessions
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
                <TabsContent value="history" className="focus-visible:outline-none">
                    <ClinicalHistoryTab patientId={selectedPatientId} />
                </TabsContent>
                <TabsContent value="sessions" className="focus-visible:outline-none">
                    <TreatmentSessionsTab patientId={selectedPatientId} />
                </TabsContent>
            </div>
          </Tabs>

        </div>
      ) : (
        // Estado vacío mejorado
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/60 border-2 border-dashed rounded-xl border-muted">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground/80">Select a Patient</h3>
            <p className="max-w-xs text-sm mt-1">
                Use the search bar above to load clinical records and treatment history.
            </p>
        </div>
      )}
    </div>
  )
}