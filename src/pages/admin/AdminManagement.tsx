import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, ShieldCheck, CheckCircle2,
  AlertTriangle, Key, Copy, Check, Power, Edit2
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { adminService, CreateAdminPayload, UpdateAdminPayload } from '../../services/admin.service';
import { AdminItem } from '../../types/admin';
import { PartnerList } from '../partners/PartnerList';

const MANDATORY_PERMISSIONS = ['customers', 'partners', 'deliveries', 'support'];

export const AdminManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'admins' | 'partners'>('admins');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);

  // New admin form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Operations Admin',
    password: '',
    permissions: ['customers', 'partners', 'deliveries', 'support'],
  });

  // Reset password state
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Created credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
  } | null>(null);

  // Feedback & Copy state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Query admins
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'admins', page, search, statusFilter],
    queryFn: () => adminService.getAdmins({
      page,
      limit: 15,
      search: search.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }),
    placeholderData: (prev) => prev,
  });

  // Mutations
  const createAdminMutation = useMutation({
    mutationFn: (payload: CreateAdminPayload) => adminService.createAdmin(payload),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setIsCreateOpen(false);
      setCreatedCredentials({
        name: vars.name,
        email: vars.email,
        phone: vars.phone,
        password: vars.password || '',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: 'Operations Admin',
        password: '',
        permissions: ['customers', 'partners', 'deliveries', 'support'],
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create admin';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdminPayload }) =>
      adminService.updateAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setIsEditOpen(false);
      setSelectedAdmin(null);
      setFeedback({ type: 'success', message: 'Admin details updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update admin';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminService.updateAdminStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setFeedback({ type: 'success', message: res.message || 'Admin status updated' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update admin status';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      adminService.resetAdminPassword(id, password),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setIsResetPasswordOpen(false);
      setCreatedCredentials({
        name: selectedAdmin?.name || 'Admin',
        email: selectedAdmin?.email || '',
        phone: selectedAdmin?.phone || '',
        password: res.data.password,
      });
      setSelectedAdmin(null);
      setResetPasswordValue('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to reset password';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pwd = 'H2H@';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `H2H Admin Portal Credentials:\nURL: ${window.location.origin}/login\nName: ${createdCredentials.name}\nPhone: ${createdCredentials.phone}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const columns = [
    {
      key: 'name',
      label: 'Admin Name',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminItem;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-900">{item.name}</p>
            <p className="text-[11px] text-gray-500">{item.email}</p>
          </div>
        );
      },
    },
    { key: 'phone', label: 'Phone' },
    {
      key: 'designation',
      label: 'Role / Designation',
      render: (r: Record<string, unknown>) => (
        <span className="text-xs font-medium text-gray-800">
          {(r.designation as string) || (r.role as string)}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r: Record<string, unknown>) => {
        const perms = (r.permissions as string[]) || [];
        const displayPerms = perms.length > 0 ? perms : MANDATORY_PERMISSIONS;
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {displayPerms.map(p => (
              <span key={p} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-medium capitalize">
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminItem;
        const isActive = item.status === 'ACTIVE';
        return <Badge label={item.status} variant={isActive ? 'green' : 'gray'} />;
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r: Record<string, unknown>) =>
        new Date(r.createdAt as string).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as AdminItem;
        const isActive = item.status === 'ACTIVE';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedAdmin(item);
                setFormData({
                  name: item.name,
                  email: item.email,
                  phone: item.phone,
                  designation: item.designation || 'Operations Admin',
                  password: '',
                  permissions: item.permissions || [],
                });
                setIsEditOpen(true);
              }}
              className="text-gray-500 hover:text-gray-900 p-1"
              title="Edit Admin"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedAdmin(item);
                setResetPasswordValue(generateRandomPassword());
                setIsResetPasswordOpen(true);
              }}
              className="text-amber-600 hover:text-amber-800 p-1"
              title="Reset Password"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                updateStatusMutation.mutate({
                  id: item._id,
                  status: isActive ? 'INACTIVE' : 'ACTIVE',
                })
              }
              disabled={updateStatusMutation.isPending}
              className={`p-1 transition-colors ${
                isActive ? 'text-emerald-600 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'
              }`}
              title={isActive ? 'Deactivate Admin' : 'Activate Admin'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Top Switcher: Admin Team vs Partner Approvals */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveSection('admins')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSection === 'admins'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Operations Admin Team
        </button>
        <button
          onClick={() => setActiveSection('partners')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSection === 'partners'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
          Delivery Partner KYC Approvals (Super Admin Review)
        </button>
      </div>

      {activeSection === 'partners' ? (
        <PartnerList />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Admin Account Management
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Super Admin Owner control: create operations admin accounts, manage operational staff, and set credentials directly
              </p>
            </div>

            <button
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  designation: 'Operations Admin',
                  password: generateRandomPassword(),
                  permissions: MANDATORY_PERMISSIONS,
                });
                setIsCreateOpen(true);
              }}
              className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5"
            >
              <Plus className="w-4 h-4" /> Add Operations Admin
            </button>
          </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input py-1.5 text-xs w-36"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage="No admin accounts registered"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1} ({data.pagination.total} admins)
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

      {/* Add Admin Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Create Operations Admin</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                createAdminMutation.mutate({
                  ...formData,
                  authMethod: 'PASSWORD',
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@h2h.in"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations Supervisor"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Initial Password</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    className="text-[11px] text-brand-600 hover:text-brand-800 font-medium"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="At least 8 chars with uppercase, lowercase, number"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="input text-xs font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">Super Admin provides this password directly to the admin.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-900">Standard Operational Access: </span>
                  Customers, Delivery Partners, Deliveries, and Support Tickets are assigned automatically to all Operations Admins.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary text-xs px-4 py-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {isEditOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Edit Admin Profile</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateAdminMutation.mutate({
                  id: selectedAdmin._id,
                  payload: {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    designation: formData.designation,
                    permissions: MANDATORY_PERMISSIONS,
                  },
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-900">Operational Access: </span>
                  Mandatory operational sections (Customers, Delivery Partners, Deliveries, Support) are active for this admin account.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary text-xs px-4 py-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAdminMutation.isPending}
                  className="btn-primary text-xs px-4 py-2"
                >
                  {updateAdminMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Reset Password Modal */}
      {isResetPasswordOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Reset Admin Password
              </h3>
              <button onClick={() => setIsResetPasswordOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <p className="text-xs text-gray-600">
              Directly assign a new password for <strong>{selectedAdmin.name}</strong> ({selectedAdmin.phone}).
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">New Password</label>
                <button
                  type="button"
                  onClick={() => setResetPasswordValue(generateRandomPassword())}
                  className="text-[11px] text-brand-600 hover:text-brand-800 font-medium"
                >
                  Generate Strong Password
                </button>
              </div>
              <input
                type="text"
                required
                minLength={8}
                value={resetPasswordValue}
                onChange={e => setResetPasswordValue(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setIsResetPasswordOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate({ id: selectedAdmin._id, password: resetPasswordValue })}
                disabled={!resetPasswordValue.trim() || resetPasswordMutation.isPending}
                className="btn-primary text-xs px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {resetPasswordMutation.isPending ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Created Credentials / Password Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Admin Account Created & Active</h3>
                <p className="text-xs text-emerald-600 font-medium">Account is active & approved. The admin can log in immediately.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Portal Login:</span>
                <span className="font-semibold text-gray-900">{window.location.origin}/login</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-semibold text-gray-900">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-semibold text-gray-900">{createdCredentials.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold text-gray-900">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-500">Password:</span>
                <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-xs">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="btn-primary text-xs px-5 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
