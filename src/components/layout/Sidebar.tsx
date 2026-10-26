import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package,
  DollarSign, HeadphonesIcon, BarChart3, Settings,
  LogOut, ShieldCheck, Lock, LifeBuoy, Image
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../store/slices/authSlice';

// Super Admin Navigation
const superAdminNav = [
  { to: '/dashboard',          label: 'Owner Dashboard',       icon: LayoutDashboard },
  { to: '/partners',           label: 'Delivery Partners',     icon: Truck },
  { to: '/admin-management',   label: 'Admin Management',      icon: ShieldCheck },
  { to: '/settings',           label: 'Platform Settings',     icon: Settings },
  { to: '/payments',           label: 'Payments & Financials', icon: DollarSign },
  { to: '/reports',            label: 'Reports & Analytics',   icon: BarChart3 },
  { to: '/support-oversight',  label: 'Dispute Oversight',     icon: LifeBuoy },
  { to: '/cms',                label: 'Content Management',    icon: Image },
  { to: '/security-logs',      label: 'Security & Logs',       icon: Lock },
];

// Exactly 5 sections for Regular Admin — Operations Team
const regularAdminNav = [
  { to: '/dashboard',          label: 'Operations Dashboard',  icon: LayoutDashboard },
  { to: '/customers',          label: 'Customers',             icon: Users },
  { to: '/partners',           label: 'Delivery Partners',     icon: Truck },
  { to: '/deliveries',         label: 'Live Deliveries',       icon: Package },
  { to: '/support',            label: 'Support Tickets',       icon: HeadphonesIcon },
];

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navItems = isSuperAdmin ? superAdminNav : regularAdminNav;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Hand2Hand"
            className="w-8 h-8 object-contain rounded-lg shadow-xs"
          />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Hand2Hand</p>
            <p className="text-[11px] text-gray-400 font-medium">
              {isSuperAdmin ? 'Super Admin (Owner)' : 'Operations Team'}
            </p>
          </div>
        </div>
      </div>

      {/* Role-Based Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {isSuperAdmin ? 'Platform Management' : 'Operations Workspace (5)'}
          </p>
        </div>

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Sign Out */}
      <div className="px-3 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="px-3 py-2.5 mb-2 bg-white rounded-lg border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
          <p className="text-[11px] text-gray-500 truncate">{user?.email || user?.phone || ''}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
              isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role || 'ADMIN'}
            </span>
            <span className="text-[10px] text-gray-400">Vellore Zone</span>
          </div>
        </div>

        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
};
