export type UserRole = 'GUEST' | 'REGISTERED' | 'MEMBER' | 'ADMIN' | 'SUPER_VENDOR' | 'VENDOR' | 'END_USER';

export type EndUserAccountStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'DEMO' | 'EXPIRED';
export type EndUserAccountType = 'DEMO' | 'FORMAL';
export type CreditTransactionTypeEnum = 'ADMIN_GRANT' | 'TRANSFER' | 'PLAN_ACTIVATION' | 'PACKAGE_PURCHASE' | 'REFUND' | 'ADJUSTMENT';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  creditCost: number;
  isDemo: boolean;
  demoHours?: number | null;
  isPromo: boolean;
  bonusDays: number;
  maxDevices: number;
  isActive: boolean;
  sortOrder: number;
  baseCredits?: number;
  createdAt: string;
}


export interface CreditPackage {
  id: string;
  name: string;
  baseCredits: number;
  bonusCredits: number;
  isPromo: boolean;
  isActive: boolean;
  sortOrder: number;
}

export type DeviceType = 'WEB' | 'MOBILE' | 'SMART_TV' | 'UNKNOWN';

export interface DeviceSession {
  id: string;
  deviceType: DeviceType;
  deviceName?: string;
  platform?: string;
  osVersion?: string;
  browserName?: string;
  appVersion?: string;
  ipAddress?: string;
  lastSeen: string;
  isActive: boolean;
}

export interface EndUserAccount {
  id: string;
  username: string;
  password: string;
  managedBy: { id: string; name: string; phone: string; username?: string; role?: string; parent?: { name: string; username?: string } | null };
  plan?: { id: string; name: string; durationDays: number } | null;
  status: EndUserAccountStatus;
  type: EndUserAccountType;
  startDate?: string | null;
  endDate?: string | null;
  maxDevices: number;
  connectedDevicesCount: number;
  connectedDevices?: DeviceSession[];
  createdAt: string;
  deletedAt?: string | null;
}

export interface CreditTransaction {
  id: string;
  type: CreditTransactionTypeEnum;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface ResellerVendor {
  id: string;
  phone: string;
  username?: string;
  name: string;
  role: UserRole;
  credits: number;
  isActive: boolean;
  createdAt: string;
  parentId?: string | null;
  parent?: { id: string; name: string; phone: string; username?: string } | null;
  _count: { children: number; managedEndUsers: number };
}

export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  page: number;
  totalPages: number;
}
