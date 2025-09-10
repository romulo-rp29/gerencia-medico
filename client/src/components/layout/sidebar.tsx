import { Link, useLocation } from 'wouter';
import { Home, UserX, Calendar, Activity, DollarSign, BarChart, LogOut, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Patients', href: '/patients', icon: UserX },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Procedures', href: '/procedures', icon: Activity },
  { name: 'Patient Evolutions', href: '/patient-evolutions', icon: FileText },
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">GastroMed</h1>
            <p className="text-sm text-slate-500">Dr. Smith's Practice</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn("sidebar-link", isActive && "active")}>
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <UserX className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="w-full justify-start text-slate-600 hover:text-slate-900"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
