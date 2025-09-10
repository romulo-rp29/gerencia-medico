import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertPatientEvolutionSchema, type Patient, type User, type Appointment } from "@shared/schema";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const formSchema = insertPatientEvolutionSchema.extend({
  evolutionDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PatientEvolutionFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<FormData>;
  patients: Patient[];
  doctors: User[];
  appointments: Appointment[];
  isSubmitting?: boolean;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export function PatientEvolutionForm({
  onSubmit,
  onCancel,
  defaultValues,
  patients,
  doctors,
  appointments,
  isSubmitting = false,
}: PatientEvolutionFormProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    (defaultValues?.prescriptions as Prescription[]) || []
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      appointmentId: "none",
      evolutionDate: new Date().toISOString().split('T')[0],
      chiefComplaint: "",
      historyOfPresentIllness: "",
      physicalExamination: "",
      assessment: "",
      plan: "",
      nextAppointment: "",
      observations: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      appointmentId: data.appointmentId === "none" ? undefined : data.appointmentId,
      prescriptions: prescriptions as any,
    });
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medication: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const selectedPatient = patients.find(p => p.id === form.watch("patientId"));
  const patientAppointments = appointments.filter(a => a.patientId === selectedPatient?.id);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {defaultValues ? "Editar Evolução" : "Nova Evolução do Paciente"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Linha de selects e data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Médico</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o médico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consulta (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a consulta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma consulta</SelectItem>
                        {patientAppointments.map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')} - {appointment.reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evolutionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Evolução</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seções de texto */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Queixa Principal</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva a queixa principal do paciente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="historyOfPresentIllness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>História da Doença Atual</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva a história da doença atual" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="physicalExamination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exame Físico</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Detalhes do exame físico" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação / Diagnóstico</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Avaliação do caso" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano Terapêutico</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Plano de tratamento e condutas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de Prescrições */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Prescrições</Label>
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <Input
                      placeholder="Medicamento"
                      value={prescription.medication}
                      onChange={(e) => updatePrescription(index, "medication", e.target.value)}
                    />
                    <Input
                      placeholder="Dosagem"
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                    />
                    <Input
                      placeholder="Frequência"
                      value={prescription.frequency}
                      onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Duração"
                        value={prescription.duration}
                        onChange={(e) => updatePrescription(index, "duration", e.target.value)}
                      />
                      <Button type="button" variant="destructive" onClick={() => removePrescription(index)}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPrescription} className="mt-2">
                  <Plus size={16} /> Adicionar Prescrição
                </Button>
              </div>

              <FormField
                control={form.control}
                name="nextAppointment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Consulta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-4 mt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
