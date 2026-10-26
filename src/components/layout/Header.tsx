import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppSelector';
import { toggleSidebar } from '../../store/slices/appSlice';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const user     = useAppSelector(s => s.auth.user);

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-10">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-brand-700">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};
