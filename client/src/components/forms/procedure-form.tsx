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
import { Checkbox } from '@/components/ui/checkbox';
import { insertProcedureSchema, type InsertProcedure, type Procedure } from '@shared/schema';

const procedureFormSchema = insertProcedureSchema.extend({
  scheduledDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).omit({
  doctorId: true,
  patientId: true,
  appointmentId: true,
});

interface ProcedureFormProps {
  procedure?: Procedure;
  onSubmit: (data: InsertProcedure) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ProcedureForm({
  procedure,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProcedureFormProps) {
  const form = useForm<z.infer<typeof procedureFormSchema>>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: {
      procedureType: procedure?.procedureType || 'Upper Endoscopy',
      status: procedure?.status || 'scheduled',
      scheduledDate: procedure?.scheduledDate 
        ? new Date(procedure.scheduledDate).toISOString().slice(0, 16)
        : '',
      startTime: procedure?.startTime 
        ? new Date(procedure.startTime).toISOString().slice(0, 16)
        : '',
      endTime: procedure?.endTime 
        ? new Date(procedure.endTime).toISOString().slice(0, 16)
        : '',
      findings: procedure?.findings || '',
      recommendations: procedure?.recommendations || '',
      complications: procedure?.complications || '',
      followUpRequired: procedure?.followUpRequired || false,
      followUpInstructions: procedure?.followUpInstructions || '',
      pathologyOrdered: procedure?.pathologyOrdered || false,
      pathologyResults: procedure?.pathologyResults || '',
    },
  });

  const handleSubmit = (data: z.infer<typeof procedureFormSchema>) => {
    const submitData: InsertProcedure = {
      ...data,
      scheduledDate: new Date(data.scheduledDate),
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      appointmentId: 'appointment-id', // This should be passed as a prop
      patientId: 'patient-id', // This should be passed as a prop
      doctorId: 'doctor-id', // This should come from auth context
      medications: [], // This could be enhanced with a proper medication selector
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="procedureType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Procedimento *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Upper Endoscopy">Endoscopia Digestiva Alta (EDA)</SelectItem>
                    <SelectItem value="Colonoscopy">Colonoscopia</SelectItem>
                    <SelectItem value="Flexible Sigmoidoscopy">Retossigmoidoscopia Flexível</SelectItem>
                    <SelectItem value="Capsule Endoscopy">Cápsula Endoscópica</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e Hora Agendada *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Início Real</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Fim Real</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="findings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Achados</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={4} 
                  placeholder="Descreva os achados do procedimento..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recommendations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recomendações</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Recomendações de tratamento..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="complications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complicações</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Quaisquer complicações durante o procedimento..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="followUpRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Acompanhamento Necessário</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pathologyOrdered"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Patologia Solicitada</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="followUpInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instruções de Acompanhamento</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Instruções para cuidados de acompanhamento..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pathologyResults"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultados da Patologia</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Resultados da patologia (quando disponíveis)..."
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
            {isSubmitting ? 'Salvando...' : procedure ? 'Atualizar Procedimento' : 'Criar Procedimento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
