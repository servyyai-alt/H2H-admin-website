export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';

export interface AdminItem {
  [key: string]: unknown;
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  designation?: string;
  permissions: string[];
  approvalStatus: ApprovalStatus;
  status: AccountStatus;
  isEmailVerified?: boolean;
  isInvitationAccepted?: boolean;
  approvedBy?: { _id: string; name: string; email: string };
  approvedAt?: string;
  rejectedBy?: { _id: string; name: string; email: string };
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  total: number;
  active: number;
  inactive: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
}

export interface AdminApprovalCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminAuditLog {
  [key: string]: unknown;
  _id: string;
  action: string;
  performedBy?: { _id: string; name: string; email: string };
  targetUser?: { _id: string; name: string; email: string; role: string; designation: string };
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface EmailStatusResponse {
  sent: boolean;
  reason?: string;
  message: string;
  invitationLink?: string;
}

export interface PlatformSettings {
  _id?: string;
  fareRules: {
    baseFare: number;
    perKmRate: number;
    surgePricingMultiplier: number;
    platformCommissionRate: number;
  };
  serviceAvailability: {
    operatingHoursStart: string;
    operatingHoursEnd: string;
    maxDeliveryRadiusKm: number;
    activeCities: string[];
  };
  systemConfig: {
    minAppVersion: string;
    maintenanceMode: boolean;
  };
}

export interface PaymentOverviewData {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  platformCommission: number;
  partnerPayouts: number;
  refundTotals: number;
  pendingPayouts: number;
  todayOrderCount: number;
  totalDeliveriesCount: number;
}

export interface PaymentTransactionItem {
  [key: string]: unknown;
  _id: string;
  deliveryId: string;
  trackingId?: string;
  customer?: { _id: string; name: string; phone: string };
  partner?: { _id: string; name: string; phone: string };
  amount: number;
  platformFee: number;
  partnerEarning: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  createdAt: string;
}

export interface ReportsOverviewData {
  period: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  totalRevenue: number;
  platformEarnings: number;
  partnerEarnings: number;
  avgDeliveryTimeMinutes: number;
  cancellationReasons: { reason: string; count: number }[];
  topPartners: { _id: string; name: string; phone: string; completedDeliveries: number; rating: number }[];
  topRoutes: { route: string; count: number }[];
  dailyRevenueTrend: { date: string; revenue: number; orders: number }[];
}

export interface CustomerItem {
  [key: string]: unknown;
  _id: string;
  name: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  createdAt: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  orderCount?: number;
}

export interface PartnerItem {
  [key: string]: unknown;
  _id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';
  accountStatus?: 'PENDING_VERIFICATION' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'REJECTED' | 'SUSPENDED';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  superAdminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  displayStatus?: string;
  isActive?: boolean;
  canWork?: boolean;
  canAcceptDeliveries?: boolean;
  rejectionReason?: string;
  approvedByAdmin?: { _id?: string; name: string; email: string; designation?: string };
  adminApprovedAt?: string;
  approvedBySuperAdmin?: { _id?: string; name: string; email: string; designation?: string };
  superAdminApprovedAt?: string;
  rejectedBy?: { _id?: string; name: string; email: string; designation?: string };
  rejectedAt?: string;
  applicationSubmittedAt?: string;
  createdAt: string;
  isOnline: boolean;
  rating: number;
  completedDeliveries: number;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  vehicle?: {
    type: string;
    make?: string;
    model?: string;
    registrationNumber?: string;
  };
  kyc?: {
    drivingLicenceNumber?: string;
    drivingLicencePhoto?: string;
    panNumber?: string;
    panPhoto?: string;
    aadhaarNumber?: string;
    aadhaarPhoto?: string;
    profilePhoto?: string;
  };
  documents?: Array<{
    type: string;
    url: string;
    number?: string;
    status: string;
  }>;
}

export interface DisputeTicketItem {
  [key: string]: unknown;
  _id: string;
  ticketNumber?: string;
  customerId?: { _id: string; name: string; phone: string; email: string };
  relatedDeliveryId?: {
    _id: string;
    trackingId?: string;
    status: string;
    pickupAddress?: { addressText: string };
    dropoffAddress?: { addressText: string };
    fare?: { totalFare: number };
  };
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  resolvedAt?: string;
  messages?: Array<{
    senderRole: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}
