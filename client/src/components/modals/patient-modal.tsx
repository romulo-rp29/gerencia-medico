import { useState } from 'react';
import { X, Calendar, FileText, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Patient } from '@shared/schema';

interface PatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleAppointment?: (patient: Patient) => void;
  onAddNote?: (patient: Patient) => void;
  onViewBilling?: (patient: Patient) => void;
  onCreateEvolution?: (patient: Patient) => void;
}

export default function PatientModal({
  patient,
  isOpen,
  onClose,
  onScheduleAppointment,
  onAddNote,
  onViewBilling,
  onCreateEvolution,
}: PatientModalProps) {
  if (!patient) return null;

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const age = patient.dateOfBirth 
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Informações do Paciente</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Nome Completo</p>
                  <p className="font-medium text-slate-900">{fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Idade</p>
                  <p className="font-medium text-slate-900">{age} anos</p>
                </div>
                <div>
                  <p className="text-slate-500">Data de Nascimento</p>
                  <p className="font-medium text-slate-900">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Telefone</p>
                  <p className="font-medium text-slate-900">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500">E-mail</p>
                  <p className="font-medium text-slate-900">{patient.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Endereço</p>
                  <p className="font-medium text-slate-900">{patient.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {patient.emergencyContact && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Contato de Emergência</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nome do Contato</p>
                    <p className="font-medium text-slate-900">{patient.emergencyContact}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Telefone</p>
                    <p className="font-medium text-slate-900">{patient.emergencyPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Medical History */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Histórico Médico</h4>
              <div className="space-y-2 text-sm">
                {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                  patient.medicalHistory.map((condition, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-slate-700">{condition}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">Nenhum histórico médico registrado</p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Alergias</h4>
              <div className="flex flex-wrap gap-2">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">Nenhuma alergia conhecida</p>
                )}
              </div>
            </div>

            {/* Current Medications */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Medicamentos Atuais</h4>
              <div className="space-y-2 text-sm">
                {patient.medications && patient.medications.length > 0 ? (
                  patient.medications.map((medication, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-slate-700">{medication}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">Nenhum medicamento atual</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {patient.notes && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Observações</h4>
                <p className="text-sm text-slate-700">{patient.notes}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Ações</h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-medical-blue hover:bg-blue-50"
                  onClick={() => onScheduleAppointment?.(patient)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Consulta
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-medical-blue hover:bg-blue-50"
                  onClick={() => onAddNote?.(patient)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Adicionar Observação
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-medical-blue hover:bg-blue-50"
                  onClick={() => onViewBilling?.(patient)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ver Faturamento
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-medical-blue hover:bg-blue-50"
                  onClick={() => onCreateEvolution?.(patient)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Criar Evolução
                </Button>
              </div>
            </div>
            
            {/* Insurance Information */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Convênio</h4>
              <div className="text-sm space-y-2">
                <div>
                  <p className="text-slate-500">Principal</p>
                  <p className="font-medium text-slate-900">
                    {patient.insurancePrimary || 'Não especificado'}
                  </p>
                </div>
                {patient.insurancePolicyNumber && (
                  <div>
                    <p className="text-slate-500">Número da Apólice</p>
                    <p className="font-medium text-slate-900">{patient.insurancePolicyNumber}</p>
                  </div>
                )}
                {patient.insuranceGroupNumber && (
                  <div>
                    <p className="text-slate-500">Número do Grupo</p>
                    <p className="font-medium text-slate-900">{patient.insuranceGroupNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
