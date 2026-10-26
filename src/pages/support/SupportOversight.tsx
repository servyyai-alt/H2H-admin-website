import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy, AlertOctagon, CheckCircle2,
  Clock, MessageSquare, DollarSign, Check, X, ShieldAlert
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { DisputeTicketItem } from '../../types/admin';

export const SupportOversight: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<DisputeTicketItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [actionType, setActionType] = useState<'REFUND_APPROVED' | 'DISPUTE_REJECTED' | 'COMPENSATION_GRANTED'>('REFUND_APPROVED');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'support-oversight'],
    queryFn: () => adminService.getSupportOversight(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { resolutionNotes: string; refundAmount?: number; action?: string } }) =>
      adminService.resolveDispute(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-oversight'] });
      setSelectedTicket(null);
      setResolutionNotes('');
      setRefundAmount(0);
      setFeedback({ type: 'success', message: res.message || 'Dispute resolved successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to resolve dispute';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    resolveMutation.mutate({
      id: selectedTicket._id,
      payload: {
        resolutionNotes,
        refundAmount: actionType === 'REFUND_APPROVED' || actionType === 'COMPENSATION_GRANTED' ? refundAmount : 0,
        action: actionType,
      },
    });
  };

  const priorityVariant = (p: string) =>
    ({ URGENT: 'red', HIGH: 'red', MEDIUM: 'yellow', LOW: 'gray' } as const)[p] ?? 'gray';

  const columns = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return <span className="font-mono text-xs font-semibold text-gray-900">{item.ticketNumber || String(item._id).slice(-6)}</span>;
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return <span className="text-xs font-medium text-gray-700">{item.category.replace(/_/g, ' ')}</span>;
      },
    },
    {
      key: 'subject',
      label: 'Subject & Customer',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900 truncate max-w-xs">{item.subject}</p>
            <p className="text-[11px] text-gray-500">{item.customerId?.name || 'Customer'} • {item.customerId?.phone || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return <Badge label={item.priority} variant={priorityVariant(item.priority)} />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return <Badge label={item.status} variant={item.status === 'ESCALATED' ? 'red' : 'yellow'} />;
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Owner Action',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as DisputeTicketItem;
        return (
          <button
            onClick={() => {
              setSelectedTicket(item);
              setResolutionNotes('');
              setRefundAmount(item.relatedDeliveryId?.fare?.totalFare || 50);
            }}
            className="btn-primary text-xs py-1 px-2.5 bg-brand-600 hover:bg-brand-700 text-white"
          >
            Review & Resolve
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          Support & Dispute Oversight
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Super Admin dispute resolution center: oversee escalated customer complaints, approve refunds, and decide compensation
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Escalated Disputes"
          value={data?.stats?.escalated ?? 0}
          icon={AlertOctagon}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Open Tickets"
          value={data?.stats?.open ?? 0}
          icon={LifeBuoy}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="In Progress"
          value={data?.stats?.inProgress ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Total Resolved"
          value={data?.stats?.resolved ?? 0}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Escalated Tickets & Disputes Awaiting Super Admin Ruling</h3>
          <p className="text-xs text-gray-500">Regular operations team cannot approve financial refunds or overrides</p>
        </div>

        <Table
          columns={columns}
          data={data?.disputes ?? []}
          loading={isLoading}
          emptyMessage="No escalated disputes currently pending review"
        />
      </div>

      {/* Dispute Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Super Admin Dispute Ruling</h3>
                <p className="text-xs text-gray-500">Ticket #{selectedTicket.ticketNumber || String(selectedTicket._id).slice(-6)}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1.5 border border-gray-100">
              <p><strong className="text-gray-700">Subject:</strong> {selectedTicket.subject}</p>
              <p><strong className="text-gray-700">Customer Issue:</strong> {selectedTicket.description}</p>
              {selectedTicket.relatedDeliveryId && (
                <p><strong className="text-gray-700">Delivery Ref:</strong> {selectedTicket.relatedDeliveryId.trackingId || selectedTicket.relatedDeliveryId._id}</p>
              )}
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ruling Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('REFUND_APPROVED')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      actionType === 'REFUND_APPROVED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('COMPENSATION_GRANTED')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      actionType === 'COMPENSATION_GRANTED'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Compensation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('DISPUTE_REJECTED')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      actionType === 'DISPUTE_REJECTED'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Reject Claim
                  </button>
                </div>
              </div>

              {(actionType === 'REFUND_APPROVED' || actionType === 'COMPENSATION_GRANTED') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Refund / Compensation Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={refundAmount}
                    onChange={e => setRefundAmount(Number(e.target.value))}
                    className="input text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Super Admin Resolution Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain resolution decision and any adjustment to user..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {resolveMutation.isPending ? 'Resolving...' : 'Confirm Ruling & Close Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
