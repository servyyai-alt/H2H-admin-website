import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert, Lock, UserCheck, Key,
  Clock, Globe, AlertTriangle, CheckCircle2, Search
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { AdminAuditLog } from '../../types/admin';

export const SecurityLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page],
    queryFn: () => adminService.getAuditLogs({ page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const actionVariant = (action: string) => {
    if (action.includes('REJECT') || action.includes('BLOCKED') || action.includes('CANCEL')) return 'red';
    if (action.includes('APPROVED') || action.includes('CREATED') || action.includes('ACTIVE')) return 'green';
    if (action.includes('RESET') || action.includes('PASSWORD') || action.includes('SETTINGS')) return 'yellow';
    return 'blue';
  };

  const filteredLogs = (data?.data ?? []).filter(log => {
    if (!filterAction) return true;
    return log.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  const columns = [
    {
      key: 'action',
      label: 'Security Action',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        return (
          <div className="flex items-center gap-2">
            <Badge label={item.action.replace(/_/g, ' ')} variant={actionVariant(item.action)} />
          </div>
        );
      },
    },
    {
      key: 'performedBy',
      label: 'Operator / Admin',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{item.performedBy?.name || 'System / Super Admin'}</p>
            <p className="text-[11px] text-gray-500">{item.performedBy?.email || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'targetUser',
      label: 'Target User / Resource',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        if (!item.targetUser) {
          return <span className="text-xs text-gray-400">Platform Settings / Broadcast</span>;
        }
        return (
          <div>
            <p className="text-xs font-medium text-gray-900">{item.targetUser?.name || 'Admin / User'}</p>
            <p className="text-[11px] text-gray-500">{item.targetUser?.email || item.targetUser?.role || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'details',
      label: 'Details / Context',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        const detailsStr = item.details ? JSON.stringify(item.details) : '—';
        return (
          <span className="font-mono text-[11px] text-gray-600 block max-w-xs truncate" title={detailsStr}>
            {detailsStr}
          </span>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        return (
          <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
            <Globe className="w-3 h-3 text-gray-400" />
            {item.ipAddress || '127.0.0.1'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminAuditLog;
        return (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-700" />
            Security & Activity Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Strict audit trail of admin logins, credentials changes, status overrides, and system operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="input py-1.5 text-xs w-48"
          >
            <option value="">All Security Events</option>
            <option value="ADMIN_">Admin Account Events</option>
            <option value="PASSWORD_RESET">Password Resets</option>
            <option value="SETTINGS_UPDATED">Settings Updates</option>
            <option value="CUSTOMER_STATUS">Customer Status Updates</option>
            <option value="PARTNER_">Partner Status/KYC</option>
            <option value="DISPUTE_">Dispute Rulings</option>
            <option value="BROADCAST">Announcements</option>
          </select>
        </div>
      </div>

      {/* Security Alerts Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">System Integrity</p>
            <p className="text-sm font-bold text-gray-900">Protected & Encrypted</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Access Control Model</p>
            <p className="text-sm font-bold text-gray-900">Strict RBAC Enforced</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Credential Policy</p>
            <p className="text-sm font-bold text-gray-900">Direct Manual Provisioning</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <Table
          columns={columns}
          data={filteredLogs}
          loading={isLoading}
          emptyMessage="No audit logs recorded for this criteria"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1} ({data.pagination.total} events recorded)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (data.pagination.totalPages || 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
