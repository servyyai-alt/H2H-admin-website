import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck, Search, Star, CheckCircle2,
  XCircle, AlertTriangle, ShieldCheck, UserCheck,
  Eye, FileText, Check, X, Clock, ExternalLink,
  ChevronRight, AlertCircle, RefreshCw, Camera, User,
  ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PartnerItem } from '../../types/admin';
import { useAppSelector } from '../../hooks/useAppSelector';

type TabKey = 'ALL' | 'PENDING' | 'ADMIN_APPROVED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

interface DocPreviewState {
  title: string;
  url: string;
  number?: string;
}

export const PartnerList: React.FC = () => {
  const queryClient = useQueryClient();
  const authState = useAppSelector(s => s.auth);
  const currentUser = authState.user;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reviewPartner, setReviewPartner] = useState<PartnerItem | null>(null);
  const [docPreview, setDocPreview] = useState<DocPreviewState | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [docLoading, setDocLoading] = useState<boolean>(true);
  const [docError, setDocError] = useState<boolean>(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; partner: PartnerItem | null; role: 'ADMIN' | 'SUPER_ADMIN' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = authState.accessToken || localStorage.getItem('admin_token') || '';

  const formatDocUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
    }
    if (token && fullUrl.includes('/admin/documents/') && !fullUrl.includes('token=')) {
      const sep = fullUrl.includes('?') ? '&' : '?';
      return `${fullUrl}${sep}token=${encodeURIComponent(token)}`;
    }
    return fullUrl;
  };

  const openDocPreview = (doc: DocPreviewState) => {
    if (!doc.url) return;
    setPreviewZoom(1);
    setPreviewRotation(0);
    setDocLoading(true);
    setDocError(false);
    setDocPreview(doc);
  };

  const closeDocPreview = () => {
    setDocPreview(null);
    setPreviewZoom(1);
    setPreviewRotation(0);
    setDocLoading(false);
    setDocError(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (docPreview) {
          closeDocPreview();
        } else if (rejectDialog) {
          setRejectDialog(null);
        } else if (reviewPartner) {
          setReviewPartner(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docPreview, rejectDialog, reviewPartner]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'partners', page, search, activeTab],
    queryFn: () => adminService.getPartners({
      page,
      limit: 15,
      search: search.trim() || undefined,
      tab: activeTab !== 'ALL' ? activeTab : undefined,
    }),
    placeholderData: (prev) => prev,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Mutations
  const adminApproveMutation = useMutation({
    mutationFn: (id: string) => adminService.approvePartnerByAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setReviewPartner(null);
      showNotification('success', res.message || 'Partner approved by Operations Admin.');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.error?.message || 'Failed to approve application');
    },
  });

  const adminRejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectPartnerByAdmin(id, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setRejectDialog(null);
      setReviewPartner(null);
      setRejectReason('');
      showNotification('success', res.message || 'Partner application rejected.');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.error?.message || 'Failed to reject application');
    },
  });

  const superAdminApproveMutation = useMutation({
    mutationFn: (id: string) => adminService.approvePartnerBySuperAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setReviewPartner(null);
      showNotification('success', res.message || 'Partner approved by Super Admin.');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.error?.message || 'Failed to approve application');
    },
  });

  const superAdminRejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectPartnerBySuperAdmin(id, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setRejectDialog(null);
      setReviewPartner(null);
      setRejectReason('');
      showNotification('success', res.message || 'Partner application rejected.');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.error?.message || 'Failed to reject application');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' }) =>
      adminService.updatePartnerStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      showNotification('success', res.message || 'Partner account status updated');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.error?.message || 'Failed to update partner status');
    },
  });

  const counts = data?.counts;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All Partners', count: counts?.total },
    { key: 'PENDING', label: 'Pending Admin Review', count: counts?.pendingAdmin },
    { key: 'ADMIN_APPROVED', label: 'Super Admin Review', count: counts?.adminApproved },
    { key: 'ACTIVE', label: 'Active Fleet', count: counts?.active },
    { key: 'REJECTED', label: 'Rejected', count: counts?.rejected },
    { key: 'SUSPENDED', label: 'Suspended', count: counts?.suspended },
  ];

  const getApprovalBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge label="Approved" variant="green" />;
      case 'REJECTED':
        return <Badge label="Rejected" variant="red" />;
      case 'PENDING':
      default:
        return <Badge label="Pending" variant="yellow" />;
    }
  };

  const getOverallStatusBadge = (partner: PartnerItem) => {
    if (partner.status === 'BLOCKED' || partner.accountStatus === 'SUSPENDED') {
      return <Badge label="SUSPENDED" variant="red" />;
    }
    if (partner.approvalStatus === 'REJECTED' || partner.adminApprovalStatus === 'REJECTED' || partner.superAdminApprovalStatus === 'REJECTED') {
      return <Badge label="REJECTED" variant="red" />;
    }
    if (partner.adminApprovalStatus === 'APPROVED' && partner.superAdminApprovalStatus === 'APPROVED') {
      return <Badge label="ACTIVE / APPROVED" variant="green" />;
    }
    if (partner.adminApprovalStatus === 'APPROVED') {
      return <Badge label="SUPER ADMIN REVIEW" variant="blue" />;
    }
    return <Badge label="PENDING VERIFICATION" variant="yellow" />;
  };

  const columns = [
    {
      key: 'name',
      label: 'Partner Details',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        const avatarUrl = item.avatar || item.kyc?.profilePhoto;
        return (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={formatDocUrl(avatarUrl)}
                alt={item.name}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <p className="text-xs font-bold text-gray-900">{item.name}</p>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{item.phone}</p>
              {item.email && <p className="text-[10px] text-gray-400">{item.email}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'vehicle',
      label: 'Vehicle Info',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return (
          <div>
            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-wider">
              {item.vehicle?.type?.replace('_', ' ') || 'MOTORCYCLE'}
            </span>
            <p className="text-xs font-mono font-medium text-gray-800 mt-1">
              {item.vehicle?.registrationNumber || 'Not provided'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'adminApproval',
      label: 'Admin Approval',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return (
          <div className="space-y-1">
            {getApprovalBadge(item.adminApprovalStatus || 'PENDING')}
            {item.approvedByAdmin && (
              <p className="text-[10px] text-gray-400">By: {item.approvedByAdmin.name}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'superAdminApproval',
      label: 'Super Admin Approval',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return (
          <div className="space-y-1">
            {getApprovalBadge(item.superAdminApprovalStatus || 'PENDING')}
            {item.approvedBySuperAdmin && (
              <p className="text-[10px] text-gray-400">By: {item.approvedBySuperAdmin.name}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'overallStatus',
      label: 'Overall Status',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return getOverallStatusBadge(item);
      },
    },
    {
      key: 'completedDeliveries',
      label: 'Trips',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return <span className="text-xs font-semibold text-gray-900">{item.completedDeliveries || 0}</span>;
      },
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        return (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {item.rating?.toFixed(1) || '5.0'}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: Record<string, unknown>) => {
        const item = r as unknown as PartnerItem;
        const isSuspended = item.status === 'BLOCKED' || item.accountStatus === 'SUSPENDED';
        const isFullyApproved = item.adminApprovalStatus === 'APPROVED' && item.superAdminApprovalStatus === 'APPROVED';

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewPartner(item)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Review
            </button>
            {isFullyApproved && (
              <button
                onClick={() =>
                  statusMutation.mutate({
                    id: item._id,
                    status: isSuspended ? 'ACTIVE' : 'BLOCKED',
                  })
                }
                disabled={statusMutation.isPending}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  isSuspended
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {isSuspended ? 'Reactivate' : 'Suspend'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Truck className="w-5 h-5" />
            </div>
            Delivery Partner Onboarding & KYC Approvals
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Two-level verification workflow: Both Operations Admin and Super Admin must approve partner applications before activation.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-xs font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? 'border-brand-600 text-brand-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner by name, phone or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 text-xs w-full"
            />
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage="No delivery partner applications found"
        />

        {data?.pagination && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages || 1} ({data.pagination.total} total partners)
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

      {/* Detailed Partner Application Review Modal */}
      {reviewPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                {/* Profile Photo Avatar */}
                {reviewPartner.avatar || reviewPartner.kyc?.profilePhoto ? (
                  <button
                    type="button"
                    onClick={() => openDocPreview({
                      title: `${reviewPartner.name}'s Profile Photo`,
                      url: formatDocUrl(reviewPartner.avatar || reviewPartner.kyc?.profilePhoto)
                    })}
                    className="relative group flex-shrink-0 cursor-pointer"
                    title="Click to inspect profile photo"
                  >
                    <img
                      src={formatDocUrl(reviewPartner.avatar || reviewPartner.kyc?.profilePhoto)}
                      alt={reviewPartner.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 shadow-sm group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-lg flex items-center justify-center border-2 border-orange-200 flex-shrink-0">
                    {reviewPartner.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                      Application #H2H-{reviewPartner._id.slice(-8).toUpperCase()}
                    </span>
                    {getOverallStatusBadge(reviewPartner)}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{reviewPartner.name}</h2>
                  <p className="text-xs text-gray-500">
                    Applied on {new Date(reviewPartner.applicationSubmittedAt || reviewPartner.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewPartner(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dual Approval Status Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Two-Level Verification Pipeline</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Level 1: Operations Admin */}
                <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">1. Operations Admin</span>
                    {getApprovalBadge(reviewPartner.adminApprovalStatus)}
                  </div>
                  {reviewPartner.approvedByAdmin && (
                    <p className="text-[11px] text-gray-500">Approved by: {reviewPartner.approvedByAdmin.name}</p>
                  )}
                  {reviewPartner.adminApprovedAt && (
                    <p className="text-[10px] text-gray-400">At: {new Date(reviewPartner.adminApprovedAt).toLocaleString()}</p>
                  )}
                </div>

                {/* Level 2: Super Admin */}
                <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">2. Super Admin (Owner)</span>
                    {getApprovalBadge(reviewPartner.superAdminApprovalStatus)}
                  </div>
                  {reviewPartner.approvedBySuperAdmin && (
                    <p className="text-[11px] text-gray-500">Approved by: {reviewPartner.approvedBySuperAdmin.name}</p>
                  )}
                  {reviewPartner.superAdminApprovedAt && (
                    <p className="text-[10px] text-gray-400">At: {new Date(reviewPartner.superAdminApprovedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {reviewPartner.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Rejection Reason
                  </p>
                  <p>{reviewPartner.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Section 1: Personal Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                Personal Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Full Legal Name</p>
                  <p className="font-bold text-gray-900 mt-0.5">{reviewPartner.name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Mobile Number</p>
                  <p className="font-bold text-gray-900 mt-0.5 font-mono">{reviewPartner.phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Email Address</p>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">{reviewPartner.email || 'None'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Phone Verified</p>
                  <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                Vehicle Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Vehicle Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                      {reviewPartner.vehicle?.type?.replace('_', ' ') || 'BIKE'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">Vehicle Registration Number</p>
                  <p className="font-bold text-gray-900 mt-0.5 font-mono text-sm tracking-wider">
                    {reviewPartner.vehicle?.registrationNumber || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: KYC & Identity Documents */}
            {(() => {
              const dlPhoto = reviewPartner.kyc?.drivingLicencePhoto || reviewPartner.documents?.find(d => d.type === 'DRIVING_LICENCE')?.url;
              const dlNumber = reviewPartner.kyc?.drivingLicenceNumber || reviewPartner.documents?.find(d => d.type === 'DRIVING_LICENCE')?.number;

              const panPhoto = reviewPartner.kyc?.panPhoto || reviewPartner.documents?.find(d => d.type === 'PAN_CARD')?.url;
              const panNumber = reviewPartner.kyc?.panNumber || reviewPartner.documents?.find(d => d.type === 'PAN_CARD')?.number;

              const aadhaarPhoto = reviewPartner.kyc?.aadhaarPhoto || reviewPartner.documents?.find(d => d.type === 'AADHAAR_CARD')?.url;
              const aadhaarNumber = reviewPartner.kyc?.aadhaarNumber || reviewPartner.documents?.find(d => d.type === 'AADHAAR_CARD')?.number;

              const profilePhoto = reviewPartner.avatar || reviewPartner.kyc?.profilePhoto || reviewPartner.documents?.find(d => d.type === 'PROFILE_PHOTO')?.url;

              return (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    KYC Verification Documents
                  </h3>

                  <div className="space-y-2.5">
                    {/* Profile Photo / Selfie */}
                    <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Profile Photo / Portrait</p>
                          <p className="text-[11px] text-gray-500">
                            {profilePhoto ? 'Passport-size front portrait provided' : 'No photo uploaded'}
                          </p>
                        </div>
                      </div>
                      {profilePhoto ? (
                        <button
                          type="button"
                          onClick={() => openDocPreview({
                            title: `${reviewPartner.name}'s Profile Photo`,
                            url: formatDocUrl(profilePhoto)
                          })}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-600" />
                          Inspect Photo
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No document file</span>
                      )}
                    </div>

                    {/* Driving Licence */}
                    <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Driving Licence</p>
                          <p className="text-xs font-mono font-bold text-slate-800">
                            DL: {dlNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {dlPhoto ? (
                        <button
                          type="button"
                          onClick={() => openDocPreview({
                            title: 'Driving Licence',
                            url: formatDocUrl(dlPhoto),
                            number: dlNumber
                          })}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Inspect Document
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No document file</span>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">PAN Card</p>
                          <p className="text-xs font-mono font-bold text-slate-800">
                            PAN: {panNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {panPhoto ? (
                        <button
                          type="button"
                          onClick={() => openDocPreview({
                            title: 'PAN Card',
                            url: formatDocUrl(panPhoto),
                            number: panNumber
                          })}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          Inspect Document
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No document file</span>
                      )}
                    </div>

                    {/* Aadhaar Card */}
                    <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Aadhaar Card</p>
                          <p className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                            Aadhaar: {aadhaarNumber ? aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {aadhaarPhoto ? (
                        <button
                          type="button"
                          onClick={() => openDocPreview({
                            title: 'Aadhaar Card',
                            url: formatDocUrl(aadhaarPhoto),
                            number: aadhaarNumber ? aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : undefined
                          })}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          Inspect Document
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No document file</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {isSuperAdmin ? 'Logged in as Super Admin' : 'Logged in as Operations Admin'}
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isSuperAdmin ? (
                  // Super Admin Controls: Approve & Reject only
                  reviewPartner.superAdminApprovalStatus !== 'APPROVED' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectDialog({ open: true, partner: reviewPartner, role: 'SUPER_ADMIN' })}
                        disabled={superAdminRejectMutation.isPending}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => superAdminApproveMutation.mutate(reviewPartner._id)}
                        disabled={superAdminApproveMutation.isPending}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Approved
                    </span>
                  )
                ) : (
                  // Operations Admin Controls: Approve & Reject only
                  reviewPartner.adminApprovalStatus !== 'APPROVED' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectDialog({ open: true, partner: reviewPartner, role: 'ADMIN' })}
                        disabled={adminRejectMutation.isPending}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => adminApproveMutation.mutate(reviewPartner._id)}
                        disabled={adminApproveMutation.isPending}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Approved
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {docPreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={closeDocPreview}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[92vh] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{docPreview.title}</h3>
                  {docPreview.number && (
                    <p className="text-xs font-mono font-semibold text-slate-600">
                      ID / Number: <span className="text-slate-900 font-bold">{docPreview.number}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Header Action Tools */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom out */}
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                {/* Zoom reset */}
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1)}
                  title="Reset Zoom"
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {Math.round(previewZoom * 100)}%
                </button>
                {/* Zoom in */}
                <button
                  type="button"
                  onClick={() => setPreviewZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {/* Rotate */}
                <button
                  type="button"
                  onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                  title="Rotate 90°"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {/* Open in new tab / download */}
                <a
                  href={docPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Original in New Tab"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {/* Close */}
                <button
                  type="button"
                  onClick={closeDocPreview}
                  title="Close Inspector (Esc)"
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Image / PDF Viewing Area */}
            <div className="relative bg-slate-950 rounded-xl flex items-center justify-center min-h-[350px] max-h-[60vh] overflow-auto p-4 border border-slate-800">
              {/* Spinner while loading */}
              {docLoading && !docError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white z-10 gap-2">
                  <RefreshCw className="w-7 h-7 text-orange-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-medium">Loading document...</span>
                </div>
              )}

              {/* Error fallback */}
              {docError ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                  <div className="p-3 bg-red-950/60 text-red-400 rounded-full border border-red-800">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Unable to display document directly</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      The document format might require direct viewing. You can open or download it securely below.
                    </p>
                  </div>
                  <a
                    href={docPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Document in New Tab
                  </a>
                </div>
              ) : (docPreview.url.startsWith('data:application/pdf') || docPreview.url.toLowerCase().includes('.pdf')) ? (
                <iframe
                  src={docPreview.url}
                  title={docPreview.title}
                  onLoad={() => setDocLoading(false)}
                  onError={() => {
                    setDocLoading(false);
                    setDocError(true);
                  }}
                  className="w-full h-[55vh] min-h-[400px] rounded-lg border-0 bg-white"
                />
              ) : (
                <img
                  src={docPreview.url}
                  alt={docPreview.title}
                  onLoad={() => setDocLoading(false)}
                  onError={() => {
                    setDocLoading(false);
                    setDocError(true);
                  }}
                  style={{
                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="max-h-[55vh] max-w-full object-contain rounded shadow-lg select-none"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-1 flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Secure Encrypted KYC Document &bull; Hand2Hand Verification
              </span>
              <button
                type="button"
                onClick={closeDocPreview}
                className="btn-secondary text-xs px-4 py-2 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectDialog && (
        <div
          className="fixed inset-0 z-[105] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setRejectDialog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Reject Partner Application
              </h3>
              <button onClick={() => setRejectDialog(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <p className="text-xs text-gray-600">
              Please enter the specific reason for rejecting <strong>{rejectDialog.partner?.name}</strong>. The partner will be notified and given the option to correct and resubmit their documents.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Driving licence photo is blurred or expired. Please upload a clear photo."
                className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectDialog(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    alert('Please enter a rejection reason.');
                    return;
                  }
                  if (rejectDialog.role === 'SUPER_ADMIN') {
                    superAdminRejectMutation.mutate({ id: rejectDialog.partner!._id, reason: rejectReason.trim() });
                  } else {
                    adminRejectMutation.mutate({ id: rejectDialog.partner!._id, reason: rejectReason.trim() });
                  }
                }}
                disabled={adminRejectMutation.isPending || superAdminRejectMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
