'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { rolePermissions } from '@/utils/auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Droplets, 
  Home, 
  Database, 
  Calculator, 
  Map, 
  FolderOpen,
  FileText,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allNavItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" />, href: '/dashboard' },
    { key: 'projects', label: 'Projects', icon: <FolderOpen className="h-5 w-5" />, href: '/dashboard/projects' },
    { key: 'data-entry', label: 'Data Entry', icon: <Database className="h-5 w-5" />, href: '/dashboard/data-entry' },
    { key: 'calculations', label: 'Calculations', icon: <Calculator className="h-5 w-5" />, href: '/dashboard/calculations' },
    { key: 'visualization', label: 'Visualization', icon: <Map className="h-5 w-5" />, href: '/dashboard/visualization' },
    { key: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" />, href: '/dashboard/reports' },
    { key: 'trends', label: 'Trends', icon: <TrendingUp className="h-5 w-5" />, href: '/dashboard/trends' },
    { key: 'comparison', label: 'Comparison', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/comparison' },
    { key: 'alerts', label: 'Alerts', icon: <AlertTriangle className="h-5 w-5" />, href: '/dashboard/alerts' },
    { key: 'policies', label: 'Policies', icon: <Shield className="h-5 w-5" />, href: '/dashboard/policies' },
  ];

  const userPermissions = rolePermissions[user.role] || [];
  const navItems = allNavItems.filter(item => userPermissions.includes(item.key));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Droplets className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AquaSure</h1>
                  <p className="text-sm text-gray-500">Water Quality System</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 bg-blue-50 border-b">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
            <div className="text-xs text-blue-600 font-medium mt-1 capitalize">
              {user.role.replace('-', ' ')} Access
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  variant="ghost"
                  className="w-full justify-start text-left hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Button>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">AquaSure Dashboard</h1>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}