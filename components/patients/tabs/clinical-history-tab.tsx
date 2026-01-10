"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { enUS } from "date-fns/locale"; 
import { 
  FileText, 
  Plus, 
  Loader2, 
  Paperclip, 
  Download, 
  Stethoscope,
  Calendar,
  Filter, 
  Search, 
  XCircle 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { cn } from "@/lib/utils";

import { clinicalRecordsApi } from "@/lib/api/clinical-records-api";
import { ClinicalRecord } from "@/types";

// --- Constants & Helpers ---

const RECORD_TYPES = {
  ANAMNESIS: "Initial Assessment",
  EVOLUTION: "Progress Note",
  MEDICAL_REPORT: "Medical Report",
  CONSENT: "Informed Consent",
  RECOMMENDATION: "Recommendation"
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case "ANAMNESIS": 
      return { border: "border-l-blue-500", badge: "bg-blue-100 text-blue-700 hover:bg-blue-100" };
    case "MEDICAL_REPORT": 
      return { border: "border-l-red-500", badge: "bg-red-100 text-red-700 hover:bg-red-100" };
    case "EVOLUTION": 
      return { border: "border-l-emerald-500", badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" };
    case "CONSENT":
      return { border: "border-l-purple-500", badge: "bg-purple-100 text-purple-700 hover:bg-purple-100" };
    default: 
      return { border: "border-l-gray-400", badge: "bg-gray-100 text-gray-700 hover:bg-gray-100" };
  }
};

const formSchema = z.object({
  recordType: z.string({ required_error: "Please select a record type." }),
  content: z.string().min(5, { message: "The note must be at least 5 characters long." }),
});

type FormValues = z.infer<typeof formSchema>;

interface ClinicalHistoryTabProps {
  patientId: number;
}

export default function ClinicalHistoryTab({ patientId }: ClinicalHistoryTabProps) {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Filtros
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { recordType: "EVOLUTION", content: "" },
  });

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await clinicalRecordsApi.getByPatientId(patientId);
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecords(sortedData);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load clinical history." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadRecords();
  }, [patientId]);

  const onSubmit = async (values: FormValues) => {
    try {
      await clinicalRecordsApi.create(
        patientId,
        values.content,
        values.recordType,
        selectedFile || undefined
      );

      toast({ title: "Record created", description: "The clinical note has been saved successfully." });
      setIsDialogOpen(false);
      form.reset({ recordType: "EVOLUTION", content: "" });
      setSelectedFile(null);
      loadRecords();
    } catch (error) {
      console.error("Error creating record:", error);
      toast({ variant: "destructive", title: "Error", description: "There was a problem saving the note." });
    }
  };

  const getRecordLabel = (type: string) => {
    return RECORD_TYPES[type as keyof typeof RECORD_TYPES] || type.replace(/_/g, " ");
  };

  // --- PARSEADOR VISUAL MEJORADO ---
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');

    return (
      <div className="space-y-3 text-sm text-gray-700 mt-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;

          // CASO 1: Título de sesión (gris pequeño)
          // Detecta "Treatment Session performed..."
          if (trimmedLine.toLowerCase().includes("treatment session performed")) {
             return (
               <div key={index} className="pb-2 border-b border-dashed border-gray-200 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {trimmedLine}
                  </p>
               </div>
             );
          }

          // CASO 2: "Session Notes:" (Lo separamos si aparece pegado)
          // Si la línea empieza por "Session Notes:", lo tratamos como título
          if (trimmedLine.toLowerCase().startsWith("session notes:")) {
             // Extraemos lo que venga después de los dos puntos
             const restOfLine = trimmedLine.substring("Session Notes:".length).trim();
             
             return (
               <div key={index}>
                  <p className="text-xs font-bold text-gray-500 mb-1">SESSION NOTES</p>
                  {/* Si hay texto después (ej: "Session Notes: Diagnóstico..."), lo renderizamos debajo recursivamente o directo */}
                  {restOfLine && (
                    <div className="pl-0 mt-1">
                      {/* Llamada recursiva simple para procesar el resto si tiene estructura */}
                      {renderFormattedContent(restOfLine)} 
                    </div>
                  )}
               </div>
             );
          }

          // CASO 3: Clave: Valor (Diagnóstico, Procedimiento, etc.)
          // Detecta [Clave]: Valor ó Clave: Valor
          const match = trimmedLine.match(/^(?:\[?([A-Za-zÁ-Úá-ú\s]+)\]?):\s*(.+)/);
          
          if (match) {
            const label = match[1].trim(); // Ej: Diagnosis
            const value = match[2].trim(); // Ej: Gripe

            return (
              <div key={index} className="flex flex-col sm:flex-row sm:items-start sm:gap-4 py-1">
                <span className="font-semibold text-gray-900 min-w-30 shrink-0 text-right sm:text-left">
                  {label}:
                </span>
                <span className="text-gray-600">{value}</span>
              </div>
            );
          }

          // CASO 4: Texto normal
          return <p key={index} className="leading-relaxed pl-1">{trimmedLine}</p>;
        })}
      </div>
    );
  };

  // --- FILTRADO ---
  const filteredRecords = records.filter((record) => {
    const matchesType = filterType === "ALL" || record.recordType === filterType;
    const searchLower = searchTerm.toLowerCase();
    const matchesText = 
      record.content.toLowerCase().includes(searchLower) || 
      record.therapistName?.toLowerCase().includes(searchLower);
    return matchesType && matchesText;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Clinical History</h3>
          <p className="text-sm text-muted-foreground">Timeline of patient progress and reports.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Note</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>Add Clinical Note</DialogTitle>
              <DialogDescription>Create a new entry in the medical record.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recordType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(RECORD_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Type notes..." className="min-h-37.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Attachment</FormLabel>
                  <Input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </FormItem>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Note
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-muted/20 p-3 rounded-lg border">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search within notes..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-full md:w-62.5">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-white">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Records</SelectItem>
              {Object.entries(RECORD_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(filterType !== "ALL" || searchTerm) && (
          <Button variant="ghost" size="icon" onClick={() => { setFilterType("ALL"); setSearchTerm(""); }} className="shrink-0">
            <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center h-32 items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-muted-foreground">No records found.</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const styles = getTypeStyles(record.recordType);
            return (
              <Card key={record.id} className={cn("overflow-hidden border-l-4 shadow-sm animate-in fade-in slide-in-from-bottom-2", styles.border)}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <h4 className="font-bold text-base flex items-center gap-2">
                          {getRecordLabel(record.recordType)}
                          <Badge className={cn("font-normal border-0 px-2 py-0.5 text-xs rounded-md", styles.badge)}>
                            {record.recordType}
                          </Badge>
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                           <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(record.createdAt), "PPP 'at' p", { locale: enUS })}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 self-start sm:self-center">
                      <Stethoscope className="w-3.5 h-3.5 mr-2 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">{record.therapistName}</span>
                    </div>
                  </div>
                  
                  <div className="pl-1">
                    {renderFormattedContent(record.content)}
                  </div>

                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mt-5 pt-3 border-t flex flex-wrap gap-2">
                      {record.attachments.map((att) => (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border rounded-md text-xs transition-colors group">
                          <Paperclip className="h-3.5 w-3.5 text-slate-500 group-hover:text-primary" />
                          <span className="truncate max-w-37.5 font-medium">{att.filename}</span>
                          <Download className="h-3 w-3 ml-1 opacity-50" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}