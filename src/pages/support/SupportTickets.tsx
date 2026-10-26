import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeadphonesIcon, MessageSquare, AlertTriangle,
  CheckCircle2, Clock, Send, ShieldAlert, Filter
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../services/api.service';

export const SupportTickets: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, statusFilter],
    queryFn: () => apiClient.get(`/tickets?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}`).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      apiClient.post(`/tickets/${id}/messages`, { message }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setReplyMessage('');
      if (activeTicket) {
        setActiveTicket(res.data.data);
      }
      setFeedback({ type: 'success', message: 'Reply sent to customer' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to send reply';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/tickets/${id}/status`, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (activeTicket) {
        setActiveTicket(res.data.data);
      }
      setFeedback({ type: 'success', message: 'Ticket status updated' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update ticket status';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const priorityVariant = (p: string) =>
    ({ URGENT: 'red', HIGH: 'red', MEDIUM: 'yellow', LOW: 'gray' } as const)[p] ?? 'gray';

  const statusVariant = (s: string) =>
    ({ OPEN: 'yellow', IN_PROGRESS: 'blue', RESOLVED: 'green', ESCALATED: 'red', CLOSED: 'gray' } as const)[s] ?? 'gray';

  const columns = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (r: Record<string, unknown>) => (
        <span className="font-mono text-xs font-semibold text-gray-900">
          {(r.ticketNumber as string) || String(r._id).slice(-6)}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (r: Record<string, unknown>) => (
        <div>
          <p className="text-xs font-semibold text-gray-900 truncate max-w-xs">{r.subject as string}</p>
          <p className="text-[11px] text-gray-500">{(r.category as string)?.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (r: Record<string, unknown>) => <Badge label={r.priority as string} variant={priorityVariant(r.priority as string)} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => <Badge label={r.status as string} variant={statusVariant(r.status as string)} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r: Record<string, unknown>) => (
        <span className="text-xs text-gray-500">
          {new Date(r.createdAt as string).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r: Record<string, unknown>) => (
        <button
          onClick={() => setActiveTicket(r)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800"
        >
          Open Thread
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-brand-600" />
            Support Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operations support team: view tickets, converse with users, and resolve operational issues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-1.5 text-xs w-40"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
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

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <Table
          columns={columns}
          data={data?.tickets ?? data?.data ?? []}
          loading={isLoading}
          emptyMessage="No support tickets found"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1}
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

      {/* Active Ticket Conversation Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Ticket #{activeTicket.ticketNumber || String(activeTicket._id).slice(-6)}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-xs">{activeTicket.subject}</p>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 border border-gray-100">
                <p className="font-semibold text-gray-800">Initial Complaint:</p>
                <p className="text-gray-600">{activeTicket.description}</p>
              </div>

              {(activeTicket.messages || []).map((msg: any, idx: number) => {
                const isAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPER_ADMIN';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl text-xs ${
                        isAdmin
                          ? 'bg-brand-600 text-white rounded-br-xs'
                          : 'bg-gray-100 text-gray-900 rounded-bl-xs'
                      }`}
                    >
                      <p className="text-[10px] opacity-75 mb-0.5">{msg.senderName || msg.senderRole}</p>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Actions */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => statusMutation.mutate({ id: activeTicket._id, status: 'IN_PROGRESS' })}
                  disabled={statusMutation.isPending}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => statusMutation.mutate({ id: activeTicket._id, status: 'RESOLVED' })}
                  disabled={statusMutation.isPending}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  Mark Resolved
                </button>
              </div>

              {/* Escalate to Super Admin */}
              <button
                type="button"
                onClick={() => statusMutation.mutate({ id: activeTicket._id, status: 'ESCALATED' })}
                disabled={statusMutation.isPending}
                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
                title="Escalate financial claim or dispute to Super Admin Owner"
              >
                <ShieldAlert className="w-3 h-3" />
                Escalate to Super Admin
              </button>
            </div>

            {/* Reply Input Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!replyMessage.trim()) return;
                replyMutation.mutate({ id: activeTicket._id, message: replyMessage });
              }}
              className="p-3 border-t border-gray-100 flex gap-2"
            >
              <input
                type="text"
                placeholder="Type response to user..."
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                className="input text-xs flex-1"
              />
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyMessage.trim()}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
