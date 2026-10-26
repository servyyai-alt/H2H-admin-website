import { apiClient } from './api.service';
import {
  AdminItem,
  AdminStats,
  AdminApprovalCounts,
  AdminAuditLog,
  EmailStatusResponse,
  PlatformSettings,
  PaymentOverviewData,
  PaymentTransactionItem,
  ReportsOverviewData,
  CustomerItem,
  PartnerItem,
  DisputeTicketItem,
} from '../types/admin';

export interface CreateAdminPayload {
  name: string;
  email: string;
  phone: string;
  designation?: string;
  permissions?: string[];
  authMethod: 'PASSWORD' | 'INVITATION';
  password?: string;
}

export interface UpdateAdminPayload {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  permissions?: string[];
}

export interface AdminsResponse {
  data: AdminItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: AdminStats;
}

export interface ApprovalsResponse {
  data: AdminItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: AdminApprovalCounts;
}

export interface AdminDetailResponse {
  admin: AdminItem;
  auditLogs: AdminAuditLog[];
}

export const adminService = {
  getAdmins: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    approvalStatus?: string;
  }) => apiClient.get<{ success: boolean; data: AdminsResponse }>('/admin/admins', { params }).then(r => r.data.data),

  getAdminById: (id: string) =>
    apiClient.get<{ success: boolean; data: AdminDetailResponse }>(`/admin/admins/${id}`).then(r => r.data.data),

  createAdmin: (payload: CreateAdminPayload) =>
    apiClient.post<{
      success: boolean;
      data: { admin: AdminItem; emailStatus: EmailStatusResponse };
      message: string;
    }>('/admin/admins', payload).then(r => r.data),

  updateAdmin: (id: string, payload: UpdateAdminPayload) =>
    apiClient.put<{ success: boolean; data: AdminItem; message: string }>(`/admin/admins/${id}`, payload).then(r => r.data),

  approveAdmin: (id: string) =>
    apiClient.post<{
      success: boolean;
      data: { admin: AdminItem; emailStatus: EmailStatusResponse };
      message: string;
    }>(`/admin/admins/${id}/approve`).then(r => r.data),

  rejectAdmin: (id: string, reason?: string) =>
    apiClient.post<{
      success: boolean;
      data: { admin: AdminItem; emailStatus: EmailStatusResponse };
      message: string;
    }>(`/admin/admins/${id}/reject`, { reason }).then(r => r.data),

  updateAdminStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    apiClient.patch<{ success: boolean; data: AdminItem; message: string }>(`/admin/admins/${id}/status`, { status }).then(r => r.data),

  resendInvitation: (id: string) =>
    apiClient.post<{
      success: boolean;
      data: { emailStatus: EmailStatusResponse };
      message: string;
    }>(`/admin/admins/${id}/resend-invitation`).then(r => r.data),

  getApprovals: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tab?: string;
  }) => apiClient.get<{ success: boolean; data: ApprovalsResponse }>('/admin/admins/approvals', { params }).then(r => r.data.data),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{
      success: boolean;
      data: { data: AdminAuditLog[]; pagination: { total: number; page: number; totalPages: number } };
    }>('/admin/admins/audit-logs', { params }).then(r => r.data.data),

  verifyInvitation: (token: string) =>
    apiClient.get<{ success: boolean; data: { valid: boolean; user: { name: string; email: string; designation: string } } }>(
      `/auth/verify-invitation?token=${encodeURIComponent(token)}`
    ).then(r => r.data),

  acceptInvitation: (token: string, password: string) =>
    apiClient.post<{ success: boolean; message: string; data: { approvalStatus: string } }>(
      '/auth/accept-invitation',
      { token, password }
    ).then(r => r.data),

  resetAdminPassword: (id: string, password?: string) =>
    apiClient.post<{ success: boolean; message: string; data: { password: string } }>(`/admin/admins/${id}/reset-password`, { password }).then(r => r.data),

  getSettings: () =>
    apiClient.get<{ success: boolean; data: PlatformSettings }>('/admin/settings').then(r => r.data.data),

  updateSettings: (payload: Partial<PlatformSettings>) =>
    apiClient.put<{ success: boolean; data: PlatformSettings; message: string }>('/admin/settings', payload).then(r => r.data),

  getPaymentsOverview: () =>
    apiClient.get<{ success: boolean; data: PaymentOverviewData }>('/admin/payments/overview').then(r => r.data.data),

  getPaymentTransactions: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<{
      success: boolean;
      data: { data: PaymentTransactionItem[]; pagination: { total: number; page: number; totalPages: number } };
    }>('/admin/payments/transactions', { params }).then(r => r.data.data),

  processPartnerPayout: (partnerId: string) =>
    apiClient.post<{ success: boolean; message: string; data: any }>('/admin/payments/process-payout', { partnerId }).then(r => r.data),

  getReportsOverview: (params?: { period?: 'daily' | 'weekly' | 'monthly'; startDate?: string; endDate?: string }) =>
    apiClient.get<{ success: boolean; data: ReportsOverviewData }>('/admin/reports/overview', { params }).then(r => r.data.data),

  getSupportOversight: (params?: { status?: string }) =>
    apiClient.get<{
      success: boolean;
      data: { stats: { total: number; open: number; inProgress: number; escalated: number; resolved: number }; disputes: DisputeTicketItem[] };
    }>('/admin/support/oversight', { params }).then(r => r.data.data),

  resolveDispute: (id: string, payload: { resolutionNotes: string; refundAmount?: number; action?: string }) =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/support/oversight/${id}/resolve`, payload).then(r => r.data),

  getCustomers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<{
      success: boolean;
      data: { data: CustomerItem[]; pagination: { total: number; page: number; totalPages: number } };
    }>('/admin/customers', { params }).then(r => r.data.data),

  updateCustomerStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/customers/${id}/status`, { status }).then(r => r.data),

  getCustomerOrders: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{
      success: boolean;
      data: { data: any[]; pagination: { total: number; page: number; totalPages: number } };
    }>(`/admin/customers/${id}/orders`, { params }).then(r => r.data.data),

  getPartners: (params?: { page?: number; limit?: number; search?: string; tab?: string }) =>
    apiClient.get<{
      success: boolean;
      data: {
        data: PartnerItem[];
        pagination: { total: number; page: number; totalPages: number };
        counts?: {
          total: number;
          pendingAdmin: number;
          adminApproved: number;
          approved: number;
          active: number;
          rejected: number;
          suspended: number;
        };
      };
    }>('/admin/partners', { params }).then(r => r.data.data),

  getPartnerById: (id: string) =>
    apiClient.get<{ success: boolean; data: PartnerItem; message: string }>(`/admin/partners/${id}`).then(r => r.data.data),

  approvePartnerByAdmin: (id: string) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(`/admin/partners/${id}/approve`).then(r => r.data),

  rejectPartnerByAdmin: (id: string, rejectionReason: string) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(`/admin/partners/${id}/reject`, { rejectionReason }).then(r => r.data),

  approvePartnerBySuperAdmin: (id: string) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(`/admin/super-admin/partners/${id}/approve`).then(r => r.data),

  rejectPartnerBySuperAdmin: (id: string, rejectionReason: string) =>
    apiClient.post<{ success: boolean; message: string; data: any }>(`/admin/super-admin/partners/${id}/reject`, { rejectionReason }).then(r => r.data),

  updatePartnerKyc: (id: string, kycStatus: 'APPROVED' | 'REJECTED' | 'PENDING') =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/partners/${id}/kyc`, { kycStatus }).then(r => r.data),

  updatePartnerStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/partners/${id}/status`, { status }).then(r => r.data),

  reassignDelivery: (id: string, partnerId: string) =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/deliveries/${id}/reassign`, { partnerId }).then(r => r.data),

  cancelDelivery: (id: string, reason: string) =>
    apiClient.patch<{ success: boolean; message: string; data: any }>(`/admin/deliveries/${id}/cancel`, { reason }).then(r => r.data),

  broadcastNotification: (payload: { title: string; description: string; targetAudience: 'ALL' | 'CUSTOMERS' | 'PARTNERS' }) =>
    apiClient.post<{ success: boolean; message: string; data: { recipientCount: number } }>('/admin/cms/broadcast', payload).then(r => r.data),
};
