import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppSelector } from '../../hooks/useAppSelector';

export const AppLayout: React.FC = () => {
  const sidebarOpen = useAppSelector(s => s.app.sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
