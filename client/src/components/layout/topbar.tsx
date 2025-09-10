import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  title: string;
  onSearch?: (query: string) => void;
}

export default function TopBar({ title, onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-medical-red" />
          </Button>
          <div className="text-right">
            <p className="text-sm text-slate-500">Today's Date</p>
            <p className="text-sm font-medium text-slate-900">{currentDate}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
