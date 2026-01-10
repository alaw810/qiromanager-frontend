"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { 
  CalendarIcon, 
  Plus, 
  Loader2, 
  Stethoscope, 
  Activity, 
  ClipboardList, 
  FileText 
} from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { treatmentSessionsApi } from "@/lib/api/treatment-sessions-api";

const formSchema = z.object({
  date: z.date({
    required_error: "Session date is required.",
    invalid_type_error: "Invalid date format.",
  }),
  diagnosis: z.string().min(2, "Diagnosis must be at least 2 characters."),
  procedureApplied: z.string().min(2, "Procedure must be at least 2 characters."),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TreatmentSessionsTabProps {
  patientId: number;
}

export default function TreatmentSessionsTab({ patientId }: TreatmentSessionsTabProps) {
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
      const sortedData = data.sort((a, b) => {
        const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
        const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
        return dateB - dateA;
      });
      setSessions(sortedData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadSessions();
  }, [patientId]);

  const onSubmit = async (values: FormValues) => {
    try {
      const safeDate = values.date || new Date();
      await treatmentSessionsApi.create({
        patientId,
        date: safeDate.toISOString(), 
        diagnosis: values.diagnosis,
        procedureApplied: values.procedureApplied,
        notes: values.notes || "",
      });

      toast({ title: "Session registered" });
      setIsDialogOpen(false);
      form.reset({ diagnosis: "", procedureApplied: "", notes: "", date: new Date() });
      loadSessions();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save session." });
    }
  };

  // --- PARSEADOR INTELIGENTE (REGEX FLEXIBLE) ---
  const renderSessionDetails = (fullNotes: string) => {
    if (!fullNotes) return <p className="text-muted-foreground italic">No details recorded.</p>;

    // 1. Regex que acepta Español o Inglés, con o sin corchetes
    // Captura: "Diagnóstico:" ó "[Diagnosis]:" seguido del contenido hasta la siguiente etiqueta
    const diagRegex = /(?:\[?(?:Diagnóstico|Diagnosis)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Procedimiento|Procedure)|$)/i;
    const procRegex = /(?:\[?(?:Procedimiento|Procedure)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Notas|Notes)|$)/i;
    const noteRegex = /(?:\[?(?:Notas|Notes)\]?):\s*([\s\S]*?)$/i;

    const diagnosisMatch = fullNotes.match(diagRegex);
    const procedureMatch = fullNotes.match(procRegex);
    const notesMatch = fullNotes.match(noteRegex);

    // Si no encontramos nada con estructura, mostramos texto plano
    if (!diagnosisMatch && !procedureMatch) {
        return <p className="whitespace-pre-wrap text-sm text-gray-700">{fullNotes}</p>;
    }

    const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : "N/A";
    const procedure = procedureMatch ? procedureMatch[1].trim() : "N/A";
    const notes = notesMatch ? notesMatch[1].trim() : "";

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
           {/* Diagnosis Card */}
           <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
              <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium text-sm">
                 <Stethoscope className="w-4 h-4" /> Diagnosis
              </div>
              <p className="text-sm text-gray-800 font-medium">{diagnosis}</p>
           </div>
           
           {/* Procedure Card */}
           <div className="bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
              <div className="flex items-center gap-2 mb-1 text-emerald-700 font-medium text-sm">
                 <Activity className="w-4 h-4" /> Procedure
              </div>
              <p className="text-sm text-gray-800">{procedure}</p>
           </div>
        </div>

        {/* Notes Card */}
        {notes && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-100 h-full">
             <div className="flex items-center gap-2 mb-1 text-gray-600 font-medium text-sm">
                <FileText className="w-4 h-4" /> Additional Notes
             </div>
             <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Treatment Sessions</h3>
          <p className="text-sm text-muted-foreground">History of interventions performed.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Log Session</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>New Treatment Session</DialogTitle>
              <DialogDescription>Enter clinical details.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
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
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl><Input placeholder="Acute pain..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="procedureApplied"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure</FormLabel>
                      <FormControl><Textarea placeholder="Massage..." className="resize-none" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Textarea placeholder="Optional..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Session
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 border rounded-lg bg-slate-50 border-dashed">
              <ClipboardList className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-muted-foreground">No sessions recorded yet.</p>
            </div>
          ) : (
            sessions.map((session) => (
               <Card key={session.id} className="overflow-hidden border-l-4 border-l-primary/70">
                  <CardContent className="p-5">
                     <div className="mb-4 flex items-center gap-2 pb-3 border-b border-dashed">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                           {session.sessionDate 
                              ? format(new Date(session.sessionDate), "PPP", { locale: enUS }) 
                              : "Unknown Date"}
                        </span>
                     </div>
                     {renderSessionDetails(session.notes)}
                  </CardContent>
               </Card>
            ))
          )}
      </div>
    </div>
  );
}