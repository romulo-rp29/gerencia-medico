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
  patient?: Patient | null;
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
        title: "Sucesso",
        description: "Agendamento realizado com sucesso",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao agendar consulta",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.type || !formData.appointmentDate || !formData.reason) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
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
          <DialogTitle>Agendar Consulta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {patient && (
            <div>
              <Label>Paciente</Label>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="appointmentDate">Data e Hora *</Label>
            <Input
              id="appointmentDate"
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Agendamento *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'consultation' | 'endoscopy' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de agendamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consulta</SelectItem>
                <SelectItem value="endoscopy">Endoscopia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
                <SelectItem value="90">90 minutos</SelectItem>
                <SelectItem value="120">120 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Motivo da Visita *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="ex: Acompanhamento para tratamento de DRGE"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAppointmentMutation.isPending}>
              {createAppointmentMutation.isPending ? 'Agendando...' : 'Agendar Consulta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
