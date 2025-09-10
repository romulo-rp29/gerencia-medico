import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, UserPlus, CheckCircle, FileText, CalendarDays, Activity, Users, DollarSign } from 'lucide-react';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PatientModal from '@/components/modals/patient-modal';
import AppointmentModal from '@/components/modals/appointment-modal';
import type { Patient } from '@shared/schema';

interface DashboardStats {
  todayAppointments: number;
  pendingProcedures: number;
  activePatients: number;
  monthlyRevenue: number;
}

interface TodayAppointment {
  id: string;
  appointmentDate: string;
  duration: number;
  type: 'consultation' | 'endoscopy';
  status: string;
  reason: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function Dashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery<TodayAppointment[]>({
    queryKey: ['/api/appointments/today'],
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      checked_in: { variant: 'outline', label: 'Check-in' },
      in_progress: { variant: 'destructive', label: 'In Progress' },
      completed: { variant: 'default', label: 'Completed' },
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
      <Badge className="bg-purple-100 text-purple-800 text-xs">Endoscopy</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 text-xs">Consultation</Badge>
    );
  };

  const handleViewAppointment = (appointment: TodayAppointment) => {
    // This would fetch the full patient data in a real app
    const patient: Patient = {
      id: appointment.patient.id,
      firstName: appointment.patient.firstName,
      lastName: appointment.patient.lastName,
      dateOfBirth: '',
      phone: '',
      email: null,
      address: null,
      emergencyContact: null,
      emergencyPhone: null,
      insurancePrimary: null,
      insurancePolicyNumber: null,
      insuranceGroupNumber: null,
      medicalHistory: [],
      allergies: [],
      medications: [],
      notes: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  if (statsLoading || appointmentsLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Dashboard" />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border h-32"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.todayAppointments || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+2</span>
                <span className="text-slate-500 ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Procedures</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.pendingProcedures || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-amber-600 font-medium">3 urgent</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Patients</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.activePatients || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+15</span>
                <span className="text-slate-500 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue (MTD)</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${stats?.monthlyRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+8.2%</span>
                <span className="text-slate-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <Button variant="ghost" size="sm">
                  View Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleViewAppointment(appointment)}
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <p className="text-sm font-medium text-slate-900">
                          {formatTime(appointment.appointmentDate)}
                        </p>
                        <p className="text-xs text-slate-500">{appointment.duration} min</p>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-slate-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </p>
                          {getTypeBadge(appointment.type)}
                        </div>
                        <p className="text-sm text-slate-500">{appointment.reason}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-medical-blue hover:bg-medical-blue/90"
                  onClick={() => setShowAppointmentModal(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                <Button variant="outline" className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
                <Button variant="outline" className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Patient Check-in
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">Patient checked in for endoscopy</p>
                      <p className="text-xs text-slate-500">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">New appointment scheduled</p>
                      <p className="text-xs text-slate-500">15 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">Payment received</p>
                      <p className="text-xs text-slate-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PatientModal
        patient={selectedPatient}
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
        onScheduleAppointment={(patient) => {
          setShowPatientModal(false);
          setShowAppointmentModal(true);
        }}
      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        patient={selectedPatient}
      />
    </div>
  );
}
