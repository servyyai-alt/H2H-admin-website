import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, CreditCard, RefreshCw,
  Search, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PaymentTransactionItem } from '../../types/admin';

export const PaymentsOverview: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; partnerId: string; partnerName: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['admin', 'payments-overview'],
    queryFn: () => adminService.getPaymentsOverview(),
  });

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ['admin', 'payments-transactions', page, statusFilter, search],
    queryFn: () => adminService.getPaymentTransactions({ page, limit: 15, status: statusFilter || undefined, search: search.trim() || undefined }),
    placeholderData: (prev) => prev,
  });

  const payoutMutation = useMutation({
    mutationFn: (partnerId: string) => adminService.processPartnerPayout(partnerId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments-transactions'] });
      setPayoutModal(null);
      setFeedback({ type: 'success', message: res.message || 'Payout processed successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to process payout';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const statusVariant = (s: string) =>
    ({ SUCCESS: 'green', PENDING: 'yellow', FAILED: 'red', REFUNDED: 'purple' } as const)[s] ?? 'gray';

  const columns = [
    {
      key: 'deliveryId',
      label: 'Order ID',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem;
        return (
          <div>
            <span className="font-mono text-xs text-gray-700 font-semibold">{item.trackingId || String(item._id).slice(-8)}</span>
          </div>
        );
      },
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{item.customer?.name || 'Customer'}</p>
            <p className="text-[11px] text-gray-500">{item.customer?.phone || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'partner',
      label: 'Delivery Partner',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{item.partner?.name || 'Unassigned'}</p>
            <p className="text-[11px] text-gray-500">{item.partner?.phone || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Gross Amount',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem & { fare?: { total?: number } };
        const amount = item.amount ?? item.fare?.total ?? 0;
        return <span className="font-semibold text-xs text-gray-900">₹{amount.toLocaleString()}</span>;
      },
    },
    {
      key: 'platformFee',
      label: 'Platform Commission',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem & { fare?: { total?: number } };
        const gross = item.amount ?? item.fare?.total ?? 0;
        const fee = item.platformFee ?? Math.round(gross * 0.2);
        return <span className="text-xs text-emerald-600 font-semibold">+₹{fee.toLocaleString()}</span>;
      },
    },
    {
      key: 'partnerEarning',
      label: 'Partner Payout',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem & { fare?: { total?: number } };
        const gross = item.amount ?? item.fare?.total ?? 0;
        const payout = item.partnerEarning ?? Math.round(gross * 0.8);
        return <span className="text-xs text-blue-600 font-semibold">₹{payout.toLocaleString()}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem & { payment?: { status?: string } };
        const s = item.status || item.payment?.status || 'PENDING';
        return <Badge label={s} variant={statusVariant(s)} />;
      },
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PaymentTransactionItem;
        const d = item.createdAt ? new Date(item.createdAt) : new Date();
        return (
          <span className="text-xs text-gray-500">
            {isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Payments & Financial Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Owner oversight of gross platform revenue, commission earnings, and partner payouts
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={overview ? `₹${(overview.totalRevenue ?? 0).toLocaleString()}` : '—'}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Platform Commission"
          value={overview ? `₹${(overview.platformCommission ?? (overview as any).netPlatformMargin ?? 0).toLocaleString()}` : '—'}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Partner Payouts Settled"
          value={overview ? `₹${(overview.partnerPayouts ?? (overview as any).estimatedPayouts ?? 0).toLocaleString()}` : '—'}
          icon={ArrowUpRight}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Pending Partner Payouts"
          value={overview ? `₹${(overview.pendingPayouts ?? (overview as any).pendingAmount ?? 0).toLocaleString()}` : '—'}
          icon={CreditCard}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Time-based Revenue Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Today's Revenue</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ₹{(overview?.todayRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
            {overview?.todayOrderCount ?? 0} orders
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">This Week's Revenue</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ₹{(overview?.weekRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">Last 7 Days</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">This Month's Revenue</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ₹{(overview?.monthRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded-md">Current Month</span>
        </div>
      </div>

      {/* Transactions & Settlement Log */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Transaction & Settlement Log</h3>
            <p className="text-xs text-gray-500">Every customer payment, commission cut, and partner payout transaction</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order or phone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9 py-1.5 text-xs w-52"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-36"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={txData?.data ?? []}
          loading={isTxLoading}
          emptyMessage="No financial transactions found"
        />

        {txData?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {txData.pagination.page} of {txData.pagination.totalPages || 1} ({txData.pagination.total} total)
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
                disabled={page >= (txData.pagination.totalPages || 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process Payout Modal */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Process Partner Settlement Payout</h3>
            <p className="text-sm text-gray-600">
              Confirm batch payout settlement for <strong>{payoutModal.partnerName}</strong>. Funds will be credited to their registered payout account.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPayoutModal(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => payoutMutation.mutate(payoutModal.partnerId)}
                disabled={payoutMutation.isPending}
                className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {payoutMutation.isPending ? 'Processing...' : 'Confirm & Release Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
