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
                <FormLabel>Procedure Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Upper Endoscopy">Upper Endoscopy (EGD)</SelectItem>
                    <SelectItem value="Colonoscopy">Colonoscopy</SelectItem>
                    <SelectItem value="Flexible Sigmoidoscopy">Flexible Sigmoidoscopy</SelectItem>
                    <SelectItem value="Capsule Endoscopy">Capsule Endoscopy</SelectItem>
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <FormLabel>Scheduled Date & Time *</FormLabel>
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
                <FormLabel>Actual Start Time</FormLabel>
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
                <FormLabel>Actual End Time</FormLabel>
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
              <FormLabel>Findings</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={4} 
                  placeholder="Describe procedure findings..."
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
              <FormLabel>Recommendations</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Treatment recommendations..."
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
              <FormLabel>Complications</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Any complications during procedure..."
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
                  <FormLabel>Follow-up Required</FormLabel>
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
                  <FormLabel>Pathology Ordered</FormLabel>
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
              <FormLabel>Follow-up Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Instructions for follow-up care..."
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
              <FormLabel>Pathology Results</FormLabel>
              <FormControl>
                <Textarea 
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  rows={3} 
                  placeholder="Pathology results (when available)..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : procedure ? 'Update Procedure' : 'Create Procedure'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
