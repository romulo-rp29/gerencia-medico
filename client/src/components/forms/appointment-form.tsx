import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { insertAppointmentSchema, type InsertAppointment, type Appointment, type Patient } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string(),
}).omit({
  createdBy: true,
  doctorId: true,
});

interface AppointmentFormProps {
  appointment?: Appointment & { patient: Patient };
  patients: Patient[];
  onSubmit: (data: InsertAppointment) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AppointmentForm({
  appointment,
  patients,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AppointmentFormProps) {
  const { user } = useAuth();
  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: appointment?.patientId || '',
      appointmentDate: appointment?.appointmentDate 
        ? new Date(appointment.appointmentDate).toISOString().slice(0, 16)
        : '',
      duration: appointment?.duration || 30,
      type: appointment?.type || 'consultation',
      status: appointment?.status || 'scheduled',
      reason: appointment?.reason || '',
      notes: appointment?.notes || '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof appointmentFormSchema>) => {
    if (!user) return;
    
    // Get the first doctor ID if logged in as receptionist
    let doctorId = user.role === 'doctor' ? user.id : '';
    if (user.role === 'receptionist') {
      try {
        const response = await fetch('/api/users?role=doctor');
        const doctors = await response.json();
        doctorId = doctors.length > 0 ? doctors[0].id : user.id;
      } catch (error) {
        doctorId = user.id; // Fallback to current user
      }
    }
    
    const submitData: InsertAppointment = {
      ...data,
      appointmentDate: new Date(data.appointmentDate),
      doctorId: doctorId,
      createdBy: user.id,
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Agendamento *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="endoscopy">Endoscopia</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e Hora *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo da Visita *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ex: Acompanhamento para tratamento de DRGE" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : appointment ? 'Atualizar Agendamento' : 'Criar Agendamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
