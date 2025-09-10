import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, CreditCard, FileText } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Billing, Patient } from '@shared/schema';

type BillingWithPatient = Billing & { patient: Patient };

export default function Billing() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingRecords = [], isLoading } = useQuery<BillingWithPatient[]>({
    queryKey: ['/api/billing'],
  });

  const updateBillingMutation = useMutation({
    mutationFn: async ({ id, status, paidDate, paymentMethod }: { 
      id: string; 
      status: string; 
      paidDate?: Date;
      paymentMethod?: string;
    }) => {
      const response = await apiRequest('PATCH', `/api/billing/${id}`, {
        status,
        paidDate,
        paymentMethod,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const filteredRecords = billingRecords.filter(record => {
    if (statusFilter !== 'all' && record.status !== statusFilter) return false;
    return true;
  });

  const handleMarkAsPaid = (record: BillingWithPatient) => {
    updateBillingMutation.mutate({
      id: record.id,
      status: 'paid',
      paidDate: new Date(),
      paymentMethod: 'Cash', // This could be enhanced with a proper payment method selector
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      paid: { variant: 'default', label: 'Paid', className: 'bg-green-100 text-green-800' },
      overdue: { variant: 'destructive', label: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'secondary', label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant as any} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const totalPending = filteredRecords
    .filter(record => record.status === 'pending')
    .reduce((sum, record) => sum + parseFloat(record.patientResponsibility), 0);

  const totalPaid = filteredRecords
    .filter(record => record.status === 'paid')
    .reduce((sum, record) => sum + parseFloat(record.amount), 0);

  const totalOverdue = filteredRecords
    .filter(record => record.status === 'overdue')
    .reduce((sum, record) => sum + parseFloat(record.patientResponsibility), 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Billing" />
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
      <TopBar title="Billing" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
            <p className="text-slate-600 mt-1">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalPending.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Paid</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalPaid.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overdue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalOverdue.toString())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Records</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {billingRecords.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Patient Responsibility</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const isOverdue = new Date(record.dueDate) < new Date() && record.status === 'pending';
                    
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {record.patient.firstName} {record.patient.lastName}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={record.description}>
                            {record.description}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(record.amount)}</TableCell>
                        <TableCell>
                          {record.insuranceCovered ? 
                            formatCurrency(record.insuranceCovered) : 
                            '$0.00'
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.patientResponsibility)}
                        </TableCell>
                        <TableCell>
                          <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(record.dueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(isOverdue ? 'overdue' : record.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {(record.status === 'pending' || isOverdue) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(record)}
                                disabled={updateBillingMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No billing records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
