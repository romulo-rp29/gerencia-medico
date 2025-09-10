import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Patient, InsertAppointment } from '@shared/schema';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  initialDate?: Date;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  patient,
  initialDate,
}: AppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    patientId: patient?.id || '',
    doctorId: '', // This would be set based on the logged-in doctor
    appointmentDate: initialDate?.toISOString().slice(0, 16) || '',
    duration: 30,
    type: '' as 'consultation' | 'endoscopy' | '',
    reason: '',
    notes: '',
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const response = await apiRequest('POST', '/api/appointments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.type || !formData.appointmentDate || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const appointmentData: InsertAppointment = {
      ...formData,
      appointmentDate: new Date(formData.appointmentDate),
      createdBy: 'doctor-id', // This should come from auth context
      doctorId: 'doctor-id', // This should come from auth context
      status: 'scheduled',
      type: formData.type as 'consultation' | 'endoscopy',
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  const handleClose = () => {
    setFormData({
      patientId: patient?.id || '',
      doctorId: '',
      appointmentDate: initialDate?.toISOString().slice(0, 16) || '',
      duration: 30,
      type: '',
      reason: '',
      notes: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {patient && (
            <div>
              <Label>Patient</Label>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="appointmentDate">Date & Time *</Label>
            <Input
              id="appointmentDate"
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Appointment Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'consultation' | 'endoscopy' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="endoscopy">Endoscopy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Visit *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Follow-up for GERD treatment"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointmentMutation.isPending}>
              {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
