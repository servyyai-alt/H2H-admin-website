import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck, Search, CheckCircle2, XCircle, Clock,
  Eye, AlertTriangle, ShieldAlert, Check, X, RefreshCw, Filter
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { adminService } from '../../services/admin.service';
import { AdminItem, ApprovalStatus } from '../../types/admin';

export const AdminApproval: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Query approvals
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'approvals', page, tab, search],
    queryFn: () => adminService.getApprovals({
      page,
      limit: 15,
      tab: tab !== 'ALL' ? tab : undefined,
      search: search.trim() || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => adminService.approveAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setIsApproveConfirmOpen(false);
      setSelectedAdmin(null);
      setFeedback({
        type: 'success',
        message: `Admin account approved successfully! ${res.data.emailStatus?.sent ? 'Notification email sent.' : ''}`
      });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setFeedback({
        type: 'error',
        message: e.response?.data?.error?.message || 'Failed to approve admin account'
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminService.rejectAdmin(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setIsRejectModalOpen(false);
      setSelectedAdmin(null);
      setRejectReason('');
      setFeedback({
        type: 'success',
        message: 'Admin account has been rejected and preserved in a blocked state.'
      });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setFeedback({
        type: 'error',
        message: e.response?.data?.error?.message || 'Failed to reject admin account'
      });
    }
  });

  const getApprovalBadge = (s: ApprovalStatus) => {
    switch (s) {
      case 'APPROVED':
        return <Badge label="Approved" variant="green" />;
      case 'PENDING':
        return <Badge label="Pending Approval" variant="yellow" />;
      case 'REJECTED':
        return <Badge label="Rejected" variant="red" />;
      default:
        return <Badge label={s} variant="gray" />;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Admin Candidate',
      render: (row: Record<string, unknown>) => {
        const admin = row as unknown as AdminItem;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {admin.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{admin.name}</p>
              <p className="text-xs text-gray-500">{admin.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-xs text-gray-700">{row.phone as string}</span>
      )
    },
    {
      key: 'designation',
      label: 'Requested Designation / Role',
      render: (row: Record<string, unknown>) => {
        const admin = row as unknown as AdminItem;
        return (
          <div>
            <span className="text-xs font-semibold text-gray-800">{admin.designation || 'Administrator'}</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(admin.permissions || []).slice(0, 3).map(p => (
                <span key={p} className="inline-block px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-600 rounded">
                  {p}
                </span>
              ))}
              {(admin.permissions || []).length > 3 && (
                <span className="inline-block px-1.5 py-0.2 text-[10px] bg-gray-100 text-gray-400 rounded">
                  +{(admin.permissions || []).length - 3}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Creation Date',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt as string).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (row: Record<string, unknown>) => getApprovalBadge((row as unknown as AdminItem).approvalStatus)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Record<string, unknown>) => {
        const admin = row as unknown as AdminItem;
        const isPending = admin.approvalStatus === 'PENDING';

        return (
          <div className="flex items-center gap-2">
            {/* View Details */}
            <button
              onClick={() => {
                setSelectedAdmin(admin);
                setIsDetailOpen(true);
              }}
              title="Review Details"
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review</span>
            </button>

            {/* Quick Approve (Only for pending) */}
            {isPending && (
              <button
                onClick={() => {
                  setSelectedAdmin(admin);
                  setIsApproveConfirmOpen(true);
                }}
                title="Approve Admin"
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            )}

            {/* Quick Reject (Only for pending) */}
            {isPending && (
              <button
                onClick={() => {
                  setSelectedAdmin(admin);
                  setIsRejectModalOpen(true);
                }}
                title="Reject Admin"
                className="border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Account Approvals</h1>
              <p className="text-xs text-gray-500">
                Review and approve or reject newly created admin accounts before dashboard access is permitted.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-lg flex items-start justify-between text-sm ${
          feedback.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        <button
          onClick={() => { setTab('PENDING'); setPage(1); }}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            tab === 'PENDING'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approval</span>
          {(data?.counts?.pending ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {data?.counts?.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => { setTab('APPROVED'); setPage(1); }}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            tab === 'APPROVED'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved</span>
          {(data?.counts?.approved ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
              {data?.counts?.approved}
            </span>
          )}
        </button>

        <button
          onClick={() => { setTab('REJECTED'); setPage(1); }}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            tab === 'REJECTED'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rejected</span>
          {(data?.counts?.rejected ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
              {data?.counts?.rejected}
            </span>
          )}
        </button>

        <button
          onClick={() => { setTab('ALL'); setPage(1); }}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            tab === 'ALL'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>All Records</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Search */}
        <div className="mb-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 text-xs"
          />
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage={
            tab === 'PENDING'
              ? 'No admin accounts currently awaiting approval.'
              : `No ${tab.toLowerCase()} admin accounts found.`
          }
        />

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: View Details before approving/rejecting */}
      {isDetailOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Admin Account Review</h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="text-gray-400 font-medium">Candidate Name</p>
                <p className="text-sm font-bold text-gray-900">{selectedAdmin.name}</p>
                <p className="text-gray-600">{selectedAdmin.email} · {selectedAdmin.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400">Designation</p>
                  <p className="font-semibold text-gray-800">{selectedAdmin.designation || 'Administrator'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400">Current Status</p>
                  <p className="font-semibold text-gray-800">{selectedAdmin.approvalStatus}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">Requested Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {(selectedAdmin.permissions || []).length > 0 ? (
                    selectedAdmin.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-[11px] font-medium">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No specific permissions requested.</span>
                  )}
                </div>
              </div>

              {selectedAdmin.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded text-red-800">
                  <p className="font-semibold mb-0.5">Rejection Reason:</p>
                  <p>{selectedAdmin.rejectionReason}</p>
                </div>
              )}

              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-blue-800 text-[11px]">
                <p>
                  <strong>Approval Security Rule:</strong> Approving this account marks it as <strong>Approved</strong> and activates access. The account status is immediately synchronized with the Admin Management panel.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>

              {selectedAdmin.approvalStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                    className="border border-red-300 text-red-700 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsApproveConfirmOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                  >
                    Approve Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Approval */}
      {isApproveConfirmOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Approve Administrator?</h3>
                <p className="text-xs text-gray-500">
                  {selectedAdmin.name} ({selectedAdmin.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Approving will set this administrator's status to <strong>APPROVED & ACTIVE</strong>. The admin will be eligible to sign in and perform tasks according to their assigned permissions.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsApproveConfirmOpen(false);
                  setSelectedAdmin(null);
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(selectedAdmin._id)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject with optional reason */}
      {isRejectModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reject Admin Account?</h3>
                <p className="text-xs text-gray-500">
                  {selectedAdmin.name} ({selectedAdmin.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Rejecting this account will set its status to <strong>REJECTED</strong> and keep the record in the database for audit history. The user will be blocked from logging into the platform.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Identity verification failed, unauthorized creation request..."
                rows={3}
                className="input text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedAdmin(null);
                  setRejectReason('');
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: selectedAdmin._id, reason: rejectReason.trim() })}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
