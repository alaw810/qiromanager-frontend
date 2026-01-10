"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, Loader2, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast"; // Corregido import
import { cn } from "@/lib/utils";

import { treatmentSessionsApi, TreatmentSession } from "@/lib/api/treatment-sessions-api";

// --- Schema de Validación (Zod) ---
const formSchema = z.object({
  // CORRECCIÓN 1: Validación estricta para evitar undefined
  date: z.date({
    required_error: "La fecha de la sesión es obligatoria.",
    invalid_type_error: "Formato de fecha inválido.",
  }),
  diagnosis: z.string().min(2, {
    message: "El diagnóstico debe tener al menos 2 caracteres.",
  }),
  procedureApplied: z.string().min(2, {
    message: "El procedimiento debe tener al menos 2 caracteres.",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TreatmentSessionsTabProps {
  patientId: number;
}

export default function TreatmentSessionsTab({ patientId }: TreatmentSessionsTabProps) {
  // Ajuste de tipos para evitar errores si la API devuelve campos extra
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diagnosis: "",
      procedureApplied: "",
      notes: "",
      date: new Date(),
    },
  });

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await treatmentSessionsApi.getByPatientId(patientId);
      // Ordenar de forma segura
      const sortedData = data.sort((a, b) => {
        const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
        const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
        return dateB - dateA;
      });
      setSessions(sortedData);
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sesiones.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadSessions();
  }, [patientId]);

  const onSubmit = async (values: FormValues) => {
    try {
      // CORRECCIÓN 2: Fallback de seguridad
      const safeDate = values.date || new Date();

      await treatmentSessionsApi.create({
        patientId,
        date: safeDate.toISOString(), 
        diagnosis: values.diagnosis,
        procedureApplied: values.procedureApplied,
        notes: values.notes || "",
      });

      toast({
        title: "Sesión registrada",
        description: "La sesión de tratamiento se ha guardado correctamente.",
      });

      setIsDialogOpen(false);
      form.reset({
        diagnosis: "",
        procedureApplied: "",
        notes: "",
        date: new Date(),
      });
      loadSessions();
    } catch (error) {
      console.error("Error creando sesión:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al guardar la sesión. Verifica la fecha.",
      });
    }
  };

  // Helper para formatear fecha en la tabla sin explotar
  const formatSessionDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Helper para extraer diagnóstico de las notas combinadas (si el backend lo devuelve así)
  const extractInfo = (notes: string, key: string) => {
    if (!notes) return "N/A";
    // Si tu backend devuelve notas combinadas tipo "[Diagnóstico]: xyz", intentamos parsear
    // Si no, devolvemos el valor crudo si es el campo de notas
    if (!notes.includes("[")) return key === 'notes' ? notes : "N/A";
    
    const regex = new RegExp(`\\[${key}\\]: (.*?)(?=\\[|$)`, 's');
    const match = notes.match(regex);
    return match ? match[1].trim() : "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Sesiones de Tratamiento</h3>
          <p className="text-sm text-muted-foreground">
            Historial de intervenciones y procedimientos realizados.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Registrar Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Nueva Sesión</DialogTitle>
              <DialogDescription>
                Detalles de la sesión clínica.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Lumbalgia..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="procedureApplied"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimiento</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej. Masaje..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observaciones..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-muted-foreground">
              <Stethoscope className="h-10 w-10 mb-2 opacity-20" />
              <p>No hay sesiones registradas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Detalles (Notas)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium align-top w-37.5">
                      {/* CORRECCIÓN 3: Uso de campo correcto 'sessionDate' del backend */}
                      {formatSessionDate(session.sessionDate || session.date)}
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap">
                      {/* Mostramos las notas tal cual vienen del backend */}
                      {session.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}