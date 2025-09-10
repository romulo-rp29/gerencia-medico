import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Activity, FileText, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
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
import ProcedureForm from '@/components/forms/procedure-form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Procedure, Patient, User as UserType, InsertProcedure } from '@shared/schema';

type ProcedureWithDetails = Procedure & { patient: Patient; doctor: UserType };

export default function Procedures() {
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: procedures = [], isLoading } = useQuery<ProcedureWithDetails[]>({
    queryKey: ['/api/procedures'],
  });

  const createProcedureMutation = useMutation({
    mutationFn: async (data: InsertProcedure) => {
      const response = await apiRequest('POST', '/api/procedures', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procedures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Procedimento criado com sucesso",
      });
      setShowProcedureForm(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar procedimento",
        variant: "destructive",
      });
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcedure> }) => {
      const response = await apiRequest('PATCH', `/api/procedures/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/procedures'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Procedimento atualizado com sucesso",
      });
      setShowProcedureForm(false);
      setEditingProcedure(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar procedimento",
        variant: "destructive",
      });
    },
  });

  const filteredProcedures = procedures.filter(procedure => {
    if (statusFilter !== 'all' && procedure.status !== statusFilter) return false;
    if (typeFilter !== 'all' && procedure.procedureType !== typeFilter) return false;
    const procedureDate = new Date(procedure.scheduledDate).toISOString().slice(0, 10);
    if (dateFilter && procedureDate !== dateFilter) return false;
    return true;
  });

  const handleCreateProcedure = (data: InsertProcedure) => {
    createProcedureMutation.mutate(data);
  };

  const handleUpdateProcedure = (data: InsertProcedure) => {
    if (editingProcedure) {
      updateProcedureMutation.mutate({ id: editingProcedure.id, data });
    }
  };

  const handleEditProcedure = (procedure: ProcedureWithDetails) => {
    setEditingProcedure(procedure);
    setShowProcedureForm(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary', label: 'Agendado' },
      in_progress: { variant: 'destructive', label: 'Em Andamento' },
      completed: { variant: 'default', label: 'Concluído' },
      cancelled: { variant: 'secondary', label: 'Cancelado' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return (
      <Badge variant={config.variant as any} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
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
        <TopBar title="Procedimentos" />
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
      <TopBar title="Procedimentos" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Procedimentos</h1>
            <p className="text-slate-600 mt-1">
              {filteredProcedures.length} {filteredProcedures.length === 1 ? 'procedimento' : 'procedimentos'}
            </p>
          </div>
          <Button 
            onClick={() => setShowProcedureForm(true)}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Procedimento
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
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
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
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Upper Endoscopy">Endoscopia Digestiva Alta (EDA)</SelectItem>
                <SelectItem value="Colonoscopy">Colonoscopia</SelectItem>
                <SelectItem value="Flexible Sigmoidoscopy">Retossigmoidoscopia Flexível</SelectItem>
                <SelectItem value="Capsule Endoscopy">Cápsula Endoscópica</SelectItem>
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
                  <TableHead>Tipo de Procedimento</TableHead>
                  <TableHead>Data Agendada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Acompanhamento</TableHead>
                  <TableHead>Patologia</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures.length > 0 ? (
                  filteredProcedures.map((procedure) => {
                    const { date, time } = formatDateTime(procedure.scheduledDate);
                    const duration = procedure.startTime && procedure.endTime
                      ? Math.round((new Date(procedure.endTime).getTime() - new Date(procedure.startTime).getTime()) / 60000)
                      : null;
                    
                    return (
                      <TableRow key={procedure.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {procedure.patient.firstName} {procedure.patient.lastName}
                        </TableCell>
                        <TableCell>{procedure.procedureType}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-slate-500">{time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(procedure.status)}</TableCell>
                        <TableCell>
                          {duration ? `${duration} min` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {procedure.followUpRequired ? (
                            <Badge variant="outline" className="text-xs">Necessário</Badge>
                          ) : (
                            <span className="text-slate-400">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {procedure.pathologyOrdered ? (
                            <Badge variant="outline" className="text-xs">Solicitada</Badge>
                          ) : (
                            <span className="text-slate-400">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProcedure(procedure)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Nenhum procedimento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Procedure Form Dialog */}
      <Dialog open={showProcedureForm} onOpenChange={setShowProcedureForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProcedure ? 'Editar Procedimento' : 'Adicionar Novo Procedimento'}
            </DialogTitle>
          </DialogHeader>
          <ProcedureForm
            procedure={editingProcedure || undefined}
            onSubmit={editingProcedure ? handleUpdateProcedure : handleCreateProcedure}
            onCancel={() => {
              setShowProcedureForm(false);
              setEditingProcedure(null);
            }}
            isSubmitting={createProcedureMutation.isPending || updateProcedureMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
