import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientEvolutionForm } from "@/components/forms/patient-evolution-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, FileText, Calendar, User, Stethoscope, ClipboardCheck } from "lucide-react";
import type { 
  PatientEvolution, 
  Patient, 
  User as UserType, 
  Appointment,
  InsertPatientEvolution 
} from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PatientEvolutionWithRelations = PatientEvolution & {
  patient: Patient;
  doctor: UserType;
  appointment?: Appointment;
};

export default function PatientEvolutions() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState<PatientEvolutionWithRelations | null>(null);
  const [selectedEvolution, setSelectedEvolution] = useState<PatientEvolutionWithRelations | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/users", "doctor"],
    queryFn: () => apiRequest("/api/users?role=doctor"),
  });

  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch evolutions for selected patient
  const { data: evolutions = [], isLoading } = useQuery({
    queryKey: ["/api/patient-evolutions", selectedPatientId],
    queryFn: () => apiRequest(`/api/patient-evolutions/${selectedPatientId}`),
    enabled: !!selectedPatientId,
  });

  const createEvolutionMutation = useMutation({
    mutationFn: (data: InsertPatientEvolution) => 
      apiRequest("/api/patient-evolutions", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-evolutions"] });
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Evolução criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar evolução.",
        variant: "destructive",
      });
    },
  });

  const updateEvolutionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertPatientEvolution> }) =>
      apiRequest(`/api/patient-evolutions/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-evolutions"] });
      setEditingEvolution(null);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Evolução atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar evolução.",
        variant: "destructive",
      });
    },
  });

  const deleteEvolutionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/patient-evolutions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-evolutions"] });
      toast({
        title: "Sucesso",
        description: "Evolução excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir evolução.",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvolution = (data: InsertPatientEvolution) => {
    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente primeiro.",
        variant: "destructive",
      });
      return;
    }
    createEvolutionMutation.mutate({
      ...data,
      patientId: selectedPatientId,
    });
  };

  const handleUpdateEvolution = (data: Partial<InsertPatientEvolution>) => {
    if (!editingEvolution) return;
    updateEvolutionMutation.mutate({
      id: editingEvolution.id,
      data,
    });
  };

  const handleDeleteEvolution = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta evolução?")) {
      deleteEvolutionMutation.mutate(id);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const filteredPatients = patients.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Evolução dos Pacientes</h1>
        <Button 
          onClick={() => {
            if (!selectedPatientId) {
              toast({
                title: "Atenção",
                description: "Selecione um paciente primeiro.",
                variant: "destructive",
              });
              return;
            }
            setEditingEvolution(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Evolução
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Selecionar Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPatientId === patient.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <h3 className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {patient.phone}
                    </p>
                    {patient.dateOfBirth && (
                      <p className="text-xs text-gray-500">
                        Nascimento: {format(new Date(patient.dateOfBirth), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Paciente Selecionado
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolutions List */}
        <div className="lg:col-span-2">
          {!selectedPatientId ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Selecione um Paciente
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Escolha um paciente na lista ao lado para visualizar suas evoluções.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Carregando evoluções...</p>
                </div>
              </CardContent>
            </Card>
          ) : evolutions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Stethoscope size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhuma Evolução Encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Este paciente ainda não possui evoluções registradas.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Criar Primeira Evolução
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {evolutions.map((evolution) => (
                <Card key={evolution.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" />
                        <span className="font-medium">
                          {format(new Date(evolution.evolutionDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          Dr. {evolution.doctor.fullName}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvolution(evolution)}
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvolution(evolution);
                            setShowForm(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvolution(evolution.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {evolution.chiefComplaint && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Queixa Principal:
                        </h4>
                        <p className="text-sm line-clamp-2">{evolution.chiefComplaint}</p>
                      </div>
                    )}
                    {evolution.assessment && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Avaliação:
                        </h4>
                        <p className="text-sm line-clamp-2">{evolution.assessment}</p>
                      </div>
                    )}
                    {evolution.appointment && (
                      <Badge variant="secondary" className="text-xs">
                        Consulta: {evolution.appointment.reason}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvolution ? "Editar Evolução" : "Nova Evolução"}
            </DialogTitle>
          </DialogHeader>
          <PatientEvolutionForm
            onSubmit={editingEvolution ? handleUpdateEvolution : handleCreateEvolution}
            onCancel={() => {
              setShowForm(false);
              setEditingEvolution(null);
            }}
            defaultValues={editingEvolution ? {
              ...editingEvolution,
              evolutionDate: format(new Date(editingEvolution.evolutionDate), "yyyy-MM-dd"),
            } : {
              patientId: selectedPatientId,
            }}
            patients={patients}
            doctors={doctors}
            appointments={appointments}
            isSubmitting={createEvolutionMutation.isPending || updateEvolutionMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Evolution Details Dialog */}
      <Dialog open={!!selectedEvolution} onOpenChange={() => setSelectedEvolution(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Evolução de {selectedEvolution?.patient.firstName} {selectedEvolution?.patient.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedEvolution && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Data:</strong> {format(new Date(selectedEvolution.evolutionDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div>
                  <strong>Médico:</strong> {selectedEvolution.doctor.fullName}
                </div>
                {selectedEvolution.appointment && (
                  <div className="col-span-2">
                    <strong>Consulta:</strong> {selectedEvolution.appointment.reason}
                  </div>
                )}
              </div>

              {selectedEvolution.chiefComplaint && (
                <div>
                  <h4 className="font-medium mb-2">Queixa Principal</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.chiefComplaint}
                  </p>
                </div>
              )}

              {selectedEvolution.historyOfPresentIllness && (
                <div>
                  <h4 className="font-medium mb-2">História da Doença Atual</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.historyOfPresentIllness}
                  </p>
                </div>
              )}

              {selectedEvolution.physicalExamination && (
                <div>
                  <h4 className="font-medium mb-2">Exame Físico</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.physicalExamination}
                  </p>
                </div>
              )}

              {selectedEvolution.assessment && (
                <div>
                  <h4 className="font-medium mb-2">Avaliação/Diagnóstico</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.assessment}
                  </p>
                </div>
              )}

              {selectedEvolution.plan && (
                <div>
                  <h4 className="font-medium mb-2">Plano Terapêutico</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.plan}
                  </p>
                </div>
              )}

              {selectedEvolution.prescriptions && selectedEvolution.prescriptions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prescrições</h4>
                  <div className="space-y-2">
                    {(selectedEvolution.prescriptions as any[]).map((prescription, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Medicamento:</strong> {prescription.medication}</div>
                          <div><strong>Dosagem:</strong> {prescription.dosage}</div>
                          <div><strong>Frequência:</strong> {prescription.frequency}</div>
                          <div><strong>Duração:</strong> {prescription.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvolution.nextAppointment && (
                <div>
                  <h4 className="font-medium mb-2">Próxima Consulta</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.nextAppointment}
                  </p>
                </div>
              )}

              {selectedEvolution.observations && (
                <div>
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {selectedEvolution.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}