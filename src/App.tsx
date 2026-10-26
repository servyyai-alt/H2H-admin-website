import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useAppSelector';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { SetupPassword } from './pages/auth/SetupPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CustomerList } from './pages/customers/CustomerList';
import { PartnerList } from './pages/partners/PartnerList';
import { DeliveryList } from './pages/deliveries/DeliveryList';
import { SupportTickets } from './pages/support/SupportTickets';
import { AdminManagement } from './pages/admin/AdminManagement';
import { PlatformSettings } from './pages/settings/PlatformSettings';
import { PaymentsOverview } from './pages/payments/PaymentsOverview';
import { ReportsAnalytics } from './pages/reports/ReportsAnalytics';
import { SupportOversight } from './pages/support/SupportOversight';
import { ContentManagement } from './pages/cms/ContentManagement';
import { SecurityLogs } from './pages/security/SecurityLogs';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppSelector(s => s.auth.user);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/setup-password" element={<SetupPassword />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Section 1: Dashboard (Role-aware: Owner for Super Admin, Operations for Regular Admin) */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Regular Admin Operations Routes (Also accessible by Super Admin) */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="partners" element={<PartnerList />} />
        <Route path="deliveries" element={<DeliveryList />} />
        <Route path="support" element={<SupportTickets />} />

        {/* Super Admin — Owner Protected Routes (Strictly 8 Sections Total) */}
        <Route
          path="admin-management"
          element={
            <SuperAdminRoute>
              <AdminManagement />
            </SuperAdminRoute>
          }
        />
        <Route
          path="settings"
          element={
            <SuperAdminRoute>
              <PlatformSettings />
            </SuperAdminRoute>
          }
        />
        <Route
          path="payments"
          element={
            <SuperAdminRoute>
              <PaymentsOverview />
            </SuperAdminRoute>
          }
        />
        <Route
          path="reports"
          element={
            <SuperAdminRoute>
              <ReportsAnalytics />
            </SuperAdminRoute>
          }
        />
        <Route
          path="support-oversight"
          element={
            <SuperAdminRoute>
              <SupportOversight />
            </SuperAdminRoute>
          }
        />
        <Route
          path="cms"
          element={
            <SuperAdminRoute>
              <ContentManagement />
            </SuperAdminRoute>
          }
        />
        <Route
          path="security-logs"
          element={
            <SuperAdminRoute>
              <SecurityLogs />
            </SuperAdminRoute>
          }
        />

        {/* Redirects for legacy routes */}
        <Route path="admin-approval" element={<Navigate to="/admin-management" replace />} />
        <Route path="home-cards" element={<Navigate to="/cms" replace />} />
        <Route path="home-banners" element={<Navigate to="/cms" replace />} />
        <Route path="pricing" element={<Navigate to="/settings" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
