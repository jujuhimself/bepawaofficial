import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils'; // Using the utility for class names

const retailNavItems = [
  { href: '/retail/dashboard', label: 'Dashboard' },
  { href: '/retail/pos', label: 'POS' },
  { href: '/retail/inventory', label: 'Inventory' },
  { href: '/retail/orders', label: 'Orders' },
  { href: '/retail/reports', label: 'Reports' },
  { href: '/retail/staff', label: 'Staff' },
];

export default function RetailLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Retail Portal</h2>
        <nav>
          <ul>
            {retailNavItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'block py-2 px-4 rounded transition-colors',
                    location.pathname.startsWith(item.href)
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-700/50'
                  )}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
} 