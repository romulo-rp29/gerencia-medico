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
      appointmentId: "",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a consulta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma consulta</SelectItem>
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

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Queixa Principal</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a queixa principal do paciente..."
                        className="min-h-[80px]"
                        {...field} 
                      />
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
                      <Textarea 
                        placeholder="Descreva a história da doença atual..."
                        className="min-h-[100px]"
                        {...field} 
                      />
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
                      <Textarea 
                        placeholder="Descreva os achados do exame físico..."
                        className="min-h-[100px]"
                        {...field} 
                      />
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
                    <FormLabel>Avaliação/Diagnóstico</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a avaliação e diagnóstico..."
                        className="min-h-[100px]"
                        {...field} 
                      />
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
                      <Textarea 
                        placeholder="Descreva o plano de tratamento..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prescriptions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Prescrições</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrescription}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Prescrição
                </Button>
              </div>

              {prescriptions.map((prescription, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Prescrição {index + 1}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePrescription(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`medication-${index}`}>Medicamento</Label>
                      <Input
                        id={`medication-${index}`}
                        value={prescription.medication}
                        onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                        placeholder="Nome do medicamento"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dosage-${index}`}>Dosagem</Label>
                      <Input
                        id={`dosage-${index}`}
                        value={prescription.dosage}
                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                        placeholder="Ex: 10mg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`frequency-${index}`}>Frequência</Label>
                      <Input
                        id={`frequency-${index}`}
                        value={prescription.frequency}
                        onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                        placeholder="Ex: 2x ao dia"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`duration-${index}`}>Duração</Label>
                      <Input
                        id={`duration-${index}`}
                        value={prescription.duration}
                        onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                        placeholder="Ex: 7 dias"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nextAppointment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Consulta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Retorno em 15 dias" {...field} />
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
                      <Textarea 
                        placeholder="Observações adicionais..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
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