import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
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
import PatientForm from '@/components/forms/patient-form';
import PatientModal from '@/components/modals/patient-modal';
import AppointmentModal from '@/components/modals/appointment-modal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Patient, InsertPatient } from '@shared/schema';

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const { data: searchResults = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: () => 
      fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json()),
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso",
      });
      setShowPatientForm(false);
      setEditingPatient(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar paciente",
        variant: "destructive",
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPatient> }) => {
      const response = await apiRequest('PATCH', `/api/patients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso",
      });
      setShowPatientForm(false);
      setEditingPatient(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar paciente",
        variant: "destructive",
      });
    },
  });

  const displayedPatients = searchQuery.length > 2 ? searchResults : patients;

  const handleCreatePatient = (data: InsertPatient) => {
    createPatientMutation.mutate(data);
  };

  const handleUpdatePatient = (data: InsertPatient) => {
    if (editingPatient) {
      updatePatientMutation.mutate({ id: editingPatient.id, data });
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  const handleCreateEvolution = (patient: Patient) => {
    setLocation(`/patient-evolutions?patientId=${patient.id}`);
  };

  const handleScheduleAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(false);
    setShowAppointmentModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Pacientes" />
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
      <TopBar title="Pacientes" onSearch={setSearchQuery} />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Pacientes</h1>
            <p className="text-slate-600 mt-1">
              {displayedPatients.length} {displayedPatients.length === 1 ? 'paciente' : 'pacientes'}
            </p>
          </div>
          <Button 
            onClick={() => setShowPatientForm(true)}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Paciente
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedPatients.length > 0 ? (
                  displayedPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        {patient.dateOfBirth 
                          ? new Date(patient.dateOfBirth).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email || 'N/A'}</TableCell>
                      <TableCell>{patient.insurancePrimary || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? "default" : "secondary"}>
                          {patient.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPatient(patient)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      {searchQuery ? 'Nenhum paciente encontrado para sua busca.' : 'Nenhum paciente cadastrado ainda.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Patient Form Dialog */}
      <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={editingPatient || undefined}
            onSubmit={editingPatient ? handleUpdatePatient : handleCreatePatient}
            onCancel={() => {
              setShowPatientForm(false);
              setEditingPatient(null);
            }}
            isSubmitting={createPatientMutation.isPending || updatePatientMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Patient Details Modal */}
      <PatientModal
        patient={selectedPatient}
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
        onScheduleAppointment={handleScheduleAppointment}
        onAddNote={(patient) => {
          toast({
            title: "Funcionalidade em Breve",
            description: "A funcionalidade de anotações estará disponível em breve.",
          });
        }}
        onCreateEvolution={handleCreateEvolution}
        onViewBilling={(patient) => {
          toast({
            title: "Funcionalidade em Breve",
            description: "Os detalhes de faturamento do paciente estarão disponíveis em breve.",
          });
        }}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </div>
  );
}
