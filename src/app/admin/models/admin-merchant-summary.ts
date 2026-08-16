// AUTHOR: Htet Nandar(Grace)
export type MerchantStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

// lastModifiedByAdminUsername/lastModifiedAt are null until the first admin-driven status
// change (suspend/reinstate) - see the backend's User.lastModifiedByAdmin.
export interface AdminMerchantSummary {
  id: number;
  username: string;
  email: string;
  status: MerchantStatus;
  createdAt: string;
  listingCount: number;
  lastModifiedByAdminUsername: string | null;
  lastModifiedAt: string | null;
}

// Everything AdminMerchantSummary has, plus order activity and revenue - only fetched when the
// detail modal is opened, so the list view stays a single lightweight request.
export interface AdminMerchantDetail extends AdminMerchantSummary {
  orderCount: number;
  revenue: number;
}
