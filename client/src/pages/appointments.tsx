import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppointmentForm from '@/components/forms/appointment-form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Appointment, Patient, User as UserType, InsertAppointment } from '@shared/schema';

type AppointmentWithDetails = Appointment & { patient: Patient; doctor: UserType };

export default function Appointments() {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
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
        description: "Agendamento criado com sucesso",
      });
      setShowAppointmentForm(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar agendamento",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAppointment> }) => {
      const response = await apiRequest('PATCH', `/api/appointments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso",
      });
      setShowAppointmentForm(false);
      setEditingAppointment(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar agendamento",
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/appointments/${id}`, {
        status: 'checked_in',
        checkedInAt: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Sucesso",
        description: "Check-in do paciente realizado com sucesso",
      });
    },
  });

  const filteredAppointments = appointments.filter(appointment => {
    if (statusFilter !== 'all' && appointment.status !== statusFilter) return false;
    if (typeFilter !== 'all' && appointment.type !== typeFilter) return false;
    const appointmentDate = new Date(appointment.appointmentDate).toISOString().slice(0, 10);
    if (dateFilter && appointmentDate !== dateFilter) return false;
    return true;
  });

  const handleCreateAppointment = (data: InsertAppointment) => {
    createAppointmentMutation.mutate(data);
  };

  const handleUpdateAppointment = (data: InsertAppointment) => {
    if (editingAppointment) {
      updateAppointmentMutation.mutate({ id: editingAppointment.id, data });
    }
  };

  const handleEditAppointment = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary', label: 'Agendado' },
      confirmed: { variant: 'default', label: 'Confirmado' },
      checked_in: { variant: 'outline', label: 'Check-in' },
      in_progress: { variant: 'destructive', label: 'Em Andamento' },
      completed: { variant: 'default', label: 'Concluído' },
      cancelled: { variant: 'secondary', label: 'Cancelado' },
      no_show: { variant: 'destructive', label: 'Não Compareceu' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return (
      <Badge variant={config.variant as any} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'endoscopy' ? (
      <Badge className="bg-purple-100 text-purple-800 text-xs">Endoscopia</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 text-xs">Consulta</Badge>
    );
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Agendamentos" />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border h-16"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Agendamentos" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Agendamentos</h1>
            <p className="text-slate-600 mt-1">
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
            </p>
          </div>
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agendar Consulta
          </Button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="checked_in">Check-in</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="no_show">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Data:</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Tipo:</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="consultation">Consulta</SelectItem>
                <SelectItem value="endoscopy">Endoscopia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => {
                    const { date, time } = formatDateTime(new Date(appointment.appointmentDate));
                    return (
                      <TableRow key={appointment.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell>{time}</TableCell>
                        <TableCell>{getTypeBadge(appointment.type)}</TableCell>
                        <TableCell>{appointment.duration} min</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {appointment.reason}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {appointment.status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => checkInMutation.mutate(appointment.id)}
                                disabled={checkInMutation.isPending}
                              >
                                <User className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <CalendarIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Nenhum agendamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Appointment Form Dialog */}
      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Editar Agendamento' : 'Agendar Nova Consulta'}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editingAppointment || undefined}
            patients={patients}
            onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
            onCancel={() => {
              setShowAppointmentForm(false);
              setEditingAppointment(null);
            }}
            isSubmitting={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
