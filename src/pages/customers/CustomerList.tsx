import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, UserCheck, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { adminService } from '../../services/admin.service';
import { CustomerItem } from '../../types/admin';

export const CustomerList: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', page, search, statusFilter],
    queryFn: () => adminService.getCustomers({ page, limit: 15, search: search.trim() || undefined, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  });

  // Query order history for selected customer (strictly non-financial)
  const { data: orderHistory, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin', 'customer-orders', selectedCustomerId],
    queryFn: () => (selectedCustomerId ? adminService.getCustomerOrders(selectedCustomerId) : null),
    enabled: !!selectedCustomerId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' }) =>
      adminService.updateCustomerStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      setFeedback({ type: 'success', message: res.message || 'Customer status updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update customer status';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const statusVariant = (s: string) =>
    ({ ACTIVE: 'green', BLOCKED: 'red', INACTIVE: 'gray' } as const)[s] ?? 'gray';

  const columns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'phone', label: 'Phone Number' },
    {
      key: 'email',
      label: 'Email',
      render: (row: Record<string, unknown>) => (row.email as string) || '—',
    },
    {
      key: 'orderCount',
      label: 'Total Orders',
      render: (row: Record<string, unknown>) => (
        <span className="font-semibold text-xs text-gray-900">{((row.orderCount as number) ?? 0)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as CustomerItem;
        return <Badge label={item.status} variant={statusVariant(item.status)} />;
      },
    },
    {
      key: 'createdAt',
      label: 'Registered Date',
      render: (row: Record<string, unknown>) =>
        new Date(row.createdAt as string).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as CustomerItem;
        const isBlocked = item.status === 'BLOCKED';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCustomerId(item._id);
                setSelectedCustomerName(item.name);
              }}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              Order History
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() =>
                statusMutation.mutate({
                  id: item._id,
                  status: isBlocked ? 'ACTIVE' : 'BLOCKED',
                })
              }
              disabled={statusMutation.isPending}
              className={`text-xs font-semibold ${
                isBlocked ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-600 hover:text-red-800'
              }`}
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operations management: browse customer accounts, monitor orders, and control access
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-1.5 text-xs w-36"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
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

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 text-xs"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage="No customer accounts found"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1} ({data.pagination.total} total customers)
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

      {/* Customer Order History Modal (Strictly Non-Financial) */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-600" />
                  Order History: {selectedCustomerName}
                </h3>
                <p className="text-xs text-gray-500">Operational delivery logs (financial pricing omitted)</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {isOrdersLoading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading order history...</div>
              ) : (orderHistory?.data || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No orders placed by this customer yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orderHistory?.data.map((order: any) => (
                    <div key={order._id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-gray-900">{order.trackingId || order._id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        <strong>Package:</strong> {order.packageType || 'Parcel'} • {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-gray-500 truncate">
                        <strong>From:</strong> {order.pickupAddress?.addressText || 'Pickup Location'}
                      </p>
                      <p className="text-gray-500 truncate">
                        <strong>To:</strong> {order.dropoffAddress?.addressText || 'Dropoff Location'}
                      </p>
                      {order.partner && (
                        <p className="text-blue-600 text-[11px]">
                          <strong>Partner:</strong> {order.partner.name} ({order.partner.phone})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
