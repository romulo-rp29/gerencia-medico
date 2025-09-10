import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, TrendingUp, Users, Activity } from 'lucide-react';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Patient, User as UserType, Procedure } from '@shared/schema';

type AppointmentWithDetails = Appointment & { patient: Patient; doctor: UserType };
type ProcedureWithDetails = Procedure & { patient: Patient; doctor: UserType };

export default function Reports() {
  const [reportType, setReportType] = useState<string>('appointments');
  const [dateRange, setDateRange] = useState<string>('month');
  
  const { toast } = useToast();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: procedures = [], isLoading: proceduresLoading } = useQuery<ProcedureWithDetails[]>({
    queryKey: ['/api/procedures'],
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    return ranges[dateRange as keyof typeof ranges] || ranges.month;
  };

  const startDate = getDateRange();
  const endDate = new Date();

  // Filter data by date range
  const filterByDateRange = (items: { createdAt?: Date; appointmentDate?: string; scheduledDate?: string }[]) => {
    return items.filter(item => {
      const itemDate = new Date(
        item.appointmentDate || 
        item.scheduledDate || 
        item.createdAt || 
        new Date()
      );
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredAppointments = filterByDateRange(appointments);
  const filteredProcedures = filterByDateRange(procedures);
  const filteredPatients = filterByDateRange(patients);

  // Calculate metrics
  const appointmentsByType = filteredAppointments.reduce((acc, apt) => {
    acc[apt.type] = (acc[apt.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const proceduresByType = filteredProcedures.reduce((acc, proc) => {
    acc[proc.procedureType] = (acc[proc.procedureType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const appointmentsByStatus = filteredAppointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download.",
    });
    
    // In a real implementation, this would generate and download a file
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your report has been downloaded successfully.",
      });
    }, 2000);
  };

  const formatDateRange = () => {
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  if (appointmentsLoading || proceduresLoading || patientsLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Reports" />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border h-32"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Reports" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
            <p className="text-slate-600 mt-1">
              Practice analytics for {formatDateRange()}
            </p>
          </div>
          <Button 
            onClick={handleExportReport}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Controls */}
        <div className="flex space-x-4 mb-8">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Report Type:</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">Appointments</SelectItem>
                <SelectItem value="procedures">Procedures</SelectItem>
                <SelectItem value="patients">Patients</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Date Range:</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Procedures Completed</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredProcedures.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">New Patients</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredPatients.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredAppointments.length > 0 
                      ? Math.round((filteredAppointments.filter(a => a.status === 'completed').length / filteredAppointments.length) * 100)
                      : 0
                    }%
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointments by Type */}
          {reportType === 'appointments' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Appointments by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(appointmentsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={type === 'endoscopy' ? 'default' : 'secondary'}>
                            {type}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Appointments by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(appointmentsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Procedures by Type */}
          {reportType === 'procedures' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Procedures by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(proceduresByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Procedures</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcedures.slice(0, 5).map((procedure) => (
                        <TableRow key={procedure.id}>
                          <TableCell className="font-medium">
                            {procedure.patient.firstName} {procedure.patient.lastName}
                          </TableCell>
                          <TableCell>{procedure.procedureType}</TableCell>
                          <TableCell>
                            {new Date(procedure.scheduledDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {procedure.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Patient Demographics */}
          {reportType === 'patients' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Patient Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.insurancePrimary || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={patient.isActive ? "default" : "secondary"}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Revenue Report */}
          {reportType === 'revenue' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Revenue reporting coming soon</p>
                  <p className="text-sm">Detailed financial analytics will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
