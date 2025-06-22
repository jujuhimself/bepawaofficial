import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  LogOut,
  TrendingUp,
  ClipboardList,
  UserCheck,
  BarChart3
} from 'lucide-react';

const WholesaleLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/wholesale/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/wholesale/products', icon: Package },
    { name: 'Orders', href: '/wholesale/orders', icon: ShoppingCart },
    { name: 'POS System', href: '/wholesale/pos', icon: CreditCard },
    { name: 'CRM/Credit', href: '/wholesale/crm', icon: Users },
    { name: 'Staff', href: '/wholesale/staff', icon: UserCheck },
    { name: 'Adjustments', href: '/wholesale/adjustments', icon: ClipboardList },
    { name: 'Audit Log', href: '/wholesale/audit', icon: FileText },
    { name: 'Analytics', href: '/wholesale/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/wholesale/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {user?.businessName || 'Wholesale'}
          </h2>
          <p className="text-sm text-gray-500">Wholesale Dashboard</p>
        </div>
        
        <nav className="mt-6">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-64 p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default WholesaleLayout; 