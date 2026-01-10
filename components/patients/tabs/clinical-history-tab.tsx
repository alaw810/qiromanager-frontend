"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
// Cambiamos 'es' a 'enUS' para fechas en inglés (o quita el locale para default)
import { enUS } from "date-fns/locale"; 
import { 
  FileText, 
  Plus, 
  Loader2, 
  Paperclip, 
  Download, 
  Stethoscope 
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 

import { clinicalRecordsApi } from "@/lib/api/clinical-records-api";
import { ClinicalRecord } from "@/types";

// --- Constants & Helpers ---

// Claves (Keys) = JAVA ENUMS (¡Intocables!)
// Valores (Values) = Texto visible en el Select (Ahora en Inglés)
const RECORD_TYPES = {
  ANAMNESIS: "Initial Assessment / Anamnesis",
  EVOLUTION: "Progress Note / Evolution",
  MEDICAL_REPORT: "Medical Report",
  CONSENT: "Informed Consent",
  RECOMMENDATION: "Recommendation / Advice"
};

const getBadgeColor = (type: string) => {
  switch (type) {
    case "ANAMNESIS": return "default"; // Black/Primary
    case "MEDICAL_REPORT": return "destructive"; // Red
    case "EVOLUTION": return "secondary"; // Gray
    default: return "outline"; 
  }
};

// --- Validation Schema ---
const formSchema = z.object({
  recordType: z.string({
    required_error: "Please select a record type.",
  }),
  content: z.string().min(5, {
    message: "The note must be at least 5 characters long.",
  }),
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
  
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // CORRECCIÓN CRÍTICA: "SESSION_NOTE" no existe en tu backend. Usamos uno válido.
      recordType: "EVOLUTION", 
      content: "",
    },
  });

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await clinicalRecordsApi.getByPatientId(patientId);
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecords(sortedData);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clinical history.",
      });
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

      toast({
        title: "Record created",
        description: "The clinical note has been saved successfully.",
      });

      setIsDialogOpen(false);
      form.reset({
        recordType: "EVOLUTION",
        content: ""
      });
      setSelectedFile(null);
      loadRecords();
    } catch (error) {
      console.error("Error creating record:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem saving the note.",
      });
    }
  };

  // Helper para mostrar texto legible del tipo de registro en la tarjeta
  const getRecordLabel = (type: string) => {
    // Intenta buscar en nuestro mapa, si no existe devuelve el tipo crudo formateado
    return RECORD_TYPES[type as keyof typeof RECORD_TYPES] || type.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Clinical History</h3>
          <p className="text-sm text-muted-foreground">
            Progress notes, medical reports, and attachments.
          </p>
        </div>

        {/* New Note Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>Add Clinical Note</DialogTitle>
              <DialogDescription>
                Create a new entry in the patient's medical record.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Record Type Select */}
                <FormField
                  control={form.control}
                  name="recordType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(RECORD_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content Textarea */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe patient progress, observations, or medical details..."
                          className="min-h-37.5 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Input */}
                <FormItem>
                  <FormLabel>Attachment (Optional)</FormLabel>
                  <Input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Supported formats: PDF, JPG, PNG. Max 5MB.
                  </p>
                </FormItem>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Note
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 border rounded-lg bg-slate-50 border-dashed">
            <FileText className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-muted-foreground">No clinical records found.</p>
          </div>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      {getRecordLabel(record.recordType)}
                      <Badge variant={getBadgeColor(record.recordType) as any}>
                        {record.recordType}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <span className="font-medium mr-1">
                        {format(new Date(record.createdAt), "PPP", { locale: enUS })}
                      </span>
                      • 
                      <span className="ml-1">
                        {format(new Date(record.createdAt), "p", { locale: enUS })}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground bg-white px-2 py-1 rounded border shadow-sm">
                    <Stethoscope className="w-3 h-3 mr-1" />
                    {record.therapistName}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {record.content}
                </p>

                {/* Attachments Section */}
                {record.attachments && record.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors border"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          <span className="truncate max-w-50">{att.filename}</span>
                          <Download className="h-3 w-3 ml-1 opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}