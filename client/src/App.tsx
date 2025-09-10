import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Appointments from "@/pages/appointments";
import Procedures from "@/pages/procedures";
import Billing from "@/pages/billing";
import Reports from "@/pages/reports";
import PatientEvolutions from "@/pages/patient-evolutions";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )} />
      <Route path="/patients" component={() => (
        <ProtectedRoute>
          <Patients />
        </ProtectedRoute>
      )} />
      <Route path="/appointments" component={() => (
        <ProtectedRoute>
          <Appointments />
        </ProtectedRoute>
      )} />
      <Route path="/procedures" component={() => (
        <ProtectedRoute>
          <Procedures />
        </ProtectedRoute>
      )} />
      <Route path="/patient-evolutions" component={() => (
        <ProtectedRoute>
          <PatientEvolutions />
        </ProtectedRoute>
      )} />
      <Route path="/billing" component={() => (
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      )} />
      <Route path="/reports" component={() => (
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
