import Link from 'next/link';
import { 
  LayoutDashboard, 
  Sparkles, 
  Database, 
  Settings, 
  Package,
  Users,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPath: string;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Builder', href: '/builder', icon: Sparkles },
  { name: 'Modules', href: '/modules', icon: Settings },
  { name: 'Database', href: '/database', icon: Database },
];

const erpModules = [
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Accounting', href: '/accounting', icon: DollarSign },
  { name: 'HR', href: '/hr', icon: Briefcase },
];

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-bold text-lg">ERP Builder</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Builder
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}

        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">
          ERP Modules
        </p>
        {erpModules.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-500">admin@erp.local</p>
          </div>
        </div>
      </div>
    </div>
  );
}
