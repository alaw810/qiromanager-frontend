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
  FileText,
  Pencil,
  Trash2
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAuth } from "@/contexts/auth-context";
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

// Helper to parse structured notes back into fields
function parseSessionNotes(fullNotes: string) {
  const diagRegex = /(?:\[?(?:Diagnóstico|Diagnosis)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Procedimiento|Procedure)|$)/i;
  const procRegex = /(?:\[?(?:Procedimiento|Procedure)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Notas|Notes)|$)/i;
  const noteRegex = /(?:\[?(?:Notas|Notes)\]?):\s*([\s\S]*?)$/i;

  const diagnosisMatch = fullNotes.match(diagRegex);
  const procedureMatch = fullNotes.match(procRegex);
  const notesMatch = fullNotes.match(noteRegex);

  return {
    diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "",
    procedureApplied: procedureMatch ? procedureMatch[1].trim() : "",
    notes: notesMatch ? notesMatch[1].trim() : "",
  };
}

export default function TreatmentSessionsTab({ patientId }: TreatmentSessionsTabProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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

  const openEditDialog = (session: any) => {
    const parsed = parseSessionNotes(session.notes || "");
    setEditingSession(session);
    form.reset({
      date: session.sessionDate ? new Date(session.sessionDate) : new Date(),
      diagnosis: parsed.diagnosis || "",
      procedureApplied: parsed.procedureApplied || "",
      notes: parsed.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSession(null);
    form.reset({ diagnosis: "", procedureApplied: "", notes: "", date: new Date() });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const safeDate = values.date || new Date();
      const combinedNotes = `
[Diagnosis]: ${values.diagnosis || 'N/A'}
[Procedure]: ${values.procedureApplied || 'N/A'}
[Notes]: ${values.notes || ''}
      `.trim();

      if (editingSession) {
        await treatmentSessionsApi.update(patientId, editingSession.id, {
          sessionDate: safeDate.toISOString(),
          notes: combinedNotes,
        });
        toast({ title: "Session updated" });
      } else {
        await treatmentSessionsApi.create({
          patientId,
          date: safeDate.toISOString(),
          diagnosis: values.diagnosis,
          procedureApplied: values.procedureApplied,
          notes: values.notes || "",
        });
        toast({ title: "Session registered" });
      }

      setIsDialogOpen(false);
      setEditingSession(null);
      form.reset({ diagnosis: "", procedureApplied: "", notes: "", date: new Date() });
      loadSessions();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save session." });
    }
  };

  const handleDelete = async () => {
    if (!deletingSessionId) return;
    try {
      setIsDeleting(true);
      await treatmentSessionsApi.delete(patientId, deletingSessionId);
      toast({ title: "Session deleted" });
      setDeletingSessionId(null);
      loadSessions();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete session." });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- PARSEADOR INTELIGENTE (REGEX FLEXIBLE) ---
  const renderSessionDetails = (fullNotes: string) => {
    if (!fullNotes) return <p className="text-muted-foreground italic">No details recorded.</p>;

    const diagRegex = /(?:\[?(?:Diagnóstico|Diagnosis)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Procedimiento|Procedure)|$)/i;
    const procRegex = /(?:\[?(?:Procedimiento|Procedure)\]?):\s*([\s\S]*?)(?=\n|\[?(?:Notas|Notes)|$)/i;
    const noteRegex = /(?:\[?(?:Notas|Notes)\]?):\s*([\s\S]*?)$/i;

    const diagnosisMatch = fullNotes.match(diagRegex);
    const procedureMatch = fullNotes.match(procRegex);
    const notesMatch = fullNotes.match(noteRegex);

    if (!diagnosisMatch && !procedureMatch) {
        return <p className="whitespace-pre-wrap text-sm text-gray-700">{fullNotes}</p>;
    }

    const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : "N/A";
    const procedure = procedureMatch ? procedureMatch[1].trim() : "N/A";
    const notes = notesMatch ? notesMatch[1].trim() : "";

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
           <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
              <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium text-sm">
                 <Stethoscope className="w-4 h-4" /> Diagnosis
              </div>
              <p className="text-sm text-gray-800 font-medium">{diagnosis}</p>
           </div>
           <div className="bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
              <div className="flex items-center gap-2 mb-1 text-emerald-700 font-medium text-sm">
                 <Activity className="w-4 h-4" /> Procedure
              </div>
              <p className="text-sm text-gray-800">{procedure}</p>
           </div>
        </div>
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

        <Button onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" /> Log Session</Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingSession(null);
      }}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Session" : "New Treatment Session"}</DialogTitle>
            <DialogDescription>
              {editingSession ? "Update session details." : "Enter clinical details."}
            </DialogDescription>
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
                    <FormControl><Input placeholder="Acute pain..." className="bg-white" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Massage..." className="resize-none bg-white" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Optional..." className="bg-white" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSession ? "Update Session" : "Save Session"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSessionId} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The treatment session will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                     <div className="mb-4 flex items-center justify-between pb-3 border-b border-dashed">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                             {session.sessionDate
                                ? format(new Date(session.sessionDate), "PPP", { locale: enUS })
                                : "Unknown Date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(session)} title="Edit session">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingSessionId(session.id)} title="Delete session">
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
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
