import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Search, UserCheck, XCircle,
  Clock, MapPin, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { adminService } from '../../services/admin.service';
import { apiClient } from '../../services/api.service';

const PIPELINE_TABS = [
  { id: '', label: 'All Live Pipeline' },
  { id: 'SEARCHING_FOR_PARTNER', label: 'Searching Partner' },
  { id: 'PARTNER_ASSIGNED', label: 'Partner Assigned' },
  { id: 'IN_TRANSIT', label: 'In Transit' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const DeliveryList: React.FC = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [reassignModal, setReassignModal] = useState<{ open: boolean; deliveryId: string; currentPartner?: string } | null>(null);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; deliveryId: string } | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Query deliveries
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'deliveries', page, status],
    queryFn: () => apiClient.get(`/admin/deliveries?page=${page}&limit=15${status ? `&status=${status}` : ''}`).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Query partners list for reassign modal dropdown
  const { data: partnersList } = useQuery({
    queryKey: ['admin', 'partners-active'],
    queryFn: () => adminService.getPartners({ limit: 50 }),
    enabled: !!reassignModal?.open,
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      adminService.reassignDelivery(id, partnerId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
      setReassignModal(null);
      setSelectedPartnerId('');
      setFeedback({ type: 'success', message: res.message || 'Delivery partner reassigned successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to reassign partner';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.cancelDelivery(id, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
      setCancelModal(null);
      setCancelReason('');
      setFeedback({ type: 'success', message: res.message || 'Delivery cancelled with reason' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to cancel delivery';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const statusColor = (s: string): 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' => {
    const map: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'> = {
      DELIVERED: 'green',
      CANCELLED: 'red',
      SEARCHING_FOR_PARTNER: 'yellow',
      SEARCHING_PARTNER: 'yellow',
      PENDING: 'yellow',
      PARTNER_ASSIGNED: 'blue',
      IN_TRANSIT: 'purple',
    };
    return map[s] ?? 'gray';
  };

  const columns = [
    {
      key: 'trackingId',
      label: 'Tracking ID',
      render: (r: Record<string, unknown>) => (
        <span className="font-mono text-xs font-semibold text-gray-900">
          {(r.trackingId as string) || String(r._id).slice(-8)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Pipeline State',
      render: (r: Record<string, unknown>) => (
        <Badge
          label={(r.status as string)?.replace(/_/g, ' ')}
          variant={statusColor(r.status as string)}
        />
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r: Record<string, unknown>) => {
        const cust = r.customer as { name?: string; phone?: string } | undefined;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{cust?.name || 'Customer'}</p>
            <p className="text-[11px] text-gray-500">{cust?.phone || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'partner',
      label: 'Assigned Partner',
      render: (r: Record<string, unknown>) => {
        const partner = r.partner as { name?: string; phone?: string } | undefined;
        if (!partner) {
          return <span className="text-xs text-amber-600 font-medium">Searching...</span>;
        }
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{partner.name}</p>
            <p className="text-[11px] text-gray-500">{partner.phone}</p>
          </div>
        );
      },
    },
    {
      key: 'route',
      label: 'Route Summary',
      render: (r: Record<string, unknown>) => {
        const pickup = r.pickupAddress as { addressText?: string } | undefined;
        const drop = r.dropoffAddress as { addressText?: string } | undefined;
        return (
          <div className="max-w-xs text-xs space-y-0.5">
            <p className="text-gray-700 truncate">
              <strong>From:</strong> {pickup?.addressText || 'Pickup'}
            </p>
            <p className="text-gray-500 truncate">
              <strong>To:</strong> {drop?.addressText || 'Dropoff'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Booked',
      render: (r: Record<string, unknown>) =>
        new Date(r.createdAt as string).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'actions',
      label: 'Operations Action',
      render: (r: Record<string, unknown>) => {
        const canReassign = r.status !== 'DELIVERED' && r.status !== 'CANCELLED';
        const canCancel = r.status !== 'DELIVERED' && r.status !== 'CANCELLED';
        return (
          <div className="flex items-center gap-2">
            {canReassign && (
              <button
                onClick={() =>
                  setReassignModal({
                    open: true,
                    deliveryId: r._id as string,
                    currentPartner: (r.partner as any)?.name,
                  })
                }
                className="text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                Reassign
              </button>
            )}
            {canCancel && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setCancelModal({ open: true, deliveryId: r._id as string })}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Cancel
                </button>
              </>
            )}
            {!canReassign && !canCancel && (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-600" />
          Live Deliveries Pipeline
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time operations tracking: monitor delivery flow, reassign drivers, and manage order exceptions
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        {/* Pipeline State Tabs */}
        <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-3">
          {PIPELINE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatus(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage="No active deliveries in this pipeline stage"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1} ({data.pagination.total} deliveries)
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

      {/* Manual Reassign Partner Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-600" />
                Manual Partner Reassignment
              </h3>
              <button onClick={() => setReassignModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <p className="text-xs text-gray-600">
              Currently assigned: <strong>{reassignModal.currentPartner || 'Unassigned / Searching'}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Active Delivery Partner
              </label>
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="input text-xs"
              >
                <option value="">Choose partner...</option>
                {(partnersList?.data || []).map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.phone}) {p.isOnline ? '— Online' : '— Offline'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassignModal(null)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button
                onClick={() => reassignMutation.mutate({ id: reassignModal.deliveryId, partnerId: selectedPartnerId })}
                disabled={!selectedPartnerId || reassignMutation.isPending}
                className="btn-primary text-xs px-4 py-2"
              >
                {reassignMutation.isPending ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Delivery Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                Cancel Delivery Order
              </h3>
              <button onClick={() => setCancelModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancellation Reason (Required)
              </label>
              <textarea
                rows={3}
                required
                placeholder="State operational reason for cancelling this delivery..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCancelModal(null)} className="btn-secondary text-xs px-4 py-2">
                Back
              </button>
              <button
                onClick={() => cancelMutation.mutate({ id: cancelModal.deliveryId, reason: cancelReason })}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
